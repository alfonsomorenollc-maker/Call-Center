import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

// Import the TwiML voice response helper
const { twiml } = require('twilio');

interface VoiceWebhookParams {
  From: string;
  To: string;
  CallSid: string;
}

interface SpeechWebhookParams extends VoiceWebhookParams {
  SpeechResult?: string;
}

/**
 * TwilioService contains the business logic for handling Twilio webhooks.
 * It orchestrates incoming calls, speech recognition results and status
 * callbacks, and coordinates with the database and AI modules to generate
 * responses.
 */
@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private twilioClient: Twilio;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioClient = new Twilio(accountSid ?? '', authToken ?? '');
  }

  /**
   * Handle the initial voice webhook. This creates a call record and
   * responds with TwiML that greets the caller and prompts for language.
   */
  async handleVoice(params: VoiceWebhookParams): Promise<string> {
    const { From, To, CallSid } = params;
    // Find agent by phone number
    const agent = await this.prisma.agent.findFirst({ where: { twilioPhoneNumber: To } });
    if (!agent) {
      // Fallback: play a message that no agent is configured
      const vr = new twiml.VoiceResponse();
      vr.say({ language: 'en-US' }, 'Sorry, this number is not configured.');
      return vr.toString();
    }
    // Create call record if not exists
    await this.prisma.call.upsert({
      where: { twilioCallSid: CallSid },
      update: {},
      create: {
        twilioCallSid: CallSid,
        tenantId: agent.tenantId,
        agentId: agent.id,
        fromPhone: From,
        toPhone: To,
        language: 'auto',
      },
    });
    // Generate greeting
    const greeting =
      'Hola. Para continuar en español, diga español. For English, say English.';
    // Compose TwiML with greeting and gather
    const vr = new twiml.VoiceResponse();
    vr.say({ voice: 'woman', language: 'es-ES' }, greeting);
    const gather = vr.gather({
      input: 'speech',
      action: '/twilio/speech',
      method: 'POST',
      speechTimeout: 'auto',
    });
    gather.say({ voice: 'woman', language: 'es-ES' }, '');
    // If no input, repeat greeting
    vr.redirect('/twilio/voice');
    return vr.toString();
  }

  /**
   * Handle speech results. Generates an AI response based on the caller's
   * input and returns TwiML that plays the response and gathers more input.
   */
  async handleSpeech(params: SpeechWebhookParams): Promise<string> {
    const { CallSid, SpeechResult, From, To } = params;
    const call = await this.prisma.call.findFirst({ where: { twilioCallSid: CallSid } });
    if (!call) {
      const vr = new twiml.VoiceResponse();
      vr.say('Call not found.');
      return vr.toString();
    }
    // Update transcript
    const userText = (SpeechResult ?? '').trim();
    const updatedTranscript = `${call.transcript}\nCaller: ${userText}\n`;
    // Detect language and generate reply
    const detected = this.detectLanguage(call.language, userText);
    const { reply, hint } = this.generateReply(detected, userText, call.agentId);
    const newTranscript = `${updatedTranscript}AI: ${reply}\n`;
    // Update call record
    await this.prisma.call.update({
      where: { id: call.id },
      data: {
        language: detected,
        transcript: newTranscript,
        status: hint === 'needs_followup' ? 'NEEDS_FOLLOWUP' : call.status,
      },
    });
    // Convert reply to speech using TTS; fallback to plain say if TTS fails
    let audioUrl: string | null = null;
    try {
      audioUrl = await this.synthesize(reply, call.agentId);
    } catch (err) {
      this.logger.error('TTS failed', err);
    }
    const vr = new twiml.VoiceResponse();
    if (audioUrl) {
      vr.play(audioUrl);
    } else {
      vr.say({ language: detected === 'es' ? 'es-ES' : 'en-US' }, reply);
    }
    const gather = vr.gather({
      input: 'speech',
      action: '/twilio/speech',
      method: 'POST',
      speechTimeout: 'auto',
    });
    gather.say({ language: detected === 'es' ? 'es-ES' : 'en-US' }, '');
    vr.redirect('/twilio/voice');
    return vr.toString();
  }

  /**
   * Handle call status callbacks. When a call is completed, summarise it and
   * optionally send an SMS summary to the caller. The summarisation is
   * simplified here; in a real system you would use a language model.
   */
  async handleStatus(params: { CallSid: string; CallStatus: string }): Promise<string> {
    const { CallSid, CallStatus } = params;
    if (CallStatus !== 'completed') {
      return 'ok';
    }
    const call = await this.prisma.call.findFirst({ where: { twilioCallSid: CallSid } });
    if (!call) return 'ok';
    // Mark endedAt
    const summary = call.transcript
      ? call.transcript.split('\n').slice(-10).join('\n')
      : '';
    const status = call.status === 'IN_PROGRESS' ? 'RESOLVED' : call.status;
    await this.prisma.call.update({
      where: { id: call.id },
      data: {
        endedAt: new Date(),
        summary,
        status,
      },
    });
    // Optionally send SMS summary (out of scope for skeleton)
    return 'ok';
  }

  /**
   * Detect the language to use for the conversation. If call.language is
   * already set to a specific language (not auto), return it. Otherwise
   * inspect the caller's utterance for keywords.
   */
  private detectLanguage(current: string, text: string): 'es' | 'en' {
    if (current === 'es' || current === 'en') return current as 'es' | 'en';
    const t = text.toLowerCase();
    if (t.includes('español') || t.includes('espanol')) return 'es';
    if (t.includes('english') || t.includes('inglés') || t.includes('ingles')) return 'en';
    // naive detection based on common words
    const spanishMarkers = ['qué', 'como', 'necesito', 'tengo', 'quiero', 'cita', 'precio'];
    if (spanishMarkers.some((m) => t.includes(m))) return 'es';
    return 'en';
  }

  /**
   * Generate a reply based on detected language, user input and agent
   * configuration. For the MVP this uses a trivial retrieval mechanism and
   * template; in production you would integrate an LLM and RAG here.
   */
  private generateReply(
    language: 'es' | 'en',
    userText: string,
    agentId: string,
  ): { reply: string; hint: 'resolved' | 'needs_followup' } {
    // TODO: fetch knowledge from DB and run retrieval
    const needsFollowup = userText.split(' ').length < 3;
    if (needsFollowup) {
      if (language === 'es') {
        return {
          reply:
            'Puedo ayudarte, pero necesito un poco más de información. Por favor dime tu nombre y tu necesidad específica.',
          hint: 'needs_followup',
        };
      } else {
        return {
          reply:
            'I can help, but I need a bit more information. Please share your name and your specific need.',
          hint: 'needs_followup',
        };
      }
    }
    // Default response
    if (language === 'es') {
      return {
        reply:
          'Gracias por compartir. De acuerdo con la información disponible, hemos registrado tu solicitud. Un agente humano te llamará si es necesario. ¿Hay algo más que quieras añadir?',
        hint: 'resolved',
      };
    }
    return {
      reply:
        'Thank you for sharing. According to the available information, we have recorded your request. A human agent will call you if necessary. Is there anything else you want to add?',
      hint: 'resolved',
    };
  }

  /**
   * Synthesize speech using ElevenLabs API. This method fetches audio from
   * ElevenLabs and uploads it to a publicly accessible location. In this
   * skeleton we return null to fallback to the Say verb. Replace this
   * implementation with actual API integration when running in production.
   */
  private async synthesize(text: string, agentId: string): Promise<string | null> {
    // TODO: integrate with ElevenLabs using fetch and store result in a static bucket
    // Returning null falls back to TwiML <Say>
    return null;
  }
}
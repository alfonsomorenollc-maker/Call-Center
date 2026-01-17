import { Controller, Post, Body, Header } from '@nestjs/common';
import { TwilioService } from './twilio.service';

/**
 * TwilioController exposes webhook endpoints that Twilio calls during
 * different stages of a voice interaction. The responses must be XML
 * encoded (TwiML), so we set the Content-Type header accordingly.
 */
@Controller('twilio')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Post('voice')
  @Header('Content-Type', 'text/xml')
  async voice(@Body() body: any): Promise<string> {
    return this.twilioService.handleVoice(body);
  }

  @Post('speech')
  @Header('Content-Type', 'text/xml')
  async speech(@Body() body: any): Promise<string> {
    return this.twilioService.handleSpeech(body);
  }

  @Post('status')
  async status(@Body() body: any): Promise<string> {
    return this.twilioService.handleStatus(body);
  }
}
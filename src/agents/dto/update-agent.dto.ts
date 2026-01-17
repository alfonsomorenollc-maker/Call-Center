import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export enum AgentStatus {
  DRAFT = 'DRAFT',
  LIVE = 'LIVE',
  PAUSED = 'PAUSED',
}

export enum LanguageMode {
  EN = 'EN',
  ES = 'ES',
  BILINGUAL = 'BILINGUAL',
}

export enum VoiceProvider {
  ELEVENLABS = 'ELEVENLABS',
  TWILIO = 'TWILIO',
}

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @IsOptional()
  @IsEnum(LanguageMode)
  languageMode?: LanguageMode;

  @IsOptional()
  @IsEnum(VoiceProvider)
  voiceProvider?: VoiceProvider;

  @IsOptional()
  @IsString()
  voiceId?: string;

  @IsOptional()
  @IsString()
  twilioPhoneNumber?: string;

  @IsOptional()
  @IsUUID()
  knowledgeBaseId?: string;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;
}

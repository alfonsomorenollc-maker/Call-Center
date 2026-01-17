import { IsEnum, IsOptional, IsString, IsUUID, IsObject } from 'class-validator';

export enum AgentStatusEnum {
  DRAFT = 'DRAFT',
  LIVE = 'LIVE',
  PAUSED = 'PAUSED',
}

export enum LanguageModeEnum {
  BILINGUAL = 'BILINGUAL',
  ES = 'ES',
  EN = 'EN',
}

/**
 * DTO for creating an agent. Validates input data sent by the client.
 */
export class CreateAgentDto {
  @IsString()
  name: string;

  @IsEnum(AgentStatusEnum)
  @IsOptional()
  status?: AgentStatusEnum;

  @IsEnum(LanguageModeEnum)
  @IsOptional()
  languageMode?: LanguageModeEnum;

  @IsString()
  @IsOptional()
  voiceProvider?: string;

  @IsString()
  voiceId: string;

  /**
   * E.164 formatted Twilio phone number. Optional at creation time.
   */
  @IsString()
  @IsOptional()
  twilioPhoneNumber?: string;

  /**
   * Optional features object; used to enable premium features such as
   * transfer or SMS summaries. Stored as JSON in the database.
   */
  @IsObject()
  @IsOptional()
  features?: Record<string, any>;

  /**
   * Optional knowledge base ID if linking this agent to an existing knowledge
   * base. Typically omitted at creation and assigned later when uploading
   * knowledge content.
   */
  @IsUUID()
  @IsOptional()
  knowledgeBaseId?: string;
}
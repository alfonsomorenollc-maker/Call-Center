import { PartialType } from '@nestjs/mapped-types';
import { CreateAgentDto } from './create-agent.dto';

/**
 * DTO for updating an agent. Inherits validation rules from CreateAgentDto
 * but marks all properties as optional. This allows for partial updates.
 */
export class UpdateAgentDto extends PartialType(CreateAgentDto) {}
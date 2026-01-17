import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

/**
 * AgentsService encapsulates all business logic related to agent entities.
 * It uses PrismaService to interact with the database. In a real application
 * you could apply additional authorization checks, event emitters, and
 * integration logic here.
 */
@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateAgentDto) {
    // In a complete implementation you would validate that the tenant
    // exists and that the user has permission to create an agent.
    return this.prisma.agent.create({
      data: {
        tenantId,
        name: dto.name,
        status: dto.status ?? 'DRAFT',
        languageMode: dto.languageMode ?? 'BILINGUAL',
        voiceProvider: dto.voiceProvider ?? 'ELEVENLABS',
        voiceId: dto.voiceId,
        twilioPhoneNumber: dto.twilioPhoneNumber,
        knowledgeBaseId: dto.knowledgeBaseId,
        features: dto.features,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.agent.findMany({ where: { tenantId } });
  }

  async findOne(tenantId: string, id: string) {
    const agent = await this.prisma.agent.findFirst({ where: { id, tenantId } });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    return agent;
  }

  async update(tenantId: string, id: string, dto: UpdateAgentDto) {
    // Ensure the agent belongs to the tenant before updating
    await this.findOne(tenantId, id);
    return this.prisma.agent.update({
      where: { id },
      data: {
        name: dto.name,
        status: dto.status,
        languageMode: dto.languageMode,
        voiceProvider: dto.voiceProvider,
        voiceId: dto.voiceId,
        twilioPhoneNumber: dto.twilioPhoneNumber,
        knowledgeBaseId: dto.knowledgeBaseId,
        features: dto.features,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    // Soft delete can be implemented instead of hard deletion
    await this.findOne(tenantId, id);
    return this.prisma.agent.delete({ where: { id } });
  }
}
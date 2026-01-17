import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

/**
 * AgentsController exposes REST endpoints for managing agents. It expects
 * clients to provide an `x-tenant-id` header to scope operations to a
 * particular tenant. In a production system this would be handled via
 * authentication/authorization middleware.
 */
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  private extractTenantId(headers: Record<string, string>): string {
    const tenantId = headers['x-tenant-id'] || headers['X-Tenant-Id'] || headers['x-tenant'];
    if (!tenantId) {
      throw new HttpException('x-tenant-id header is required', HttpStatus.BAD_REQUEST);
    }
    return tenantId;
  }

  @Post()
  async create(
    @Headers() headers: Record<string, string>,
    @Body() createAgentDto: CreateAgentDto,
  ) {
    const tenantId = this.extractTenantId(headers);
    return this.agentsService.create(tenantId, createAgentDto);
  }

  @Get()
  async findAll(@Headers() headers: Record<string, string>) {
    const tenantId = this.extractTenantId(headers);
    return this.agentsService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Headers() headers: Record<string, string>, @Param('id') id: string) {
    const tenantId = this.extractTenantId(headers);
    return this.agentsService.findOne(tenantId, id);
  }

  @Patch(':id')
  async update(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    const tenantId = this.extractTenantId(headers);
    return this.agentsService.update(tenantId, id, updateAgentDto);
  }

  @Delete(':id')
  async remove(@Headers() headers: Record<string, string>, @Param('id') id: string) {
    const tenantId = this.extractTenantId(headers);
    return this.agentsService.remove(tenantId, id);
  }
}
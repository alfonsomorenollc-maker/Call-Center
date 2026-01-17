import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [TwilioController],
  providers: [TwilioService, PrismaService],
})
export class TwilioModule {}
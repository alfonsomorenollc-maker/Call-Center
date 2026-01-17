import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AgentsModule } from './agents/agents.module';
import { TwilioModule } from './twilio/twilio.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AgentsModule,
    TwilioModule,
    // Additional modules such as AuthModule, BillingModule, etc. can be added here
  ],
  providers: [PrismaService],
})
export class AppModule {}
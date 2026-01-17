# AI Call Center – NestJS MVP

This repository contains a minimal yet extensible backend built with
[NestJS](https://nestjs.com/) and [Prisma](https://www.prisma.io/) that
implements the core logic for an AI‐powered call center. The goal of this
MVP is to allow non‑technical users to stand up a voice bot that can
answer incoming calls via Twilio, converse in either English or Spanish,
consult a knowledge base, and log calls into a lightweight CRM. The
system is multi‑tenant and designed to evolve into a fully fledged SaaS
platform.

## Features

* **Multi‑tenant data model:** Tenants, users, agents, knowledge bases,
  calls, contacts and usage events are modelled in `prisma/schema.prisma`.
* **Agent management:** REST endpoints to create, list, retrieve,
  update and delete agents. Each agent can have its own phone number,
  voice, language mode and feature flags.
* **Twilio webhooks:** Endpoints to handle incoming calls, speech
  recognition results and status callbacks. Calls are stored in the
  database and a simple language detection and reply generator is used
  for the conversation.
* **Extensible AI pipeline:** A placeholder `synthesize()` method is
  provided for integrating with ElevenLabs TTS. A simple language
  detection and response generator is included; replace it with your
  retrieval‑augmented generation pipeline and LLM of choice.
* **Configurable environment:** `.env.example` outlines the required
  environment variables, including the database URL, Twilio credentials
  and ElevenLabs keys.

## Getting Started

1. **Clone the repository and install dependencies**

   ```bash
   git clone <this repo>
   cd callcenter-nest
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your PostgreSQL credentials,
   Twilio Account SID, Auth Token and optionally ElevenLabs API key. You
   will also need to provision at least one Twilio phone number and
   assign it to an agent via the API.

3. **Set up the database**

   This project uses Prisma for ORM. Run the following commands to
   generate the client and apply the schema to your database:

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Run the application**

   ```bash
   npm run start:dev
   ```

   The API will start on `http://localhost:3000`. You can use tools like
   curl or Postman to interact with the `/agents` and `/twilio` endpoints.

5. **Configure Twilio webhooks**

   In your Twilio console, configure your phone number to send webhooks
   to your application:

   * **A call comes in:** `POST https://<your-domain>/twilio/voice`
   * **Status callback:** `POST https://<your-domain>/twilio/status`

   When running locally, use a tunnel service like ngrok to expose your
   server to the internet.

## Next Steps

This MVP lays the groundwork for a fully featured AI call center. To
expand it into a production‑ready SaaS, consider implementing:

* **Authentication and authorization** via JWT or another identity
  provider.
* **Knowledge ingestion and retrieval** using embeddings and a vector
  database such as pgvector or an external service.
* **Advanced conversation orchestration** with a state machine and
  fallback logic.
* **Premium features** like call transfer, SMS summaries and detailed
  analytics with usage‑based billing.

Pull requests and suggestions are welcome! This code is intended for
educational purposes and as a starting point for real projects.
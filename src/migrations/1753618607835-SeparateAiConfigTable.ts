import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeparateAiConfigTable1753618607835 implements MigrationInterface {
  name = 'SeparateAiConfigTable1753618607835';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the new ai_configs table
    await queryRunner.query(`
      CREATE TABLE "ai_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider" character varying NOT NULL DEFAULT 'groq',
        "model" character varying NOT NULL DEFAULT 'llama3-70b-8192',
        "instructions" character varying,
        "temperature" numeric(3,2) DEFAULT 0.7,
        "max_tokens" integer DEFAULT 1000,
        "top_p" numeric(3,2) DEFAULT 1.0,
        "frequency_penalty" numeric(3,2) DEFAULT 0.0,
        "presence_penalty" numeric(3,2) DEFAULT 0.0,
        "room_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_configs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ai_configs_room_id" UNIQUE ("room_id"),
        CONSTRAINT "FK_ai_configs_room_id" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE
      )
    `);

    // Add CHECK constraint for provider enum
    await queryRunner.query(`
      ALTER TABLE "ai_configs" 
      ADD CONSTRAINT "CHK_ai_configs_provider" 
      CHECK (provider IN ('openai', 'gemini', 'groq'))
    `);

    // Add CHECK constraints for numeric ranges
    await queryRunner.query(`
      ALTER TABLE "ai_configs" 
      ADD CONSTRAINT "CHK_ai_configs_temperature" 
      CHECK (temperature >= 0.0 AND temperature <= 2.0)
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_configs" 
      ADD CONSTRAINT "CHK_ai_configs_max_tokens" 
      CHECK (max_tokens >= 1 AND max_tokens <= 4000)
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_configs" 
      ADD CONSTRAINT "CHK_ai_configs_top_p" 
      CHECK (top_p >= 0.0 AND top_p <= 1.0)
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_configs" 
      ADD CONSTRAINT "CHK_ai_configs_frequency_penalty" 
      CHECK (frequency_penalty >= -2.0 AND frequency_penalty <= 2.0)
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_configs" 
      ADD CONSTRAINT "CHK_ai_configs_presence_penalty" 
      CHECK (presence_penalty >= -2.0 AND presence_penalty <= 2.0)
    `);

    // Migrate existing AI configuration data from rooms table to ai_configs table
    await queryRunner.query(`
      INSERT INTO "ai_configs" (
        "room_id", 
        "provider", 
        "model", 
        "instructions", 
        "temperature", 
        "max_tokens", 
        "top_p", 
        "frequency_penalty", 
        "presence_penalty",
        "createdAt",
        "updatedAt"
      )
      SELECT 
        "id" as room_id,
        COALESCE("ai_provider", 'groq') as provider,
        COALESCE("ai_model", 'llama3-70b-8192') as model,
        "ai_instructions" as instructions,
        COALESCE("ai_temperature", 0.7) as temperature,
        COALESCE("ai_max_tokens", 1000) as max_tokens,
        COALESCE("ai_top_p", 1.0) as top_p,
        COALESCE("ai_frequency_penalty", 0.0) as frequency_penalty,
        COALESCE("ai_presence_penalty", 0.0) as presence_penalty,
        "createdAt",
        "updatedAt"
      FROM "rooms"
      WHERE "id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Migrate data back from ai_configs to rooms
    await queryRunner.query(`
      UPDATE "rooms" 
      SET 
        "ai_provider" = "ai_configs"."provider",
        "ai_model" = "ai_configs"."model",
        "ai_temperature" = "ai_configs"."temperature",
        "ai_max_tokens" = "ai_configs"."max_tokens",
        "ai_top_p" = "ai_configs"."top_p",
        "ai_frequency_penalty" = "ai_configs"."frequency_penalty",
        "ai_presence_penalty" = "ai_configs"."presence_penalty"
      FROM "ai_configs"
      WHERE "rooms"."id" = "ai_configs"."room_id"
    `);

    // Re-add CHECK constraints to rooms table
    await queryRunner.query(`
      ALTER TABLE "rooms" 
      ADD CONSTRAINT "CHK_ai_provider" 
      CHECK (ai_provider IN ('openai', 'gemini', 'groq'))
    `);

    await queryRunner.query(`
      ALTER TABLE "rooms" 
      ADD CONSTRAINT "CHK_ai_temperature" 
      CHECK (ai_temperature >= 0.0 AND ai_temperature <= 2.0)
    `);

    await queryRunner.query(`
      ALTER TABLE "rooms" 
      ADD CONSTRAINT "CHK_ai_max_tokens" 
      CHECK (ai_max_tokens >= 1 AND ai_max_tokens <= 4000)
    `);

    await queryRunner.query(`
      ALTER TABLE "rooms" 
      ADD CONSTRAINT "CHK_ai_top_p" 
      CHECK (ai_top_p >= 0.0 AND ai_top_p <= 1.0)
    `);

    await queryRunner.query(`
      ALTER TABLE "rooms" 
      ADD CONSTRAINT "CHK_ai_frequency_penalty" 
      CHECK (ai_frequency_penalty >= -2.0 AND ai_frequency_penalty <= 2.0)
    `);

    await queryRunner.query(`
      ALTER TABLE "rooms" 
      ADD CONSTRAINT "CHK_ai_presence_penalty" 
      CHECK (ai_presence_penalty >= -2.0 AND ai_presence_penalty <= 2.0)
    `);

    // Drop the ai_configs table
    await queryRunner.query(`DROP TABLE "ai_configs"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiProviderFields1753618607834 implements MigrationInterface {
  name = 'AddAiProviderFields1753618607834';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add AI provider configuration columns to rooms table
    await queryRunner.query(`
      ALTER TABLE "rooms" 
      ADD COLUMN "ai_provider" character varying NOT NULL DEFAULT 'groq',
      ADD COLUMN "ai_model" character varying NOT NULL DEFAULT 'llama3-70b-8192',
      ADD COLUMN "ai_temperature" numeric(3,2) DEFAULT 0.7,
      ADD COLUMN "ai_max_tokens" integer DEFAULT 1000,
      ADD COLUMN "ai_top_p" numeric(3,2) DEFAULT 1.0,
      ADD COLUMN "ai_frequency_penalty" numeric(3,2) DEFAULT 0.0,
      ADD COLUMN "ai_presence_penalty" numeric(3,2) DEFAULT 0.0
    `);

    // Create CHECK constraint for ai_provider enum
    await queryRunner.query(`
      ALTER TABLE "rooms" 
      ADD CONSTRAINT "CHK_ai_provider" 
      CHECK (ai_provider IN ('openai', 'gemini', 'groq'))
    `);

    // Create CHECK constraints for numeric ranges
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
    await queryRunner.query(`
      ALTER TABLE "rooms" 
      DROP COLUMN IF EXISTS "ai_instructions",
      DROP COLUMN IF EXISTS "ai_provider",
      DROP COLUMN IF EXISTS "ai_model",
      DROP COLUMN IF EXISTS "ai_temperature",
      DROP COLUMN IF EXISTS "ai_max_tokens",
      DROP COLUMN IF EXISTS "ai_top_p",
      DROP COLUMN IF EXISTS "ai_frequency_penalty",
      DROP COLUMN IF EXISTS "ai_presence_penalty"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop CHECK constraints
    await queryRunner.query(`
      ALTER TABLE "rooms" 
      DROP CONSTRAINT IF EXISTS "CHK_ai_presence_penalty",
      DROP CONSTRAINT IF EXISTS "CHK_ai_frequency_penalty",
      DROP CONSTRAINT IF EXISTS "CHK_ai_top_p",
      DROP CONSTRAINT IF EXISTS "CHK_ai_max_tokens",
      DROP CONSTRAINT IF EXISTS "CHK_ai_temperature",
      DROP CONSTRAINT IF EXISTS "CHK_ai_provider"
    `);

    // Drop AI provider configuration columns
    await queryRunner.query(`
      ALTER TABLE "rooms" 
      DROP COLUMN IF EXISTS "ai_presence_penalty",
      DROP COLUMN IF EXISTS "ai_frequency_penalty",
      DROP COLUMN IF EXISTS "ai_top_p",
      DROP COLUMN IF EXISTS "ai_max_tokens",
      DROP COLUMN IF EXISTS "ai_temperature",
      DROP COLUMN IF EXISTS "ai_model",
      DROP COLUMN IF EXISTS "ai_provider"
    `);
  }
}

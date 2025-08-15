import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompleteSchema1753618607840 implements MigrationInterface {
  name = 'CompleteSchema1753618607840';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing tables if they exist (in reverse dependency order)
    await queryRunner.query(`DROP TABLE IF EXISTS "room_attachments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_attachments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "room_members" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_configs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invitations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rooms" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "profiles" CASCADE`);

    // Drop existing ENUMs if they exist (with CASCADE to handle dependencies)
    await queryRunner.query(`DROP TYPE IF EXISTS "attachment_type" CASCADE`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "attachment_type_old" CASCADE`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "invitation_status" CASCADE`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "invitation_status_old" CASCADE`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "room_type" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "room_type_old" CASCADE`);

    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create ENUMs
    await queryRunner.query(
      `CREATE TYPE "room_type" AS ENUM('personal', 'group')`,
    );
    await queryRunner.query(
      `CREATE TYPE "invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TYPE "attachment_type" AS ENUM('ai_config', 'room_file')`,
    );

    // Create profiles table (users)
    await queryRunner.query(`
      CREATE TABLE "profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" text,
        "username" text,
        "email" text NOT NULL,
        "password" text NOT NULL,
        "password_key" text NOT NULL,
        "supabase_user_id" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_profiles_username" UNIQUE ("username"),
        CONSTRAINT "UQ_profiles_email" UNIQUE ("email"),
        CONSTRAINT "UQ_profiles_supabase_user_id" UNIQUE ("supabase_user_id"),
        CONSTRAINT "PK_profiles_id" PRIMARY KEY ("id")
      )
    `);

    // Create rooms table
    await queryRunner.query(`
      CREATE TABLE "rooms" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" text,
        "type" "room_type" NOT NULL DEFAULT 'personal',
        "admin_id" uuid,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rooms_id" PRIMARY KEY ("id")
      )
    `);

    // Create messages table
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "content" text NOT NULL,
        "sender_type" text NOT NULL DEFAULT 'user',
        "sender_id" uuid NOT NULL,
        "room_id" uuid NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id")
      )
    `);

    // Create invitations table
    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" text NOT NULL,
        "status" "invitation_status" NOT NULL DEFAULT 'pending',
        "expiresAt" TIMESTAMPTZ,
        "room_id" uuid NOT NULL,
        "invited_by_id" uuid NOT NULL,
        "invited_user_id" uuid,
        "invitedEmail" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invitations_code" UNIQUE ("code"),
        CONSTRAINT "PK_invitations_id" PRIMARY KEY ("id")
      )
    `);

    // Create ai_configs table
    await queryRunner.query(`
      CREATE TABLE "ai_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider" text NOT NULL DEFAULT 'groq',
        "model" text NOT NULL DEFAULT 'llama3-70b-8192',
        "instructions" text,
        "temperature" numeric(3,2) DEFAULT 0.7,
        "max_tokens" integer DEFAULT 1000,
        "top_p" numeric(3,2) DEFAULT 1.0,
        "frequency_penalty" numeric(3,2) DEFAULT 0.0,
        "presence_penalty" numeric(3,2) DEFAULT 0.0,
        "room_id" uuid NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_configs_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ai_configs_room_id" UNIQUE ("room_id")
      )
    `);

    // Create room_members table
    await queryRunner.query(`
      CREATE TABLE "room_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "room_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" text DEFAULT 'member',
        "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "lastSeenAt" TIMESTAMPTZ,
        CONSTRAINT "PK_room_members_id" PRIMARY KEY ("id")
      )
    `);

    // Create ai_attachments table
    await queryRunner.query(`
      CREATE TABLE "ai_attachments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "filename" text NOT NULL,
        "originalName" text NOT NULL,
        "mimeType" text NOT NULL,
        "size" bigint NOT NULL,
        "storagePath" text NOT NULL,
        "storageUrl" text NOT NULL,
        "type" "attachment_type" NOT NULL DEFAULT 'ai_config',
        "description" text,
        "roomId" uuid NOT NULL,
        "uploaded_by_id" uuid NOT NULL,
        "ai_config_id" uuid NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_attachments_id" PRIMARY KEY ("id")
      )
    `);

    // Create room_attachments table
    await queryRunner.query(`
      CREATE TABLE "room_attachments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "filename" text NOT NULL,
        "originalName" text NOT NULL,
        "mimeType" text NOT NULL,
        "size" bigint NOT NULL,
        "storagePath" text NOT NULL,
        "storageUrl" text NOT NULL,
        "type" "attachment_type" NOT NULL DEFAULT 'room_file',
        "description" text,
        "room_id" uuid NOT NULL,
        "uploaded_by_id" uuid NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_room_attachments_id" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "rooms" 
      ADD CONSTRAINT "FK_rooms_admin_id" 
      FOREIGN KEY ("admin_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "FK_messages_sender_id" 
      FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "FK_messages_room_id" 
      FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ADD CONSTRAINT "FK_invitations_room_id" 
      FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ADD CONSTRAINT "FK_invitations_invited_by_id" 
      FOREIGN KEY ("invited_by_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ADD CONSTRAINT "FK_invitations_invited_user_id" 
      FOREIGN KEY ("invited_user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_configs" 
      ADD CONSTRAINT "FK_ai_configs_room_id" 
      FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "room_members" 
      ADD CONSTRAINT "FK_room_members_room_id" 
      FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "room_members" 
      ADD CONSTRAINT "FK_room_members_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_attachments" 
      ADD CONSTRAINT "FK_ai_attachments_ai_config_id" 
      FOREIGN KEY ("ai_config_id") REFERENCES "ai_configs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_attachments" 
      ADD CONSTRAINT "FK_ai_attachments_uploaded_by_id" 
      FOREIGN KEY ("uploaded_by_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "room_attachments" 
      ADD CONSTRAINT "FK_room_attachments_room_id" 
      FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "room_attachments" 
      ADD CONSTRAINT "FK_room_attachments_uploaded_by_id" 
      FOREIGN KEY ("uploaded_by_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add CHECK constraints for ai_configs
    await queryRunner.query(`
      ALTER TABLE "ai_configs" 
      ADD CONSTRAINT "CHK_ai_configs_provider" 
      CHECK (provider IN ('openai', 'gemini', 'groq'))
    `);

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

    // Create indexes for performance
    await queryRunner.query(
      `CREATE INDEX "IDX_profiles_username" ON "profiles" ("username")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_profiles_email" ON "profiles" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_profiles_supabase_user_id" ON "profiles" ("supabase_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rooms_type" ON "rooms" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rooms_admin_id" ON "rooms" ("admin_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_sender_id" ON "messages" ("sender_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_room_id" ON "messages" ("room_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_createdAt" ON "messages" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_room_id" ON "invitations" ("room_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_invited_by_id" ON "invitations" ("invited_by_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_invited_user_id" ON "invitations" ("invited_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_code" ON "invitations" ("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_configs_room_id" ON "ai_configs" ("room_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_room_members_room_id" ON "room_members" ("room_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_room_members_user_id" ON "room_members" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_attachments_ai_config_id" ON "ai_attachments" ("ai_config_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_attachments_uploaded_by_id" ON "ai_attachments" ("uploaded_by_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_attachments_filename" ON "ai_attachments" ("filename")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_room_attachments_room_id" ON "room_attachments" ("room_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_room_attachments_uploaded_by_id" ON "room_attachments" ("uploaded_by_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_room_attachments_filename" ON "room_attachments" ("filename")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_room_attachments_filename"`);
    await queryRunner.query(`DROP INDEX "IDX_room_attachments_uploaded_by_id"`);
    await queryRunner.query(`DROP INDEX "IDX_room_attachments_room_id"`);
    await queryRunner.query(`DROP INDEX "IDX_ai_attachments_filename"`);
    await queryRunner.query(`DROP INDEX "IDX_ai_attachments_uploaded_by_id"`);
    await queryRunner.query(`DROP INDEX "IDX_ai_attachments_ai_config_id"`);
    await queryRunner.query(`DROP INDEX "IDX_room_members_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_room_members_room_id"`);
    await queryRunner.query(`DROP INDEX "IDX_ai_configs_room_id"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_code"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_invited_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_invited_by_id"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_room_id"`);
    await queryRunner.query(`DROP INDEX "IDX_messages_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_messages_room_id"`);
    await queryRunner.query(`DROP INDEX "IDX_messages_sender_id"`);
    await queryRunner.query(`DROP INDEX "IDX_rooms_admin_id"`);
    await queryRunner.query(`DROP INDEX "IDX_rooms_type"`);
    await queryRunner.query(`DROP INDEX "IDX_profiles_supabase_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_profiles_email"`);
    await queryRunner.query(`DROP INDEX "IDX_profiles_username"`);

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "room_attachments" DROP CONSTRAINT "FK_room_attachments_uploaded_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_attachments" DROP CONSTRAINT "FK_room_attachments_room_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_attachments" DROP CONSTRAINT "FK_ai_attachments_uploaded_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_attachments" DROP CONSTRAINT "FK_ai_attachments_ai_config_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_members" DROP CONSTRAINT "FK_room_members_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_members" DROP CONSTRAINT "FK_room_members_room_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_configs" DROP CONSTRAINT "FK_ai_configs_room_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_invited_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_invited_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_room_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_room_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_sender_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" DROP CONSTRAINT "FK_rooms_admin_id"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "room_attachments"`);
    await queryRunner.query(`DROP TABLE "ai_attachments"`);
    await queryRunner.query(`DROP TABLE "room_members"`);
    await queryRunner.query(`DROP TABLE "ai_configs"`);
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "rooms"`);
    await queryRunner.query(`DROP TABLE "profiles"`);

    // Drop ENUMs
    await queryRunner.query(`DROP TYPE "attachment_type"`);
    await queryRunner.query(`DROP TYPE "invitation_status"`);
    await queryRunner.query(`DROP TYPE "room_type"`);
  }
}

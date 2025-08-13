import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorAttachmentsSystem1753618607839
  implements MigrationInterface
{
  name = 'RefactorAttachmentsSystem1753618607839';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create AttachmentType enum
    await queryRunner.query(`
      CREATE TYPE "attachment_type" AS ENUM('ai_config', 'room_file')
    `);

    // Drop old attachment tables if they exist
    await queryRunner.query(`DROP TABLE IF EXISTS "attachments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "room_attachments" CASCADE`);

    // Create new ai_attachments table
    await queryRunner.query(`
      CREATE TABLE "ai_attachments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "filename" character varying NOT NULL,
        "originalName" character varying NOT NULL,
        "mimeType" character varying NOT NULL,
        "size" bigint NOT NULL,
        "storagePath" character varying NOT NULL,
        "storageUrl" character varying NOT NULL,
        "type" "attachment_type" NOT NULL DEFAULT 'ai_config',
        "description" character varying,
        "roomId" uuid NOT NULL,
        "uploaded_by_id" uuid NOT NULL,
        "ai_config_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_attachments_id" PRIMARY KEY ("id")
      )
    `);

    // Create new room_attachments table
    await queryRunner.query(`
      CREATE TABLE "room_attachments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "filename" character varying NOT NULL,
        "originalName" character varying NOT NULL,
        "mimeType" character varying NOT NULL,
        "size" bigint NOT NULL,
        "storagePath" character varying NOT NULL,
        "storageUrl" character varying NOT NULL,
        "type" "attachment_type" NOT NULL DEFAULT 'room_file',
        "description" character varying,
        "roomId" uuid NOT NULL,
        "uploaded_by_id" uuid NOT NULL,
        "room_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_room_attachments_id" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints for ai_attachments
    await queryRunner.query(`
      ALTER TABLE "ai_attachments" 
      ADD CONSTRAINT "FK_ai_attachments_uploaded_by_id" 
      FOREIGN KEY ("uploaded_by_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_attachments" 
      ADD CONSTRAINT "FK_ai_attachments_ai_config_id" 
      FOREIGN KEY ("ai_config_id") REFERENCES "ai_configs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add foreign key constraints for room_attachments
    await queryRunner.query(`
      ALTER TABLE "room_attachments" 
      ADD CONSTRAINT "FK_room_attachments_uploaded_by_id" 
      FOREIGN KEY ("uploaded_by_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "room_attachments" 
      ADD CONSTRAINT "FK_room_attachments_room_id" 
      FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_attachments_room_id" ON "ai_attachments" ("roomId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_attachments_uploaded_by_id" ON "ai_attachments" ("uploaded_by_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_attachments_ai_config_id" ON "ai_attachments" ("ai_config_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_attachments_type" ON "ai_attachments" ("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_room_attachments_room_id" ON "room_attachments" ("roomId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_room_attachments_uploaded_by_id" ON "room_attachments" ("uploaded_by_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_room_attachments_type" ON "room_attachments" ("type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_room_attachments_type"`);
    await queryRunner.query(`DROP INDEX "IDX_room_attachments_uploaded_by_id"`);
    await queryRunner.query(`DROP INDEX "IDX_room_attachments_room_id"`);
    await queryRunner.query(`DROP INDEX "IDX_ai_attachments_type"`);
    await queryRunner.query(`DROP INDEX "IDX_ai_attachments_ai_config_id"`);
    await queryRunner.query(`DROP INDEX "IDX_ai_attachments_uploaded_by_id"`);
    await queryRunner.query(`DROP INDEX "IDX_ai_attachments_room_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "room_attachments" 
      DROP CONSTRAINT "FK_room_attachments_room_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "room_attachments" 
      DROP CONSTRAINT "FK_room_attachments_uploaded_by_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_attachments" 
      DROP CONSTRAINT "FK_ai_attachments_ai_config_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_attachments" 
      DROP CONSTRAINT "FK_ai_attachments_uploaded_by_id"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE "room_attachments"`);
    await queryRunner.query(`DROP TABLE "ai_attachments"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "attachment_type"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttachmentsTable1753618607837 implements MigrationInterface {
  name = 'AddAttachmentsTable1753618607837';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create attachments table
    await queryRunner.query(`
      CREATE TABLE "attachments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "filename" character varying NOT NULL,
        "originalName" character varying NOT NULL,
        "mimeType" character varying NOT NULL,
        "size" bigint NOT NULL,
        "path" character varying NOT NULL,
        "description" character varying,
        "ai_config_id" uuid NOT NULL,
        "uploaded_by_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attachments_id" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "attachments" 
      ADD CONSTRAINT "FK_attachments_ai_config_id" 
      FOREIGN KEY ("ai_config_id") REFERENCES "ai_configs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "attachments" 
      ADD CONSTRAINT "FK_attachments_uploaded_by_id" 
      FOREIGN KEY ("uploaded_by_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_attachments_ai_config_id" ON "attachments" ("ai_config_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_attachments_uploaded_by_id" ON "attachments" ("uploaded_by_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_attachments_filename" ON "attachments" ("filename")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_attachments_filename"`);
    await queryRunner.query(`DROP INDEX "IDX_attachments_uploaded_by_id"`);
    await queryRunner.query(`DROP INDEX "IDX_attachments_ai_config_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "attachments" 
      DROP CONSTRAINT "FK_attachments_uploaded_by_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "attachments" 
      DROP CONSTRAINT "FK_attachments_ai_config_id"
    `);

    // Drop attachments table
    await queryRunner.query(`DROP TABLE "attachments"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoomAttachmentsTable1753618607838
  implements MigrationInterface
{
  name = 'AddRoomAttachmentsTable1753618607838';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create room_attachments table
    await queryRunner.query(`
      CREATE TABLE "room_attachments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "filename" character varying NOT NULL,
        "originalName" character varying NOT NULL,
        "mimeType" character varying NOT NULL,
        "size" bigint NOT NULL,
        "path" character varying NOT NULL,
        "description" character varying,
        "room_id" uuid NOT NULL,
        "uploaded_by_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_room_attachments_id" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
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

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_room_attachments_room_id" ON "room_attachments" ("room_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_room_attachments_uploaded_by_id" ON "room_attachments" ("uploaded_by_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_room_attachments_filename" ON "room_attachments" ("filename")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_room_attachments_filename"`);
    await queryRunner.query(`DROP INDEX "IDX_room_attachments_uploaded_by_id"`);
    await queryRunner.query(`DROP INDEX "IDX_room_attachments_room_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "room_attachments" 
      DROP CONSTRAINT "FK_room_attachments_uploaded_by_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "room_attachments" 
      DROP CONSTRAINT "FK_room_attachments_room_id"
    `);

    // Drop room_attachments table
    await queryRunner.query(`DROP TABLE "room_attachments"`);
  }
}

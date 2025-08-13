import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoomAdmin1753618607836 implements MigrationInterface {
  name = 'AddRoomAdmin1753618607836';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add admin_id column to rooms table
    await queryRunner.query(`
      ALTER TABLE "rooms" 
      ADD COLUMN "admin_id" uuid
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "rooms" 
      ADD CONSTRAINT "FK_rooms_admin_id" 
      FOREIGN KEY ("admin_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Create index for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_rooms_admin_id" ON "rooms" ("admin_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_rooms_admin_id"`);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "rooms" 
      DROP CONSTRAINT "FK_rooms_admin_id"
    `);

    // Drop admin_id column
    await queryRunner.query(`
      ALTER TABLE "rooms" 
      DROP COLUMN "admin_id"
    `);
  }
}

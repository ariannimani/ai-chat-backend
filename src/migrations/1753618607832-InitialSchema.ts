import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1753618607832 implements MigrationInterface {
  name = 'InitialSchema1753618607832';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create ENUM for room types
    await queryRunner.query(
      `CREATE TYPE "room_type" AS ENUM('personal', 'group')`,
    );

    // Create users table
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "name" character varying NOT NULL, 
                "username" character varying NOT NULL, 
                "email" character varying NOT NULL, 
                "password" character varying NOT NULL, 
                "password_key" character varying NOT NULL, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "UQ_users_username" UNIQUE ("username"), 
                CONSTRAINT "UQ_users_email" UNIQUE ("email"), 
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
            )
        `);

    // Create rooms table
    await queryRunner.query(`
            CREATE TABLE "rooms" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "name" character varying, 
                "type" "room_type" NOT NULL DEFAULT 'personal', 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_rooms_id" PRIMARY KEY ("id")
            )
        `);

    // Create chats table
    await queryRunner.query(`
            CREATE TABLE "chats" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "content" character varying NOT NULL, 
                "isAiResponse" boolean NOT NULL DEFAULT false, 
                "sender_id" uuid NOT NULL, 
                "room_id" uuid NOT NULL, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_chats_id" PRIMARY KEY ("id")
            )
        `);

    // Add foreign keys
    await queryRunner.query(`
            ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_sender" 
            FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_room" 
            FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    // Create indexes for performance
    await queryRunner.query(
      `CREATE INDEX "IDX_users_username" ON "users" ("username")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rooms_type" ON "rooms" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chats_sender_id" ON "chats" ("sender_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chats_room_id" ON "chats" ("room_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chats_createdAt" ON "chats" ("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_chats_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_chats_room_id"`);
    await queryRunner.query(`DROP INDEX "IDX_chats_sender_id"`);
    await queryRunner.query(`DROP INDEX "IDX_rooms_type"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_users_username"`);

    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_chats_room"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_chats_sender"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "chats"`);
    await queryRunner.query(`DROP TABLE "rooms"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "room_type"`);
  }
}

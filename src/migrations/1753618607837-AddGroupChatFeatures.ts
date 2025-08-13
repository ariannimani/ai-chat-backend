import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupChatFeatures1753618607837 implements MigrationInterface {
  name = 'AddGroupChatFeatures1753618607837';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Room members
    await queryRunner.query(`
      CREATE TABLE "room_members" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "room_id" uuid NOT NULL REFERENCES "rooms"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "role" character varying DEFAULT 'member',
        "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "lastSeenAt" TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_room_members_room_id" ON "room_members" ("room_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_room_members_user_id" ON "room_members" ("user_id")
    `);

    // 2. Attachments
    await queryRunner.query(`
      CREATE TABLE "attachments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "chat_id" uuid NOT NULL REFERENCES "chats"("id") ON DELETE CASCADE,
        "type" character varying NOT NULL,
        "url" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_attachments_chat_id" ON "attachments" ("chat_id")
    `);

    // 3. Message status
    await queryRunner.query(`
      CREATE TABLE "message_status" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "chat_id" uuid NOT NULL REFERENCES "chats"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "status" character varying NOT NULL DEFAULT 'delivered',
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_message_status_chat_id" ON "message_status" ("chat_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_message_status_user_id" ON "message_status" ("user_id")
    `);

    // 4. Pinned messages
    await queryRunner.query(`
      CREATE TABLE "pinned_messages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "room_id" uuid NOT NULL REFERENCES "rooms"("id") ON DELETE CASCADE,
        "chat_id" uuid NOT NULL REFERENCES "chats"("id") ON DELETE CASCADE,
        "pinnedBy" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE SET NULL,
        "pinnedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_pinned_messages_room_id" ON "pinned_messages" ("room_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_pinned_messages_chat_id" ON "pinned_messages" ("chat_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop pinned messages
    await queryRunner.query(`DROP INDEX "IDX_pinned_messages_chat_id"`);
    await queryRunner.query(`DROP INDEX "IDX_pinned_messages_room_id"`);
    await queryRunner.query(`DROP TABLE "pinned_messages"`);

    // Drop message status
    await queryRunner.query(`DROP INDEX "IDX_message_status_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_message_status_chat_id"`);
    await queryRunner.query(`DROP TABLE "message_status"`);

    // Drop attachments
    await queryRunner.query(`DROP INDEX "IDX_attachments_chat_id"`);
    await queryRunner.query(`DROP TABLE "attachments"`);

    // Drop room members
    await queryRunner.query(`DROP INDEX "IDX_room_members_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_room_members_room_id"`);
    await queryRunner.query(`DROP TABLE "room_members"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvitationTable1753618607833 implements MigrationInterface {
  name = 'AddInvitationTable1753618607833';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM for invitation status
    await queryRunner.query(
      `CREATE TYPE "invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired')`,
    );

    // Create invitations table
    await queryRunner.query(`
            CREATE TABLE "invitations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "code" character varying NOT NULL,
                "status" "invitation_status" NOT NULL DEFAULT 'pending',
                "expiresAt" TIMESTAMP,
                "room_id" uuid NOT NULL,
                "invited_by_id" uuid NOT NULL,
                "invited_user_id" uuid,
                "invitedEmail" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_invitations_code" UNIQUE ("code"),
                CONSTRAINT "PK_invitations_id" PRIMARY KEY ("id")
            )
        `);

    // Create foreign key constraints
    await queryRunner.query(`
            ALTER TABLE "invitations" 
            ADD CONSTRAINT "FK_invitations_room_id" 
            FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "invitations" 
            ADD CONSTRAINT "FK_invitations_invited_by_id" 
            FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "invitations" 
            ADD CONSTRAINT "FK_invitations_invited_user_id" 
            FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    // Create indexes for better performance
    await queryRunner.query(`
            CREATE INDEX "IDX_invitations_code" ON "invitations" ("code")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_invitations_status" ON "invitations" ("status")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_invitations_room_id" ON "invitations" ("room_id")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_invitations_invited_by_id" ON "invitations" ("invited_by_id")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_invitations_invited_user_id" ON "invitations" ("invited_user_id")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_invitations_invited_email" ON "invitations" ("invitedEmail")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_invitations_invited_email"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_invited_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_invited_by_id"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_room_id"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_status"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_code"`);

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_invited_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_invited_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_room_id"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE "invitations"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "invitation_status"`);
  }
}

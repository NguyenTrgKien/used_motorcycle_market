import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationSubmittedNotifications1786800000000
  implements MigrationInterface
{
  name = 'AddApplicationSubmittedNotifications1786800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'new_identity_application'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'new_professional_seller_application'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "notifications" SET "type" = 'new_posst_pending' WHERE "type" IN ('new_identity_application', 'new_professional_seller_application')`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('post_approve', 'post_rejected', 'new_message', 'new_review', 'new_posst_pending', 'bank_transfer_submitted', 'bank_transfer_rejected', 'bank_transfer_confirmed', 'identity_status_updated')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::text::"public"."notifications_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
  }
}

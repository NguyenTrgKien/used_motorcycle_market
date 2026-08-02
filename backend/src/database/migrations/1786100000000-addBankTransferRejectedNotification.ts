import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBankTransferRejectedNotification1786100000000
  implements MigrationInterface
{
  name = 'AddBankTransferRejectedNotification1786100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'bank_transfer_rejected'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "notifications" SET "type" = 'new_posst_pending' WHERE "type" = 'bank_transfer_rejected'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('post_approve', 'post_rejected', 'new_message', 'new_review', 'new_posst_pending', 'bank_transfer_submitted')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::text::"public"."notifications_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."notifications_type_enum_old"`,
    );
  }
}

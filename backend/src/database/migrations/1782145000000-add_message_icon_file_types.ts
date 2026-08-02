import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageIconFileTypes1782145000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."messages_messagetype_enum" ADD VALUE IF NOT EXISTS 'icon'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."messages_messagetype_enum" ADD VALUE IF NOT EXISTS 'file'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "messages" SET "messageType" = 'text' WHERE "messageType" IN ('icon', 'file')`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."messages_messagetype_enum" RENAME TO "messages_messagetype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_messagetype_enum" AS ENUM('text', 'image')`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "messageType" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "messageType" TYPE "public"."messages_messagetype_enum" USING "messageType"::text::"public"."messages_messagetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "messageType" SET DEFAULT 'text'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."messages_messagetype_enum_old"`,
    );
  }
}

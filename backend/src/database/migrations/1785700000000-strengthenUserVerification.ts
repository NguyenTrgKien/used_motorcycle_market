import { MigrationInterface, QueryRunner } from 'typeorm';

export class StrengthenUserVerification1785700000000
  implements MigrationInterface
{
  name = 'StrengthenUserVerification1785700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_verifications" ADD "failedAttempts" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "phone" TYPE character varying(16)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phoneVerifiedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_phone" ON "users"  ("phone") WHERE "phone" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_users_phone"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "phoneVerifiedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "phone" TYPE character varying(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_verifications" DROP COLUMN "failedAttempts"`,
    );
  }
}

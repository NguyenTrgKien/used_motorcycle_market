import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBlackListTable1772526561479 implements MigrationInterface {
  name = 'CreateBlackListTable1772526561479';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "blacklist_tokens" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1713bcba6ce8eec7cdb1c4fef44" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "fullName" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "fullName" SET NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "blacklist_tokens"`);
  }
}

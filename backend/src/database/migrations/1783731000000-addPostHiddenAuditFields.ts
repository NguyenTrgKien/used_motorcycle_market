import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPostHiddenAuditFields1783731000000 implements MigrationInterface {
  name = "AddPostHiddenAuditFields1783731000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" ADD "hiddenReason" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "hiddenAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "hiddenBy" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "hiddenBy"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "hiddenAt"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "hiddenReason"`);
  }
}

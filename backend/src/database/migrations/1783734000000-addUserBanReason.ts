import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserBanReason1783734000000 implements MigrationInterface {
  name = "AddUserBanReason1783734000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "banReason" character varying(500)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "banReason"`);
  }
}

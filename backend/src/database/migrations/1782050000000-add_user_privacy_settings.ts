import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPrivacySettings1782050000000 implements MigrationInterface {
  name = 'AddUserPrivacySettings1782050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "showEmail" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "showPhone" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "showPhone"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "showEmail"`);
  }
}

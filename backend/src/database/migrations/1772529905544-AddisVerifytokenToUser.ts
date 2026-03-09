import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddisVerifytokenToUser1772529905544 implements MigrationInterface {
  name = 'AddisVerifytokenToUser1772529905544';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "verifyToken" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verifyToken"`);
  }
}

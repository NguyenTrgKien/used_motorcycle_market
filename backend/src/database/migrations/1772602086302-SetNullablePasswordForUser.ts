import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetNullablePasswordForUser1772602086302 implements MigrationInterface {
  name = 'SetNullablePasswordForUser1772602086302';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`,
    );
  }
}

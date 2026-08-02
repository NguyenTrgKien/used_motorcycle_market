import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropCategoryIcon1784400000000 implements MigrationInterface {
  name = 'DropCategoryIcon1784400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" DROP COLUMN IF EXISTS "icon"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "icon" character varying`,
    );
  }
}

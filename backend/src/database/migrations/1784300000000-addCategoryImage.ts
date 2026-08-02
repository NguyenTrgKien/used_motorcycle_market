import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryImage1784300000000 implements MigrationInterface {
  name = 'AddCategoryImage1784300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "image" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "imagePublicId" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" DROP COLUMN IF EXISTS "imagePublicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" DROP COLUMN IF EXISTS "image"`,
    );
  }
}

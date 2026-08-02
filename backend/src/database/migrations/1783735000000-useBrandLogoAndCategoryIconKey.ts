import { MigrationInterface, QueryRunner } from 'typeorm';

export class UseBrandLogoAndCategoryIconKey1783735000000
  implements MigrationInterface
{
  name = 'UseBrandLogoAndCategoryIconKey1783735000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle_brands" ADD COLUMN IF NOT EXISTS "publicId" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN IF EXISTS "image"`);
    await queryRunner.query(
      `ALTER TABLE "category" DROP COLUMN IF EXISTS "publicId"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "image" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "publicId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_brands" DROP COLUMN IF EXISTS "publicId"`,
    );
  }
}

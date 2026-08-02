import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryListingFormSchema1786300000000
  implements MigrationInterface
{
  name = 'AddCategoryListingFormSchema1786300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ADD "listingFormSchema" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" DROP COLUMN "listingFormSchema"`,
    );
  }
}

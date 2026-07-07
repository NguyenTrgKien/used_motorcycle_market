import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVehicleDocumentImages1782142000000
  implements MigrationInterface
{
  name = 'AddVehicleDocumentImages1782142000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" ADD "documentImages" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "documentImages"`);
  }
}

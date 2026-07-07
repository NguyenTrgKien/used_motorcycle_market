import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatePostGuideFlagToUser1782143000000
  implements MigrationInterface
{
  name = 'AddCreatePostGuideFlagToUser1782143000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "hasSeenCreatePostGuide" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "hasSeenCreatePostGuide"`,
    );
  }
}

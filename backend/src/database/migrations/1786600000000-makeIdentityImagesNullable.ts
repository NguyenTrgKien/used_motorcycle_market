import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeIdentityImagesNullable1786600000000
  implements MigrationInterface
{
  name = 'MakeIdentityImagesNullable1786600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_identities" ALTER COLUMN "idFrontUrl" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" ALTER COLUMN "idBackUrl" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" ALTER COLUMN "selfieUrl" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "user_identities" SET "idFrontUrl" = COALESCE("idFrontUrl", ''), "idBackUrl" = COALESCE("idBackUrl", ''), "selfieUrl" = COALESCE("selfieUrl", '')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" ALTER COLUMN "selfieUrl" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" ALTER COLUMN "idBackUrl" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" ALTER COLUMN "idFrontUrl" SET NOT NULL`,
    );
  }
}

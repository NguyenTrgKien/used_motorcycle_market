import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdentityImagePublicIds1785600000000
  implements MigrationInterface
{
  name = 'AddIdentityImagePublicIds1785600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_identities" ADD "idFrontPublicId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" ADD "idBackPublicId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" ADD "selfiePublicId" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_identities" DROP COLUMN "selfiePublicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" DROP COLUMN "idBackPublicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" DROP COLUMN "idFrontPublicId"`,
    );
  }
}

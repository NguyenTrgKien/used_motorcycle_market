import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlugforPostAndCategory1773042541500 implements MigrationInterface {
  name = 'AddSlugforPostAndCategory1773042541500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ADD "slug" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "UQ_cb73208f151aa71cdd78f662d70" UNIQUE ("slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "slug" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "UQ_54ddf9075260407dcfdd7248577" UNIQUE ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "UQ_54ddf9075260407dcfdd7248577"`,
    );
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "slug"`);
    await queryRunner.query(
      `ALTER TABLE "category" DROP CONSTRAINT "UQ_cb73208f151aa71cdd78f662d70"`,
    );
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "slug"`);
  }
}

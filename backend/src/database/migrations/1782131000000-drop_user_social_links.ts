import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserSocialLinks1782131000000 implements MigrationInterface {
  name = 'DropUserSocialLinks1782131000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_social_links" DROP CONSTRAINT IF EXISTS "FK_user_social_links_user"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_user_social_links_user_platform"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "user_social_links"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."user_social_links_platform_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_social_links_platform_enum" AS ENUM('facebook', 'instagram', 'tiktok', 'linkedin', 'zalo', 'website')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_social_links" ("id" SERIAL NOT NULL, "platform" "public"."user_social_links_platform_enum" NOT NULL, "url" character varying(500) NOT NULL, "isPublic" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_98b2db4fd1ee83e4be50fc0367d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_social_links_user_platform" ON "user_social_links" ("userId", "platform")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_social_links" ADD CONSTRAINT "FK_user_social_links_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSocialLinks1782130000000 implements MigrationInterface {
  name = 'AddUserSocialLinks1782130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_social_links" DROP CONSTRAINT "FK_user_social_links_user"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_user_social_links_user_platform"`);
    await queryRunner.query(`DROP TABLE "user_social_links"`);
    await queryRunner.query(`DROP TYPE "public"."user_social_links_platform_enum"`);
  }
}

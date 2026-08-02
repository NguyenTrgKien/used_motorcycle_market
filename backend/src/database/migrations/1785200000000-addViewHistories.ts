import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViewHistories1785200000000 implements MigrationInterface {
  name = 'AddViewHistories1785200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "view_histories" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "viewedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_view_histories_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_view_histories_user_post" UNIQUE ("userId", "postId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_view_histories_user_viewed_at" ON "view_histories" ("userId", "viewedAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_histories" ADD CONSTRAINT "FK_view_histories_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_histories" ADD CONSTRAINT "FK_view_histories_post" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "view_histories" DROP CONSTRAINT "FK_view_histories_post"`,
    );
    await queryRunner.query(
      `ALTER TABLE "view_histories" DROP CONSTRAINT "FK_view_histories_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_view_histories_user_viewed_at"`,
    );
    await queryRunner.query(`DROP TABLE "view_histories"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddListingPayments1785500000000 implements MigrationInterface {
  name = 'AddListingPayments1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "listing_free_quotas" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "pricingGroup" character varying(30) NOT NULL, "usedCount" integer NOT NULL DEFAULT 0, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_listing_free_quotas" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_listing_free_quota_user_group" ON "listing_free_quotas" ("userId", "pricingGroup")`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "listingBillingType" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "listingPricingGroup" character varying(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "listingFee" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "freeQuotaRefunded" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE TABLE "listing_payment_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(30) NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "amount" integer NOT NULL, "method" character varying(30) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "gatewayTransactionId" character varying(255), "gatewayResponse" jsonb, "paidAt" TIMESTAMP, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_listing_payment_code" UNIQUE ("code"), CONSTRAINT "UQ_listing_payment_post" UNIQUE ("postId"), CONSTRAINT "PK_listing_payment_orders" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_listing_payment_user_created" ON "listing_payment_orders" ("userId", "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_free_quotas" ADD CONSTRAINT "FK_listing_free_quota_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" ADD CONSTRAINT "FK_listing_payment_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" ADD CONSTRAINT "FK_listing_payment_post" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(`
      INSERT INTO "listing_free_quotas" ("userId", "pricingGroup", "usedCount")
      SELECT
        "classified_posts"."userId",
        "classified_posts"."pricingGroup",
        LEAST(
          COUNT(*)::integer,
          CASE
            WHEN "classified_posts"."pricingGroup" = 'large_vehicle'
            THEN 1
            ELSE 2
          END
        )
      FROM (
        SELECT
          "posts"."userId",
          CASE
            WHEN "category"."slug" IN ('o-to', 'xe-tai', 'xe-chuyen-dung')
            THEN 'large_vehicle'
            ELSE 'other_vehicle'
          END AS "pricingGroup"
        FROM "posts"
        INNER JOIN "users" ON "users"."id" = "posts"."userId"
        INNER JOIN "category" ON "category"."id" = "posts"."categoryId"
        WHERE "users"."sellerType" = 'individual'
          AND "posts"."status" NOT IN ('rejected', 'hidden', 'draft')
      ) AS "classified_posts"
      GROUP BY
        "classified_posts"."userId",
        "classified_posts"."pricingGroup"
      ON CONFLICT ("userId", "pricingGroup") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" DROP CONSTRAINT "FK_listing_payment_post"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" DROP CONSTRAINT "FK_listing_payment_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_free_quotas" DROP CONSTRAINT "FK_listing_free_quota_user"`,
    );
    await queryRunner.query(`DROP TABLE "listing_payment_orders"`);
    await queryRunner.query(
      `ALTER TABLE "posts" DROP COLUMN "freeQuotaRefunded"`,
    );
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "listingFee"`);
    await queryRunner.query(
      `ALTER TABLE "posts" DROP COLUMN "listingPricingGroup"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP COLUMN "listingBillingType"`,
    );
    await queryRunner.query(`DROP TABLE "listing_free_quotas"`);
  }
}

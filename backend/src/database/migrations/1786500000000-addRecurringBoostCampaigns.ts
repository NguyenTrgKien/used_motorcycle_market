import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecurringBoostCampaigns1786500000000
  implements MigrationInterface
{
  name = 'AddRecurringBoostCampaigns1786500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "boost_campaigns" ("id" SERIAL NOT NULL, "postId" integer NOT NULL, "userId" integer NOT NULL, "orderId" uuid NOT NULL, "pricingPlanId" integer NOT NULL, "totalBoosts" integer NOT NULL, "boostsCompleted" integer NOT NULL DEFAULT 0, "startedAt" TIMESTAMP NOT NULL, "nextBoostAt" TIMESTAMP, "status" character varying(20) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_boost_campaign_order" UNIQUE ("orderId"), CONSTRAINT "PK_boost_campaigns" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_boost_campaign_due" ON "boost_campaigns" ("status", "nextBoostAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_boosts" ADD "campaignId" integer`,
    );
    await queryRunner.query(
      `UPDATE "listing_pricing_plans" SET "isActive" = false WHERE "productType" = 'boost'`,
    );
    await queryRunner.query(
      `INSERT INTO "listing_pricing_plans" ("name", "productType", "sellerAudience", "price", "durationDays", "recommended") VALUES ('Đẩy tin thường 1 ngày', 'boost', 'all', 8000, 1, false), ('Đẩy tin thường 3 ngày', 'boost', 'all', 20000, 3, true), ('Đẩy tin thường 7 ngày', 'boost', 'all', 50000, 7, false)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "listing_pricing_plans" WHERE "productType" = 'boost' AND "price" IN (8000, 20000, 50000)`,
    );
    await queryRunner.query(
      `UPDATE "listing_pricing_plans" SET "isActive" = true WHERE "productType" = 'boost' AND "price" = 15000`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_boosts" DROP COLUMN "campaignId"`,
    );
    await queryRunner.query(`DROP TABLE "boost_campaigns"`);
  }
}

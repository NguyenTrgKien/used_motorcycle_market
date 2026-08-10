import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMonetizationPlatform1786400000000 implements MigrationInterface {
  name = 'AddMonetizationPlatform1786400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "listing_payment_orders" DROP CONSTRAINT IF EXISTS "UQ_listing_payment_post"`);
    await queryRunner.query(`ALTER TABLE "listing_payment_orders" ALTER COLUMN "postId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "listing_payment_orders" ADD "orderType" character varying(30) NOT NULL DEFAULT 'listing'`);
    await queryRunner.query(`ALTER TABLE "listing_payment_orders" ADD "pricingPlanId" integer`);
    await queryRunner.query(`ALTER TABLE "listing_payment_orders" ADD "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_payment_listing_post_unique" ON "listing_payment_orders" ("postId") WHERE "orderType" = 'listing'`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "promotionType" character varying(30)`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "promotionStartedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "promotionExpiredAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "lastBoostedAt" TIMESTAMP`);
    await queryRunner.query(`CREATE TABLE "listing_pricing_plans" ("id" SERIAL NOT NULL, "name" character varying(120) NOT NULL, "productType" character varying(30) NOT NULL, "pricingGroup" character varying(30), "categoryId" integer, "sellerAudience" character varying(30) NOT NULL DEFAULT 'all', "price" integer NOT NULL, "durationDays" integer, "boostCredits" integer NOT NULL DEFAULT 0, "recommended" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_listing_pricing_plans" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_pricing_product_active" ON "listing_pricing_plans" ("productType", "isActive")`);
    await queryRunner.query(`CREATE TABLE "post_boosts" ("id" SERIAL NOT NULL, "postId" integer NOT NULL, "userId" integer NOT NULL, "orderId" uuid, "price" integer NOT NULL, "boostedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_post_boosts" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_post_boost_time" ON "post_boosts" ("postId", "boostedAt")`);
    await queryRunner.query(`CREATE TABLE "seller_subscription_plans" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "price" integer NOT NULL, "durationDays" integer NOT NULL DEFAULT 30, "listingLimit" integer NOT NULL, "boostCredits" integer NOT NULL DEFAULT 0, "isActive" boolean NOT NULL DEFAULT true, "recommended" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_seller_subscription_plans" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "seller_subscriptions" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "planId" integer NOT NULL, "orderId" uuid, "startsAt" TIMESTAMP NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "listingsUsed" integer NOT NULL DEFAULT 0, "boostsUsed" integer NOT NULL DEFAULT 0, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_seller_subscriptions" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_subscription_user_expiry" ON "seller_subscriptions" ("userId", "expiresAt")`);
    await queryRunner.query(`CREATE TABLE "monetization_audit_logs" ("id" SERIAL NOT NULL, "adminId" integer NOT NULL, "action" character varying(50) NOT NULL, "entityType" character varying(50) NOT NULL, "entityId" integer, "before" jsonb, "after" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_monetization_audit_logs" PRIMARY KEY ("id"))`);
    await queryRunner.query(`INSERT INTO "listing_pricing_plans" ("name", "productType", "sellerAudience", "price", "durationDays", "recommended") VALUES ('Phí đăng tin', 'listing', 'all', 30000, NULL, false), ('Tin nổi bật 7 ngày', 'featured', 'all', 59000, 7, true), ('Tin VIP 15 ngày', 'vip', 'all', 99000, 15, false), ('Đẩy tin', 'boost', 'all', 15000, NULL, false)`);
    await queryRunner.query(`INSERT INTO "seller_subscription_plans" ("name", "price", "durationDays", "listingLimit", "boostCredits", "recommended") VALUES ('Basic', 199000, 30, 10, 2, false), ('Pro', 499000, 30, 30, 10, true), ('Dealer', 999000, 30, 100, 30, false)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "monetization_audit_logs"`);
    await queryRunner.query(`DROP TABLE "seller_subscriptions"`);
    await queryRunner.query(`DROP TABLE "seller_subscription_plans"`);
    await queryRunner.query(`DROP TABLE "post_boosts"`);
    await queryRunner.query(`DROP TABLE "listing_pricing_plans"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "lastBoostedAt"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "promotionExpiredAt"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "promotionStartedAt"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "promotionType"`);
    await queryRunner.query(`DROP INDEX "IDX_payment_listing_post_unique"`);
    await queryRunner.query(`ALTER TABLE "listing_payment_orders" DROP COLUMN "metadata"`);
    await queryRunner.query(`ALTER TABLE "listing_payment_orders" DROP COLUMN "pricingPlanId"`);
    await queryRunner.query(`ALTER TABLE "listing_payment_orders" DROP COLUMN "orderType"`);
    await queryRunner.query(`DELETE FROM "listing_payment_orders" WHERE "postId" IS NULL`);
    await queryRunner.query(`ALTER TABLE "listing_payment_orders" ALTER COLUMN "postId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "listing_payment_orders" ADD CONSTRAINT "UQ_listing_payment_post" UNIQUE ("postId")`);
  }
}

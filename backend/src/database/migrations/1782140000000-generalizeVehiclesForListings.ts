import { MigrationInterface, QueryRunner } from 'typeorm';

export class GeneralizeVehiclesForListings1782140000000
  implements MigrationInterface
{
  name = 'GeneralizeVehiclesForListings1782140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."posts_status_enum" ADD VALUE IF NOT EXISTS 'draft'`);
    await queryRunner.query(`ALTER TYPE "public"."posts_status_enum" ADD VALUE IF NOT EXISTS 'expired'`);
    await queryRunner.query(`ALTER TYPE "public"."posts_status_enum" ADD VALUE IF NOT EXISTS 'hidden'`);
    await queryRunner.query(
      `CREATE TYPE "public"."vehicles_condition_enum" AS ENUM('new', 'used', 'excellent', 'good', 'fair')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vehicles_fueltype_enum" AS ENUM('gasoline', 'diesel', 'electric', 'hybrid', 'plug_in_hybrid', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vehicles_transmission_enum" AS ENUM('manual', 'automatic', 'semi_automatic', 'cvt', 'single_speed', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vehicles_bodytype_enum" AS ENUM('motorbike', 'motorcycle', 'scooter', 'car', 'truck', 'dump_truck', 'van', 'bus', 'special_purpose', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicle_brands" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "logo" character varying, "country" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7a25b7f0e68be73ed9f56ecab89" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_vehicle_brands_slug" ON "vehicle_brands" ("slug")`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicle_models" ("id" SERIAL NOT NULL, "brandId" integer NOT NULL, "categoryId" integer, "name" character varying NOT NULL, "slug" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f4dc9f088176d23cd0c1f9e12f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_vehicle_models_brand_slug" ON "vehicle_models" ("brandId", "slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicle_models_category" ON "vehicle_models" ("categoryId")`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicle_brand_categories" ("categoryId" integer NOT NULL, "brandId" integer NOT NULL, CONSTRAINT "PK_vehicle_brand_categories" PRIMARY KEY ("categoryId", "brandId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicle_brand_categories_category" ON "vehicle_brand_categories" ("categoryId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicle_brand_categories_brand" ON "vehicle_brand_categories" ("brandId")`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicles" ("id" SERIAL NOT NULL, "postId" integer NOT NULL, "categoryId" integer, "brandId" integer, "modelId" integer, "brandName" character varying NOT NULL, "modelName" character varying NOT NULL, "bodyType" "public"."vehicles_bodytype_enum" NOT NULL DEFAULT 'other', "manufactureYear" integer, "registrationYear" integer, "mileage" integer, "color" character varying, "condition" "public"."vehicles_condition_enum" NOT NULL DEFAULT 'used', "engineCapacity" character varying, "enginePower" character varying, "batteryCapacity" character varying, "rangePerCharge" character varying, "licensePlate" character varying, "fuelType" "public"."vehicles_fueltype_enum" NOT NULL DEFAULT 'other', "transmission" "public"."vehicles_transmission_enum" NOT NULL DEFAULT 'other', "origin" character varying, "documentsStatus" character varying, "seatCount" integer, "doorCount" integer, "payloadKg" integer, "grossWeightKg" integer, "wheelCount" integer, "extraSpecs" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_vehicles_postId" UNIQUE ("postId"), CONSTRAINT "PK_46d60059cde7377fa4b4dd0393e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicles_brand_model" ON "vehicles" ("brandId", "modelId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicles_body_fuel" ON "vehicles" ("bodyType", "fuelType")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicles_manufacture_year" ON "vehicles" ("manufactureYear")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicles_mileage" ON "vehicles" ("mileage")`,
    );
    await queryRunner.query(`ALTER TABLE "posts" ADD "ward" character varying(100)`);
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "addressDetail" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "posts" ADD "approvedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "approvedBy" integer`);
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "rejectedReason" character varying(500)`,
    );
    await queryRunner.query(`ALTER TABLE "posts" ADD "soldAt" TIMESTAMP`);
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_status_price" ON "posts" ("status", "price")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_status_createdAt" ON "posts" ("status", "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_images" ADD "sortOrder" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_images" ADD "isPrimary" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `INSERT INTO "vehicles" ("postId", "categoryId", "brandName", "modelName", "bodyType", "manufactureYear", "mileage", "color", "condition", "engineCapacity", "licensePlate", "fuelType", "transmission", "createdAt", "updatedAt") SELECT "posts"."id", "posts"."categoryId", "motorcycles"."brand", "motorcycles"."model", 'motorbike', "motorcycles"."year", "motorcycles"."mileage", "motorcycles"."color", CASE WHEN "motorcycles"."condition" = 'new' THEN 'new'::"public"."vehicles_condition_enum" ELSE 'used'::"public"."vehicles_condition_enum" END, "motorcycles"."engineCapacity", "motorcycles"."licensePlate", CASE WHEN "motorcycles"."fuelType" = 'electricity' THEN 'electric'::"public"."vehicles_fueltype_enum" WHEN "motorcycles"."fuelType" = 'gasoline' THEN 'gasoline'::"public"."vehicles_fueltype_enum" ELSE 'other'::"public"."vehicles_fueltype_enum" END, CASE WHEN "motorcycles"."transmission" = 'semi-automatic' THEN 'semi_automatic'::"public"."vehicles_transmission_enum" WHEN "motorcycles"."transmission" = 'automatic' THEN 'automatic'::"public"."vehicles_transmission_enum" ELSE 'other'::"public"."vehicles_transmission_enum" END, "motorcycles"."createdAt", "motorcycles"."updatedAt" FROM "posts" INNER JOIN "motorcycles" ON "motorcycles"."id" = "posts"."motorcycleId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_post" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_category" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_brand" FOREIGN KEY ("brandId") REFERENCES "vehicle_brands"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_model" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_models" ADD CONSTRAINT "FK_vehicle_models_brand" FOREIGN KEY ("brandId") REFERENCES "vehicle_brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_models" ADD CONSTRAINT "FK_vehicle_models_category" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_brand_categories" ADD CONSTRAINT "FK_vehicle_brand_categories_category" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_brand_categories" ADD CONSTRAINT "FK_vehicle_brand_categories_brand" FOREIGN KEY ("brandId") REFERENCES "vehicle_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_d90157f727e5c1a11a17f8e852c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "REL_d90157f727e5c1a11a17f8e852"`,
    );
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "motorcycleId"`);
    await queryRunner.query(`DROP TABLE "motorcycles"`);
    await queryRunner.query(`DROP TYPE "public"."motorcycles_transmission_enum"`);
    await queryRunner.query(`DROP TYPE "public"."motorcycles_fueltype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."motorcycles_condition_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."motorcycles_condition_enum" AS ENUM('new', 'used')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."motorcycles_fueltype_enum" AS ENUM('gasoline', 'electricity')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."motorcycles_transmission_enum" AS ENUM('automatic', 'semi-automatic')`,
    );
    await queryRunner.query(
      `CREATE TABLE "motorcycles" ("id" SERIAL NOT NULL, "brand" character varying NOT NULL, "model" character varying NOT NULL, "year" integer NOT NULL, "mileage" integer NOT NULL, "color" character varying NOT NULL, "condition" "public"."motorcycles_condition_enum" NOT NULL DEFAULT 'used', "engineCapacity" character varying NOT NULL, "licensePlate" character varying, "fuelType" "public"."motorcycles_fueltype_enum" NOT NULL, "transmission" "public"."motorcycles_transmission_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6e34aca06f3000916257494a4aa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "motorcycleId" integer`,
    );
    await queryRunner.query(
      `INSERT INTO "motorcycles" ("brand", "model", "year", "mileage", "color", "condition", "engineCapacity", "licensePlate", "fuelType", "transmission", "createdAt", "updatedAt") SELECT "brandName", "modelName", COALESCE("manufactureYear", EXTRACT(YEAR FROM now())::integer), COALESCE("mileage", 0), COALESCE("color", 'unknown'), CASE WHEN "condition" = 'new' THEN 'new'::"public"."motorcycles_condition_enum" ELSE 'used'::"public"."motorcycles_condition_enum" END, COALESCE("engineCapacity", 'unknown'), "licensePlate", CASE WHEN "fuelType" = 'electric' THEN 'electricity'::"public"."motorcycles_fueltype_enum" ELSE 'gasoline'::"public"."motorcycles_fueltype_enum" END, CASE WHEN "transmission" = 'semi_automatic' THEN 'semi-automatic'::"public"."motorcycles_transmission_enum" ELSE 'automatic'::"public"."motorcycles_transmission_enum" END, "createdAt", "updatedAt" FROM "vehicles" ORDER BY "id"`,
    );
    await queryRunner.query(
      `UPDATE "posts" SET "motorcycleId" = "motorcycles"."id" FROM "vehicles", "motorcycles" WHERE "vehicles"."postId" = "posts"."id" AND "motorcycles"."brand" = "vehicles"."brandName" AND "motorcycles"."model" = "vehicles"."modelName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "REL_d90157f727e5c1a11a17f8e852" UNIQUE ("motorcycleId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_d90157f727e5c1a11a17f8e852c" FOREIGN KEY ("motorcycleId") REFERENCES "motorcycles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_brand_categories" DROP CONSTRAINT "FK_vehicle_brand_categories_brand"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_brand_categories" DROP CONSTRAINT "FK_vehicle_brand_categories_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_models" DROP CONSTRAINT "FK_vehicle_models_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_models" DROP CONSTRAINT "FK_vehicle_models_brand"`,
    );
    await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_model"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_brand"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_category"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_post"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicles_mileage"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicles_manufacture_year"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicles_body_fuel"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicles_brand_model"`);
    await queryRunner.query(`DROP TABLE "vehicles"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_brand_categories_brand"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_brand_categories_category"`);
    await queryRunner.query(`DROP TABLE "vehicle_brand_categories"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_models_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_models_brand_slug"`);
    await queryRunner.query(`DROP TABLE "vehicle_models"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_brands_slug"`);
    await queryRunner.query(`DROP TABLE "vehicle_brands"`);
    await queryRunner.query(`DROP TYPE "public"."vehicles_bodytype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."vehicles_transmission_enum"`);
    await queryRunner.query(`DROP TYPE "public"."vehicles_fueltype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."vehicles_condition_enum"`);
    await queryRunner.query(`ALTER TABLE "post_images" DROP COLUMN "isPrimary"`);
    await queryRunner.query(`ALTER TABLE "post_images" DROP COLUMN "sortOrder"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_posts_status_createdAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_posts_status_price"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "soldAt"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "rejectedReason"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "approvedBy"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "approvedAt"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "addressDetail"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "ward"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfessionalSellers1785300000000
  implements MigrationInterface
{
  name = 'AddProfessionalSellers1785300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_sellertype_enum" AS ENUM('individual', 'professional')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "sellerType" "public"."users_sellertype_enum" NOT NULL DEFAULT 'individual'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_seller_type" ON "users" ("sellerType")`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."professional_seller_profiles_status_enum" AS ENUM('pending', 'approved', 'rejected', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "professional_seller_profiles" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "storeName" character varying(150) NOT NULL, "description" text, "taxCode" character varying(50) NOT NULL, "businessLicenseUrl" character varying(255) NOT NULL, "businessLicensePublicId" character varying(255) NOT NULL, "logoUrl" character varying(255), "logoPublicId" character varying(255), "coverUrl" character varying(255), "coverPublicId" character varying(255), "province" character varying(100) NOT NULL, "district" character varying(100) NOT NULL, "ward" character varying(100), "addressDetail" character varying(255) NOT NULL, "website" character varying(255), "status" "public"."professional_seller_profiles_status_enum" NOT NULL DEFAULT 'pending', "verifiedAt" TIMESTAMP, "verifiedBy" integer, "rejectedReason" character varying(500), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_professional_seller_user" UNIQUE ("userId"), CONSTRAINT "UQ_professional_seller_tax_code" UNIQUE ("taxCode"), CONSTRAINT "PK_professional_seller_profiles" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_professional_seller_status_created" ON "professional_seller_profiles" ("status", "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "professional_seller_profiles" ADD CONSTRAINT "FK_professional_seller_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "professional_seller_profiles" DROP CONSTRAINT "FK_professional_seller_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_professional_seller_status_created"`,
    );
    await queryRunner.query(`DROP TABLE "professional_seller_profiles"`);
    await queryRunner.query(
      `DROP TYPE "public"."professional_seller_profiles_status_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_users_seller_type"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "sellerType"`);
    await queryRunner.query(`DROP TYPE "public"."users_sellertype_enum"`);
  }
}

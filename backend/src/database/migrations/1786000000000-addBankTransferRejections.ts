import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBankTransferRejections1786000000000
  implements MigrationInterface
{
  name = 'AddBankTransferRejections1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" ADD "rejectedReason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" ADD "rejectedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" ADD "rejectedBy" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" ADD "rejectionHistory" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" DROP COLUMN "rejectionHistory"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" DROP COLUMN "rejectedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" DROP COLUMN "rejectedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" DROP COLUMN "rejectedReason"`,
    );
  }
}

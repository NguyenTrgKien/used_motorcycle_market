import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBankTransferReceipts1785800000000
  implements MigrationInterface
{
  name = 'AddBankTransferReceipts1785800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" ADD "receiptUrl" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" ADD "receiptPublicId" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" ADD "transferSubmittedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" DROP COLUMN "transferSubmittedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" DROP COLUMN "receiptPublicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_payment_orders" DROP COLUMN "receiptUrl"`,
    );
  }
}

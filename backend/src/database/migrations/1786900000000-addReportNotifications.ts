import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReportNotifications1786900000000 implements MigrationInterface {
  name = 'AddReportNotifications1786900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'new_report'`);
    await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'report_status_updated'`);
  }

  public async down(): Promise<void> {}
}

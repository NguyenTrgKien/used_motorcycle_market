import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanStalePostHiddenAuditFields1785400000000
  implements MigrationInterface
{
  name = 'CleanStalePostHiddenAuditFields1785400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "posts"
       SET "hiddenReason" = NULL, "hiddenAt" = NULL, "hiddenBy" = NULL
       WHERE "status" != 'hidden'
         AND ("hiddenReason" IS NOT NULL OR "hiddenAt" IS NOT NULL OR "hiddenBy" IS NOT NULL)`,
    );
  }

  public async down(): Promise<void> {}
}

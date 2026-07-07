import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedVehicleCategories1782141000000 implements MigrationInterface {
  name = 'SeedVehicleCategories1782141000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "category" ("name", "description", "status", "slug")
      VALUES
        ('Xe máy', 'Danh mục dành cho tin đăng xe máy, mô tô, xe tay ga và xe số.', 'active', 'xe-may'),
        ('Ô tô', 'Danh mục dành cho tin đăng ô tô cá nhân và xe du lịch.', 'active', 'o-to'),
        ('Xe tải', 'Danh mục dành cho tin đăng xe tải, xe ben, xe van và phương tiện chở hàng.', 'active', 'xe-tai'),
        ('Xe điện', 'Danh mục dành cho tin đăng xe máy điện, ô tô điện và phương tiện dùng pin.', 'active', 'xe-dien'),
        ('Xe chuyên dụng', 'Danh mục dành cho xe khách, xe công trình và các phương tiện chuyên dụng khác.', 'active', 'xe-chuyen-dung')
      ON CONFLICT ("slug") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "status" = EXCLUDED."status",
        "updatedAt" = now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "category"
      WHERE "slug" IN ('xe-may', 'o-to', 'xe-tai', 'xe-dien', 'xe-chuyen-dung')
    `);
  }
}

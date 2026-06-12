import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersonalInfoInUser1780048114372 implements MigrationInterface {
  name = 'AddPersonalInfoInUser1780048114372';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "personalInfo" character varying`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_verifications_type_enum" RENAME TO "user_verifications_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_verifications_type_enum" AS ENUM('email', 'reset_password', 'phone_otp')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_verifications" ALTER COLUMN "type" TYPE "public"."user_verifications_type_enum" USING "type"::"text"::"public"."user_verifications_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."user_verifications_type_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_verifications_type_enum_old" AS ENUM('register_email', 'change_email', 'reset_password', 'phone_otp')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_verifications" ALTER COLUMN "type" TYPE "public"."user_verifications_type_enum_old" USING "type"::"text"::"public"."user_verifications_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."user_verifications_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_verifications_type_enum_old" RENAME TO "user_verifications_type_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "personalInfo"`);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserVerificationTypeEnum1780629592073 implements MigrationInterface {
    name = 'FixUserVerificationTypeEnum1780629592073'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."user_verifications_type_enum" RENAME TO "user_verifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_verifications_type_enum" AS ENUM('register_email', 'change_email', 'reset_password', 'phone_otp')`);
        await queryRunner.query(`ALTER TABLE "user_verifications" ALTER COLUMN "type" TYPE "public"."user_verifications_type_enum" USING "type"::"text"::"public"."user_verifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_verifications_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_verifications_type_enum_old" AS ENUM('email', 'reset_password', 'phone_otp')`);
        await queryRunner.query(`ALTER TABLE "user_verifications" ALTER COLUMN "type" TYPE "public"."user_verifications_type_enum_old" USING "type"::"text"::"public"."user_verifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."user_verifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_verifications_type_enum_old" RENAME TO "user_verifications_type_enum"`);
    }

}

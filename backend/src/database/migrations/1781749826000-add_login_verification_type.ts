import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLoginVerificationType1781749826000 implements MigrationInterface {
    name = 'AddLoginVerificationType1781749826000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."user_verifications_type_enum" RENAME TO "user_verifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_verifications_type_enum" AS ENUM('register_email', 'change_email', 'reset_password', 'add_phone', 'change_phone', 'enable_2fa', 'disable_2fa', 'login')`);
        await queryRunner.query(`ALTER TABLE "user_verifications" ALTER COLUMN "type" TYPE "public"."user_verifications_type_enum" USING "type"::"text"::"public"."user_verifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_verifications_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "user_verifications" WHERE "type"::text = 'login'`);
        await queryRunner.query(`ALTER TYPE "public"."user_verifications_type_enum" RENAME TO "user_verifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_verifications_type_enum" AS ENUM('register_email', 'change_email', 'reset_password', 'add_phone', 'change_phone', 'enable_2fa', 'disable_2fa')`);
        await queryRunner.query(`ALTER TABLE "user_verifications" ALTER COLUMN "type" TYPE "public"."user_verifications_type_enum" USING "type"::"text"::"public"."user_verifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_verifications_type_enum_old"`);
    }

}

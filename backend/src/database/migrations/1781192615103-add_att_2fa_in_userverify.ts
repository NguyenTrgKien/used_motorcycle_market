import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAtt2faInUserverify1781192615103 implements MigrationInterface {
    name = 'AddAtt2faInUserverify1781192615103'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."user_verifications_type_enum" RENAME TO "user_verifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_verifications_type_enum" AS ENUM('register_email', 'change_email', 'reset_password', 'add_phone', 'change_phone', 'enable_2fa', 'disable_2fa')`);
        await queryRunner.query(`ALTER TABLE "user_verifications" ALTER COLUMN "type" TYPE "public"."user_verifications_type_enum" USING "type"::"text"::"public"."user_verifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_verifications_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_verifications_type_enum_old" AS ENUM('register_email', 'change_email', 'reset_password', 'add_phone', 'change_phone')`);
        await queryRunner.query(`ALTER TABLE "user_verifications" ALTER COLUMN "type" TYPE "public"."user_verifications_type_enum_old" USING "type"::"text"::"public"."user_verifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."user_verifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_verifications_type_enum_old" RENAME TO "user_verifications_type_enum"`);
    }

}

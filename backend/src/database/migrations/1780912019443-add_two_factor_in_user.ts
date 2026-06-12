import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTwoFactorInUser1780912019443 implements MigrationInterface {
    name = 'AddTwoFactorInUser1780912019443'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "two_factor_enabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE TYPE "public"."users_two_factor_method_enum" AS ENUM('email', 'sms', 'authenticator')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "two_factor_method" "public"."users_two_factor_method_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "two_factor_method"`);
        await queryRunner.query(`DROP TYPE "public"."users_two_factor_method_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "two_factor_enabled"`);
    }

}

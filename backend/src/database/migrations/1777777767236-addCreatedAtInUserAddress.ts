import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedAtInUserAddress1777777767236 implements MigrationInterface {
    name = 'AddCreatedAtInUserAddress1777777767236'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_addresses" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_addresses" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_addresses" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "user_addresses" DROP COLUMN "createdAt"`);
    }

}

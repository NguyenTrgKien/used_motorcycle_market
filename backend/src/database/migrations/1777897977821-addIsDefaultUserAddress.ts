import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDefaultUserAddress1777897977821 implements MigrationInterface {
    name = 'AddIsDefaultUserAddress1777897977821'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_addresses" ADD "isDefault" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_addresses" DROP COLUMN "isDefault"`);
    }

}

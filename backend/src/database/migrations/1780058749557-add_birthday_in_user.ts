import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBirthdayInUser1780058749557 implements MigrationInterface {
    name = 'AddBirthdayInUser1780058749557'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "birthday" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "birthday"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMetaDataInUserVerified1778476524425 implements MigrationInterface {
    name = 'AddMetaDataInUserVerified1778476524425'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_verifications" ADD "metadata" json`);
        await queryRunner.query(`ALTER TABLE "user_verifications" DROP CONSTRAINT "UQ_4643e12d8c71d509ff5a69932eb"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_verifications" ADD CONSTRAINT "UQ_4643e12d8c71d509ff5a69932eb" UNIQUE ("token")`);
        await queryRunner.query(`ALTER TABLE "user_verifications" DROP COLUMN "metadata"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class SetNullableForGenderInUser1777513244363 implements MigrationInterface {
    name = 'SetNullableForGenderInUser1777513244363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verifyToken"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "gender" DROP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_f1db02a79b7805d51d5cc78679" ON "user_addresses" ("province") `);
        await queryRunner.query(`CREATE INDEX "IDX_7a5100ce0548ef27a6f1533a5c" ON "user_addresses" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bd176eac11efa1957a61b001a1" ON "user_addresses" ("province", "district") `);
        await queryRunner.query(`CREATE INDEX "IDX_7938a593c600dc924fc5093161" ON "user_identities" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_bf5fe01eb8cad7114b4c371cdc" ON "user_identities" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_8c0739137ac934474956898070" ON "users" ("isVerified") `);
        await queryRunner.query(`CREATE INDEX "IDX_f82bbd4657fabcbd1f2def242a" ON "users" ("status", "isVerified") `);
        await queryRunner.query(`CREATE INDEX "IDX_d6ee2d4bf901675877bb94977c" ON "users" ("status", "role") `);
        await queryRunner.query(`CREATE INDEX "IDX_1a76eda8d02cee3143d20e48c4" ON "user_verifications" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_2c6a037273f1cb3e6fdd832db2" ON "user_verifications" ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_2c6a037273f1cb3e6fdd832db2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1a76eda8d02cee3143d20e48c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d6ee2d4bf901675877bb94977c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f82bbd4657fabcbd1f2def242a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8c0739137ac934474956898070"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf5fe01eb8cad7114b4c371cdc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7938a593c600dc924fc5093161"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd176eac11efa1957a61b001a1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7a5100ce0548ef27a6f1533a5c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f1db02a79b7805d51d5cc78679"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "gender" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verifyToken" character varying`);
    }

}

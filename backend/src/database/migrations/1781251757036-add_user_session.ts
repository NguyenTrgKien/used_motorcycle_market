import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserSession1781251757036 implements MigrationInterface {
    name = 'AddUserSession1781251757036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_session" ("id" SERIAL NOT NULL, "refreshTokenHash" character varying NOT NULL, "deviceName" character varying, "browser" character varying, "os" character varying, "ipAddress" character varying, "userAgent" character varying, "expiredAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP, "lastActive" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_adf3b49590842ac3cf54cac451a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_session" ADD CONSTRAINT "FK_b5eb7aa08382591e7c2d1244fe5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_session" DROP CONSTRAINT "FK_b5eb7aa08382591e7c2d1244fe5"`);
        await queryRunner.query(`DROP TABLE "user_session"`);
    }

}

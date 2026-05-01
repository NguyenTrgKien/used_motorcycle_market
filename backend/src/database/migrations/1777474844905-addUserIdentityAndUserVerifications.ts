import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdentityAndUserVerifications1777474844905 implements MigrationInterface {
  name = 'AddUserIdentityAndUserVerifications1777474844905';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "province" TO "gender"`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_addresses" ("id" SERIAL NOT NULL, "province" character varying(100) NOT NULL, "district" character varying(100) NOT NULL, "ward" character varying(100) NOT NULL, "address" character varying(255), "user_id" integer, CONSTRAINT "PK_8abbeb5e3239ff7877088ffc25b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_identities_idtype_enum" AS ENUM('cccd', 'passport')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_identities_gender_enum" AS ENUM('male', 'female', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_identities_status_enum" AS ENUM('pending', 'processing', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_identities" ("id" SERIAL NOT NULL, "idNumber" character varying NOT NULL, "idType" "public"."user_identities_idtype_enum" NOT NULL, "fullName" character varying NOT NULL, "dateOfBirth" TIMESTAMP NOT NULL, "gender" "public"."user_identities_gender_enum" NOT NULL, "issueDate" TIMESTAMP NOT NULL, "issuePlace" character varying NOT NULL, "address" character varying NOT NULL, "idFrontUrl" character varying NOT NULL, "idBackUrl" character varying NOT NULL, "selfieUrl" character varying NOT NULL, "status" "public"."user_identities_status_enum" NOT NULL DEFAULT 'pending', "confidenceScore" double precision NOT NULL DEFAULT '0', "verifiedAt" TIMESTAMP, "rejectionReason" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "UQ_0386dcfee6438628615e6061a53" UNIQUE ("idNumber", "idType"), CONSTRAINT "UQ_bf5fe01eb8cad7114b4c371cdc7" UNIQUE ("user_id"), CONSTRAINT "REL_bf5fe01eb8cad7114b4c371cdc" UNIQUE ("user_id"), CONSTRAINT "PK_e23bff04e9c3e7b785e442b262c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_verifications_type_enum" AS ENUM('email', 'reset_password', 'phone_otp')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_verifications" ("id" SERIAL NOT NULL, "type" "public"."user_verifications_type_enum" NOT NULL, "token" character varying NOT NULL, "verifiedAt" TIMESTAMP, "expiredAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "UQ_4643e12d8c71d509ff5a69932eb" UNIQUE ("token"), CONSTRAINT "PK_3269a92433d028916ab342b94fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gender"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_gender_enum" AS ENUM('male', 'female', 'other')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "gender" "public"."users_gender_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ADD CONSTRAINT "FK_7a5100ce0548ef27a6f1533a5ce" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" ADD CONSTRAINT "FK_bf5fe01eb8cad7114b4c371cdc7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_verifications" ADD CONSTRAINT "FK_2c6a037273f1cb3e6fdd832db24" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_verifications" DROP CONSTRAINT "FK_2c6a037273f1cb3e6fdd832db24"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" DROP CONSTRAINT "FK_bf5fe01eb8cad7114b4c371cdc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" DROP CONSTRAINT "FK_7a5100ce0548ef27a6f1533a5ce"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gender"`);
    await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "gender" character varying(100)`,
    );
    await queryRunner.query(`DROP TABLE "user_verifications"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_verifications_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "user_identities"`);
    await queryRunner.query(`DROP TYPE "public"."user_identities_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_identities_gender_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_identities_idtype_enum"`);
    await queryRunner.query(`DROP TABLE "user_addresses"`);
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "gender" TO "province"`,
    );
  }
}

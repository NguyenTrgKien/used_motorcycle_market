import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1772434242563 implements MigrationInterface {
    name = 'CreateTables1772434242563'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."messages_messagetype_enum" AS ENUM('text', 'image')`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" SERIAL NOT NULL, "senderId" integer NOT NULL, "conversationId" integer NOT NULL, "content" text NOT NULL, "messageType" "public"."messages_messagetype_enum" NOT NULL DEFAULT 'text', "publicId" character varying, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."category_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "category" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "status" "public"."category_status_enum" NOT NULL DEFAULT 'active', "image" character varying, "icon" character varying, "publicId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."motorcycles_condition_enum" AS ENUM('new', 'used')`);
        await queryRunner.query(`CREATE TYPE "public"."motorcycles_fueltype_enum" AS ENUM('gasoline', 'electricity')`);
        await queryRunner.query(`CREATE TYPE "public"."motorcycles_transmission_enum" AS ENUM('automatic', 'semi-automatic')`);
        await queryRunner.query(`CREATE TABLE "motorcycles" ("id" SERIAL NOT NULL, "brand" character varying NOT NULL, "model" character varying NOT NULL, "year" integer NOT NULL, "mileage" integer NOT NULL, "color" character varying NOT NULL, "condition" "public"."motorcycles_condition_enum" NOT NULL DEFAULT 'used', "engineCapacity" character varying NOT NULL, "licensePlate" character varying, "fuelType" "public"."motorcycles_fueltype_enum" NOT NULL, "transmission" "public"."motorcycles_transmission_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6e34aca06f3000916257494a4aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post_images" ("id" SERIAL NOT NULL, "postId" integer NOT NULL, "imageUrl" text NOT NULL, "publicId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_32fe67d8cdea0e7536320d7c454" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "reviewerId" integer NOT NULL, "revieweeId" integer NOT NULL, "postId" integer NOT NULL, "rating" integer NOT NULL, "comment" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_63a9418754cc39aac117bf27ed" CHECK (rating >= 1 AND rating <= 5), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "save_posts" ("id" SERIAL NOT NULL, "postId" integer NOT NULL, "userId" integer NOT NULL, "savedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_fbff8656506d4d0e13fedc1ea4e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_949738d40d717d3491b804a9d5" ON "save_posts" ("userId", "postId") `);
        await queryRunner.query(`CREATE INDEX "IDX_54a9ff33bd4111c41b83c45d96" ON "save_posts" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."posts_status_enum" AS ENUM('pending', 'active', 'sold', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "categoryId" integer NOT NULL, "motorcycleId" integer NOT NULL, "title" character varying NOT NULL, "description" text, "price" numeric(15,0) NOT NULL DEFAULT '0', "status" "public"."posts_status_enum" NOT NULL DEFAULT 'pending', "viewCount" integer NOT NULL DEFAULT '0', "province" character varying(100) NOT NULL, "district" character varying(100), "expiredAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_d90157f727e5c1a11a17f8e852" UNIQUE ("motorcycleId"), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9e573b2e0bab10a10ab3b433c2" ON "posts" ("categoryId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_f79074898e02a09d4aee6fa18e" ON "posts" ("userId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_32a0c1e70f4ad3ebcd767d6f86" ON "posts" ("status", "province") `);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" SERIAL NOT NULL, "buyerId" integer NOT NULL, "sellerId" integer NOT NULL, "postId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('post_approve', 'post_rejected', 'new_message', 'new_review', 'new_posst_pending')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "title" character varying NOT NULL, "content" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "type" "public"."notifications_type_enum" NOT NULL, "referenceId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5340fc241f57310d243e5ab20b" ON "notifications" ("userId", "isRead") `);
        await queryRunner.query(`CREATE TYPE "public"."reports_targettype_enum" AS ENUM('post', 'user')`);
        await queryRunner.query(`CREATE TYPE "public"."reports_reasontype_enum" AS ENUM('fake_info', 'wrong_price', 'duplicate_post', 'already_sold', 'stolen_vehicle', 'fake_images', 'fraud', 'spam', 'abusive', 'scam', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."reports_status_enum" AS ENUM('pending', 'resolved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" SERIAL NOT NULL, "reporterId" integer NOT NULL, "targetId" integer NOT NULL, "targetType" "public"."reports_targettype_enum" NOT NULL, "reasonType" "public"."reports_reasontype_enum" NOT NULL, "reasonDetail" character varying NOT NULL, "status" "public"."reports_status_enum" NOT NULL DEFAULT 'pending', "note" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4353be8309ce86650def2f8572" ON "reports" ("reporterId") `);
        await queryRunner.query(`CREATE INDEX "IDX_dab4d78b3be05c1ca4a626f57f" ON "reports" ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'banned')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "fullName" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "phone" character varying(12), "avatar" character varying, "publicId" character varying, "province" character varying(100), "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "isVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a000cca60bcf04454e72769949" ON "users" ("phone") `);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_images" ADD CONSTRAINT "FK_92e2382a7f43d4e9350d591fb6a" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_f9238c3e3739dc40322f577fc46" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_c8f626e1e943aabb0f90fb8ee61" FOREIGN KEY ("revieweeId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_11135032353b5ff06fdb8431263" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "save_posts" ADD CONSTRAINT "FK_54a9ff33bd4111c41b83c45d96a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "save_posts" ADD CONSTRAINT "FK_d1e8caef4c2ef82e1168ac2df3a" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_ae05faaa55c866130abef6e1fee" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_d90157f727e5c1a11a17f8e852c" FOREIGN KEY ("motorcycleId") REFERENCES "motorcycles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_168bf21b341e2ae340748e2541d" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_fad7b384e73ce2b5e9029a0032a" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_4173670d70b706461e31d847ce1" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_cd3ac63f73a557fe229fc68f716" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_4353be8309ce86650def2f8572d" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_4353be8309ce86650def2f8572d"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_cd3ac63f73a557fe229fc68f716"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_4173670d70b706461e31d847ce1"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_fad7b384e73ce2b5e9029a0032a"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_168bf21b341e2ae340748e2541d"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_d90157f727e5c1a11a17f8e852c"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_ae05faaa55c866130abef6e1fee"`);
        await queryRunner.query(`ALTER TABLE "save_posts" DROP CONSTRAINT "FK_d1e8caef4c2ef82e1168ac2df3a"`);
        await queryRunner.query(`ALTER TABLE "save_posts" DROP CONSTRAINT "FK_54a9ff33bd4111c41b83c45d96a"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_11135032353b5ff06fdb8431263"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_c8f626e1e943aabb0f90fb8ee61"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_f9238c3e3739dc40322f577fc46"`);
        await queryRunner.query(`ALTER TABLE "post_images" DROP CONSTRAINT "FK_92e2382a7f43d4e9350d591fb6a"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a000cca60bcf04454e72769949"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dab4d78b3be05c1ca4a626f57f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4353be8309ce86650def2f8572"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TYPE "public"."reports_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reports_reasontype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reports_targettype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5340fc241f57310d243e5ab20b"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_32a0c1e70f4ad3ebcd767d6f86"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f79074898e02a09d4aee6fa18e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9e573b2e0bab10a10ab3b433c2"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TYPE "public"."posts_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_54a9ff33bd4111c41b83c45d96"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_949738d40d717d3491b804a9d5"`);
        await queryRunner.query(`DROP TABLE "save_posts"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "post_images"`);
        await queryRunner.query(`DROP TABLE "motorcycles"`);
        await queryRunner.query(`DROP TYPE "public"."motorcycles_transmission_enum"`);
        await queryRunner.query(`DROP TYPE "public"."motorcycles_fueltype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."motorcycles_condition_enum"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`DROP TYPE "public"."category_status_enum"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_messagetype_enum"`);
    }

}

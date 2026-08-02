import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeConversationsForChat1782144000000
  implements MigrationInterface
{
  name = 'OptimizeConversationsForChat1782144000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD "lastMessage" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD "lastMessageAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD "lastSenderId" integer`,
    );
    await queryRunner.query(`
      UPDATE "conversations" conversation
      SET
        "lastMessage" = message."content",
        "lastMessageAt" = message."createdAt",
        "lastSenderId" = message."senderId",
        "updatedAt" = GREATEST(conversation."updatedAt", message."createdAt")
      FROM (
        SELECT DISTINCT ON ("conversationId")
          "conversationId",
          "content",
          "createdAt",
          "senderId"
        FROM "messages"
        ORDER BY "conversationId", "createdAt" DESC, "id" DESC
      ) message
      WHERE message."conversationId" = conversation."id"
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_conversation_created" ON "messages" ("conversationId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_conversation_id" ON "messages" ("conversationId", "id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_conversation_sender_read" ON "messages" ("conversationId", "senderId", "isRead")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_conversations_buyer_updated" ON "conversations" ("buyerId", "updatedAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_conversations_seller_updated" ON "conversations" ("sellerId", "updatedAt")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_conversations_pair_post" ON "conversations" ("buyerId", "sellerId", "postId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_conversations_pair_post"`);
    await queryRunner.query(`DROP INDEX "IDX_conversations_seller_updated"`);
    await queryRunner.query(`DROP INDEX "IDX_conversations_buyer_updated"`);
    await queryRunner.query(
      `DROP INDEX "IDX_messages_conversation_sender_read"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_messages_conversation_id"`);
    await queryRunner.query(`DROP INDEX "IDX_messages_conversation_created"`);
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP COLUMN "lastSenderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP COLUMN "lastMessageAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP COLUMN "lastMessage"`,
    );
  }
}

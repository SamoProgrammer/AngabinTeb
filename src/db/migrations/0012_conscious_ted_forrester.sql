ALTER TABLE "support_request" DROP CONSTRAINT "support_request_assignee_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "support_request" DROP COLUMN "assignee_user_id";
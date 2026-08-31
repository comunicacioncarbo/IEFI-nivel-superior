CREATE TABLE "evaluations" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"year" integer NOT NULL,
	"section" varchar(1) NOT NULL,
	"time" time,
	"date" date NOT NULL,
	"subject" text NOT NULL,
	"teacher" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "plans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "plans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;
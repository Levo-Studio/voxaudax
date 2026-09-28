CREATE TYPE "public"."chat_group_kind" AS ENUM('signal', 'whatsapp');--> statement-breakpoint
CREATE TABLE "chat_groups" (
	"kind" "chat_group_kind" PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "chat_groups" ("kind", "url") VALUES
	('signal', 'https://signal.group/#CjQKIPGXqeS0Hznb439cklWUg_o6w5hif0SofN6qrcw8T1tFEhBIzJCJeECz4lXieTp8Ew_X'),
	('whatsapp', 'https://chat.whatsapp.com/DoDVEFjqEyP3YguqUeMxqk')
ON CONFLICT ("kind") DO NOTHING;
--> statement-breakpoint
UPDATE "pages" SET "body" = jsonb_set("body", '{content,0}', '{"type": "paragraph", "content": [{"type": "text", "text": "Wir entscheiden selbst, worüber geschrieben wird — redaktionell unabhängig von Schulleitung und Förderverein. Feste Treffen gibt es nicht: Abgesprochen wird in unserer Signal- und unserer WhatsApp-Gruppe, wann immer jemand etwas vorhat."}]}'::jsonb), "updated_at" = now()
WHERE "slug" = 'redaktion' AND "body" #> '{content,0}' = '{"type": "paragraph", "content": [{"type": "text", "text": "Sechs Schülerinnen und Schüler aus den Klassen 9 bis 12. Wir treffen uns mittwochs in der siebten Stunde in Raum 214 und entscheiden dort, worüber geschrieben wird — redaktionell unabhängig von Schulleitung und Förderverein."}]}'::jsonb;
--> statement-breakpoint
UPDATE "pages" SET "body" = jsonb_set("body", '{content,2}', '{"type": "paragraph", "content": [{"type": "text", "text": "Du willst bei der Vox Audax mitmachen? Sprich uns einfach persönlich an, tritt unserer Signal-Gruppe bei oder schreibe uns eine Mail! Wir freuen uns auf dich!"}]}'::jsonb), "updated_at" = now()
WHERE "slug" = 'redaktion' AND "body" #> '{content,2}' = '{"type": "paragraph", "content": [{"type": "text", "text": "Wer schreiben, fotografieren, recherchieren oder layouten will, kommt einfach mittwochs dazu. Vorkenntnisse braucht niemand, ein Thema reicht. redaktion@voxaudax.de"}]}'::jsonb;

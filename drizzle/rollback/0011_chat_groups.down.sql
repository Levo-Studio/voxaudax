-- Puts the two paragraphs about the Wednesday meeting back, but only where the
-- page still carries the text 0011 wrote: a page an admin has since rewritten
-- keeps what they wrote. Dropping the table loses the two join links, which
-- the page then no longer shows.
UPDATE "pages" SET "body" = jsonb_set("body", '{content,0}', '{"type": "paragraph", "content": [{"type": "text", "text": "Sechs Schülerinnen und Schüler aus den Klassen 9 bis 12. Wir treffen uns mittwochs in der siebten Stunde in Raum 214 und entscheiden dort, worüber geschrieben wird — redaktionell unabhängig von Schulleitung und Förderverein."}]}'::jsonb), "updated_at" = now()
WHERE "slug" = 'redaktion' AND "body" #> '{content,0}' = '{"type": "paragraph", "content": [{"type": "text", "text": "Wir entscheiden selbst, worüber geschrieben wird — redaktionell unabhängig von Schulleitung und Förderverein. Feste Treffen gibt es nicht: Abgesprochen wird in unserer Signal- und unserer WhatsApp-Gruppe, wann immer jemand etwas vorhat."}]}'::jsonb;
UPDATE "pages" SET "body" = jsonb_set("body", '{content,2}', '{"type": "paragraph", "content": [{"type": "text", "text": "Wer schreiben, fotografieren, recherchieren oder layouten will, kommt einfach mittwochs dazu. Vorkenntnisse braucht niemand, ein Thema reicht. redaktion@voxaudax.de"}]}'::jsonb), "updated_at" = now()
WHERE "slug" = 'redaktion' AND "body" #> '{content,2}' = '{"type": "paragraph", "content": [{"type": "text", "text": "Du willst bei der Vox Audax mitmachen? Sprich uns einfach persönlich an, tritt unserer Signal-Gruppe bei oder schreibe uns eine Mail! Wir freuen uns auf dich!"}]}'::jsonb;
DROP TABLE IF EXISTS "chat_groups";
DROP TYPE IF EXISTS "public"."chat_group_kind";

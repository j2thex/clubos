ALTER TABLE quests ADD COLUMN multi_use boolean NOT NULL DEFAULT false;
ALTER TABLE member_quests DROP CONSTRAINT member_quests_quest_id_member_id_key;

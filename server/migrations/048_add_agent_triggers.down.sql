-- Remove the triggers column from agent table.
ALTER TABLE agent DROP COLUMN IF EXISTS triggers;

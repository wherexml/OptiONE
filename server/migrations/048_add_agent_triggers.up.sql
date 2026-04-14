-- Re-add the triggers column to agent table with support for scheduled triggers.
ALTER TABLE agent ADD COLUMN triggers JSONB NOT NULL DEFAULT '[]';

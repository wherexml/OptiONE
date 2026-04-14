-- Fix audit_event trigger to allow CASCADE deletes from parent tables.
-- The trigger should only prevent direct DELETE/UPDATE operations,
-- but allow CASCADE deletes when the parent decision_case is deleted.

CREATE OR REPLACE FUNCTION enforce_audit_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow CASCADE deletes (when tg_op='DELETE' and triggered by FK cascade)
    -- We can detect this by checking if the decision_case still exists
    IF TG_OP = 'DELETE' THEN
        -- Check if parent decision_case exists
        -- If it doesn't exist, this is a CASCADE delete, so allow it
        IF NOT EXISTS (SELECT 1 FROM decision_case WHERE issue_id = OLD.decision_case_id) THEN
            RETURN OLD;
        END IF;
        -- Parent exists, this is a direct DELETE, so block it
        RAISE EXCEPTION 'audit_event rows are immutable: DELETE not allowed';
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'audit_event rows are immutable: UPDATE not allowed';
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

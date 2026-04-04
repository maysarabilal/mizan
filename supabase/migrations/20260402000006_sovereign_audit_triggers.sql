-- =========================================================================
-- MIZAN DATABASE MIGRATION
-- Sovereign Audit Logging (Data Diffs)
-- Migration: 20260402000006
-- =========================================================================

-- Function to generate the audit log entry automatically
CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data jsonb := NULL;
    v_new_data jsonb := NULL;
    v_action text := TG_OP;
    v_user_id uuid := auth.uid();
    v_office_id uuid;
BEGIN
    -- 1. Identify which office this belongs to
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
        v_office_id := OLD.office_id;
        v_old_data := to_jsonb(OLD);
    END IF;
    
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        v_office_id := NEW.office_id;
        v_new_data := to_jsonb(NEW);
    END IF;

    -- 2. Log exactly what changed (for Updates)
    IF (TG_OP = 'UPDATE') THEN
        -- Only keep keys that changed
        v_new_data = (SELECT jsonb_object_agg(key, value) 
                      FROM jsonb_each(v_new_data) 
                      WHERE v_old_data->key IS DISTINCT FROM value);
        
        v_old_data = (SELECT jsonb_object_agg(key, value) 
                      FROM jsonb_each(v_old_data) 
                      WHERE v_new_data->key IS NOT NULL);
    END IF;

    -- 3. Insert into audit_logs
    INSERT INTO audit_logs (
        office_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        v_office_id,
        v_user_id,
        v_action,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'old', v_old_data,
            'new', v_new_data
        )
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_cases ON cases;
CREATE TRIGGER audit_cases AFTER INSERT OR UPDATE OR DELETE ON cases FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

DROP TRIGGER IF EXISTS audit_clients ON clients;
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON clients FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

DROP TRIGGER IF EXISTS audit_sessions ON sessions;
CREATE TRIGGER audit_sessions AFTER INSERT OR UPDATE OR DELETE ON sessions FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

DROP TRIGGER IF EXISTS audit_tasks ON tasks;
CREATE TRIGGER audit_tasks AFTER INSERT OR UPDATE OR DELETE ON tasks FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

DROP TRIGGER IF EXISTS audit_office_members ON office_members;
CREATE TRIGGER audit_office_members AFTER INSERT OR UPDATE OR DELETE ON office_members FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

COMMENT ON FUNCTION trigger_audit_log IS 'Captures entity changes (including data diffs for updates) and stores them in audit_logs.';

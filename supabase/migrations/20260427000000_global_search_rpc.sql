-- Global Search RPC for Topbar Search
-- This function searches across cases, clients, sessions, and tasks
-- while strictly enforcing multi-tenancy via current_office_id().

CREATE OR REPLACE FUNCTION global_search(search_query text)
RETURNS TABLE (type text, id uuid, title text, subtitle text)
LANGUAGE sql SECURITY DEFINER SET search_path = public
STABLE
AS $$
  (SELECT 'case'::text, c.id, c.title, c.case_type
   FROM cases c
   WHERE c.office_id = current_office_id()
   AND (c.title ILIKE '%' || search_query || '%'
        OR c.case_number ILIKE '%' || search_query || '%')
   LIMIT 5)
  UNION ALL
  (SELECT 'client'::text, cl.id, cl.name, cl.phone
   FROM clients cl
   WHERE cl.office_id = current_office_id()
   AND (cl.name ILIKE '%' || search_query || '%'
        OR cl.phone ILIKE '%' || search_query || '%')
   LIMIT 5)
  UNION ALL
  (SELECT 'session'::text, s.id, s.court, s.session_date::text
   FROM sessions s
   WHERE s.office_id = current_office_id()
   AND s.court ILIKE '%' || search_query || '%'
   LIMIT 5)
  UNION ALL
  (SELECT 'task'::text, t.id, t.title, t.status
   FROM tasks t
   WHERE t.office_id = current_office_id()
   AND t.title ILIKE '%' || search_query || '%'
   LIMIT 5)
$$;

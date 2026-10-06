CREATE TABLE public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX community_messages_comm_idx ON public.community_messages (community_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.community_messages TO authenticated;
GRANT ALL ON public.community_messages TO service_role;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read messages" ON public.community_messages FOR SELECT TO authenticated USING (public.is_community_member(community_id, auth.uid()));
CREATE POLICY "members send messages" ON public.community_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_community_member(community_id, auth.uid()));
CREATE POLICY "delete own messages" ON public.community_messages FOR DELETE TO authenticated USING (user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

CREATE OR REPLACE FUNCTION public.is_community_admin(_community uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.communities WHERE id = _community AND admin_id = _user)
$$;

-- Public-safe profile info (name + photo only)
CREATE OR REPLACE FUNCTION public.get_public_profiles(_ids uuid[])
RETURNS TABLE (id uuid, full_name text, profile_photo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.profile_photo FROM public.profiles p WHERE p.id = ANY(_ids)
$$;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;

-- First person to join a community without an admin becomes its admin
CREATE OR REPLACE FUNCTION public.assign_community_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.communities WHERE id = NEW.community_id AND admin_id = NEW.user_id) THEN
    NEW.role := 'admin';
  ELSIF EXISTS (SELECT 1 FROM public.communities WHERE id = NEW.community_id AND admin_id IS NULL) THEN
    UPDATE public.communities SET admin_id = NEW.user_id WHERE id = NEW.community_id AND admin_id IS NULL;
    NEW.role := 'admin';
  ELSE
    NEW.role := 'member';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER community_members_assign_admin BEFORE INSERT ON public.community_members
FOR EACH ROW EXECUTE FUNCTION public.assign_community_admin();

-- Backfill: earliest member becomes admin of admin-less communities
UPDATE public.communities c SET admin_id = m.user_id
FROM (SELECT DISTINCT ON (community_id) community_id, user_id FROM public.community_members ORDER BY community_id, joined_at) m
WHERE c.id = m.community_id AND c.admin_id IS NULL;
UPDATE public.community_members cm SET role = CASE WHEN c.admin_id = cm.user_id THEN 'admin' ELSE 'member' END
FROM public.communities c WHERE c.id = cm.community_id;

-- Only the community admin may create plans
DROP POLICY IF EXISTS "plans insert" ON public.crop_plans;
CREATE POLICY "plans insert" ON public.crop_plans FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_community_admin(community_id, auth.uid()));
DROP POLICY IF EXISTS "plans update" ON public.crop_plans;
CREATE POLICY "plans update" ON public.crop_plans FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND public.is_community_admin(community_id, auth.uid()));

-- Members can view the community plan's recommendations and schedule
CREATE POLICY "community recs read" ON public.crop_recommendations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.crop_plans cp WHERE cp.id = crop_plan_id AND public.is_community_member(cp.community_id, auth.uid())));
CREATE POLICY "community schedule read" ON public.planting_schedule FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.crop_recommendations r JOIN public.crop_plans cp ON cp.id = r.crop_plan_id
          WHERE r.id = recommendation_id AND public.is_community_member(cp.community_id, auth.uid())));

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text,
  profile_photo text,
  location text,
  household_members int4,
  farming_technique text,
  growing_area numeric,
  skill_level text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  image_url text,
  admin_id uuid,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "communities readable" ON public.communities FOR SELECT TO authenticated USING (true);
CREATE POLICY "communities create" ON public.communities FOR INSERT TO authenticated WITH CHECK (admin_id = auth.uid());

CREATE TABLE public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members readable" ON public.community_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "join self" ON public.community_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "leave self" ON public.community_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_community_member(_community uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_members WHERE community_id = _community AND user_id = _user)
$$;

CREATE TABLE public.household_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  crop_name text NOT NULL,
  quantity_needed int4 NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_needs TO authenticated;
GRANT ALL ON public.household_needs TO service_role;
ALTER TABLE public.household_needs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own needs" ON public.household_needs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text NOT NULL UNIQUE,
  category text,
  estimated_harvest_min_days int4,
  estimated_harvest_max_days int4,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crops TO authenticated;
GRANT ALL ON public.crops TO service_role;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crops readable" ON public.crops FOR SELECT TO authenticated USING (true);

CREATE TABLE public.crop_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  farming_technique text,
  community_skill_level text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.crop_plans TO authenticated;
GRANT ALL ON public.crop_plans TO service_role;
ALTER TABLE public.crop_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans read" ON public.crop_plans FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.is_community_member(community_id, auth.uid()));
CREATE POLICY "plans insert" ON public.crop_plans FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "plans update" ON public.crop_plans FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE TABLE public.crop_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_plan_id uuid REFERENCES public.crop_plans(id) ON DELETE CASCADE,
  household_id uuid NOT NULL,
  crop_id uuid REFERENCES public.crops(id),
  recommended_quantity int4,
  estimated_harvest_days int4,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  suitability text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_recommendations TO authenticated;
GRANT ALL ON public.crop_recommendations TO service_role;
ALTER TABLE public.crop_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recs" ON public.crop_recommendations FOR ALL TO authenticated USING (household_id = auth.uid()) WITH CHECK (household_id = auth.uid());

CREATE TABLE public.planting_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid REFERENCES public.crop_recommendations(id) ON DELETE CASCADE,
  household_id uuid NOT NULL,
  crop_id uuid REFERENCES public.crops(id),
  planting_date date,
  expected_harvest_date date,
  quantity int4,
  activity text,
  status text NOT NULL DEFAULT 'Scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planting_schedule TO authenticated;
GRANT ALL ON public.planting_schedule TO service_role;
ALTER TABLE public.planting_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own schedule" ON public.planting_schedule FOR ALL TO authenticated USING (household_id = auth.uid()) WITH CHECK (household_id = auth.uid());

CREATE TABLE public.harvest_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
  household_id uuid NOT NULL,
  crop_id uuid REFERENCES public.crops(id),
  harvest_date date NOT NULL DEFAULT current_date,
  quantity_kg numeric NOT NULL DEFAULT 0,
  surplus_kg numeric NOT NULL DEFAULT 0,
  shared_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.harvest_outputs TO authenticated;
GRANT ALL ON public.harvest_outputs TO service_role;
ALTER TABLE public.harvest_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "harvest read" ON public.harvest_outputs FOR SELECT TO authenticated USING (household_id = auth.uid() OR public.is_community_member(community_id, auth.uid()));
CREATE POLICY "harvest insert" ON public.harvest_outputs FOR INSERT TO authenticated WITH CHECK (household_id = auth.uid());
CREATE POLICY "harvest update" ON public.harvest_outputs FOR UPDATE TO authenticated USING (household_id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.crops (crop_name, category, estimated_harvest_min_days, estimated_harvest_max_days) VALUES
('Kangkung','Leafy',25,30),('Sawi','Leafy',30,40),('Bayam','Leafy',25,35),('Kailan','Leafy',45,55),
('Lettuce','Leafy',35,45),('Tomato','Fruiting',60,80),('Chilli','Fruiting',75,90),('Cucumber','Fruiting',45,55),
('Long Bean','Legume',50,60),('Carrot','Root',70,80);

INSERT INTO public.communities (name, location, description) VALUES
('Lorong 6 Bahagia','Klang, Selangor','A neighbourhood community growing fresh vegetables together.'),
('Taman Hijau Setia','Shah Alam, Selangor','Residents turning a shared rooftop into a hydroponic garden.'),
('Kampung Baru Kebun','Kuala Lumpur','A heritage village plot growing traditional Malaysian greens.');

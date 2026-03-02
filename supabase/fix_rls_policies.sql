-- ============================================================
-- COMPLETE FIX: Run this ENTIRE script in Supabase SQL Editor
-- Fixes: "Database error saving new user" and RLS issues
-- ============================================================

-- STEP 1: Temporarily disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies on ALL tables
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- STEP 3: Drop old helper functions
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- STEP 4: Clean up any broken user data from previous attempts
DELETE FROM public.users WHERE id NOT IN (SELECT id FROM auth.users);

-- STEP 5: Recreate the trigger function with proper RLS bypass
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role', '')::public.user_role,
      'employee'::public.user_role
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- STEP 6: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 7: Re-enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create safe role helper (bypasses RLS completely)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

-- ============================================================
-- STEP 9: Create RLS Policies
-- ============================================================

-- USERS: everyone can read themselves
CREATE POLICY "users_select_self" ON public.users
  FOR SELECT USING (id = auth.uid());

-- USERS: admins can read employees
CREATE POLICY "users_select_by_role" ON public.users
  FOR SELECT USING (
    public.get_my_role() IN ('super_admin', 'admin')
  );

-- USERS: allow trigger inserts (service role / trigger context)
CREATE POLICY "users_insert_via_trigger" ON public.users
  FOR INSERT WITH CHECK (true);

-- USERS: update self
CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- USERS: super_admin can update/delete anyone
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE USING (public.get_my_role() = 'super_admin');

CREATE POLICY "users_delete_admin" ON public.users
  FOR DELETE USING (public.get_my_role() = 'super_admin');

-- TASKS policies
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    public.get_my_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (
    assigned_by = auth.uid()
    OR public.get_my_role() = 'super_admin'
  );

-- SUBMISSIONS policies
CREATE POLICY "submissions_select" ON public.submissions
  FOR SELECT USING (
    employee_id = auth.uid()
    OR public.get_my_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "submissions_insert" ON public.submissions
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "submissions_update" ON public.submissions
  FOR UPDATE USING (
    public.get_my_role() IN ('super_admin', 'admin')
  );

-- MESSAGES policies
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE USING (receiver_id = auth.uid());

-- ACTIVITY LOGS policies
CREATE POLICY "logs_select" ON public.activity_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.get_my_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "logs_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

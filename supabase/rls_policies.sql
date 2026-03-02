-- ObrixLabs Internal Management System
-- Row Level Security (RLS) Policies

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: Get current user's role
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- Super Admin can view all users
CREATE POLICY "super_admin_view_all_users" ON public.users
  FOR SELECT USING (public.get_user_role() = 'super_admin');

-- Admin can view employees
CREATE POLICY "admin_view_employees" ON public.users
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    AND (role = 'employee' OR id = auth.uid())
  );

-- Employees can view themselves
CREATE POLICY "employee_view_self" ON public.users
  FOR SELECT USING (
    public.get_user_role() = 'employee'
    AND id = auth.uid()
  );

-- Super Admin can insert users
CREATE POLICY "super_admin_insert_users" ON public.users
  FOR INSERT WITH CHECK (public.get_user_role() = 'super_admin');

-- Admin can insert employees
CREATE POLICY "admin_insert_employees" ON public.users
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'admin'
    AND role = 'employee'
  );

-- Super Admin can update any user
CREATE POLICY "super_admin_update_users" ON public.users
  FOR UPDATE USING (public.get_user_role() = 'super_admin');

-- Users can update their own profile
CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Super Admin can delete users
CREATE POLICY "super_admin_delete_users" ON public.users
  FOR DELETE USING (public.get_user_role() = 'super_admin');

-- ============================================================
-- TASKS TABLE POLICIES
-- ============================================================

-- Super Admin can view all tasks
CREATE POLICY "super_admin_view_all_tasks" ON public.tasks
  FOR SELECT USING (public.get_user_role() = 'super_admin');

-- Admin can view tasks they assigned
CREATE POLICY "admin_view_assigned_tasks" ON public.tasks
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    AND assigned_by = auth.uid()
  );

-- Employee can view their assigned tasks
CREATE POLICY "employee_view_own_tasks" ON public.tasks
  FOR SELECT USING (
    public.get_user_role() = 'employee'
    AND assigned_to = auth.uid()
  );

-- Admin and Super Admin can create tasks
CREATE POLICY "admin_create_tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin')
  );

-- Admin and Super Admin can update tasks
CREATE POLICY "admin_update_tasks" ON public.tasks
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND assigned_by = auth.uid())
  );

-- Employee can update status of their own tasks
CREATE POLICY "employee_update_own_task_status" ON public.tasks
  FOR UPDATE USING (
    public.get_user_role() = 'employee'
    AND assigned_to = auth.uid()
  );

-- Super Admin and Admin can delete tasks
CREATE POLICY "admin_delete_tasks" ON public.tasks
  FOR DELETE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND assigned_by = auth.uid())
  );

-- ============================================================
-- SUBMISSIONS TABLE POLICIES
-- ============================================================

-- Super Admin can view all submissions
CREATE POLICY "super_admin_view_all_submissions" ON public.submissions
  FOR SELECT USING (public.get_user_role() = 'super_admin');

-- Admin can view submissions for their tasks
CREATE POLICY "admin_view_task_submissions" ON public.submissions
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    AND task_id IN (
      SELECT id FROM public.tasks WHERE assigned_by = auth.uid()
    )
  );

-- Employee can view own submissions
CREATE POLICY "employee_view_own_submissions" ON public.submissions
  FOR SELECT USING (
    public.get_user_role() = 'employee'
    AND employee_id = auth.uid()
  );

-- Employee can create submissions
CREATE POLICY "employee_create_submissions" ON public.submissions
  FOR INSERT WITH CHECK (employee_id = auth.uid());

-- Admin can update submissions (approve/reject)
CREATE POLICY "admin_update_submissions" ON public.submissions
  FOR UPDATE USING (
    public.get_user_role() IN ('super_admin', 'admin')
  );

-- ============================================================
-- MESSAGES TABLE POLICIES
-- ============================================================

-- Users can view messages they sent or received
CREATE POLICY "users_view_own_messages" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

-- Super Admin can view all messages
CREATE POLICY "super_admin_view_all_messages" ON public.messages
  FOR SELECT USING (public.get_user_role() = 'super_admin');

-- Authenticated users can send messages
CREATE POLICY "users_send_messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Users can update their own received messages (mark as read)
CREATE POLICY "users_mark_read" ON public.messages
  FOR UPDATE USING (receiver_id = auth.uid());

-- ============================================================
-- ACTIVITY LOGS TABLE POLICIES
-- ============================================================

-- Super Admin can view all logs
CREATE POLICY "super_admin_view_all_logs" ON public.activity_logs
  FOR SELECT USING (public.get_user_role() = 'super_admin');

-- Users can view own logs
CREATE POLICY "users_view_own_logs" ON public.activity_logs
  FOR SELECT USING (user_id = auth.uid());

-- Any authenticated user can insert logs
CREATE POLICY "users_insert_logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Submissions bucket: employees can upload, admins can read
CREATE POLICY "employees_upload_submissions" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'submissions'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "users_view_submission_files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'submissions'
    AND auth.uid() IS NOT NULL
  );

-- Messages bucket: authenticated users can upload and read
CREATE POLICY "users_upload_message_files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'messages'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "users_view_message_files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'messages'
    AND auth.uid() IS NOT NULL
  );

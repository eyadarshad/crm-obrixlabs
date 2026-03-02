-- ============================================================
-- ObrixLabs IMS: Announcements & Meetings Tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================

CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_created_by ON public.announcements(created_by);
CREATE INDEX idx_announcements_priority ON public.announcements(priority);
CREATE INDEX idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX idx_announcements_is_pinned ON public.announcements(is_pinned);

-- ============================================================
-- MEETINGS TABLE
-- ============================================================

CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  meeting_link TEXT,
  location TEXT,
  organized_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meetings_organized_by ON public.meetings(organized_by);
CREATE INDEX idx_meetings_scheduled_at ON public.meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON public.meetings(status);

-- ============================================================
-- MEETING PARTICIPANTS (many-to-many)
-- ============================================================

CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rsvp_status TEXT NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined')),
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_meeting_participants_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user ON public.meeting_participants(user_id);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- ANNOUNCEMENTS: everyone can read
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ANNOUNCEMENTS: only admins can create/update/delete
CREATE POLICY "announcements_insert" ON public.announcements
  FOR INSERT WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "announcements_update" ON public.announcements
  FOR UPDATE USING (
    created_by = auth.uid() OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "announcements_delete" ON public.announcements
  FOR DELETE USING (
    created_by = auth.uid() OR public.get_my_role() = 'super_admin'
  );

-- MEETINGS: participants and organizers can read
CREATE POLICY "meetings_select" ON public.meetings
  FOR SELECT USING (
    organized_by = auth.uid()
    OR id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid())
    OR public.get_my_role() IN ('super_admin', 'admin')
  );

-- MEETINGS: admins can create
CREATE POLICY "meetings_insert" ON public.meetings
  FOR INSERT WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "meetings_update" ON public.meetings
  FOR UPDATE USING (
    organized_by = auth.uid() OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "meetings_delete" ON public.meetings
  FOR DELETE USING (
    organized_by = auth.uid() OR public.get_my_role() = 'super_admin'
  );

-- MEETING PARTICIPANTS
CREATE POLICY "participants_select" ON public.meeting_participants
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "participants_insert" ON public.meeting_participants
  FOR INSERT WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "participants_update" ON public.meeting_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "participants_delete" ON public.meeting_participants
  FOR DELETE USING (public.get_my_role() IN ('super_admin', 'admin'));

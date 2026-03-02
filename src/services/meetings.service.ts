import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface Meeting {
    id: string;
    title: string;
    description: string | null;
    scheduled_at: string;
    duration_minutes: number;
    meeting_link: string | null;
    location: string | null;
    organized_by: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
    organizer?: { id: string; name: string; email: string };
    participants?: MeetingParticipant[];
}

export interface MeetingParticipant {
    id: string;
    meeting_id: string;
    user_id: string;
    rsvp_status: 'pending' | 'accepted' | 'declined';
    user?: { id: string; name: string; email: string };
}

export const meetingsService = {
    async getMeetings(filters?: { status?: string; page?: number; pageSize?: number }) {
        const page = filters?.page || 1;
        const pageSize = filters?.pageSize || 20;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('meetings')
            .select('*, organizer:users!organized_by(id, name, email)', { count: 'exact' })
            .order('scheduled_at', { ascending: true })
            .range(from, to);

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: (data || []) as Meeting[],
            totalPages: Math.ceil((count || 0) / pageSize),
        };
    },

    async getMeetingById(id: string) {
        const { data, error } = await supabase
            .from('meetings')
            .select('*, organizer:users!organized_by(id, name, email)')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Fetch participants
        const { data: participants } = await supabase
            .from('meeting_participants')
            .select('*, user:users!user_id(id, name, email)')
            .eq('meeting_id', id);

        return { ...data, participants: participants || [] } as Meeting;
    },

    async createMeeting(meeting: {
        title: string;
        description?: string;
        scheduled_at: string;
        duration_minutes: number;
        meeting_link?: string;
        location?: string;
        organized_by: string;
        participant_ids?: string[];
    }) {
        const { participant_ids, ...meetingData } = meeting;

        const { data, error } = await supabase
            .from('meetings')
            .insert(meetingData)
            .select()
            .single();

        if (error) throw error;

        // Add participants
        if (participant_ids && participant_ids.length > 0) {
            const participants = participant_ids.map((uid) => ({
                meeting_id: data.id,
                user_id: uid,
            }));
            await supabase.from('meeting_participants').insert(participants);
        }

        return data as Meeting;
    },

    async updateMeeting(id: string, updates: Partial<Meeting>) {
        const { data, error } = await supabase
            .from('meetings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Meeting;
    },

    async updateMeetingStatus(id: string, status: Meeting['status']) {
        return this.updateMeeting(id, { status } as Partial<Meeting>);
    },

    async deleteMeeting(id: string) {
        const { error } = await supabase.from('meetings').delete().eq('id', id);
        if (error) throw error;
    },

    async updateRsvp(meetingId: string, userId: string, rsvpStatus: string) {
        const { error } = await supabase
            .from('meeting_participants')
            .update({ rsvp_status: rsvpStatus })
            .eq('meeting_id', meetingId)
            .eq('user_id', userId);

        if (error) throw error;
    },
};

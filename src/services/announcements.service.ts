import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    created_by: string;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    creator?: { id: string; name: string; email: string; role: string };
}

export const announcementsService = {
    async getAnnouncements(page = 1, pageSize = 20) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('announcements')
            .select('*, creator:users!created_by(id, name, email, role)', { count: 'exact' })
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return {
            data: (data || []) as Announcement[],
            totalPages: Math.ceil((count || 0) / pageSize),
        };
    },

    async createAnnouncement(announcement: {
        title: string;
        content: string;
        priority?: string;
        created_by: string;
        is_pinned?: boolean;
    }) {
        const { data, error } = await supabase
            .from('announcements')
            .insert(announcement)
            .select()
            .single();

        if (error) throw error;
        return data as Announcement;
    },

    async updateAnnouncement(id: string, updates: Partial<Announcement>) {
        const { data, error } = await supabase
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Announcement;
    },

    async deleteAnnouncement(id: string) {
        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async togglePin(id: string, isPinned: boolean) {
        const { error } = await supabase
            .from('announcements')
            .update({ is_pinned: !isPinned })
            .eq('id', id);

        if (error) throw error;
    },
};

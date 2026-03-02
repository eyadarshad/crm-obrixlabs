'use client';

import { createClient } from '@/lib/supabase/client';
import type { ActivityLog } from '@/types';

const supabase = createClient();

export const activityLogsService = {
    async getLogs(filters: {
        action?: string;
        userId?: string;
        page?: number;
        pageSize?: number;
    } = {}) {
        const { action, userId, page = 1, pageSize = 20 } = filters;

        let query = supabase
            .from('activity_logs')
            .select('*, user:users!user_id(*)', { count: 'exact' });

        if (action) query = query.eq('action', action);
        if (userId) query = query.eq('user_id', userId);

        query = query
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: (data || []) as ActivityLog[],
            count: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        };
    },

    async logActivity(log: {
        user_id: string;
        action: string;
        metadata?: Record<string, unknown>;
    }): Promise<void> {
        const { error } = await supabase
            .from('activity_logs')
            .insert(log);

        if (error) console.error('Failed to log activity:', error);
    },
};

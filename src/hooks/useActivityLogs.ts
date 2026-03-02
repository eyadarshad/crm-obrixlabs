'use client';

import { useState, useEffect, useCallback } from 'react';
import { activityLogsService } from '@/services/activity-logs.service';
import type { ActivityLog } from '@/types';

export function useActivityLogs(filters: {
    action?: string;
    userId?: string;
    page?: number;
    pageSize?: number;
} = {}) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await activityLogsService.getLogs(filters);
            setLogs(result.data);
            setTotalPages(result.totalPages);
            setTotalCount(result.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return { logs, totalPages, totalCount, loading, error, refetch: fetchLogs };
}

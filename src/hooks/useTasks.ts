'use client';

import { useState, useEffect, useCallback } from 'react';
import { tasksService } from '@/services/tasks.service';
import type { Task, TaskFilters, PaginatedResponse } from '@/types';

export function useTasks(initialFilters: TaskFilters = {}) {
    const [tasks, setTasks] = useState<PaginatedResponse<Task>>({
        data: [],
        count: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
    });
    const [filters, setFilters] = useState<TaskFilters>(initialFilters);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await tasksService.getTasks(filters);
            setTasks(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const updateFilters = (newFilters: Partial<TaskFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    };

    const setPage = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    return {
        tasks: tasks.data,
        totalPages: tasks.totalPages,
        totalCount: tasks.count,
        currentPage: tasks.page,
        loading,
        error,
        filters,
        updateFilters,
        setPage,
        refetch: fetchTasks,
    };
}

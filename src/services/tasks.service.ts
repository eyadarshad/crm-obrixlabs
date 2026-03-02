'use client';

import { createClient } from '@/lib/supabase/client';
import type { Task, TaskFilters, PaginatedResponse } from '@/types';

const supabase = createClient();

export const tasksService = {
    async getTasks(filters: TaskFilters = {}): Promise<PaginatedResponse<Task>> {
        const {
            status,
            priority,
            search,
            assignedTo,
            sortBy = 'created_at',
            sortOrder = 'desc',
            page = 1,
            pageSize = 10,
        } = filters;

        let query = supabase
            .from('tasks')
            .select('*, assignee:users!assigned_to(*), assigner:users!assigned_by(*)', { count: 'exact' });

        if (status) query = query.eq('status', status);
        if (priority) query = query.eq('priority', priority);
        if (assignedTo) query = query.eq('assigned_to', assignedTo);
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        query = query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range((page - 1) * pageSize, page * pageSize - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const total = count || 0;
        return {
            data: (data || []) as Task[],
            count: total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    },

    async getTaskById(id: string): Promise<Task> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, assignee:users!assigned_to(*), assigner:users!assigned_by(*), submissions(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Task;
    },

    async createTask(task: {
        title: string;
        description?: string;
        assigned_to: string;
        assigned_by: string;
        priority: string;
        deadline?: string;
    }): Promise<Task> {
        const { data, error } = await supabase
            .from('tasks')
            .insert(task)
            .select('*, assignee:users!assigned_to(*), assigner:users!assigned_by(*)')
            .single();

        if (error) throw error;
        return data as Task;
    },

    async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select('*, assignee:users!assigned_to(*), assigner:users!assigned_by(*)')
            .single();

        if (error) throw error;
        return data as Task;
    },

    async deleteTask(id: string): Promise<void> {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateTaskStatus(id: string, status: string): Promise<Task> {
        return this.updateTask(id, { status } as Partial<Task>);
    },
};

'use client';

import { createClient } from '@/lib/supabase/client';
import type { DashboardStats, EmployeePerformance, User } from '@/types';

const supabase = createClient();

export const analyticsService = {
    async getDashboardStats(): Promise<DashboardStats> {
        const [employeesRes, tasksRes] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact' }).eq('role', 'employee'),
            supabase.from('tasks').select('id, status, created_at, updated_at'),
        ]);

        const totalEmployees = employeesRes.count || 0;
        const tasks = tasksRes.data || [];
        const totalTasks = tasks.length;
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
        const completedTasks = tasks.filter(t => t.status === 'approved').length;
        const rejectedTasks = tasks.filter(t => t.status === 'rejected').length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Calculate average completion time for approved tasks
        const approvedTasks = tasks.filter(t => t.status === 'approved');
        let avgTime = 0;
        if (approvedTasks.length > 0) {
            const totalMs = approvedTasks.reduce((sum, t) => {
                return sum + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime());
            }, 0);
            avgTime = totalMs / approvedTasks.length / (1000 * 60 * 60 * 24); // in days
        }

        return {
            totalEmployees,
            totalTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks,
            rejectedTasks,
            completionRate: Math.round(completionRate * 10) / 10,
            averageCompletionTime: Math.round(avgTime * 10) / 10,
        };
    },

    async getEmployeePerformance(): Promise<EmployeePerformance[]> {
        const { data: employees } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'employee');

        if (!employees) return [];

        const { data: tasks } = await supabase
            .from('tasks')
            .select('*');

        if (!tasks) return [];

        return employees.map((emp: User) => {
            const empTasks = tasks.filter(t => t.assigned_to === emp.id);
            const completed = empTasks.filter(t => t.status === 'approved');
            const pending = empTasks.filter(t => ['pending', 'in_progress'].includes(t.status));

            let avgTime = 0;
            if (completed.length > 0) {
                const totalMs = completed.reduce((sum: number, t: { updated_at: string; created_at: string }) => {
                    return sum + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime());
                }, 0);
                avgTime = totalMs / completed.length / (1000 * 60 * 60 * 24);
            }

            return {
                user: emp,
                totalTasks: empTasks.length,
                completedTasks: completed.length,
                pendingTasks: pending.length,
                completionRate: empTasks.length > 0
                    ? Math.round((completed.length / empTasks.length) * 100 * 10) / 10
                    : 0,
                averageCompletionTime: Math.round(avgTime * 10) / 10,
            };
        }).sort((a, b) => b.completionRate - a.completionRate);
    },
};

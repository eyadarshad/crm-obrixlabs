'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { TaskFiltersBar } from '@/components/tasks/TaskFilters';
import { TaskList } from '@/components/tasks/TaskList';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function TasksPage() {
    const { user } = useAuth();
    const {
        tasks,
        totalPages,
        currentPage,
        loading,
        filters,
        updateFilters,
        setPage,
    } = useTasks(
        user?.role === 'employee' ? { assignedTo: user?.id } : {}
    );

    const canCreateTask = user?.role !== 'employee';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Tasks</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        {user?.role === 'employee'
                            ? 'View and manage your assigned tasks'
                            : 'Manage and track all team tasks'}
                    </p>
                </div>
                {canCreateTask && (
                    <Link href="/tasks/new">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            New Task
                        </Button>
                    </Link>
                )}
            </div>

            <TaskFiltersBar filters={filters} onFilterChange={updateFilters} />

            {loading ? (
                <LoadingSpinner text="Loading tasks..." />
            ) : (
                <TaskList
                    tasks={tasks}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}

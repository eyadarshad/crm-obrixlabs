'use client';

import { useEffect, useState } from 'react';
import { TaskForm } from '@/components/tasks/TaskForm';
import { employeesService } from '@/services/employees.service';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { User } from '@/types';

export default function NewTaskPage() {
    const [employees, setEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            try {
                const data = await employeesService.getEmployees();
                setEmployees(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    if (loading) return <LoadingSpinner text="Loading..." />;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-white">Create New Task</h2>
                <p className="text-sm text-gray-400 mt-1">
                    Assign a new task to a team member
                </p>
            </div>
            <TaskForm employees={employees} />
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { employeesService } from '@/services/employees.service';
import { tasksService } from '@/services/tasks.service';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Mail,
    Calendar,
    CheckCircle2,
    Clock,
    ListTodo,
} from 'lucide-react';
import type { User, Task } from '@/types';

export default function EmployeeDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [employee, setEmployee] = useState<User | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [emp, taskData] = await Promise.all([
                    employeesService.getUserById(id),
                    tasksService.getTasks({ assignedTo: id, pageSize: 100 }),
                ]);
                setEmployee(emp);
                setTasks(taskData.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    if (loading) return <LoadingSpinner text="Loading..." />;
    if (!employee) return null;

    const completedTasks = tasks.filter(t => t.status === 'approved').length;
    const pendingTasks = tasks.filter(t => ['pending', 'in_progress'].includes(t.status)).length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const statusColors: Record<string, string> = {
        pending: 'bg-amber-500/10 text-amber-400',
        in_progress: 'bg-blue-500/10 text-blue-400',
        submitted: 'bg-violet-500/10 text-violet-400',
        approved: 'bg-emerald-500/10 text-emerald-400',
        rejected: 'bg-red-500/10 text-red-400',
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>

            {/* Profile Card */}
            <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                <CardContent className="p-6">
                    <div className="flex items-start gap-5">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white text-xl font-bold">
                                {getInitials(employee.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-white">{employee.name}</h2>
                                <Badge
                                    variant="outline"
                                    className={
                                        employee.role === 'admin'
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    }
                                >
                                    {employee.role.replace('_', ' ')}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" />
                                    {employee.email}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Joined {format(new Date(employee.created_at), 'MMM yyyy')}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                    <CardContent className="p-4 text-center">
                        <ListTodo className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{tasks.length}</p>
                        <p className="text-xs text-gray-500">Total Tasks</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                    <CardContent className="p-4 text-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{completedTasks}</p>
                        <p className="text-xs text-gray-500">Completed</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                    <CardContent className="p-4 text-center">
                        <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{pendingTasks}</p>
                        <p className="text-xs text-gray-500">Pending</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                    <CardContent className="p-4 text-center">
                        <div className="w-5 h-5 mx-auto mb-2 text-cyan-400 font-bold text-lg leading-5">
                            %
                        </div>
                        <p className="text-2xl font-bold text-white">{completionRate}%</p>
                        <p className="text-xs text-gray-500">Completion Rate</p>
                    </CardContent>
                </Card>
            </div>

            {/* Task History */}
            <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                <CardHeader>
                    <CardTitle className="text-sm text-gray-300">Task History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white/[0.04] transition-colors"
                                onClick={() => router.push(`/tasks/${task.id}`)}
                            >
                                <div>
                                    <p className="text-sm text-white">{task.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {task.deadline
                                            ? `Due: ${format(new Date(task.deadline), 'MMM dd, yyyy')}`
                                            : 'No deadline'}
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={statusColors[task.status]}
                                >
                                    {task.status.replace('_', ' ')}
                                </Badge>
                            </div>
                        ))}
                        {tasks.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">
                                No tasks assigned yet
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

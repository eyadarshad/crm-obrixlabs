'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { tasksService } from '@/services/tasks.service';
import { submissionsService } from '@/services/submissions.service';
import { activityLogsService } from '@/services/activity-logs.service';
import { SubmissionForm } from '@/components/submissions/SubmissionForm';
import { SubmissionReview } from '@/components/submissions/SubmissionReview';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Calendar,
    User,
    Flag,
    Trash2,
    Play,
    Clock,
} from 'lucide-react';
import type { Task, Submission } from '@/types';

const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    submitted: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const priorityColors: Record<string, string> = {
    low: 'bg-gray-500/10 text-gray-400',
    medium: 'bg-amber-500/10 text-amber-400',
    high: 'bg-red-500/10 text-red-400',
};

export default function TaskDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const [task, setTask] = useState<Task | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchTask = async () => {
        try {
            const data = await tasksService.getTaskById(id);
            setTask(data);
            const subs = await submissionsService.getSubmissionsByTask(id);
            setSubmissions(subs);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load task');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTask();
    }, [id]);

    const handleStartTask = async () => {
        if (!task || !user) return;
        try {
            await tasksService.updateTaskStatus(task.id, 'in_progress');
            await activityLogsService.logActivity({
                user_id: user.id,
                action: 'task_updated',
                metadata: { task_id: task.id, status: 'in_progress' },
            });
            toast.success('Task started');
            fetchTask();
        } catch {
            toast.error('Failed to update task');
        }
    };

    const handleDelete = async () => {
        if (!task || !user) return;
        setDeleting(true);
        try {
            await tasksService.deleteTask(task.id);
            await activityLogsService.logActivity({
                user_id: user.id,
                action: 'task_deleted',
                metadata: { task_id: task.id, title: task.title },
            });
            toast.success('Task deleted');
            router.push('/tasks');
        } catch {
            toast.error('Failed to delete task');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <LoadingSpinner text="Loading task..." />;
    if (!task) return null;

    const isEmployee = user?.role === 'employee';
    const isAdmin = user?.role !== 'employee';
    const canStart = isEmployee && task.status === 'pending';
    const canSubmit =
        isEmployee &&
        ['in_progress', 'rejected'].includes(task.status);
    const formatStatus = (s: string) =>
        s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="text-gray-400 hover:text-white mt-1"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-white">{task.title}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge
                                    variant="outline"
                                    className={statusColors[task.status]}
                                >
                                    {formatStatus(task.status)}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className={priorityColors[task.priority]}
                                >
                                    <Flag className="w-3 h-3 mr-1" />
                                    {task.priority}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {canStart && (
                                <Button
                                    onClick={handleStartTask}
                                    className="bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Task
                                </Button>
                            )}
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowDelete(true)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Details */}
            <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                <CardContent className="p-6">
                    {task.description && (
                        <div className="mb-5">
                            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                Description
                            </h3>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                {task.description}
                            </p>
                        </div>
                    )}

                    <Separator className="bg-white/[0.06] my-4" />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                <User className="w-3 h-3" /> Assigned To
                            </p>
                            <p className="text-sm text-white mt-1">
                                {task.assignee?.name || 'Unknown'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                <User className="w-3 h-3" /> Assigned By
                            </p>
                            <p className="text-sm text-white mt-1">
                                {task.assigner?.name || 'Unknown'}
                            </p>
                        </div>
                        {task.deadline && (
                            <div>
                                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Deadline
                                </p>
                                <p className="text-sm text-white mt-1">
                                    {format(new Date(task.deadline), 'MMM dd, yyyy')}
                                </p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> Created
                            </p>
                            <p className="text-sm text-white mt-1">
                                {format(new Date(task.created_at), 'MMM dd, yyyy')}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Submission Section */}
            {canSubmit && (
                <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-300">
                            Submit Your Work
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SubmissionForm
                            taskId={task.id}
                            employeeId={user?.id || ''}
                            onSubmitted={fetchTask}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Submissions History */}
            {submissions.length > 0 && (
                <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-300">
                            Submissions ({submissions.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {submissions.map((sub) => (
                            <SubmissionReview
                                key={sub.id}
                                submission={sub}
                                taskId={task.id}
                                isAdmin={isAdmin}
                                onAction={fetchTask}
                            />
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Delete Modal */}
            <ConfirmModal
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={handleDelete}
                title="Delete Task"
                description="Are you sure you want to delete this task? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                loading={deleting}
            />
        </div>
    );
}

'use client';

import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Clock, Calendar, User } from 'lucide-react';
import type { Task } from '@/types';
import Link from 'next/link';

interface TaskCardProps {
    task: Task;
}

const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    submitted: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const priorityColors: Record<string, string> = {
    low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const formatStatus = (s: string) => s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export function TaskCard({ task }: TaskCardProps) {
    const isOverdue =
        task.deadline &&
        new Date(task.deadline) < new Date() &&
        !['approved', 'rejected'].includes(task.status);

    return (
        <Link href={`/tasks/${task.id}`}>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-200 cursor-pointer group">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                        {task.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                            variant="outline"
                            className={`text-[10px] ${priorityColors[task.priority]}`}
                        >
                            {task.priority}
                        </Badge>
                        <Badge
                            variant="outline"
                            className={`text-[10px] ${statusColors[task.status]}`}
                        >
                            {formatStatus(task.status)}
                        </Badge>
                    </div>
                </div>

                {task.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                        {task.description}
                    </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                    {task.assignee && (
                        <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            <span>{task.assignee.name}</span>
                        </div>
                    )}
                    {task.deadline && (
                        <div
                            className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : ''}`}
                        >
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(task.deadline), 'MMM dd, yyyy')}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(task.created_at), 'MMM dd')}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

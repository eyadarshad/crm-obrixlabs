'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { activityLogsService } from '@/services/activity-logs.service';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import type { ActivityLog } from '@/types';

const actionColors: Record<string, string> = {
    task_created: 'bg-blue-500/10 text-blue-400',
    task_updated: 'bg-cyan-500/10 text-cyan-400',
    task_deleted: 'bg-red-500/10 text-red-400',
    submission_made: 'bg-violet-500/10 text-violet-400',
    submission_approved: 'bg-emerald-500/10 text-emerald-400',
    submission_rejected: 'bg-red-500/10 text-red-400',
    message_sent: 'bg-indigo-500/10 text-indigo-400',
    user_created: 'bg-green-500/10 text-green-400',
    user_deleted: 'bg-red-500/10 text-red-400',
    login: 'bg-gray-500/10 text-gray-400',
};

const actionLabels: Record<string, string> = {
    task_created: 'Task Created',
    task_updated: 'Task Updated',
    task_deleted: 'Task Deleted',
    submission_made: 'Submission Made',
    submission_approved: 'Submission Approved',
    submission_rejected: 'Submission Rejected',
    message_sent: 'Message Sent',
    user_created: 'User Created',
    user_deleted: 'User Deleted',
    login: 'Login',
};

export default function ActivityLogsPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [actionFilter, setActionFilter] = useState<string>('all');

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const result = await activityLogsService.getLogs({
                action: actionFilter === 'all' ? undefined : actionFilter,
                page,
                pageSize: 20,
            });
            setLogs(result.data);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, actionFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-white">Activity Logs</h2>
                <p className="text-sm text-gray-400 mt-1">
                    Track all system activities and changes
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <Select
                    value={actionFilter}
                    onValueChange={(v) => {
                        setActionFilter(v);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[200px] bg-white/[0.04] border-white/[0.08] text-gray-300 h-9">
                        <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141925] border-white/[0.08]">
                        <SelectItem value="all">All Actions</SelectItem>
                        {Object.entries(actionLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Logs */}
            {loading ? (
                <LoadingSpinner text="Loading logs..." />
            ) : (
                <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/[0.04]">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Activity className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium text-white">
                                                {log.user?.name || 'System'}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] ${actionColors[log.action] || 'bg-gray-500/10 text-gray-400'}`}
                                            >
                                                {actionLabels[log.action] || log.action}
                                            </Badge>
                                        </div>
                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {Object.entries(log.metadata)
                                                    .map(([k, v]) => `${k}: ${v}`)
                                                    .join(' • ')}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-600 flex-shrink-0">
                                        {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                                    </span>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="p-12 text-center text-gray-500">
                                    No activity logs found
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="text-gray-400"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-400">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="text-gray-400"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submissionsService } from '@/services/submissions.service';
import { activityLogsService } from '@/services/activity-logs.service';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Check, X, FileText, ExternalLink, Loader2 } from 'lucide-react';
import type { Submission } from '@/types';

interface SubmissionReviewProps {
    submission: Submission;
    taskId: string;
    isAdmin: boolean;
    onAction: () => void;
}

const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-amber-500/10 text-amber-400', label: 'Pending Review' },
    approved: { color: 'bg-emerald-500/10 text-emerald-400', label: 'Approved' },
    rejected: { color: 'bg-red-500/10 text-red-400', label: 'Rejected' },
};

export function SubmissionReview({
    submission,
    taskId,
    isAdmin,
    onAction,
}: SubmissionReviewProps) {
    const { user } = useAuth();
    const [feedback, setFeedback] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [loading, setLoading] = useState(false);
    const status = statusConfig[submission.status];

    const handleApprove = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await submissionsService.approveSubmission(submission.id, taskId);
            await activityLogsService.logActivity({
                user_id: user.id,
                action: 'submission_approved',
                metadata: { submission_id: submission.id, task_id: taskId },
            });
            toast.success('Submission approved');
            onAction();
        } catch {
            toast.error('Failed to approve');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!user || !feedback.trim()) {
            toast.error('Please provide feedback');
            return;
        }
        setLoading(true);
        try {
            await submissionsService.rejectSubmission(submission.id, taskId, feedback);
            await activityLogsService.logActivity({
                user_id: user.id,
                action: 'submission_rejected',
                metadata: { submission_id: submission.id, task_id: taskId },
            });
            toast.success('Submission rejected with feedback');
            setShowFeedback(false);
            onAction();
        } catch {
            toast.error('Failed to reject');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={status.color}>
                        {status.label}
                    </Badge>
                    <span className="text-xs text-gray-500">
                        {format(new Date(submission.submitted_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                </div>
            </div>

            {submission.description && (
                <p className="text-sm text-gray-300 mb-3">{submission.description}</p>
            )}

            {submission.file_url && (
                <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 mb-3"
                >
                    <FileText className="w-3 h-3" />
                    View Attachment
                    <ExternalLink className="w-3 h-3" />
                </a>
            )}

            {submission.feedback && (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 mb-3">
                    <p className="text-xs font-medium text-red-400 mb-1">Admin Feedback:</p>
                    <p className="text-sm text-gray-300">{submission.feedback}</p>
                </div>
            )}

            {/* Admin Actions */}
            {isAdmin && submission.status === 'pending' && (
                <div className="flex items-center gap-2 mt-3">
                    <Button
                        size="sm"
                        onClick={handleApprove}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                        {loading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <>
                                <Check className="w-3 h-3 mr-1" />
                                Approve
                            </>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowFeedback(!showFeedback)}
                        className="text-red-400 hover:bg-red-500/10"
                    >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                    </Button>
                </div>
            )}

            {/* Feedback Input */}
            {showFeedback && (
                <div className="mt-3 space-y-2">
                    <Textarea
                        placeholder="Provide feedback for rejection..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                    />
                    <Button
                        size="sm"
                        onClick={handleReject}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-500 text-white"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Reject'}
                    </Button>
                </div>
            )}
        </div>
    );
}

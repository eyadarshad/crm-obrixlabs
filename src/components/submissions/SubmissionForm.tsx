'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/shared/FileUpload';
import { submissionsService } from '@/services/submissions.service';
import { activityLogsService } from '@/services/activity-logs.service';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SubmissionFormProps {
    taskId: string;
    employeeId: string;
    onSubmitted: () => void;
}

export function SubmissionForm({ taskId, employeeId, onSubmitted }: SubmissionFormProps) {
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() && !file) {
            toast.error('Please add a description or attach a file');
            return;
        }

        setLoading(true);
        try {
            let fileUrl: string | undefined;
            if (file) {
                fileUrl = await submissionsService.uploadFile(file, taskId);
            }

            await submissionsService.createSubmission({
                task_id: taskId,
                employee_id: employeeId,
                description: description.trim(),
                file_url: fileUrl,
            });

            await activityLogsService.logActivity({
                user_id: employeeId,
                action: 'submission_made',
                metadata: { task_id: taskId },
            });

            toast.success('Work submitted successfully');
            setDescription('');
            setFile(null);
            onSubmitted();
        } catch (error) {
            toast.error('Failed to submit work');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
                placeholder="Describe your work..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white min-h-[100px]"
            />

            <FileUpload
                onFileSelected={(f) => setFile(f)}
                uploading={loading}
            />

            <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    'Submit Work'
                )}
            </Button>
        </form>
    );
}

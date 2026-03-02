'use client';

import { createClient } from '@/lib/supabase/client';
import type { Submission } from '@/types';

const supabase = createClient();

export const submissionsService = {
    async getSubmissionsByTask(taskId: string): Promise<Submission[]> {
        const { data, error } = await supabase
            .from('submissions')
            .select('*, employee:users!employee_id(*)')
            .eq('task_id', taskId)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Submission[];
    },

    async createSubmission(submission: {
        task_id: string;
        employee_id: string;
        description?: string;
        file_url?: string;
    }): Promise<Submission> {
        const { data, error } = await supabase
            .from('submissions')
            .insert(submission)
            .select('*')
            .single();

        if (error) throw error;

        // Also update the task status to submitted
        await supabase
            .from('tasks')
            .update({ status: 'submitted' })
            .eq('id', submission.task_id);

        return data as Submission;
    },

    async approveSubmission(id: string, taskId: string): Promise<Submission> {
        const { data, error } = await supabase
            .from('submissions')
            .update({ status: 'approved' })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        await supabase
            .from('tasks')
            .update({ status: 'approved' })
            .eq('id', taskId);

        return data as Submission;
    },

    async rejectSubmission(id: string, taskId: string, feedback: string): Promise<Submission> {
        const { data, error } = await supabase
            .from('submissions')
            .update({ status: 'rejected', feedback })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        await supabase
            .from('tasks')
            .update({ status: 'rejected' })
            .eq('id', taskId);

        return data as Submission;
    },

    async uploadFile(file: File, taskId: string): Promise<string> {
        const ext = file.name.split('.').pop();
        const fileName = `${taskId}/${Date.now()}.${ext}`;

        const { error } = await supabase.storage
            .from('submissions')
            .upload(fileName, file);

        if (error) throw error;

        const { data } = supabase.storage
            .from('submissions')
            .getPublicUrl(fileName);

        return data.publicUrl;
    },
};

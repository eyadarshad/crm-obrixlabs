'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tasksService } from '@/services/tasks.service';
import { activityLogsService } from '@/services/activity-logs.service';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TaskFormProps {
    employees: User[];
}

export function TaskForm({ employees }: TaskFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        deadline: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const task = await tasksService.createTask({
                ...form,
                assigned_by: user.id,
            });

            await activityLogsService.logActivity({
                user_id: user.id,
                action: 'task_created',
                metadata: { task_id: task.id, title: task.title },
            });

            toast.success('Task created successfully');
            router.push('/tasks');
        } catch (error) {
            toast.error('Failed to create task');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-[#0a0f1a]/80 border-white/[0.06] max-w-2xl">
            <CardHeader>
                <CardTitle className="text-lg text-white">Create New Task</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-gray-300">Title</Label>
                        <Input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="bg-white/[0.04] border-white/[0.08] text-white"
                            placeholder="Enter task title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-300">Description</Label>
                        <Textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="bg-white/[0.04] border-white/[0.08] text-white min-h-[100px]"
                            placeholder="Describe the task..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Assign To</Label>
                            <Select
                                value={form.assigned_to}
                                onValueChange={(v) => setForm({ ...form, assigned_to: v })}
                                required
                            >
                                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-gray-300">
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141925] border-white/[0.08]">
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Priority</Label>
                            <Select
                                value={form.priority}
                                onValueChange={(v) => setForm({ ...form, priority: v })}
                            >
                                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-gray-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141925] border-white/[0.08]">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-300">Deadline</Label>
                        <Input
                            type="datetime-local"
                            value={form.deadline}
                            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                            className="bg-white/[0.04] border-white/[0.08] text-white"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Task'
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-gray-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

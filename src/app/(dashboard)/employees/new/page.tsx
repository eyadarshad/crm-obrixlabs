'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { activityLogsService } from '@/services/activity-logs.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewEmployeePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'employee',
    });

    const availableRoles = () => {
        if (user?.role === 'super_admin') {
            return ['admin', 'employee'];
        }
        return ['employee'];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            // Use API route to create user (runs on server with service role key)
            const res = await fetch('/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create user');
            }

            await activityLogsService.logActivity({
                user_id: user.id,
                action: 'user_created',
                metadata: { name: form.name, email: form.email, role: form.role },
            });

            toast.success(`${form.role === 'admin' ? 'Admin' : 'Employee'} created successfully`);
            router.push('/employees');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-white">
                    Add New {user?.role === 'super_admin' ? 'User' : 'Employee'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                    Create a new team member account
                </p>
            </div>

            <Card className="bg-[#0a0f1a]/80 border-white/[0.06] max-w-lg">
                <CardHeader>
                    <CardTitle className="text-lg text-white">User Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Full Name</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="bg-white/[0.04] border-white/[0.08] text-white"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Email Address</Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="bg-white/[0.04] border-white/[0.08] text-white"
                                placeholder="john@obrixlabs.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Password</Label>
                            <Input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="bg-white/[0.04] border-white/[0.08] text-white"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Role</Label>
                            <Select
                                value={form.role}
                                onValueChange={(v) => setForm({ ...form, role: v })}
                            >
                                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-gray-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141925] border-white/[0.08]">
                                    {availableRoles().map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    'Create User'
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
        </div>
    );
}

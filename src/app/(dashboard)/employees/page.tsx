'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { employeesService } from '@/services/employees.service';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { activityLogsService } from '@/services/activity-logs.service';
import { Plus, Search, Trash2, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import type { User } from '@/types';

export default function EmployeesPage() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchEmployees = async () => {
        try {
            const data =
                user?.role === 'super_admin'
                    ? await employeesService.getAllUsers()
                    : await employeesService.getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchEmployees();
    }, [user]);

    const handleDelete = async () => {
        if (!deleteTarget || !user) return;
        setDeleting(true);
        try {
            await employeesService.deleteUser(deleteTarget.id);
            await activityLogsService.logActivity({
                user_id: user.id,
                action: 'user_deleted',
                metadata: { deleted_user: deleteTarget.name, deleted_id: deleteTarget.id },
            });
            toast.success('User deleted');
            setDeleteTarget(null);
            fetchEmployees();
        } catch {
            toast.error('Failed to delete user');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = employees.filter(
        (e) =>
            e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.email.toLowerCase().includes(search.toLowerCase())
    );

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const roleBadge = (role: string) => {
        const colors: Record<string, string> = {
            super_admin: 'bg-red-500/10 text-red-400 border-red-500/20',
            admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            employee: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
        return colors[role] || colors.employee;
    };

    if (loading) return <LoadingSpinner text="Loading employees..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">
                        {user?.role === 'super_admin' ? 'All Users' : 'Employees'}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Manage your team members
                    </p>
                </div>
                <Link href="/employees/new">
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add {user?.role === 'super_admin' ? 'User' : 'Employee'}
                    </Button>
                </Link>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 h-9"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((emp) => (
                    <Card
                        key={emp.id}
                        className="bg-[#0a0f1a]/80 border-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-11 w-11">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white text-xs font-bold">
                                            {getInitials(emp.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <Link
                                            href={`/employees/${emp.id}`}
                                            className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
                                        >
                                            {emp.name}
                                        </Link>
                                        <Badge
                                            variant="outline"
                                            className={`ml-2 text-[10px] ${roleBadge(emp.role)}`}
                                        >
                                            {emp.role.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                                {user?.role === 'super_admin' && emp.id !== user.id && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteTarget(emp)}
                                        className="text-gray-500 hover:text-red-400 p-1 h-auto"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Mail className="w-3 h-3" />
                                    <span>{emp.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    <span>Joined {format(new Date(emp.created_at), 'MMM dd, yyyy')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No users found</p>
                </div>
            )}

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete User"
                description={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                loading={deleting}
            />
        </div>
    );
}

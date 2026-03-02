'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
    Users,
    ListTodo,
    Clock,
    CheckCircle2,
    TrendingUp,
    Timer,
    XCircle,
    AlertCircle,
} from 'lucide-react';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
    stats: DashboardStats;
    role: string;
}

const statConfig = [
    {
        key: 'totalEmployees',
        label: 'Total Employees',
        icon: Users,
        gradient: 'from-blue-500 to-cyan-400',
        bgGlow: 'bg-blue-500/10',
        roles: ['super_admin', 'admin'],
    },
    {
        key: 'totalTasks',
        label: 'Total Tasks',
        icon: ListTodo,
        gradient: 'from-violet-500 to-purple-400',
        bgGlow: 'bg-violet-500/10',
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        key: 'pendingTasks',
        label: 'Pending Tasks',
        icon: Clock,
        gradient: 'from-amber-500 to-orange-400',
        bgGlow: 'bg-amber-500/10',
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        key: 'inProgressTasks',
        label: 'In Progress',
        icon: AlertCircle,
        gradient: 'from-cyan-500 to-blue-400',
        bgGlow: 'bg-cyan-500/10',
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        key: 'completedTasks',
        label: 'Completed',
        icon: CheckCircle2,
        gradient: 'from-emerald-500 to-green-400',
        bgGlow: 'bg-emerald-500/10',
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        key: 'rejectedTasks',
        label: 'Rejected',
        icon: XCircle,
        gradient: 'from-red-500 to-rose-400',
        bgGlow: 'bg-red-500/10',
        roles: ['super_admin', 'admin'],
    },
    {
        key: 'completionRate',
        label: 'Completion Rate',
        icon: TrendingUp,
        gradient: 'from-emerald-500 to-teal-400',
        bgGlow: 'bg-emerald-500/10',
        suffix: '%',
        roles: ['super_admin', 'admin'],
    },
    {
        key: 'averageCompletionTime',
        label: 'Avg. Completion',
        icon: Timer,
        gradient: 'from-pink-500 to-rose-400',
        bgGlow: 'bg-pink-500/10',
        suffix: ' days',
        roles: ['super_admin', 'admin'],
    },
];

export function StatsCards({ stats, role }: StatsCardsProps) {
    const visibleStats = statConfig.filter((s) => s.roles.includes(role));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleStats.map((stat) => {
                const Icon = stat.icon;
                const value = stats[stat.key as keyof DashboardStats];
                return (
                    <Card
                        key={stat.key}
                        className="bg-[#0a0f1a]/80 border-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        {stat.label}
                                    </p>
                                    <p className="text-2xl font-bold text-white mt-2">
                                        {value}
                                        {stat.suffix || ''}
                                    </p>
                                </div>
                                <div
                                    className={`w-10 h-10 rounded-xl ${stat.bgGlow} flex items-center justify-center`}
                                >
                                    <Icon
                                        className={`w-5 h-5 bg-gradient-to-br ${stat.gradient} bg-clip-text`}
                                        style={{ color: 'inherit' }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

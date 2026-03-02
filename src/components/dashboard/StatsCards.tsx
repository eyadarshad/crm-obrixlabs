'use client';

import { useEffect, useState, useRef } from 'react';
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

function useCountUp(target: number, duration = 900): number {
    const [count, setCount] = useState(0);
    const startedAt = useRef<number | null>(null);
    const rafId = useRef<number | null>(null);

    useEffect(() => {
        if (typeof target !== 'number') return;

        startedAt.current = null;
        const targetNum = target;

        const step = (timestamp: number) => {
            if (!startedAt.current) startedAt.current = timestamp;
            const elapsed = timestamp - startedAt.current;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * targetNum));
            if (progress < 1) {
                rafId.current = requestAnimationFrame(step);
            }
        };

        rafId.current = requestAnimationFrame(step);
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [target, duration]);

    return count;
}

const statConfig = [
    {
        key: 'totalEmployees',
        label: 'Total Employees',
        icon: Users,
        iconColor: 'text-blue-400',
        bgGlow: 'bg-blue-500/10',
        borderColor: 'hover:border-blue-500/30',
        roles: ['super_admin', 'admin'],
    },
    {
        key: 'totalTasks',
        label: 'Total Tasks',
        icon: ListTodo,
        iconColor: 'text-violet-400',
        bgGlow: 'bg-violet-500/10',
        borderColor: 'hover:border-violet-500/30',
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        key: 'pendingTasks',
        label: 'Pending Tasks',
        icon: Clock,
        iconColor: 'text-amber-400',
        bgGlow: 'bg-amber-500/10',
        borderColor: 'hover:border-amber-500/30',
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        key: 'inProgressTasks',
        label: 'In Progress',
        icon: AlertCircle,
        iconColor: 'text-cyan-400',
        bgGlow: 'bg-cyan-500/10',
        borderColor: 'hover:border-cyan-500/30',
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        key: 'completedTasks',
        label: 'Completed',
        icon: CheckCircle2,
        iconColor: 'text-emerald-400',
        bgGlow: 'bg-emerald-500/10',
        borderColor: 'hover:border-emerald-500/30',
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        key: 'rejectedTasks',
        label: 'Rejected',
        icon: XCircle,
        iconColor: 'text-red-400',
        bgGlow: 'bg-red-500/10',
        borderColor: 'hover:border-red-500/30',
        roles: ['super_admin', 'admin'],
    },
    {
        key: 'completionRate',
        label: 'Completion Rate',
        icon: TrendingUp,
        iconColor: 'text-teal-400',
        bgGlow: 'bg-emerald-500/10',
        borderColor: 'hover:border-teal-500/30',
        suffix: '%',
        roles: ['super_admin', 'admin'],
    },
    {
        key: 'averageCompletionTime',
        label: 'Avg. Completion',
        icon: Timer,
        iconColor: 'text-pink-400',
        bgGlow: 'bg-pink-500/10',
        borderColor: 'hover:border-pink-500/30',
        suffix: ' days',
        roles: ['super_admin', 'admin'],
    },
];

function StatCard({ stat, value }: { stat: typeof statConfig[number]; value: number }) {
    const animated = useCountUp(value);
    const Icon = stat.icon;

    return (
        <Card className={`bg-[#0a0f1a]/80 border-white/[0.06] ${stat.borderColor} transition-all duration-300 group`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            {stat.label}
                        </p>
                        <p className="text-2xl font-bold text-white mt-2 tabular-nums">
                            {animated}
                            {stat.suffix || ''}
                        </p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${stat.bgGlow} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function StatsCards({ stats, role }: StatsCardsProps) {
    const visibleStats = statConfig.filter((s) => s.roles.includes(role));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleStats.map((stat) => {
                const value = stats[stat.key as keyof DashboardStats];
                return (
                    <StatCard
                        key={stat.key}
                        stat={stat}
                        value={typeof value === 'number' ? value : 0}
                    />
                );
            })}
        </div>
    );
}

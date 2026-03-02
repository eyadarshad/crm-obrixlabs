'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/services/analytics.service';
import { StatsCards } from '@/components/dashboard/StatsCards';
import {
    PerformanceChart,
    EmployeeRankingTable,
} from '@/components/dashboard/PerformanceChart';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { DashboardStats, EmployeePerformance } from '@/types';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [performance, setPerformance] = useState<EmployeePerformance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsData, perfData] = await Promise.all([
                    analyticsService.getDashboardStats(),
                    user?.role !== 'employee'
                        ? analyticsService.getEmployeePerformance()
                        : Promise.resolve([]),
                ]);
                setStats(statsData);
                setPerformance(perfData);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) fetchData();
    }, [user]);

    if (loading) return <LoadingSpinner size="lg" text="Loading dashboard..." />;
    if (!stats) return null;

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h2 className="text-xl font-semibold text-white">
                    Welcome back, {user?.name?.split(' ')[0]} 👋
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                    Here&apos;s what&apos;s happening with your team today.
                </p>
            </div>

            {/* Stats Cards */}
            <StatsCards stats={stats} role={user?.role || 'employee'} />

            {/* Charts (Admin/Super Admin only) */}
            {user?.role !== 'employee' && (
                <>
                    <PerformanceChart data={performance} />
                    <EmployeeRankingTable data={performance} />
                </>
            )}
        </div>
    );
}

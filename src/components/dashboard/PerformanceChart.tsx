'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EmployeePerformance } from '@/types';

interface PerformanceChartProps {
    data: EmployeePerformance[];
}

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export function PerformanceChart({ data }: PerformanceChartProps) {
    const barData = data.slice(0, 8).map((d) => ({
        name: d.user.name.split(' ')[0],
        completed: d.completedTasks,
        pending: d.pendingTasks,
        total: d.totalTasks,
        rate: d.completionRate,
    }));

    const pieData = [
        { name: 'Completed', value: data.reduce((s, d) => s + d.completedTasks, 0), color: '#10b981' },
        { name: 'Pending', value: data.reduce((s, d) => s + d.pendingTasks, 0), color: '#f59e0b' },
        {
            name: 'Other',
            value: data.reduce((s, d) => s + d.totalTasks - d.completedTasks - d.pendingTasks, 0),
            color: '#6366f1',
        },
    ].filter((d) => d.value > 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                        Employee Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={barData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                                />
                                <YAxis
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#141925',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                    }}
                                />
                                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-gray-500 text-sm">
                            No data available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                        Task Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {pieData.length > 0 ? (
                        <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#141925',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-gray-500 text-sm">
                            No data available
                        </div>
                    )}
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-2">
                        {pieData.map((d) => (
                            <div key={d.name} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: d.color }}
                                />
                                <span className="text-xs text-gray-400">
                                    {d.name} ({d.value})
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function EmployeeRankingTable({ data }: { data: EmployeePerformance[] }) {
    return (
        <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                    Employee Rankings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {data.slice(0, 10).map((emp, i) => (
                        <div
                            key={emp.user.id}
                            className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : i === 1
                                        ? 'bg-gray-400/20 text-gray-300'
                                        : i === 2
                                            ? 'bg-amber-700/20 text-amber-600'
                                            : 'bg-white/[0.04] text-gray-500'
                                    }`}
                            >
                                {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {emp.user.name}
                                </p>
                                <p className="text-xs text-gray-500">{emp.user.email}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-white">
                                    {emp.completionRate}%
                                </p>
                                <p className="text-xs text-gray-500">
                                    {emp.completedTasks}/{emp.totalTasks} tasks
                                </p>
                            </div>
                            {/* Progress bar */}
                            <div className="w-20 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                    style={{ width: `${emp.completionRate}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    {data.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                            No employee data yet
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

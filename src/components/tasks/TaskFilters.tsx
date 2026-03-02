'use client';

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TaskFilters } from '@/types';

interface TaskFiltersBarProps {
    filters: TaskFilters;
    onFilterChange: (filters: Partial<TaskFilters>) => void;
}

export function TaskFiltersBar({ filters, onFilterChange }: TaskFiltersBarProps) {
    const hasFilters = filters.status || filters.priority || filters.search;

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                    placeholder="Search tasks..."
                    value={filters.search || ''}
                    onChange={(e) => onFilterChange({ search: e.target.value })}
                    className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 h-9"
                />
            </div>

            {/* Status filter */}
            <Select
                value={filters.status || 'all'}
                onValueChange={(v) => onFilterChange({ status: v === 'all' ? undefined : v as TaskFilters['status'] })}
            >
                <SelectTrigger className="w-[140px] bg-white/[0.04] border-white/[0.08] text-gray-300 h-9">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#141925] border-white/[0.08]">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>

            {/* Priority filter */}
            <Select
                value={filters.priority || 'all'}
                onValueChange={(v) => onFilterChange({ priority: v === 'all' ? undefined : v as TaskFilters['priority'] })}
            >
                <SelectTrigger className="w-[140px] bg-white/[0.04] border-white/[0.08] text-gray-300 h-9">
                    <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-[#141925] border-white/[0.08]">
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                </SelectContent>
            </Select>

            {/* Sort */}
            <Select
                value={filters.sortBy || 'created_at'}
                onValueChange={(v) => onFilterChange({ sortBy: v as TaskFilters['sortBy'] })}
            >
                <SelectTrigger className="w-[150px] bg-white/[0.04] border-white/[0.08] text-gray-300 h-9">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-[#141925] border-white/[0.08]">
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
            </Select>

            {/* Clear filters */}
            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        onFilterChange({ status: undefined, priority: undefined, search: '' })
                    }
                    className="text-gray-400 hover:text-white h-9"
                >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                </Button>
            )}
        </div>
    );
}

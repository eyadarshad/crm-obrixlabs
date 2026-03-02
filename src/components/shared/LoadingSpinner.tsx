'use client';

import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
    const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

    return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className={`${sizeMap[size]} animate-spin text-blue-500`} />
            {text && <p className="text-sm text-gray-400">{text}</p>}
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            <Skeleton className="h-10 w-full bg-white/[0.04]" />
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full bg-white/[0.04]" />
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <Skeleton className="h-4 w-1/3 bg-white/[0.06]" />
            <Skeleton className="h-8 w-1/2 bg-white/[0.06]" />
            <Skeleton className="h-3 w-2/3 bg-white/[0.04]" />
        </div>
    );
}

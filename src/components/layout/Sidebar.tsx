'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    ListTodo,
    Users,
    MessageSquare,
    ScrollText,
    Settings,
    Shield,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    Calendar,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
    unreadMessages: number;
}

const navItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        label: 'Tasks',
        href: '/tasks',
        icon: ListTodo,
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        label: 'Announcements',
        href: '/announcements',
        icon: Megaphone,
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        label: 'Meetings',
        href: '/meetings',
        icon: Calendar,
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        label: 'Employees',
        href: '/employees',
        icon: Users,
        roles: ['super_admin', 'admin'],
    },
    {
        label: 'Messages',
        href: '/messages',
        icon: MessageSquare,
        roles: ['super_admin', 'admin', 'employee'],
    },
    {
        label: 'Activity Logs',
        href: '/activity-logs',
        icon: ScrollText,
        roles: ['super_admin', 'admin'],
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: ['super_admin', 'admin', 'employee'],
    },
];

export function Sidebar({ unreadMessages }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const filteredItems = navItems.filter((item) =>
        item.roles.includes(user?.role || '')
    );

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 h-full bg-[#0a0f1a] border-r border-white/[0.06] flex flex-col z-40 transition-all duration-300',
                collapsed ? 'w-[68px]' : 'w-[240px]'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-white/[0.06] gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h2 className="text-sm font-bold text-white leading-none">ObrixLabs</h2>
                        <p className="text-[10px] text-gray-500 mt-0.5">Management System</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + '/');
                    const showBadge = item.href === '/messages' && unreadMessages > 0;

                    const linkContent = (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                                isActive
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full" />
                            )}
                            <Icon
                                className={cn(
                                    'w-5 h-5 flex-shrink-0',
                                    isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'
                                )}
                            />
                            {!collapsed && (
                                <>
                                    <span>{item.label}</span>
                                    {showBadge && (
                                        <Badge
                                            className="ml-auto bg-blue-500 text-white text-[10px] px-1.5 py-0 h-5 min-w-5 flex items-center justify-center"
                                        >
                                            {unreadMessages > 99 ? '99+' : unreadMessages}
                                        </Badge>
                                    )}
                                </>
                            )}
                            {collapsed && showBadge && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-[8px] text-white font-bold">
                                        {unreadMessages > 9 ? '9+' : unreadMessages}
                                    </span>
                                </div>
                            )}
                        </Link>
                    );

                    if (collapsed) {
                        return (
                            <Tooltip key={item.href} delayDuration={0}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side="right" className="bg-[#1a1f2e] text-white border-white/10">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    }

                    return linkContent;
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="p-3 border-t border-white/[0.06]">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-colors text-sm"
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <>
                            <ChevronLeft className="w-4 h-4" />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}

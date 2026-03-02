'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LogOut, Settings, User, Menu } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

interface NavbarProps {
    onMobileMenuToggle?: () => void;
}

const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/tasks': 'Tasks',
    '/tasks/new': 'Create Task',
    '/announcements': 'Announcements',
    '/meetings': 'Meetings',
    '/employees': 'Employees',
    '/employees/new': 'Add Employee',
    '/messages': 'Messages',
    '/activity-logs': 'Activity Logs',
    '/settings': 'Settings',
};

export function Navbar({ onMobileMenuToggle }: NavbarProps) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const pageTitle = pageTitles[pathname] || 'Dashboard';

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'super_admin':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'admin':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default:
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        }
    };

    const formatRole = (role: string) => {
        return role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <header className="h-16 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMobileMenuToggle}
                    className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <ThemeToggle />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-3 h-auto py-1.5 px-2 hover:bg-black/5 dark:hover:bg-white/[0.04]"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">
                                    {user?.name || 'User'}
                                </p>
                                <Badge
                                    variant="outline"
                                    className={`text-[10px] mt-1 ${getRoleBadgeColor(user?.role || '')}`}
                                >
                                    {formatRole(user?.role || 'employee')}
                                </Badge>
                            </div>
                            <Avatar className="h-9 w-9 border-2 border-gray-200 dark:border-white/10">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white text-xs font-bold">
                                    {getInitials(user?.name || 'U')}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-48 bg-[#141925] border-white/[0.08] text-gray-300"
                    >
                        <DropdownMenuItem
                            onClick={() => router.push('/settings')}
                            className="hover:bg-white/[0.04] cursor-pointer"
                        >
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => router.push('/settings')}
                            className="hover:bg-white/[0.04] cursor-pointer"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/[0.06]" />
                        <DropdownMenuItem
                            onClick={handleSignOut}
                            className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

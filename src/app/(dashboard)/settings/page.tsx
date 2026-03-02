'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Save, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [saving, setSaving] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await authService.updateProfile(user.id, { name: name.trim() });
            await refreshUser();
            toast.success('Profile updated');
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setChangingPassword(true);
        try {
            await authService.updatePassword(newPassword);
            toast.success('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error('Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    const getInitials = (nm: string) =>
        nm.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const formatRole = (role: string) =>
        role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="text-xl font-semibold text-white">Settings</h2>
                <p className="text-sm text-gray-400 mt-1">
                    Manage your account settings
                </p>
            </div>

            {/* Profile */}
            <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                <CardHeader>
                    <CardTitle className="text-sm text-gray-300">Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white text-xl font-bold">
                                {getInitials(user?.name || 'U')}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-white font-medium">{user?.name}</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                            <Badge
                                variant="outline"
                                className="mt-1 text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20"
                            >
                                {formatRole(user?.role || 'employee')}
                            </Badge>
                        </div>
                    </div>

                    <Separator className="bg-white/[0.06]" />

                    <div className="space-y-2">
                        <Label className="text-gray-300">Display Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-white/[0.04] border-white/[0.08] text-white"
                        />
                    </div>

                    <Button
                        onClick={handleSaveProfile}
                        disabled={saving || name === user?.name}
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="bg-[#0a0f1a]/80 border-white/[0.06]">
                <CardHeader>
                    <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Change Password
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">New Password</Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="bg-white/[0.04] border-white/[0.08] text-white"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Confirm New Password</Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-white/[0.04] border-white/[0.08] text-white"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={changingPassword || !newPassword}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            {changingPassword ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Lock className="mr-2 h-4 w-4" />
                            )}
                            Change Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

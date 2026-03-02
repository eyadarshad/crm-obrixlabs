'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    announcementsService,
    type Announcement,
} from '@/services/announcements.service';
import { activityLogsService } from '@/services/activity-logs.service';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
    Plus,
    Megaphone,
    Pin,
    Trash2,
    Edit,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

const priorityConfig: Record<string, { color: string; label: string }> = {
    low: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'Low' },
    normal: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Normal' },
    high: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'High' },
    urgent: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Urgent' },
};

export default function AnnouncementsPage() {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState<Announcement | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal',
        is_pinned: false,
    });
    const [saving, setSaving] = useState(false);

    const isAdmin = user?.role !== 'employee';

    const fetchAnnouncements = useCallback(async () => {
        try {
            setLoading(true);
            const result = await announcementsService.getAnnouncements(page);
            setAnnouncements(result.data);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const openCreateForm = () => {
        setEditTarget(null);
        setFormData({ title: '', content: '', priority: 'normal', is_pinned: false });
        setShowForm(true);
    };

    const openEditForm = (ann: Announcement) => {
        setEditTarget(ann);
        setFormData({
            title: ann.title,
            content: ann.content,
            priority: ann.priority,
            is_pinned: ann.is_pinned,
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        try {
            if (editTarget) {
                await announcementsService.updateAnnouncement(editTarget.id, formData);
                toast.success('Announcement updated');
            } else {
                await announcementsService.createAnnouncement({
                    ...formData,
                    created_by: user.id,
                });
                await activityLogsService.logActivity({
                    user_id: user.id,
                    action: 'announcement_created',
                    metadata: { title: formData.title },
                });
                toast.success('Announcement published');
            }
            setShowForm(false);
            fetchAnnouncements();
        } catch {
            toast.error('Failed to save announcement');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget || !user) return;
        setDeleting(true);
        try {
            await announcementsService.deleteAnnouncement(deleteTarget.id);
            toast.success('Announcement deleted');
            setDeleteTarget(null);
            fetchAnnouncements();
        } catch {
            toast.error('Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    const handleTogglePin = async (ann: Announcement) => {
        try {
            await announcementsService.togglePin(ann.id, ann.is_pinned);
            toast.success(ann.is_pinned ? 'Unpinned' : 'Pinned');
            fetchAnnouncements();
        } catch {
            toast.error('Failed to update');
        }
    };

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Announcements</h2>
                    <p className="text-sm text-gray-400 mt-1">Company-wide updates and notices</p>
                </div>
                {isAdmin && (
                    <Button onClick={openCreateForm} className="bg-blue-600 hover:bg-blue-500 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        New Announcement
                    </Button>
                )}
            </div>

            {loading ? (
                <LoadingSpinner text="Loading announcements..." />
            ) : announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                        <Megaphone className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">No announcements yet</h3>
                    <p className="text-sm text-gray-500">
                        {isAdmin ? 'Create your first announcement to notify the team.' : 'Nothing posted yet. Check back later!'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((ann) => (
                        <Card
                            key={ann.id}
                            className={`bg-[#0a0f1a]/80 border-white/[0.06] hover:border-white/[0.1] transition-all ${ann.is_pinned ? 'ring-1 ring-amber-500/20' : ''
                                }`}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <Avatar className="h-9 w-9 mt-0.5 flex-shrink-0">
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white text-xs font-bold">
                                                {getInitials(ann.creator?.name || 'U')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                {ann.is_pinned && (
                                                    <Pin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                                )}
                                                <h3 className="text-sm font-semibold text-white">{ann.title}</h3>
                                                <Badge variant="outline" className={`text-[10px] ${priorityConfig[ann.priority].color}`}>
                                                    {priorityConfig[ann.priority].label}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-300 whitespace-pre-wrap mb-2">{ann.content}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span>{ann.creator?.name || 'Unknown'}</span>
                                                <span>·</span>
                                                <span>{format(new Date(ann.created_at), 'MMM dd, yyyy HH:mm')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleTogglePin(ann)}
                                                className={`p-1.5 h-auto ${ann.is_pinned ? 'text-amber-400' : 'text-gray-500'} hover:text-amber-400`}
                                            >
                                                <Pin className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditForm(ann)}
                                                className="text-gray-500 hover:text-white p-1.5 h-auto"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteTarget(ann)}
                                                className="text-gray-500 hover:text-red-400 p-1.5 h-auto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="text-gray-400">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
                    <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="text-gray-400">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="bg-[#0f1420] border-white/[0.08] text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-white/[0.04] border-white/[0.08] text-white"
                                placeholder="Announcement title"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">Content</Label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="bg-white/[0.04] border-white/[0.08] text-white min-h-[120px]"
                                placeholder="Write your announcement..."
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-300">Priority</Label>
                                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                                    <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-gray-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#141925] border-white/[0.08]">
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Pin to Top</Label>
                                <div className="flex items-center gap-2 h-9 mt-1">
                                    <Checkbox
                                        checked={formData.is_pinned}
                                        onCheckedChange={(v) => setFormData({ ...formData, is_pinned: !!v })}
                                    />
                                    <span className="text-sm text-gray-400">Pin this announcement</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white">
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {editTarget ? 'Update' : 'Publish'}
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="text-gray-400">
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Announcement"
                description="This announcement will be permanently removed."
                confirmText="Delete"
                variant="danger"
                loading={deleting}
            />
        </div>
    );
}

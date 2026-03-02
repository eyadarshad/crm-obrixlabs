'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { meetingsService, type Meeting } from '@/services/meetings.service';
import { employeesService } from '@/services/employees.service';
import { activityLogsService } from '@/services/activity-logs.service';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { format, isPast, isToday, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import type { User } from '@/types';
import {
    Plus,
    CalendarDays,
    Clock,
    MapPin,
    Link2,
    Video,
    Users,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    List,
    Copy,
    ExternalLink
} from 'lucide-react';

const statusConfig: Record<string, { color: string; icon: typeof CalendarDays }> = {
    scheduled: { color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: CalendarDays },
    in_progress: { color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Clock },
    completed: { color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    cancelled: { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: XCircle },
};

export default function MeetingsPage() {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [allMeetings, setAllMeetings] = useState<Meeting[]>([]); // For calendar view
    const [employees, setEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduled_at: '',
        duration_minutes: 30,
        meeting_link: '',
        location: '',
    });

    const isAdmin = user?.role !== 'employee';

    // Fetch paginated for list view
    const fetchMeetings = useCallback(async () => {
        try {
            setLoading(true);
            const result = await meetingsService.getMeetings({ status: statusFilter, page });
            setMeetings(result.data);
            setTotalPages(result.totalPages);

            // Also fetch all meetings for the calendar (max 100 for performance)
            const allResult = await meetingsService.getMeetings({ pageSize: 100 });
            setAllMeetings(allResult.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    useEffect(() => {
        async function fetchEmployees() {
            try {
                const data = await employeesService.getAllUsers();
                setEmployees(data.filter(u => u.id !== user?.id));
            } catch (err) {
                console.error(err);
            }
        }
        if (user && isAdmin) fetchEmployees();
    }, [user, isAdmin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        try {
            await meetingsService.createMeeting({
                ...formData,
                organized_by: user.id,
                participant_ids: selectedParticipants,
            });
            await activityLogsService.logActivity({
                user_id: user.id,
                action: 'meeting_created',
                metadata: { title: formData.title },
            });
            toast.success('Meeting scheduled');
            setShowForm(false);
            setFormData({ title: '', description: '', scheduled_at: '', duration_minutes: 30, meeting_link: '', location: '' });
            setSelectedParticipants([]);
            fetchMeetings();
        } catch {
            toast.error('Failed to schedule meeting');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await meetingsService.deleteMeeting(deleteTarget.id);
            toast.success('Meeting deleted');
            setDeleteTarget(null);
            fetchMeetings();
        } catch {
            toast.error('Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    const handleStatusChange = async (meeting: Meeting, status: Meeting['status']) => {
        try {
            await meetingsService.updateMeetingStatus(meeting.id, status);
            toast.success(`Meeting ${status === 'cancelled' ? 'cancelled' : 'updated'}`);
            fetchMeetings();
        } catch {
            toast.error('Failed to update');
        }
    };

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const toggleParticipant = (id: string) => {
        setSelectedParticipants(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Link copied to clipboard');
    };

    const getGoogleCalendarUrl = (meeting: Meeting) => {
        const start = new Date(meeting.scheduled_at);
        const end = new Date(start.getTime() + meeting.duration_minutes * 60000);
        const formatString = "yyyyMMdd'T'HHmmss'Z'";

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: meeting.title,
            details: meeting.description || '',
            location: meeting.meeting_link || meeting.location || '',
            dates: `${format(start, formatString)}/${format(end, formatString)}`
        });

        return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
    };

    const CalendarMeetingList = () => {
        const selectedDateMeetings = allMeetings.filter(m =>
            selectedDate && isSameDay(new Date(m.scheduled_at), selectedDate)
        );

        if (selectedDateMeetings.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center border-t dark:border-white/[0.06] border-gray-100 mt-6 pt-6">
                    <CalendarDays className="w-8 h-8 text-gray-400 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No meetings scheduled for this date.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4 mt-6 border-t dark:border-white/[0.06] border-gray-100 pt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                    Meetings on {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : ''}
                </h3>
                {selectedDateMeetings.map(meeting => renderMeetingCard(meeting))}
            </div>
        );
    };

    const renderMeetingCard = (meeting: Meeting) => {
        const meetingDate = new Date(meeting.scheduled_at);
        const isOverdue = isPast(meetingDate) && meeting.status === 'scheduled';
        const isTodayMeeting = isToday(meetingDate);
        const statusInfo = statusConfig[meeting.status];

        return (
            <Card
                key={meeting.id}
                className={`bg-white dark:bg-[#0a0f1a]/80 shadow-sm border-gray-200 dark:border-white/[0.06] hover:border-blue-500/50 dark:hover:border-white/[0.1] transition-all ${isTodayMeeting && meeting.status === 'scheduled' ? 'ring-1 ring-blue-500/20' : ''
                    }`}
            >
                <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{meeting.title}</h3>
                                <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                                    {meeting.status.replace('_', ' ')}
                                </Badge>
                                {isTodayMeeting && meeting.status === 'scheduled' && (
                                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-300 text-[10px] border-0">
                                        Today
                                    </Badge>
                                )}
                                {isOverdue && (
                                    <Badge className="bg-red-500/10 text-red-600 dark:text-red-300 text-[10px] border-0">
                                        Overdue
                                    </Badge>
                                )}
                            </div>

                            {meeting.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{meeting.description}</p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-gray-400" />
                                    {format(meetingDate, 'EEEE, MMM dd, yyyy')}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    {format(meetingDate, 'h:mm a')} ({meeting.duration_minutes} min)
                                </span>
                                {meeting.location && (
                                    <span className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        {meeting.location}
                                    </span>
                                )}
                                <span className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    Org: {meeting.organizer?.name || 'Unknown'}
                                </span>
                            </div>

                            {/* Action Links row */}
                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.04]">
                                {meeting.meeting_link && (
                                    <>
                                        <a
                                            href={meeting.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-md"
                                        >
                                            <Video className="w-3.5 h-3.5" />
                                            Join Meeting
                                        </a>
                                        <button
                                            onClick={() => copyToClipboard(meeting.meeting_link!)}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.04]"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            Copy Link
                                        </button>
                                    </>
                                )}
                                <a
                                    href={getGoogleCalendarUrl(meeting)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.04]"
                                >
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    Add to Calendar
                                </a>
                            </div>
                        </div>

                        {/* Admin Overrides */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {isAdmin && meeting.status === 'scheduled' && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStatusChange(meeting, 'in_progress')}
                                        className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-xs px-2 h-8"
                                    >
                                        Start
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStatusChange(meeting, 'cancelled')}
                                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs px-2 h-8"
                                    >
                                        Cancel
                                    </Button>
                                </>
                            )}
                            {isAdmin && meeting.status === 'in_progress' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStatusChange(meeting, 'completed')}
                                    className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-xs px-2 h-8"
                                >
                                    Complete
                                </Button>
                            )}
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteTarget(meeting)}
                                    className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-transparent p-2 h-auto"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Meetings</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Schedule and manage team meetings</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-100 dark:bg-white/[0.04] p-1 rounded-lg border border-gray-200 dark:border-white/[0.08]">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center justify-center p-1.5 px-3 rounded-md text-sm font-medium transition-all ${viewMode === 'list'
                                ? 'bg-white dark:bg-[#141925] text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                }`}
                        >
                            <List className="w-4 h-4 mr-2" />
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center justify-center p-1.5 px-3 rounded-md text-sm font-medium transition-all ${viewMode === 'calendar'
                                ? 'bg-white dark:bg-[#141925] text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                }`}
                        >
                            <CalendarDays className="w-4 h-4 mr-2" />
                            Calendar
                        </button>
                    </div>

                    {isAdmin && (
                        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20">
                            <Plus className="w-4 h-4 mr-2" />
                            Schedule Meeting
                        </Button>
                    )}
                </div>
            </div>

            {viewMode === 'list' ? (
                <>
                    {/* Status Filter */}
                    <div className="flex items-center gap-3 bg-white dark:bg-[#0a0f1a]/80 p-3 rounded-xl border border-gray-200 dark:border-white/[0.06] shadow-sm">
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[180px] bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-gray-300 h-9">
                                <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#141925] border-gray-200 dark:border-white/[0.08]">
                                <SelectItem value="all">All Meetings</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-sm font-medium text-gray-500 ml-auto mr-2">Showing {meetings.length} meetings</span>
                    </div>

                    {/* Meetings List */}
                    {loading ? (
                        <LoadingSpinner text="Loading meetings..." />
                    ) : meetings.length === 0 ? (
                        <Card className="bg-white dark:bg-[#0a0f1a]/80 border-dashed border-gray-200 dark:border-white/[0.1] shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-white/[0.04] flex items-center justify-center mb-4 ring-8 ring-blue-50/50 dark:ring-white/[0.02]">
                                    <Video className="w-8 h-8 text-blue-500 dark:text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No meetings found</h3>
                                <p className="text-sm text-gray-500 max-w-sm">
                                    {isAdmin ? 'Schedule a meeting with your team members to get started.' : 'No meetings scheduled for you at this time.'}
                                </p>
                                {isAdmin && (
                                    <Button onClick={() => setShowForm(true)} className="mt-6 bg-blue-600 hover:bg-blue-500 text-white">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Schedule Initial Meeting
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {meetings.map((meeting) => renderMeetingCard(meeting))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="dark:border-white/[0.08] dark:bg-transparent">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                            </Button>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mx-4">Page {page} of {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="dark:border-white/[0.08] dark:bg-transparent">
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                /* Calendar View */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 bg-white dark:bg-[#0a0f1a]/80 shadow-sm border-gray-200 dark:border-white/[0.06] h-fit">
                        <CardContent className="p-4 flex justify-center">
                            <CalendarUI
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md [&_.rdp-day_button:hover]:bg-blue-100 dark:[&_.rdp-day_button:hover]:bg-white/10 [&_.rdp-day_button.rdp-day_selected]:bg-blue-600 [&_.rdp-day_button.rdp-day_selected]:text-white"
                                modifiers={{
                                    hasMeeting: allMeetings.map(m => new Date(m.scheduled_at))
                                }}
                                modifiersClassNames={{
                                    hasMeeting: "font-bold text-blue-600 dark:text-blue-400 underline decoration-blue-500/50 underline-offset-4"
                                }}
                            />
                        </CardContent>
                    </Card>
                    <div className="lg:col-span-2">
                        <CalendarMeetingList />
                    </div>
                </div>
            )}

            {/* Schedule Meeting Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="bg-white dark:bg-[#0f1420] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Schedule Meeting</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                        <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300">Meeting Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white"
                                placeholder="e.g. Weekly Sync, Sprint Review"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">Date & Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.scheduled_at}
                                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                    className="bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">Duration (minutes)</Label>
                                <Input
                                    type="number"
                                    value={formData.duration_minutes}
                                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                                    className="bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white"
                                    min={5}
                                    max={480}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">Meeting Link (Video Call)</Label>
                                <Input
                                    value={formData.meeting_link}
                                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                                    className="bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white"
                                    placeholder="https://meet.google.com/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">Location (In-person)</Label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white"
                                    placeholder="e.g. Conference Room A"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300">Description / Agenda</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white min-h-[80px]"
                                placeholder="What will be discussed?"
                            />
                        </div>

                        {/* Participants */}
                        {employees.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">Select Participants</Label>
                                <div className="max-h-[160px] overflow-y-auto space-y-1.5 p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
                                    {employees.map(emp => (
                                        <label
                                            key={emp.id}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] cursor-pointer"
                                        >
                                            <Checkbox
                                                checked={selectedParticipants.includes(emp.id)}
                                                onCheckedChange={() => toggleParticipant(emp.id)}
                                            />
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-gradient-to-br dark:from-blue-500 dark:to-cyan-400 dark:text-white text-xs font-bold">
                                                    {getInitials(emp.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.name}</p>
                                                <p className="text-xs text-gray-500">{emp.role.replace('_', ' ')}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.08]">
                            <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white">
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Schedule Meeting
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 dark:border-white/[0.1] dark:hover:bg-white/[0.05]">
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Meeting"
                description="This meeting will be permanently removed."
                confirmText="Delete"
                variant="danger"
                loading={deleting}
            />
        </div>
    );
}

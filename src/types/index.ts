// ============================================================
// ObrixLabs IMS — TypeScript Type Definitions
// ============================================================

export type UserRole = 'super_admin' | 'admin' | 'employee';
export type TaskStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
export type TaskPriority = 'low' | 'medium' | 'high';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    assigned_to: string;
    assigned_by: string;
    status: TaskStatus;
    priority: TaskPriority;
    deadline: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    assignee?: User;
    assigner?: User;
    submissions?: Submission[];
}

export interface Submission {
    id: string;
    task_id: string;
    employee_id: string;
    file_url: string | null;
    description: string | null;
    status: SubmissionStatus;
    feedback: string | null;
    submitted_at: string;
    // Joined fields
    task?: Task;
    employee?: User;
}

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    message: string | null;
    file_url: string | null;
    is_read: boolean;
    created_at: string;
    // Joined fields
    sender?: User;
    receiver?: User;
}

export interface ActivityLog {
    id: string;
    user_id: string | null;
    action: string;
    metadata: Record<string, unknown>;
    created_at: string;
    // Joined fields
    user?: User;
}

export interface Conversation {
    user: User;
    lastMessage: Message | null;
    unreadCount: number;
}

// ============================================================
// Filter & Pagination Types
// ============================================================

export interface TaskFilters {
    status?: TaskStatus;
    priority?: TaskPriority;
    search?: string;
    assignedTo?: string;
    sortBy?: 'deadline' | 'created_at' | 'priority';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ============================================================
// Dashboard Stats
// ============================================================

export interface DashboardStats {
    totalEmployees: number;
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    rejectedTasks: number;
    completionRate: number;
    averageCompletionTime: number;
}

export interface EmployeePerformance {
    user: User;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
    averageCompletionTime: number;
}

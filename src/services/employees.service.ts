'use client';

import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';

const supabase = createClient();

export const employeesService = {
    async getEmployees(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'employee')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as User[];
    },

    async getAdmins(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .in('role', ['admin', 'super_admin'])
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as User[];
    },

    async getAllUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as User[];
    },

    async getUserById(id: string): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as User;
    },

    async deleteUser(id: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};

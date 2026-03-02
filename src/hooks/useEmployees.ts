'use client';

import { useState, useEffect, useCallback } from 'react';
import { employeesService } from '@/services/employees.service';
import type { User } from '@/types';

export function useEmployees() {
    const [employees, setEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await employeesService.getEmployees();
            setEmployees(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    return { employees, loading, error, refetch: fetchEmployees };
}

import { create } from 'zustand';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

// Define types matching backend schemas
export interface CalendarEvent {
    date: string;       // ISO date string YYYY-MM-DD
    time: string;       // HH:MM (24h)
    duration: number;   // in minutes
    notes?: string;
    scheduledAt: string; // ISO timestamp
}

export interface Task {
    id?: number;
    title: string;
    description?: string;
    status: 'To Do' | 'In Progress' | 'Done';
    owner?: string;
    deadline?: string;
    risk_level?: string;
    source?: string;
    calendar_event?: CalendarEvent; // named with snake_case for DB harmony
}

interface AppState {
    tasks: Task[];
    unconfirmedTasks: Task[];
    setTasks: (tasks: Task[]) => void;
    addTask: (task: Task) => void;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (id: number) => Promise<void>;

    // ── Persistence ──
    fetchTasks: () => Promise<void>;

    // ── Confirmation Workflow ──
    addUnconfirmedTask: (task: Task) => void;
    removeUnconfirmedTask: (id: number) => void;
    confirmTask: (task: Task) => void;

    // ── Scheduling Modal State ──
    pendingScheduleTask: Task | null;
    setPendingScheduleTask: (task: Task | null) => void;
    scheduleTask: (task: Task, event: CalendarEvent) => Promise<void>;
    skipSchedule: (task: Task) => Promise<void>;

    // ── AI Summary ──
    latestSummary: any | null;
    setLatestSummary: (summary: any) => void;
    clearSummary: () => void;

    isLoading: boolean;
    setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
    tasks: [],
    unconfirmedTasks: [],
    isLoading: false,

    // Load from DB on app start
    fetchTasks: async () => {
        set({ isLoading: true });
        try {
            const res = await axios.get(`${API_BASE}/tasks/`);
            // Convert any snake_case 'calendar_event' from DB to JS camelCase if needed
            // But here we keep 'calendar_event' for consistency with DB
            set({ tasks: res.data });
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
        } finally {
            set({ isLoading: false });
        }
    },

    setTasks: (tasks) => set({ tasks }),

    addTask: (task) => set((state) => ({
        tasks: [...state.tasks, task]
    })),

    updateTask: async (updatedTask) => {
        try {
            const res = await axios.put(`${API_BASE}/tasks/${updatedTask.id}`, updatedTask);
            set((state) => ({
                tasks: state.tasks.map((t) => (t.id === updatedTask.id ? res.data : t))
            }));
        } catch (err) {
            console.error('Update failed:', err);
        }
    },

    deleteTask: async (id) => {
        try {
            await axios.delete(`${API_BASE}/tasks/${id}`);
            set((state) => ({
                tasks: state.tasks.filter(t => t.id !== id)
            }));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    },

    // ── Pending Review Logic ──
    addUnconfirmedTask: (task) => set((state) => ({
        unconfirmedTasks: [...state.unconfirmedTasks, task]
    })),

    removeUnconfirmedTask: (id) => set((state) => ({
        unconfirmedTasks: state.unconfirmedTasks.filter(t => t.id !== id)
    })),

    confirmTask: (task) => set((state) => ({
        // Filter it OUT of unconfirmed immediately
        unconfirmedTasks: state.unconfirmedTasks.filter(t => t.id !== task.id),
        // Move to the scheduling queue
        pendingScheduleTask: task,
    })),

    // ── Scheduling Logic ──
    pendingScheduleTask: null,
    setPendingScheduleTask: (task) => set({ pendingScheduleTask: task }),

    // FINAL: Post to backend as a real task
    scheduleTask: async (task, event) => {
        try {
            const payload = { ...task, calendar_event: event };
            delete payload.id; // Backend generates the DB ID

            const res = await axios.post(`${API_BASE}/tasks/`, payload);
            set((state) => ({
                pendingScheduleTask: null,
                tasks: [...state.tasks, res.data],
            }));
        } catch (err) {
            console.error('Scheduling failed:', err);
        }
    },

    skipSchedule: async (task) => {
        try {
            const payload = { ...task };
            delete payload.id;

            const res = await axios.post(`${API_BASE}/tasks/`, payload);
            set((state) => ({
                pendingScheduleTask: null,
                tasks: [...state.tasks, res.data],
            }));
        } catch (err) {
            console.error('Skip schedule failed:', err);
        }
    },

    // ── Summary ──
    latestSummary: null,
    setLatestSummary: (summary) => set({ latestSummary: summary }),
    clearSummary: () => set({ latestSummary: null }),

    setLoading: (isLoading) => set({ isLoading }),
}));

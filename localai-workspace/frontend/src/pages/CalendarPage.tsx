import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Task } from '../store';
import {
    CalendarCheck2,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    StickyNote,
    Timer,
    Info,
    Calendar as CalendarIcon,
} from 'lucide-react';

// ── helpers ─────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
    return new Date(year, month, 1).getDay(); // 0=Sun
}

function formatTime(time: string) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_COLORS = [
    'bg-indigo-500',
    'bg-violet-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
];

// ── component ────────────────────────────────────────────────────────────────

export function CalendarPage() {
    const { tasks } = useStore();
    const today = new Date();

    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const scheduledTasks = useMemo(
        () => tasks.filter((t) => t.calendar_event),
        [tasks]
    );

    // Map date string → tasks
    const tasksByDate = useMemo(() => {
        const map: Record<string, Task[]> = {};
        scheduledTasks.forEach((task) => {
            const d = task.calendar_event!.date;
            if (!map[d]) map[d] = [];
            map[d].push(task);
        });
        return map;
    }, [scheduledTasks]);

    const daysInMonth = getDaysInMonth(year, month);
    const firstDow = getFirstDayOfWeek(year, month);
    const todayStr = today.toISOString().slice(0, 10);

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const goToday = () => {
        setYear(today.getFullYear());
        setMonth(today.getMonth());
    };

    // Build all calendar cells (leading blanks + days)
    const cells: (number | null)[] = [
        ...Array(firstDow).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    // Pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="h-full flex flex-col gap-6 relative">
            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <CalendarCheck2 className="text-indigo-500" size={32} />
                        Calendar
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {scheduledTasks.length === 0
                            ? 'No tasks scheduled anywhere yet.'
                            : `${scheduledTasks.length} total scheduled task${scheduledTasks.length > 1 ? 's' : ''}.`}
                    </p>
                </div>

                {/* Month navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToday}
                        className="px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={prevMonth}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-lg font-bold text-slate-800 dark:text-white w-44 text-center">
                        {MONTH_NAMES[month]} {year}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* ── Calendar Grid ── */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col relative">

                {/* ── Month-Specific Empty State Watermark ── */}
                {scheduledTasks.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 z-0">
                        <div className="text-center">
                            <CalendarIcon size={120} className="text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-300 dark:text-slate-700">No scheduled tasks yet</h3>
                            <p className="text-slate-400 dark:text-slate-600 text-sm max-w-xs mx-auto">
                                Confirm tasks from your inputs to see them here.
                            </p>
                        </div>
                    </div>
                )}

                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 z-10 bg-white dark:bg-slate-900">
                    {DAY_NAMES.map((d) => (
                        <div
                            key={d}
                            className="py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr z-10">
                    {cells.map((day, idx) => {
                        if (day === null) {
                            return (
                                <div
                                    key={`blank-${idx}`}
                                    className="border-r border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10"
                                />
                            );
                        }

                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayTasks = tasksByDate[dateStr] || [];
                        const isToday = dateStr === todayStr;
                        const isRightEdge = (idx + 1) % 7 === 0;
                        const isBottomEdge = idx >= cells.length - 7;

                        return (
                            <div
                                key={dateStr}
                                className={`min-h-[100px] p-2 flex flex-col gap-1 transition-colors group
                                    ${!isRightEdge ? 'border-r' : ''} 
                                    ${!isBottomEdge ? 'border-b' : ''} 
                                    border-slate-100 dark:border-slate-800
                                    ${dayTasks.length > 0 ? 'hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}
                                    cursor-default`}
                            >
                                {/* Day number */}
                                <div className="flex justify-end">
                                    <span
                                        className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                                            ${isToday
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                : 'text-slate-600 dark:text-slate-400 group-hover:text-indigo-500'}`}
                                    >
                                        {day}
                                    </span>
                                </div>

                                {/* Task pills */}
                                <div className="flex flex-col gap-1 mt-0.5 max-h-[120px] overflow-hidden">
                                    {dayTasks.slice(0, 3).map((task, ti) => (
                                        <motion.button
                                            key={task.id}
                                            layoutId={`task-pill-${task.id}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTask(task);
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            className={`w-full text-left px-2 py-1 rounded-lg text-white text-[10px] leading-tight font-medium truncate shadow-sm ${EVENT_COLORS[ti % EVENT_COLORS.length]}`}
                                        >
                                            {formatTime(task.calendar_event!.time)} {task.title}
                                        </motion.button>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <span className="text-[10px] text-slate-400 font-medium pl-1">
                                            +{dayTasks.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Task Detail Drawer (side panel) ── */}
            <AnimatePresence>
                {selectedTask && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTask(null)}
                            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, x: 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 60 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className="fixed right-0 top-0 bottom-0 z-50 w-96 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col overflow-y-auto"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 h-24">
                                <div>
                                    <p className="text-white/70 text-xs uppercase tracking-wider font-bold">Scheduled Details</p>
                                    <h3 className="text-white font-bold text-lg leading-tight mt-1 line-clamp-2 pr-2">
                                        {selectedTask.title}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all transform active:scale-95"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-8 space-y-8 flex-1">
                                <DetailSection icon={<CalendarCheck2 size={20} className="text-indigo-500" />} label="When">
                                    <p className="text-slate-800 dark:text-white font-bold text-lg">
                                        {new Date(`${selectedTask.calendar_event!.date}T${selectedTask.calendar_event!.time}`).toLocaleString('en-IN', {
                                            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                                        })}
                                    </p>
                                    <p className="text-indigo-600 dark:text-indigo-400 font-semibold mt-1 flex items-center gap-2">
                                        <Clock size={16} />
                                        {formatTime(selectedTask.calendar_event!.time)}
                                    </p>
                                </DetailSection>

                                <DetailSection icon={<Timer size={20} className="text-violet-500" />} label="Duration">
                                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                                        {selectedTask.calendar_event!.duration < 60
                                            ? `${selectedTask.calendar_event!.duration} minutes`
                                            : `${(selectedTask.calendar_event!.duration / 60).toFixed(1).replace('.0', '')} hours`}
                                    </p>
                                </DetailSection>

                                {selectedTask.owner && (
                                    <DetailSection icon={<User size={20} className="text-emerald-500" />} label="Owner">
                                        <p className="text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 inline-block">
                                            {selectedTask.owner}
                                        </p>
                                    </DetailSection>
                                )}

                                {selectedTask.calendar_event!.notes && (
                                    <DetailSection icon={<StickyNote size={20} className="text-rose-400" />} label="Notes">
                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-l-4 border-slate-100 dark:border-slate-800 pl-4 py-1 italic">
                                            "{selectedTask.calendar_event!.notes}"
                                        </p>
                                    </DetailSection>
                                )}
                            </div>

                            <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium uppercase tracking-widest flex items-center gap-2">
                                <Info size={12} />
                                Auto-saved on {new Date(selectedTask.calendar_event!.scheduledAt).toLocaleDateString()}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function DetailSection({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
            </div>
            <div className="pl-11">{children}</div>
        </div>
    );
}

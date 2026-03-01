import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    X,
    ChevronRight,
    CheckCircle2,
    CalendarCheck2,
    AlertTriangle,
    User,
    StickyNote,
    Timer,
} from 'lucide-react';
import { useStore, Task, CalendarEvent } from '../store';

// Returns today's date as YYYY-MM-DD
function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

// Returns current time rounded up to next :00 or :30
function nearestHalfHour() {
    const now = new Date();
    const m = now.getMinutes();
    const rounded = m < 30 ? 30 : 60;
    now.setMinutes(rounded, 0, 0);
    return now.toTimeString().slice(0, 5);
}

type Step = 'form' | 'confirm';

interface Props {
    task: Task;
}

export function ScheduleModal({ task }: Props) {
    const { scheduleTask, skipSchedule, setPendingScheduleTask, addUnconfirmedTask } = useStore();

    const [step, setStep] = useState<Step>('form');
    const [date, setDate] = useState(todayStr());
    const [time, setTime] = useState(nearestHalfHour());
    const [duration, setDuration] = useState(30);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formattedDateTime = () => {
        const d = new Date(`${date}T${time}`);
        return d.toLocaleString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const durationLabel = () => {
        if (duration < 60) return `${duration} minutes`;
        const h = Math.floor(duration / 60);
        const m = duration % 60;
        return m === 0 ? `${h} hour${h > 1 ? 's' : ''}` : `${h}h ${m}m`;
    };

    const handleProceedToConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('confirm');
    };

    const handleFinalConfirm = async () => {
        setIsSubmitting(true);
        const event: CalendarEvent = {
            date,
            time,
            duration,
            notes: notes.trim() || undefined,
            scheduledAt: new Date().toISOString(),
        };
        // Schedule and Close
        await scheduleTask(task, event);
        setIsSubmitting(false);
    };

    const handleSkip = async () => {
        await skipSchedule(task);
    };

    const handleClose = () => {
        // IMPORTANT: If they close the modal, move it back to unconfirmed so it doesn't disappear!
        addUnconfirmedTask(task);
        setPendingScheduleTask(null);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <CalendarCheck2 size={22} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                                {step === 'form' ? 'Schedule Task' : 'Confirm Scheduling'}
                            </p>
                            <h2 className="text-white font-bold text-base leading-tight">
                                {step === 'form' ? 'Set Calendar Event' : 'Review & Confirm'}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug line-clamp-2">
                        {task.title}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'form' && (
                        <motion.form
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleProceedToConfirm}
                            className="p-6 space-y-5"
                        >
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <Calendar size={14} /> Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    min={todayStr()}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        <Clock size={14} /> Start Time
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        <Timer size={14} /> Duration
                                    </label>
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                                    >
                                        <option value={15}>15 minutes</option>
                                        <option value={30}>30 minutes</option>
                                        <option value={45}>45 minutes</option>
                                        <option value={60}>1 hour</option>
                                        <option value={90}>1.5 hours</option>
                                        <option value={120}>2 hours</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <StickyNote size={14} /> Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any context or agenda..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none transition"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleSkip}
                                    className="flex-1 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                                >
                                    Skip for now
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                >
                                    Review Schedule <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {step === 'confirm' && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-6 space-y-5"
                        >
                            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
                                <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                                    Lock in your calendar slot for this task.
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl divide-y divide-slate-200 dark:divide-slate-700">
                                <SummaryRow icon={<CalendarCheck2 size={16} className="text-indigo-400" />} label="Date & Time" value={formattedDateTime()} />
                                <SummaryRow icon={<Timer size={16} className="text-violet-400" />} label="Duration" value={durationLabel()} />
                                {notes && <SummaryRow icon={<StickyNote size={16} className="text-rose-400" />} label="Notes" value={notes} />}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setStep('form')}
                                    className="flex-1 px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200"
                                >
                                    ← Edit
                                </button>
                                <button
                                    onClick={handleFinalConfirm}
                                    disabled={isSubmitting}
                                    className="flex-[2] px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                >
                                    {isSubmitting ? 'Scheduling...' : <><CheckCircle2 size={18} /> Confirm & Schedule</>}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

function SummaryRow({ icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-shrink-0">{icon}</div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 w-24">{label}</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{value}</span>
        </div>
    );
}

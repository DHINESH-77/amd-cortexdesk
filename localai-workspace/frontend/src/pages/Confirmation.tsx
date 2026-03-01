import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Task } from '../store';
import { CheckCircle2, XCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BrainCircuit } from 'lucide-react';
import { ScheduleModal } from '../components/ScheduleModal';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Confirmation() {
    const {
        unconfirmedTasks,
        confirmTask,
        removeUnconfirmedTask,
        latestSummary,
        clearSummary,
        pendingScheduleTask,
    } = useStore();

    return (
        <>
            {/* ── Schedule Modal ── triggered when a task is confirmed */}
            <AnimatePresence>
                {pendingScheduleTask && (
                    <ScheduleModal task={pendingScheduleTask} />
                )}
            </AnimatePresence>

            <div className="h-full flex flex-col space-y-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-3">
                        Pending Review
                        <span className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-3 py-1 rounded-full text-base font-medium">
                            {unconfirmedTasks.length} tasks
                        </span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Review and confirm automatically extracted tasks from your inputs, screenshots, and emails before they hit your Kanban board.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    <AnimatePresence>
                        {/* AI Summary card */}
                        {latestSummary && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 mb-6 relative group"
                            >
                                <button
                                    onClick={clearSummary}
                                    className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <XCircle size={20} />
                                </button>
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        <BrainCircuit className="text-indigo-500" size={24} />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-300">
                                                {latestSummary.title || 'AI Synthesis & Summary'}
                                            </h2>
                                            <p className="text-sm text-indigo-800 dark:text-indigo-200 mt-1 leading-relaxed">
                                                {latestSummary.overview}
                                            </p>
                                        </div>

                                        {latestSummary.key_points && latestSummary.key_points.length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Critical Data Points</h3>
                                                <ul className="space-y-2">
                                                    {latestSummary.key_points.map((point: string, idx: number) => (
                                                        <li key={idx} className="text-sm text-indigo-900/80 dark:text-indigo-200/80 flex items-start gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 mt-1.5 flex-shrink-0" />
                                                            {point}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="pt-4 mt-2 flex justify-end gap-3 border-t border-indigo-200/50 dark:border-indigo-500/20">
                                            <button
                                                onClick={clearSummary}
                                                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-lg transition-colors border border-transparent"
                                            >
                                                Dismiss Summary
                                            </button>
                                            <button
                                                onClick={clearSummary}
                                                className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                                            >
                                                <CheckCircle2 size={16} />
                                                Accept & Acknowledge
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Empty state */}
                        {unconfirmedTasks.length === 0 && !latestSummary && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-20"
                            >
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">All caught up!</h2>
                                <p className="text-slate-500 mt-2">There are no pending tasks to review.</p>
                            </motion.div>
                        )}

                        {/* Bulk confirm header */}
                        {unconfirmedTasks.length > 0 && (
                            <div className="pb-2 flex justify-between items-center">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Action Items Extracted ({unconfirmedTasks.length})
                                </h3>
                                {unconfirmedTasks.length > 1 && (
                                    <button
                                        onClick={() => {
                                            // Confirm first task — subsequent ones queue after user handles each modal
                                            const first = unconfirmedTasks[0];
                                            confirmTask(first);
                                        }}
                                        className="text-xs font-semibold px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 rounded-lg transition-colors"
                                    >
                                        Confirm Next Task
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Task cards */}
                        {unconfirmedTasks.map((task: Task) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={task.id}
                                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-[rgba(0,0,0,0.02)_0_4px_12px] border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative group"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400" />

                                <div className="flex-1 pl-4 space-y-3 relative z-10">
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                                            {task.title}
                                        </h3>
                                    </div>

                                    {task.description && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                            {task.description}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                                        {task.source && (
                                            <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-1 rounded-md">
                                                Source: {task.source}
                                            </span>
                                        )}
                                        <span className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded-md">
                                            Owner: {task.owner || 'Unassigned'}
                                        </span>
                                        {task.risk_level && task.risk_level.toLowerCase() === 'high' && (
                                            <span className="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 px-2 py-1 rounded-md">
                                                High Risk
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 md:pl-6 md:border-l border-slate-200 dark:border-slate-700/50">
                                    <button
                                        onClick={() => removeUnconfirmedTask(task.id!)}
                                        className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 rounded-xl transition-colors focus:ring-4 focus:ring-rose-500/20 flex-shrink-0"
                                        title="Discard Task"
                                    >
                                        <XCircle size={22} />
                                    </button>

                                    <button
                                        onClick={() => confirmTask(task)}
                                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors focus:ring-4 focus:ring-emerald-500/20 font-semibold shadow-sm flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={20} />
                                        Confirm
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}

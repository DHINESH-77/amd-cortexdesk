import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Task } from '../store';
import { Clock, CheckCircle2, Circle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const columns = [
    { id: 'To Do', title: 'To Do', icon: Circle, color: 'text-slate-400' },
    { id: 'In Progress', title: 'In Progress', icon: Clock, color: 'text-amber-500' },
    { id: 'Done', title: 'Done', icon: CheckCircle2, color: 'text-emerald-500' }
];

export function Kanban() {
    const { tasks, updateTask } = useStore();
    const [draggedTask, setDraggedTask] = useState<number | null>(null);

    const handleDragStart = (id: number) => {
        setDraggedTask(id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (status: Task['status']) => {
        if (draggedTask !== null) {
            const task = tasks.find(t => t.id === draggedTask);
            if (task && task.status !== status) {
                updateTask({ ...task, status });
            }
            setDraggedTask(null);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div>
                <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Task Board</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Manage your automatically extracted tasks.
                </p>
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-6 h-full pb-4">
                    {columns.map(col => {
                        const columnTasks = tasks.filter(t => t.status === col.id);
                        const Icon = col.icon;

                        return (
                            <div
                                key={col.id}
                                className="flex-shrink-0 w-80 flex flex-col bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800"
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(col.id as any)}
                            >
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <Icon size={18} className={col.color} />
                                        <h3 className="font-semibold text-slate-700 dark:text-slate-300">{col.title}</h3>
                                    </div>
                                    <span className="text-xs font-medium px-2.5 py-1 bg-white dark:bg-slate-700 rounded-full text-slate-500">
                                        {columnTasks.length}
                                    </span>
                                </div>

                                <div className="flex-1 space-y-3 overflow-y-auto min-h-[150px]">
                                    <AnimatePresence>
                                        {columnTasks.map(task => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                key={task.id}
                                                draggable
                                                onDragStart={() => handleDragStart(task.id!)}
                                                className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative overflow-hidden group"
                                            >
                                                <p className="font-medium text-slate-900 dark:text-white leading-snug mb-3">
                                                    {task.title}
                                                </p>
                                                <div className="flex justify-between items-center mt-auto">
                                                    <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded font-medium">
                                                        {task.owner || 'Unassigned'}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LayoutDashboard, CheckSquare, KanbanSquare, FileSearch, Radio, CalendarCheck2 } from 'lucide-react';
import { useStore } from '../../store';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Sidebar() {
    const location = useLocation();
    const { unconfirmedTasks, tasks } = useStore();

    const scheduledCount = tasks.filter(t => t.calendarEvent).length;

    const navItems = [
        { name: 'Dashboard & Input', path: '/', icon: LayoutDashboard },
        { name: 'Pending Review', path: '/confirmation', icon: CheckSquare, badge: unconfirmedTasks.length },
        { name: 'Task Board', path: '/board', icon: KanbanSquare },
        { name: 'Calendar', path: '/calendar', icon: CalendarCheck2, badge: scheduledCount > 0 ? scheduledCount : undefined },
        { name: 'Research Copilot', path: '/copilot', icon: FileSearch },
        { name: 'Live Meeting', path: '/meeting', icon: Radio },
    ];

    return (
        <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
            <div className="p-6">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                        <Radio size={18} className="text-white" />
                    </div>
                    LocalAI
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all relative overflow-hidden group",
                                isActive ? "text-white font-medium bg-indigo-500/10" : "hover:text-white hover:bg-slate-800/50"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <div className="flex items-center gap-3 relative z-10">
                                <Icon size={20} className={cn(isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-300")} />
                                <span>{item.name}</span>
                            </div>

                            {item.badge !== undefined && item.badge > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={cn(
                                        "relative z-10 text-white text-xs font-bold px-2 py-0.5 rounded-full",
                                        item.path === '/calendar' ? 'bg-indigo-500' : 'bg-rose-500'
                                    )}
                                >
                                    {item.badge}
                                </motion.span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 m-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Offline & Secure
                </div>
            </div>
        </div>
    );
}

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

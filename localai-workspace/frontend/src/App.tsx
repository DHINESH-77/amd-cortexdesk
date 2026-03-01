import { useState } from 'react'
import { animate, motion } from 'framer-motion'
import { LayoutDashboard } from 'lucide-react'

function App() {
    const [count, setCount] = useState(0)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 p-8 flex flex-col items-center justify-center font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <LayoutDashboard size={24} />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">LocalAI Workspace</h1>
                </div>

                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    Welcome to the privacy-first AI productivity application. Fully offline, orchestrating tasks automatically.
                </p>

                <button
                    onClick={() => setCount(c => c + 1)}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors focus:ring-4 focus:ring-indigo-500/20 active:scale-[0.98]"
                >
                    Count is {count}
                </button>
            </motion.div>
        </div>
    )
}

export default App

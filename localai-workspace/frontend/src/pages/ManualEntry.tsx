import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, Play } from 'lucide-react';
import axios from 'axios';
import { useStore, Task } from '../store';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function ManualEntry() {
    const [text, setText] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState<any>(null);

    const addTask = useStore(state => state.addTask);

    const handleExtract = async () => {
        if (!text.trim()) return;

        setIsExtracting(true);
        try {
            // Send to FastAPI backend
            const response = await axios.post('http://localhost:8000/tasks/extract', { text });
            setExtractedData(response.data);
        } catch (error) {
            console.error("Extraction failed:", error);
        } finally {
            setIsExtracting(false);
        }
    };

    const confirmTasks = () => {
        if (!extractedData?.tasks) return;

        // Add all extracted tasks to Zustand store
        extractedData.tasks.forEach((t: any) => {
            addTask({
                id: Math.floor(Math.random() * 10000), // mock ID
                title: t.title,
                description: t.description,
                status: t.status || 'To Do',
                owner: t.owner,
                deadline: new Date().toISOString() // mock deadline
            });
        });

        setText('');
        setExtractedData(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-3">
                    Manual Entry & Extraction
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Paste your meeting notes, emails, or brain dumps here. LocalAI will extract tasks, decisions, and risks automatically.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="e.g., 'Dhinesh will finish the frontend UI by Friday. We decided to use Vite instead of Create React App. Risk: the backend might not be ready on time.'"
                    className="w-full h-64 p-6 bg-transparent resize-none focus:outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                />

                <div className="bg-slate-50 border-t border-slate-200 dark:bg-slate-900 dark:border-slate-700 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Sparkles size={16} className="text-indigo-500" />
                        <span>Local processing. Data never leaves your device.</span>
                    </div>

                    <button
                        onClick={handleExtract}
                        disabled={isExtracting || !text.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                    >
                        {isExtracting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Extracting...
                            </>
                        ) : (
                            <>
                                <Play size={18} />
                                Extract Data
                            </>
                        )}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {extractedData && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6"
                    >
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            Extracted Intel
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-medium text-slate-700 dark:text-slate-300">Found Tasks ({extractedData.tasks?.length || 0})</h3>
                                {extractedData.tasks?.map((task: any, i: number) => (
                                    <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-900 shadow-sm relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                        <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                                        <div className="flex gap-4 mt-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Owner: {task.owner}</span>
                                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Status: {task.status}</span>
                                        </div>
                                    </div>
                                ))}

                                {extractedData.tasks?.length > 0 && (
                                    <button
                                        onClick={confirmTasks}
                                        className="w-full py-3 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
                                    >
                                        Confirm & Add to Board
                                        <ArrowRight size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Key Decisions</h3>
                                    {extractedData.decisions?.length > 0 ? (
                                        extractedData.decisions.map((d: str, i: number) => (
                                            <div key={i} className="mb-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 rounded-lg text-sm border border-emerald-100 dark:border-emerald-500/20">
                                                {d}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">No decisions detected.</p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Identified Risks</h3>
                                    {extractedData.risks?.length > 0 ? (
                                        extractedData.risks.map((r: str, i: number) => (
                                            <div key={i} className="mb-2 p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 rounded-lg text-sm border border-rose-100 dark:border-rose-500/20">
                                                {r}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">No risks detected.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

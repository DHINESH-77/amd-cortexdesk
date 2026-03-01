import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, CheckSquare, AlertTriangle, Lightbulb, Save } from 'lucide-react';
import { useStore } from '../store';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function LiveMeeting() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [tasks, setTasks] = useState<any[]>([]);
    const [decisions, setDecisions] = useState<string[]>([]);
    const [risks, setRisks] = useState<string[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'Disconnected' | 'Connecting...' | 'Connected'>('Disconnected');
    const [ws, setWs] = useState<WebSocket | null>(null);

    const addStoreTask = useStore(state => state.addTask);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const startRecording = () => {
        setIsRecording(true);
        setConnectionStatus('Connecting...');

        // Connect to WebSocket
        const socket = new WebSocket('ws://localhost:8000/meetings/live');

        socket.onopen = () => {
            setConnectionStatus('Connected');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'extraction') {
                if (data.extracted_tasks) setTasks(data.extracted_tasks);
                if (data.decisions) setDecisions(data.decisions);
                if (data.risks) setRisks(data.risks);
            } else if (data.type === 'info') {
                console.log("Server info:", data.message);
            }
        };

        socket.onclose = () => {
            setConnectionStatus('Disconnected');
            setIsRecording(false);
        };

        setWs(socket);
    };

    const stopRecording = () => {
        setIsRecording(false);
        if (ws) {
            ws.close();
            setWs(null);
        }
    };

    // Mock speech input simulator - in reality this would be Web Speech API or local Whisper
    useEffect(() => {
        if (!isRecording || !ws || connectionStatus !== 'Connected') return;

        const mockSentences = [
            "Let's start the weekly sync.",
            "Dhinesh will need to complete the UI components by end of day tomorrow.",
            "I've noticed a risk with the database schema, it might not scale well.",
            "We decided to go with React instead of Vue for this project.",
            "Please make sure to add offline support for the new feature."
        ];

        let index = 0;

        const interval = setInterval(() => {
            if (index < mockSentences.length) {
                const sentence = mockSentences[index];
                setTranscript(prev => prev + ' ' + sentence);

                // Send to WebSocket for real-time extraction
                ws.send(sentence);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 4000); // simulate someone speaking every 4 seconds

        return () => clearInterval(interval);
    }, [isRecording, ws, connectionStatus]);

    const saveTasksToBoard = () => {
        tasks.forEach(task => {
            addStoreTask({
                id: Math.floor(Math.random() * 10000),
                title: task.title,
                status: 'To Do',
                owner: task.owner,
                risk_level: task.risk_level
            });
        });
        // Clear local state after merge
        setTasks([]);
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-3">
                        Live Meeting Mode
                        <span className={cn(
                            "text-xs px-2 py-1 rounded-full border font-medium",
                            connectionStatus === 'Connected' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" :
                                connectionStatus === 'Connecting...' ? "bg-amber-50 text-amber-600 border-amber-200" :
                                    "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        )}>
                            {connectionStatus}
                        </span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 border-l-2 border-indigo-500 pl-3">
                        Real-time transcript analysis on-device. Tasks and insights extract automatically as you speak.
                    </p>
                </div>

                <button
                    onClick={toggleRecording}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl font-medium shadow-sm transition-all shadow-[rgba(0,0,0,0.05)_0_2px_8px]",
                        isRecording
                            ? "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 animate-pulse"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    )}
                >
                    {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                    {isRecording ? 'Stop Analysis' : 'Start Live Analysis'}
                </button>
            </div>

            <div className="flex gap-6 flex-1 min-h-[500px]">
                {/* Left pane: Transcript */}
                <div className="w-1/2 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-200">Live Transcript</h2>
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto leading-relaxed text-slate-700 dark:text-slate-300 space-y-4 font-serif text-lg">
                        {!transcript && !isRecording && (
                            <p className="text-slate-400 italic text-center mt-20">Click Start to begin analyzing the meeting.</p>
                        )}

                        <p>{transcript}</p>

                        {isRecording && (
                            <div className="flex items-center gap-1 text-slate-400">
                                <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce"></span>
                                <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce delay-100"></span>
                                <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce delay-200"></span>
                            </div>
                        )}
                        <div ref={transcriptEndRef} />
                    </div>
                </div>

                {/* Right pane: Extracted Insights */}
                <div className="w-1/2 flex flex-col space-y-4">
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">

                        {/* Actions */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 px-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-colors">
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <CheckSquare size={16} className="text-indigo-500" /> Action Items
                                </h3>
                                <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs font-bold">
                                    {tasks.length}
                                </span>
                            </div>
                            <div className="p-4 space-y-3 min-h-[100px]">
                                <AnimatePresence>
                                    {tasks.map((task, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col"
                                        >
                                            <span className="font-medium text-slate-700 dark:text-slate-300 text-sm mb-1">{task.title}</span>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">Owner: {task.owner || 'auto-assigned'}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {tasks.length === 0 && <p className="text-slate-400 text-sm italic">Waiting for actions...</p>}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Decisions */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 px-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                <Lightbulb size={16} className="text-emerald-500" />
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Decisions</h3>
                            </div>
                            <div className="p-4 space-y-2 min-h-[60px]">
                                {decisions.map((d, i) => (
                                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-600 dark:text-slate-400 bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded">
                                        {d}
                                    </motion.div>
                                ))}
                                {decisions.length === 0 && <p className="text-slate-400 text-sm italic">Waiting for decisions...</p>}
                            </div>
                        </div>

                        {/* Risks */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 px-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-rose-500" />
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Flagged Risks</h3>
                            </div>
                            <div className="p-4 space-y-2 min-h-[60px]">
                                {risks.map((r, i) => (
                                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-600 dark:text-slate-400 bg-rose-50 dark:bg-rose-500/10 p-2 rounded border-l-2 border-rose-500">
                                        {r}
                                    </motion.div>
                                ))}
                                {risks.length === 0 && <p className="text-slate-400 text-sm italic">Waiting for risks...</p>}
                            </div>
                        </div>

                    </div>

                    <button
                        disabled={tasks.length === 0}
                        onClick={saveTasksToBoard}
                        className="w-full py-4 mt-auto rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[rgba(0,0,0,0.1)_0_4px_12px] hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                    >
                        <Save size={18} />
                        Commit Output to Project
                    </button>
                </div>
            </div>
        </div>
    );
}

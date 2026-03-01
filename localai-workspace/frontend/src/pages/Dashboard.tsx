import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UploadCloud,
    FileText,
    Image as ImageIcon,
    Sparkles,
    AlertTriangle,
    ArrowRight,
    Loader2,
    Play,
    Hash,
    CheckCircle2,
    XCircle,
    FileWarning,
} from 'lucide-react';
import { useStore } from '../store';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

// ── API base — works regardless of which Vite port is used ──
const API_BASE = 'http://localhost:8000';

// ── Accepted file types per tab ──
const ACCEPT_MAP = {
    file: '.txt,.md,.pdf,.csv,.eml,.log',
    image: 'image/png,image/jpeg,image/webp',
    chat: '.txt,.md,.csv',
} as const;

type TabId = 'text' | 'file' | 'image' | 'chat';

interface UploadState {
    status: 'idle' | 'uploading' | 'success' | 'error';
    message: string;
    tasksFound: number;
}

export function Dashboard() {
    const { addUnconfirmedTask, unconfirmedTasks, tasks, setLatestSummary, fetchTasks } = useStore();
    const navigate = useNavigate();

    // Fetch on mount
    useEffect(() => {
        fetchTasks();
    }, []);

    const [activeTab, setActiveTab] = useState<TabId>('text');
    const [textInput, setTextInput] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [textError, setTextError] = useState<string | null>(null);
    const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', message: '', tasksFound: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Utilities ────────────────────────────────────────────────────────────

    const pushExtractedTasks = (extractedData: any, sourceLabel: string) => {
        const tasks: any[] = extractedData?.tasks || [];
        tasks.forEach((t: any) => {
            addUnconfirmedTask({
                id: Math.floor(Math.random() * 10_000_000),
                title: t.title,
                description: t.description || 'Extracted automatically.',
                status: 'To Do',
                owner: t.owner || 'Unassigned',
                risk_level: t.risk_level,
                source: sourceLabel,
            });
        });
        if (extractedData?.summary?.overview) {
            setLatestSummary(extractedData.summary);
        }
        return tasks.length;
    };

    const getErrorMessage = (err: unknown): string => {
        if (err instanceof AxiosError) {
            if (err.code === 'ERR_NETWORK') {
                return 'Cannot reach the backend server. Make sure it is running on port 8000.';
            }
            const detail = err.response?.data?.detail;
            if (detail) return typeof detail === 'string' ? detail : JSON.stringify(detail);
            return `Server error ${err.response?.status}: ${err.message}`;
        }
        return String(err);
    };

    // ── Text Extraction ──────────────────────────────────────────────────────

    const handleTextExtract = async () => {
        if (!textInput.trim()) return;
        setIsExtracting(true);
        setTextError(null);

        try {
            const response = await axios.post(`${API_BASE}/tasks/extract`, { text: textInput });
            const count = pushExtractedTasks(response.data, 'Manual Text Entry');

            if (count === 0) {
                setTextError('No actionable tasks were found. Try adding clearer action phrases like "I need to...", "X will...", or "Task: ...".');
            } else {
                setTextInput('');
            }
        } catch (err) {
            setTextError(getErrorMessage(err));
        } finally {
            setIsExtracting(false);
        }
    };

    // ── File / Image Upload ──────────────────────────────────────────────────

    const processFile = async (file: File) => {
        setUploadState({ status: 'uploading', message: `Processing "${file.name}"...`, tasksFound: 0 });

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Use the combined upload + extract endpoint
            const response = await axios.post(`${API_BASE}/documents/upload/extract`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 30_000, // 30s for large files
            });

            const count = pushExtractedTasks(response.data, `File: ${file.name}`);

            setUploadState({
                status: 'success',
                message: `"${file.name}" processed successfully.`,
                tasksFound: count,
            });

            // Auto-clear success state after 4 seconds
            setTimeout(() => setUploadState({ status: 'idle', message: '', tasksFound: 0 }), 4000);
        } catch (err) {
            setUploadState({
                status: 'error',
                message: getErrorMessage(err),
                tasksFound: 0,
            });
        }
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Reset input so same file can be re-uploaded
        e.target.value = '';
        await processFile(file);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    // ── Stats ────────────────────────────────────────────────────────────────

    const stats = [
        { title: 'Total Active Tasks', value: tasks.length, color: 'text-indigo-500' },
        { title: 'Pending Confirmation', value: unconfirmedTasks.length, color: 'text-rose-500' },
    ];

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                    Input & Dashboard
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Upload documents, screenshots, emails, or paste raw notes. We structure your chaos instantly.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={stat.title}
                        className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
                    >
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.title}</p>
                        <p className={`text-4xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Input panel */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto text-sm font-medium">
                    {(
                        [
                            { id: 'text', label: 'Raw Text', icon: FileText },
                            { id: 'file', label: 'Document / Email Logs', icon: UploadCloud },
                            { id: 'image', label: 'Screenshot OCR', icon: ImageIcon },
                            { id: 'chat', label: 'WhatsApp / Slack Export', icon: Hash },
                        ] as { id: TabId; label: string; icon: any }[]
                    ).map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => {
                                setActiveTab(id);
                                setUploadState({ status: 'idle', message: '', tasksFound: 0 });
                            }}
                            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === id
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            <Icon size={18} />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="p-6 md:p-8">
                    {/* ── Raw Text Tab ── */}
                    {activeTab === 'text' && (
                        <div className="space-y-4">
                            <textarea
                                value={textInput}
                                onChange={(e) => {
                                    setTextInput(e.target.value);
                                    setTextError(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                        handleTextExtract();
                                    }
                                }}
                                placeholder="Paste your messy meeting notes, thoughts, or raw brain dumps here...&#10;&#10;Tip: Include phrases like 'I need to...', 'X will...', or 'Task:' for best results."
                                className="w-full h-52 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 text-base leading-relaxed"
                            />

                            {/* Error message */}
                            <AnimatePresence>
                                {textError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl"
                                    >
                                        <XCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-rose-700 dark:text-rose-400">{textError}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <Sparkles size={16} className="text-indigo-400" />
                                    <span>AI identifies tasks, risks & decisions locally. Ctrl+Enter to submit.</span>
                                </div>
                                <button
                                    id="extract-insights-btn"
                                    onClick={handleTextExtract}
                                    disabled={isExtracting || !textInput.trim()}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    {isExtracting
                                        ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
                                        : <><Play size={18} /> Extract Insights</>
                                    }
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── File / Image / Chat Upload Tabs ── */}
                    {activeTab !== 'text' && (
                        <div className="space-y-4">
                            {/* Drop zone */}
                            <div
                                onClick={() => uploadState.status !== 'uploading' && fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[280px]
                                    ${uploadState.status === 'uploading'
                                        ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5 cursor-not-allowed'
                                        : isDragging
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.01]'
                                            : uploadState.status === 'success'
                                                ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5'
                                                : uploadState.status === 'error'
                                                    ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-500/5'
                                                    : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                                    }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                    accept={ACCEPT_MAP[activeTab as keyof typeof ACCEPT_MAP]}
                                />

                                {/* Uploading state */}
                                {uploadState.status === 'uploading' && (
                                    <>
                                        <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                            {uploadState.message}
                                        </h3>
                                        <p className="text-slate-500 mt-2 text-sm">
                                            Running AI extraction pipeline locally...
                                        </p>
                                    </>
                                )}

                                {/* Success state */}
                                {uploadState.status === 'success' && (
                                    <>
                                        <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                                        <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                                            {uploadState.message}
                                        </h3>
                                        <p className="text-emerald-600 dark:text-emerald-400 mt-2 text-sm font-medium">
                                            {uploadState.tasksFound > 0
                                                ? `${uploadState.tasksFound} task${uploadState.tasksFound > 1 ? 's' : ''} extracted and queued for review.`
                                                : 'File indexed. No new tasks found — try adding more action-oriented text.'}
                                        </p>
                                        <p className="text-slate-400 text-xs mt-3">Click or drop another file to continue</p>
                                    </>
                                )}

                                {/* Error state */}
                                {uploadState.status === 'error' && (
                                    <>
                                        <FileWarning size={48} className="text-rose-500 mb-4" />
                                        <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-300">
                                            Upload failed
                                        </h3>
                                        <p className="text-rose-600 dark:text-rose-400 mt-2 text-sm max-w-sm">
                                            {uploadState.message}
                                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUploadState({ status: 'idle', message: '', tasksFound: 0 });
                                            }}
                                            className="mt-4 px-4 py-2 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </>
                                )}

                                {/* Idle state */}
                                {uploadState.status === 'idle' && (
                                    <>
                                        {activeTab === 'image'
                                            ? <ImageIcon size={48} className="text-slate-400 mb-4" />
                                            : activeTab === 'chat'
                                                ? <Hash size={48} className="text-slate-400 mb-4" />
                                                : <UploadCloud size={48} className="text-slate-400 mb-4" />
                                        }
                                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                                            {isDragging
                                                ? 'Drop it here!'
                                                : activeTab === 'image'
                                                    ? 'Drop screenshot or image for OCR analysis'
                                                    : activeTab === 'chat'
                                                        ? 'Drop your chat export file here'
                                                        : 'Drop a document or email file here'
                                            }
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {activeTab === 'image'
                                                ? 'JPG, PNG, WebP — file content will be OCR-analyzed'
                                                : 'PDF, EML, TXT, MD, CSV supported — or click to browse'
                                            }
                                        </p>
                                        <p className="text-xs text-slate-400 mt-3">Max 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pending review banner */}
            <AnimatePresence>
                {unconfirmedTasks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-6 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 shadow-sm flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <AlertTriangle size={28} className="text-amber-500 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-400">Action Required</h3>
                                <p className="text-amber-700 dark:text-amber-500/80">
                                    You have {unconfirmedTasks.length} extracted task{unconfirmedTasks.length > 1 ? 's' : ''} waiting for your review.
                                </p>
                            </div>
                        </div>
                        <button
                            id="review-now-btn"
                            onClick={() => navigate('/confirmation')}
                            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors font-semibold flex items-center gap-2 whitespace-nowrap shadow-sm"
                        >
                            Review Now <ArrowRight size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

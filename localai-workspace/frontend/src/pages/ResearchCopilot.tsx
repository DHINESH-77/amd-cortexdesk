import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, Search, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import axios from 'axios';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    references?: string[];
}

export function ResearchCopilot() {
    const [isUploading, setIsUploading] = useState(false);
    const [documents, setDocuments] = useState<{ id: number, filename: string }[]>([]);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Upload your documents and ask me anything about them.' }
    ]);
    const [isQuerying, setIsQuerying] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:8000/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDocuments(prev => [...prev, response.data]);
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userQuery = query;
        setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
        setQuery('');
        setIsQuerying(true);

        try {
            const response = await axios.post('http://localhost:8000/documents/query', { text: userQuery });
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.answer,
                references: response.data.references
            }]);
        } catch (error) {
            console.error("Query failed", error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error querying the documents.' }]);
        } finally {
            setIsQuerying(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-3">
                    Research Copilot <Sparkles className="text-indigo-500" />
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Upload documents securely to your local vector store and chat with your private data.
                </p>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* Left Side: Document Management */}
                <div className="w-1/3 flex flex-col space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Knowledge Base</h2>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".txt,.md,.csv"
                            />
                            <UploadCloud size={32} className="mx-auto text-slate-400 mb-3" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload document</p>
                            <p className="text-xs text-slate-500 mt-1">TXT, MD, CSV supported</p>

                            {isUploading && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 text-sm">
                                    <Loader2 size={16} className="animate-spin" />
                                    Indexing locally...
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-3">
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Indexed Files</h3>
                            {documents.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No files in vector store yet.</p>
                            ) : (
                                documents.map((doc, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-sm">
                                        <FileText size={16} className="text-indigo-500" />
                                        <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{doc.filename}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Chat Interface */}
                <div className="w-2/3 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 mt-1">
                                        <MessageSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                )}

                                <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm'} p-4`}>
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

                                    {msg.references && msg.references.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Sources:</p>
                                            <div className="space-y-2">
                                                {msg.references.map((ref, idx) => (
                                                    <div key={idx} className="bg-white/50 dark:bg-slate-800/50 p-2 rounded text-xs text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 line-clamp-2">
                                                        {ref}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isQuerying && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                                    <Loader2 size={16} className="text-indigo-600 dark:text-indigo-400 animate-spin" />
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-100" />
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-200" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                        <form onSubmit={handleQuery} className="flex gap-3 relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask your local knowledge base..."
                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                            <button
                                type="submit"
                                disabled={isQuerying || !query.trim() || documents.length === 0}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white rounded-xl px-6 font-medium transition-colors flex items-center justify-center"
                            >
                                <Search size={20} />
                            </button>
                        </form>
                        {documents.length === 0 && (
                            <p className="text-xs text-center text-slate-500 mt-2">Upload documents first to start chatting.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

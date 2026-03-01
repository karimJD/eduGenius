'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, FileText, Loader2 } from 'lucide-react';
import { createCourseWithAI } from '../../services/api';
import { Sidebar } from '../../components/ui/Sidebar';
import { motion } from 'framer-motion';

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<'text' | 'pdf'>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = mode === 'text' ? content : files;
      if (mode === 'text' && !content) throw new Error('Please provide content');
      if (mode === 'pdf' && files.length === 0) throw new Error('Please upload at least one PDF file');
      
      await createCourseWithAI(title, payload as any);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to generate course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-blue-500" />
              Create New Course
            </h1>
            <p className="text-gray-400">
              Upload PDF files or paste text to generate a comprehensive course and quiz.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g., Introduction to Quantum Physics"
                />
              </div>

              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setMode('text')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'text' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setMode('pdf')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'pdf' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  Upload PDFs
                </button>
              </div>

              {mode === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course Content
                  </label>
                  <div className="relative">
                    <textarea
                      required
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none font-mono text-sm"
                      placeholder="Paste your course material here..."
                    />
                    <FileText className="absolute right-4 top-4 w-5 h-5 text-gray-500" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Supported formats: Plain text, Markdown. Max 5000 characters.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload PDFs
                  </label>
                  <div className="relative border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      required
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-10 h-10 text-blue-500" />
                      <p className="text-gray-300 font-medium">
                        {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm text-gray-500">PDF files only (max 5MB each)</p>
                      {files.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400">
                          {files.map(f => f.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Magic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Course
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

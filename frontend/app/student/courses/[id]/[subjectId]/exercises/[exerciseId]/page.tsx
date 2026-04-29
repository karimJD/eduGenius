'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  ArrowLeft,
  AlertCircle,
  Download,
  Calendar,
  X,
  File as FileIcon,
  Loader2,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/student/PageHeader';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Exercise {
  _id: string;
  title: string;
  description: string;
  dueDate?: string;
}

interface Submission {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  submittedAt: string;
  feedback?: string;
  grade?: number;
}

export default function StudentExercisePage() {
  const { id: classId, subjectId, exerciseId } = useParams<{ id: string, subjectId: string, exerciseId: string }>();
  const [data, setData] = useState<{ exercise: Exercise, chapterId: string, subject: any, submission: Submission | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/student/courses/${classId}/exercises/${exerciseId}?subjectId=${subjectId}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching exercise:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'exercice');
    } finally {
      setLoading(false);
    }
  }, [classId, subjectId, exerciseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Le fichier est trop volumineux (max 10MB)');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !data) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', subjectId);

      const res = await api.post(
        `/student/courses/${classId}/chapters/${data.chapterId}/exercises/${exerciseId}/submit`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      if (res.data.success) {
        setFile(null);
        fetchData(); // Refresh to show the submission
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du fichier');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-muted-foreground dark:text-gray-400 font-medium tracking-tight">Chargement de l'exercice...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-foreground dark:text-white mb-2 uppercase tracking-tighter">Oups !</h2>
        <p className="text-muted-foreground dark:text-gray-400 max-w-md mb-6">{error}</p>
        <Button onClick={() => router.back()} variant="outline" className="rounded-full px-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { exercise, submission, subject } = data;
  const isExpired = exercise.dueDate && new Date(exercise.dueDate) < new Date();

  return (
    <div className="mx-auto space-y-8 pb-20">
      <PageHeader
        title={exercise.title}
        description={
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-white/5 border border-white/10 text-muted-foreground dark:text-gray-400 text-[10px] font-bold tracking-widest uppercase rounded-full flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                {exercise.dueDate ? `À rendre avant le ${format(new Date(exercise.dueDate), 'd MMMM yyyy', { locale: fr })}` : 'Pas de date limite'}
              </span>
              {submission && (
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold tracking-widest uppercase rounded-full flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  Rendu envoyé
                </span>
              )}
            </div>
            <p className="text-muted-foreground dark:text-gray-400 text-lg leading-relaxed font-medium italic border-l-4 border-blue-500/30 pl-6">
              {exercise.description}
            </p>
          </div>
        }
        badgeText={subject.code}
        badgeClassName="bg-blue-500/10 border-blue-500/20 text-blue-400"
        onBack={() => router.back()}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Submission Status */}
        <div className="md:col-span-2 space-y-8">
          {/* File Upload Section */}
          <div className="bg-muted/20 dark:bg-[#0a0a0a] border border-border dark:border-[#222222] rounded-[2rem] p-8 space-y-6">
            <h3 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-3 uppercase tracking-tight">
              <Upload className="w-5 h-5 text-blue-500" />
              Déposer mon travail
            </h3>

            {!submission || uploading ? (
              <div 
                className={cn(
                  "relative border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center text-center space-y-4 overflow-hidden",
                  file ? "border-blue-500/50 bg-blue-500/5" : "border-white/10 hover:border-white/20 bg-white/5"
                )}
              >
                {!file ? (
                  <>
                    <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center text-muted-foreground dark:text-gray-400 border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                      <FileIcon className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-foreground dark:text-white font-bold">Glissez-déposez votre fichier ici</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-500 uppercase tracking-widest">ou cliquez pour parcourir</p>
                    </div>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      disabled={uploading || isExpired as boolean}
                    />
                  </>
                ) : (
                  <div className="w-full space-y-6">
                    <div className="flex items-center gap-4 bg-background dark:bg-black/40 p-4 rounded-2xl border border-white/5">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                        <FileIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-foreground dark:text-white font-bold truncate">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground dark:text-gray-500 font-black uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button onClick={() => setFile(null)} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground dark:text-gray-400 hover:text-red-400 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <Button 
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-foreground dark:text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        'Confirmer l\'envoi'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-500/5 border border-green-500/20 rounded-3xl p-8 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-foreground dark:text-white uppercase tracking-tighter">Travail remis !</h4>
                  <p className="text-muted-foreground dark:text-gray-400 text-sm font-medium">Votre fichier a été déposé avec succès le {format(new Date(submission.submittedAt), 'd MMMM HH:mm', { locale: fr })}.</p>
                </div>
                
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 bg-background dark:bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-3 text-left min-w-0">
                    <FileIcon className="w-5 h-5 text-muted-foreground dark:text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground dark:text-white text-xs font-bold truncate">{submission.fileName}</p>
                    </div>
                    <a 
                      href={submission.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/5 rounded-full text-blue-400 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (confirm('Voulez-vous remplacer votre rendu actuel ?')) {
                        setData({ ...data, submission: null });
                      }
                    }}
                    className="h-full px-6 border-[#222222] text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-[#1a1a1a] rounded-2xl group"
                  >
                    <Trash2 className="w-5 h-5 group-hover:text-red-400" />
                  </Button>
                </div>
              </div>
            )}

            {isExpired && !submission && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-400 text-xs font-bold uppercase tracking-tight">La date limite est dépassée. L'envoi est bloqué.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Feedback & Metadata */}
        <div className="space-y-8">
          {/* Grade Card */}
          <div className="bg-card dark:bg-[#111111] border border-border dark:border-[#222222] rounded-[2rem] p-8 text-center space-y-4 shadow-xl">
             <p className="text-[10px] text-muted-foreground dark:text-gray-500 font-black uppercase tracking-[0.2em]">Note Finale</p>
             <div className="text-6xl font-black text-foreground dark:text-white px-6 py-4 bg-white/5 rounded-3xl inline-block min-w-[120px]">
               {submission?.grade !== null && submission?.grade !== undefined ? (
                 <span className="text-blue-400">{submission.grade}<span className="text-2xl text-gray-600">/20</span></span>
               ) : (
                 <span className="text-gray-700">--</span>
               )}
             </div>
             <p className="text-xs text-muted-foreground dark:text-gray-500 font-medium">
               {submission?.grade !== null ? 'Évalué par l\'enseignant' : 'En attente d\'évaluation'}
             </p>
          </div>

          {/* Feedback Card */}
          <div className="bg-muted/20 dark:bg-[#0a0a0a] border border-border dark:border-[#222222] rounded-[2rem] p-8 space-y-4">
            <h4 className="text-sm font-black text-muted-foreground dark:text-gray-400 flex items-center gap-2 uppercase tracking-widest">
              <MessageSquare className="w-4 h-4" />
              Commentaires
            </h4>
            {submission?.feedback ? (
              <p className="text-foreground dark:text-white text-sm leading-relaxed font-medium bg-card dark:bg-[#111111] p-4 rounded-2xl border border-border dark:border-white/5 italic">
                "{submission.feedback}"
              </p>
            ) : (
              <p className="text-gray-600 text-xs italic font-medium">
                Aucun commentaire disponible pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

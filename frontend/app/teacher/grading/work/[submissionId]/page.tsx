'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, ExternalLink, FileText, User, BookOpen, Folder, Calendar, MessageSquare, Star } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface WorkSubmission {
  _id: string;
  studentId: { firstName: string; lastName: string; email: string; profileImage?: string };
  classId: { name: string };
  subjectId: { name: string };
  fileUrl: string;
  fileName: string;
  fileSize: number;
  submittedAt: string;
  grade: number | null;
  feedback: string;
  exerciseName: string;
  chapterName: string;
}

export default function WorkGradingPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const router = useRouter();

  const [sub, setSub] = useState<WorkSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get(`/teacher/grading/work/${submissionId}`)
      .then(r => {
        setSub(r.data);
        setGrade(r.data.grade !== null ? String(r.data.grade) : '');
        setFeedback(r.data.feedback || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [submissionId]);

  const handleSave = async () => {
    if (!sub) return;
    const gradeNum = parseFloat(grade);
    if (grade && (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 20)) {
      toast.error('La note doit être entre 0 et 20');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/teacher/grading/work/${submissionId}`, {
        grade: grade ? gradeNum : null,
        feedback,
      });
      setSaved(true);
      toast.success('Correction sauvegardée !');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const isPDF = sub?.fileName?.toLowerCase().endsWith('.pdf') || sub?.fileUrl?.includes('.pdf');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-muted-foreground gap-3">
        <FileText className="w-12 h-12 opacity-30" />
        <p className="font-medium">Soumission introuvable.</p>
        <Button variant="ghost" onClick={() => router.back()}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* ─── Left: PDF Viewer ─── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        {/* Top bar */}
        <div className="h-14 border-b border-border bg-card flex items-center gap-3 px-4 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => router.push('/teacher/grading')} className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{sub.exerciseName}</p>
            <p className="text-xs text-muted-foreground truncate">{sub.chapterName} · {sub.classId?.name}</p>
          </div>
          <a
            href={sub.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ouvrir dans un onglet
          </a>
        </div>

        {/* PDF / file viewer */}
        <div className="flex-1 overflow-hidden bg-muted/30">
          {isPDF ? (
            <iframe
              src={`${sub.fileUrl}#toolbar=1&view=FitH`}
              className="w-full h-full border-0"
              title={sub.fileName}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <div className="w-20 h-20 rounded-3xl bg-card border border-border flex items-center justify-center">
                <FileText className="w-10 h-10 text-primary/60" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">{sub.fileName}</p>
                <p className="text-sm mt-1">Ce type de fichier ne peut pas être prévisualisé.</p>
              </div>
              <a
                href={sub.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90"
              >
                <ExternalLink className="w-4 h-4" />
                Télécharger le fichier
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: Grading Sidebar ─── */}
      <div className="w-[340px] shrink-0 flex flex-col bg-card overflow-y-auto">
        {/* Student info */}
        <div className="p-5 border-b border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shrink-0 overflow-hidden border border-border">
              {sub.studentId.profileImage ? (
                <img src={sub.studentId.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                `${sub.studentId.firstName?.[0]}${sub.studentId.lastName?.[0]}`
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground text-sm truncate">{sub.studentId.firstName} {sub.studentId.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{sub.studentId.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{sub.subjectId?.name || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{sub.classId?.name || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Folder className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{sub.chapterName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{new Date(sub.submittedAt).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </div>

        {/* Grade input */}
        <div className="p-5 border-b border-border space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">Note</h3>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={grade}
              onChange={e => setGrade(e.target.value)}
              placeholder="—"
              className="w-24 text-center text-2xl font-bold px-3 py-3 bg-background border-2 border-border focus:border-primary rounded-2xl outline-none transition-colors"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">/ 20</p>
              {grade && !isNaN(parseFloat(grade)) && (
                <p className={`text-xs font-bold mt-0.5 ${parseFloat(grade) >= 10 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {((parseFloat(grade) / 20) * 100).toFixed(0)}%
                  {parseFloat(grade) >= 16 ? ' · Très bien' : parseFloat(grade) >= 14 ? ' · Bien' : parseFloat(grade) >= 10 ? ' · Passable' : ' · Insuffisant'}
                </p>
              )}
            </div>
          </div>

          {/* Quick-grade buttons */}
          <div className="flex gap-2 flex-wrap">
            {[0, 5, 8, 10, 12, 14, 16, 18, 20].map(v => (
              <button
                key={v}
                onClick={() => setGrade(String(v))}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  parseFloat(grade) === v
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="p-5 border-b border-border space-y-3 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-foreground">Commentaire</h3>
          </div>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Écrivez un commentaire pour l'étudiant... (points forts, erreurs, conseils)"
            rows={8}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Save button */}
        <div className="p-5 space-y-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-xl font-semibold"
          >
            {saved ? (
              <><CheckCircle className="w-4 h-4 mr-2" /> Sauvegardé !</>
            ) : saving ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" /> Sauvegarde...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Sauvegarder la correction</>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push('/teacher/grading')}
            className="w-full h-9 rounded-xl text-xs text-muted-foreground"
          >
            Retour à la liste
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState, useCallback } from 'react';
import { getGrades, bulkSaveGrades, getClasses } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { FileText, Save } from 'lucide-react';

type Session = 'main' | 'make-up' | 'special';

interface GradeRow {
  studentId: string;
  studentName: string;
  studentNumber: string;
  continuousAssessment: number | '';
  practicalWork: number | '';
  examGrade: number | '';
  totalGrade?: number;
  mention?: string;
  isPassed?: boolean;
}

function getMention(grade: number): string {
  if (grade < 10) return 'Ajourné';
  if (grade < 12) return 'Passable';
  if (grade < 14) return 'Assez Bien';
  if (grade < 16) return 'Bien';
  if (grade < 18) return 'Très Bien';
  return 'Excellent';
}

function calcTotal(cc: number | '', exam: number | ''): number | undefined {
  if (cc === '' || exam === '') return undefined;
  return Math.round(((Number(exam) * 0.7) + (Number(cc) * 0.3)) * 100) / 100;
}

export default function GradesPage() {
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [session, setSession] = useState<Session>('main');
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<{_id: string; name: string}[]>([]);

  useEffect(() => {
    getClasses().then(setClasses).catch(() => {});
  }, []);

  const loadGrades = useCallback(async () => {
    if (!classId || !subjectId) return;
    setLoading(true);
    try {
      const data = await getGrades({ classId, subjectId, examSession: session });
      setRows(data.map((g: Record<string, unknown>) => ({
        studentId: (g.studentId as { _id: string })?._id || String(g.studentId),
        studentName: g.studentName as string,
        studentNumber: '',
        continuousAssessment: (g.continuousAssessment as number) ?? '',
        practicalWork: (g.practicalWork as number) ?? '',
        examGrade: (g.examGrade as number) ?? '',
        totalGrade: g.totalGrade as number,
        mention: g.mention as string,
        isPassed: g.isPassed as boolean,
      })));
    } catch { } finally { setLoading(false); }
  }, [classId, subjectId, session]);

  useEffect(() => { loadGrades(); }, [loadGrades]);

  const updateRow = (i: number, field: keyof GradeRow, value: unknown) => {
    setRows(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      const total = calcTotal(
        field === 'continuousAssessment' ? value as number | '' : next[i].continuousAssessment,
        field === 'examGrade' ? value as number | '' : next[i].examGrade,
      );
      next[i].totalGrade = total;
      if (total !== undefined) {
        next[i].mention = getMention(total);
        next[i].isPassed = total >= 10;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!classId || !subjectId) return;
    setSaving(true);
    try {
      const grades = rows.map(r => ({
        studentId: r.studentId,
        subjectId,
        classId,
        examSession: session,
        continuousAssessment: r.continuousAssessment === '' ? undefined : Number(r.continuousAssessment),
        practicalWork: r.practicalWork === '' ? undefined : Number(r.practicalWork),
        examGrade: r.examGrade === '' ? undefined : Number(r.examGrade),
        totalGrade: r.totalGrade,
        mention: r.mention,
        isPassed: r.isPassed,
      }));
      await bulkSaveGrades(grades);
      alert('Notes enregistrées avec succès');
    } catch { alert('Erreur lors de l\'enregistrement'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des Notes</h1>
        <Button onClick={handleSave} disabled={saving || rows.length === 0}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Classe</label>
          <select
            value={classId}
            onChange={e => setClassId(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Sélectionner —</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Matière (ID)</label>
          <input
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            placeholder="ID de la matière"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Session</label>
          <select
            value={session}
            onChange={e => setSession(e.target.value as Session)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="main">Principale</option>
            <option value="make-up">Rattrapage</option>
            <option value="special">Spéciale</option>
          </select>
        </div>
        <div className="self-end">
          <Button variant="outline" size="sm" onClick={loadGrades} disabled={!classId || !subjectId}>
            Charger
          </Button>
        </div>
      </div>

      {/* Grade table */}
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">N°</th>
                <th className="px-4 py-3 text-left font-medium">Étudiant</th>
                <th className="px-4 py-3 text-left font-medium">CC (/20)</th>
                <th className="px-4 py-3 text-left font-medium">TP (/20)</th>
                <th className="px-4 py-3 text-left font-medium">Examen (/20)</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Mention</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.studentId} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{row.studentName}</td>
                  {(['continuousAssessment', 'practicalWork', 'examGrade'] as const).map(f => (
                    <td key={f} className="px-4 py-2">
                      <input
                        type="number"
                        min="0" max="20" step="0.25"
                        value={row[f] as number | ''}
                        onChange={e => updateRow(i, f, e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-20 rounded border border-input bg-background px-2 py-1 text-center text-sm"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <span className={`font-semibold ${
                      row.totalGrade !== undefined
                        ? row.totalGrade >= 10 ? 'text-emerald-600' : 'text-red-600'
                        : 'text-muted-foreground'
                    }`}>
                      {row.totalGrade !== undefined ? row.totalGrade.toFixed(2) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-xs text-muted-foreground">{row.mention || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />
          Sélectionnez une classe et une matière pour saisir les notes
        </div>
      )}
    </div>
  );
}

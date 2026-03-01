'use client';
import { useState } from 'react';
import { getPVData } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { FileText, Printer } from 'lucide-react';

interface GradeRow {
  _id: string;
  studentId: { firstName: string; lastName: string; cin: string; studentId?: string };
  totalGrade?: number;
  continuousAssessment?: number;
  examGrade?: number;
  mention?: string;
  isAbsent?: boolean;
  isPassed?: boolean;
}

interface PVData {
  header: { institution: string; class?: { name: string; code: string; departmentId?: { name: string }; programId?: { name: string } }; subject?: { name: string; code: string }; examSession: string; generatedAt: string };
  grades: GradeRow[];
  statistics: { total: number; passed: number; failed: number; absent: number; average: number };
}

export default function PVPage() {
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [session, setSession] = useState('main');
  const [pvData, setPvData] = useState<PVData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!classId || !subjectId) return;
    setLoading(true);
    try {
      const data = await getPVData({ classId, subjectId, examSession: session });
      setPvData(data);
    } catch { alert('Erreur lors du chargement des données'); } finally { setLoading(false); }
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FileText className="h-6 w-6" /> Procès-Verbal des Notes
        </h1>
        {pvData && (
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimer / PDF
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">ID Classe</label>
          <input value={classId} onChange={e => setClassId(e.target.value)}
            placeholder="Identifiant de la classe"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ID Matière</label>
          <input value={subjectId} onChange={e => setSubjectId(e.target.value)}
            placeholder="Identifiant de la matière"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Session</label>
          <select value={session} onChange={e => setSession(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="main">Principale</option>
            <option value="make-up">Rattrapage</option>
            <option value="special">Spéciale</option>
          </select>
        </div>
        <Button onClick={load} disabled={loading || !classId || !subjectId}>
          {loading ? 'Chargement...' : 'Générer PV'}
        </Button>
      </div>

      {/* PV Preview */}
      {pvData && (
        <div id="pv-content" className="rounded-2xl border border-border bg-card p-8 print:border-none print:p-0">
          {/* Official Header */}
          <div className="mb-8 text-center">
            <p className="text-sm text-muted-foreground">République Tunisienne</p>
            <p className="text-sm text-muted-foreground">Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</p>
            <h2 className="mt-2 text-xl font-bold">{pvData.header.institution}</h2>
            <h3 className="mt-4 text-lg font-semibold border-b border-t border-foreground py-2">
              PROCÈS-VERBAL DES EXAMENS
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Classe :</strong> {pvData.header.class?.name}
              </div>
              <div>
                <strong>Matière :</strong> {pvData.header.subject?.name}
              </div>
              <div>
                <strong>Session :</strong> {pvData.header.examSession === 'main' ? 'Principale' : pvData.header.examSession === 'make-up' ? 'Rattrapage' : 'Spéciale'}
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border border-foreground bg-muted">
                <th className="border border-foreground px-3 py-2">N°</th>
                <th className="border border-foreground px-3 py-2">CIN</th>
                <th className="border border-foreground px-3 py-2">N° Étudiant</th>
                <th className="border border-foreground px-3 py-2">Nom & Prénom</th>
                <th className="border border-foreground px-3 py-2">CC</th>
                <th className="border border-foreground px-3 py-2">Examen</th>
                <th className="border border-foreground px-3 py-2">Note Finale</th>
                <th className="border border-foreground px-3 py-2">Mention</th>
                <th className="border border-foreground px-3 py-2">Résultat</th>
              </tr>
            </thead>
            <tbody>
              {pvData.grades.map((g, i) => (
                <tr key={g._id} className="border border-foreground">
                  <td className="border border-foreground px-3 py-1.5 text-center">{i + 1}</td>
                  <td className="border border-foreground px-3 py-1.5">{g.studentId?.cin}</td>
                  <td className="border border-foreground px-3 py-1.5">{g.studentId?.studentId || '—'}</td>
                  <td className="border border-foreground px-3 py-1.5 font-medium">
                    {g.studentId?.lastName} {g.studentId?.firstName}
                  </td>
                  <td className="border border-foreground px-3 py-1.5 text-center">{g.continuousAssessment ?? '—'}</td>
                  <td className="border border-foreground px-3 py-1.5 text-center">{g.examGrade ?? '—'}</td>
                  <td className="border border-foreground px-3 py-1.5 text-center font-semibold">
                    {g.isAbsent ? 'ABS' : g.totalGrade?.toFixed(2) ?? '—'}
                  </td>
                  <td className="border border-foreground px-3 py-1.5 text-center">{g.mention || '—'}</td>
                  <td className={`border border-foreground px-3 py-1.5 text-center font-semibold ${g.isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                    {g.isAbsent ? 'ABS' : g.isPassed ? 'ADM' : 'AJ'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-5 gap-4 text-center text-sm">
            {[
              ['Total', pvData.statistics.total],
              ['Admis', pvData.statistics.passed],
              ['Ajournés', pvData.statistics.failed],
              ['Absents', pvData.statistics.absent],
              ['Moyenne', pvData.statistics.average.toFixed(2)],
            ].map(([label, val]) => (
              <div key={label} className="rounded-lg border border-border p-3">
                <p className="font-bold">{val}</p>
                <p className="text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div className="mt-12 grid grid-cols-3 gap-8 text-center text-sm">
            <div>
              <div className="h-16 border-b border-foreground" />
              <p className="mt-2">L'Enseignant</p>
            </div>
            <div>
              <div className="h-16 border-b border-foreground" />
              <p className="mt-2">Le Chef de Département</p>
            </div>
            <div>
              <div className="h-16 border-b border-foreground" />
              <p className="mt-2">Le Doyen / Directeur</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

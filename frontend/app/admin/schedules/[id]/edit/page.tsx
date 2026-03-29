'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, Calendar,
  Clock, User, MapPin, Video, ChevronDown, RotateCcw,
  AlertTriangle, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  getClasses, getTeachers, getSubjects, updateSchedule, getSchedules, getSchedule
} from '@/lib/api/admin';
import clsx from 'clsx';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Cls          { _id: string; name: string; code: string }
interface Teacher      { _id: string; firstName: string; lastName: string }
interface Subject      { _id: string; name: string; code: string }

interface EntryForm {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
  room: string;
  sessionType: 'lecture' | 'tutorial' | 'practical';
  notes: string;
  isRecursive: boolean;
  recurrenceType: 'semester' | 'weeks';
  weeksCount?: number;
}

interface ConflictWarning {
  type: 'teacher' | 'room';
  entryIndex: number;
  message: string;
}

const DAY_LABELS = ['Lundi','Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAY_NUMS   = [1, 2, 3, 4, 5, 6];

const SESSION_TYPE_LABELS: Record<string, string> = {
  lecture:  'Cours Magistral',
  tutorial: 'Travaux Dirigés (TD)',
  practical: 'Travaux Pratiques (TP)',
};

const emptyEntry = (): EntryForm => ({
  dayOfWeek: 1,
  startTime: '08:00',
  endTime: '10:00',
  subjectId: '',
  teacherId: '',
  room: '',
  sessionType: 'lecture',
  notes: '',
  isRecursive: false,
  recurrenceType: 'semester',
  weeksCount: 1,
});

// ─────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  const steps = ['Informations', 'Séances', 'Récapitulatif'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={clsx(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all',
                done   ? 'bg-primary text-primary-foreground'  : '',
                active ? 'ring-2 ring-primary bg-primary/10 text-primary' : '',
                !done && !active ? 'bg-muted text-muted-foreground' : '',
              )}>
                {done ? <Check className="h-4 w-4" /> : idx}
              </div>
              <span className={clsx('text-sm font-medium hidden sm:block',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={clsx('h-px flex-1 mx-3 transition-all',
                current > idx ? 'bg-primary' : 'bg-border'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// SelectField helper
// ─────────────────────────────────────────────
function SelectField({
  label, id, value, onChange, required, children, placeholder,
}: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; required?: boolean;
  children: React.ReactNode; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      <div className="relative">
        <select
          id={id}
          value={value}
          required={required}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{placeholder ?? '— Choisir —'}</option>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(true);

  // Lookups
  const [classes, setClasses]   = useState<Cls[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Step 1 – general form
  const [title, setTitle]             = useState('');
  const [academicYearId, setYearId]   = useState('2024-2025');
  const generatedYears = Array.from({ length: 2100 - 2024 + 1 }, (_, i) => `${2024 + i}-${2025 + i}`);
  const [semester, setSemester]       = useState<1 | 2>(1);
  const [targetType, setTargetType]   = useState<'class' | 'teacher'>('class');
  const [targetId, setTargetId]       = useState('');

  // Step 2 – entries
  const [entries, setEntries]   = useState<EntryForm[]>([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntry, setNewEntry] = useState<EntryForm>(emptyEntry());
  const [localConflicts, setLocalConflicts] = useState<ConflictWarning[]>([]);
  const [backendConflicts, setBackendConflicts] = useState<string[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // ── Loaders
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, t, s, schedData] = await Promise.all([
        getClasses().catch(() => []),
        getTeachers().catch(() => []),
        getSubjects().catch(() => []),
        getSchedule(id),
      ]);
      
      setClasses(Array.isArray(c) ? c : c.classes || []);
      setTeachers(Array.isArray(t) ? t : t.teachers || []);
      setSubjects(Array.isArray(s) ? s : []);

      const sched = schedData.schedule || schedData;
      setTitle(sched.title);
      setYearId(sched.academicYearId);
      setSemester(sched.semester);
      setTargetType(sched.targetType);
      setTargetId(sched.targetId);
      setSaveAsDraft(!sched.isPublished);
      setEntries(sched.entries.map((e: any) => ({
        ...e,
        subjectId: e.subjectId?._id || e.subjectId,
        teacherId: e.teacherId?._id || e.teacherId || '',
        room: e.room || '',
        notes: e.notes || '',
        isRecursive: !!e.isRecursive,
        recurrenceType: e.recurrenceType || 'semester',
        weeksCount: e.weeksCount || 1,
      })));
    } catch {
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Rest of functions copied from create/page.tsx
  const timesOverlap = (s1: string, e1: string, s2: string, e2: string) => {
    const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    return toMins(s1) < toMins(e2) && toMins(s2) < toMins(e1);
  };

  const detectLocalConflicts = useCallback((allEntries: EntryForm[]): ConflictWarning[] => {
    const warnings: ConflictWarning[] = [];
    allEntries.forEach((e, i) => {
      allEntries.forEach((other, j) => {
        if (i >= j) return;
        if (e.dayOfWeek !== other.dayOfWeek) return;
        if (!timesOverlap(e.startTime, e.endTime, other.startTime, other.endTime)) return;
        if (e.teacherId && other.teacherId && e.teacherId === other.teacherId) {
          const teacher = teachers.find(t => t._id === e.teacherId);
          const name = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'cet enseignant';
          if (!warnings.find(w => w.entryIndex === i && w.type === 'teacher'))
            warnings.push({ type: 'teacher', entryIndex: i, message: `${name} a déjà une séance ce créneau.` });
          if (!warnings.find(w => w.entryIndex === j && w.type === 'teacher'))
            warnings.push({ type: 'teacher', entryIndex: j, message: `${name} a déjà une séance ce créneau.` });
        }
        if (e.room && other.room && e.room.trim().toLowerCase() === other.room.trim().toLowerCase()) {
          if (!warnings.find(w => w.entryIndex === i && w.type === 'room'))
            warnings.push({ type: 'room', entryIndex: i, message: `La salle ${e.room} est déjà occupée ce créneau.` });
          if (!warnings.find(w => w.entryIndex === j && w.type === 'room'))
            warnings.push({ type: 'room', entryIndex: j, message: `La salle ${other.room} est déjà occupée ce créneau.` });
        }
      });
    });
    return warnings;
  }, [teachers]);

  useEffect(() => {
    if (entries.length > 0) {
      setLocalConflicts(detectLocalConflicts(entries));
    }
  }, [entries, detectLocalConflicts]);

  const addEntry = () => {
    if (!newEntry.subjectId || !newEntry.startTime || !newEntry.endTime) return;
    const updated = [...entries, { ...newEntry }];
    setEntries(updated);
    setNewEntry(emptyEntry());
    setShowAddEntry(false);
  };

  const removeEntry = (i: number) => {
    const updated = entries.filter((_, idx) => idx !== i);
    setEntries(updated);
  };

  const goToStep3 = async () => {
    setCheckingConflicts(true);
    setBackendConflicts([]);
    try {
      const existing = await getSchedules({ semester: String(semester), academicYear: academicYearId }).catch(() => []);
      const existingEntries: any[] = [];
      const schedList = (Array.isArray(existing) ? existing : (existing?.schedules ?? []))
        .filter((s: any) => s._id !== id); // Exclude current schedule
      
      schedList.forEach((sched: any) => {
        (sched.entries ?? []).forEach((e: any) => {
          if (e.dayOfWeek == null || !e.startTime || !e.endTime) return;
          existingEntries.push({
            dayOfWeek: e.dayOfWeek,
            startTime: e.startTime,
            endTime: e.endTime,
            teacherId: e.teacherId?._id || e.teacherId,
            room: e.room,
            scheduleTitle: sched.title,
          });
        });
      });

      const newConflicts: string[] = [];
      entries.forEach(e => {
        existingEntries.forEach(ex => {
          if (!ex.dayOfWeek || !ex.startTime || !ex.endTime) return;
          if (ex.dayOfWeek !== e.dayOfWeek) return;
          if (!timesOverlap(e.startTime, e.endTime, ex.startTime, ex.endTime)) return;
          if (e.teacherId && ex.teacherId && e.teacherId === ex.teacherId) {
            const teacher = teachers.find(t => t._id === e.teacherId);
            const name = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Un enseignant';
            newConflicts.push(`${name} est déjà assigné à une autre séance (${DAY_LABELS[DAY_NUMS.indexOf(e.dayOfWeek)] ?? ''} ${e.startTime}–${e.endTime}) dans "${ex.scheduleTitle ?? 'un autre EDT'}".`);
          }
          if (e.room && ex.room && e.room.trim().toLowerCase() === ex.room.trim().toLowerCase()) {
            newConflicts.push(`La salle ${e.room} est déjà occupée (${DAY_LABELS[DAY_NUMS.indexOf(e.dayOfWeek)] ?? ''} ${e.startTime}–${e.endTime}) dans "${ex.scheduleTitle ?? 'un autre EDT'}".`);
          }
        });
      });

      setBackendConflicts([...new Set(newConflicts)]);
    } catch {
    } finally {
      setCheckingConflicts(false);
      setStep(3);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        academicYearId,
        semester,
        targetType,
        targetId,
        isPublished: !saveAsDraft,
        entries: entries.map(e => ({
          dayOfWeek: e.dayOfWeek,
          startTime: e.startTime,
          endTime: e.endTime,
          subjectId: e.subjectId || undefined,
          teacherId: e.teacherId || undefined,
          room: e.room || undefined,
          sessionType: e.sessionType,
          notes: e.notes || undefined,
          isRecursive: e.isRecursive,
          recurrenceType: e.isRecursive ? e.recurrenceType : undefined,
          weeksCount: e.isRecursive && e.recurrenceType === 'weeks' ? e.weeksCount : undefined,
        })),
      };
      await updateSchedule(id, payload);
      router.push(`/admin/schedules/${id}`);
    } catch {
      alert("Erreur lors de l'enregistrement.");
    } finally { setSaving(false); }
  };

  const targetLabel = () => {
    if (targetType === 'class') {
      const c = classes.find(cl => cl._id === targetId);
      return c ? `${c.name} (${c.code})` : '—';
    }
    const t = teachers.find(tc => tc._id === targetId);
    return t ? `${t.firstName} ${t.lastName}` : '—';
  };

  const subjectLabel = (id: string) => {
    const s = subjects.find(su => su._id === id);
    return s ? `${s.name} — ${s.code}` : id;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const step1Valid = title.trim() && academicYearId && targetId;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-heading">Modifier l'Emploi du Temps</h1>
          <p className="text-muted-foreground text-sm">Mettez à jour les informations et séances</p>
        </div>
      </div>

      <StepBar current={step} />

      {/* ────────────── STEP 1 ────────────── */}
      {step === 1 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Informations générales
          </h2>

          <div className="space-y-1.5">
            <Label htmlFor="title">Titre <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ex: EDT S1 — Licence Informatique L2-A"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Année Académique" id="year" required
              value={academicYearId} onChange={setYearId}
            >
              {generatedYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </SelectField>

            <SelectField
              label="Semestre" id="semester" required
              value={String(semester)} onChange={v => setSemester(Number(v) as 1 | 2)}
            >
              <option value="1">Semestre 1</option>
              <option value="2">Semestre 2</option>
            </SelectField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Type de cible" id="targetType" required
              value={targetType} onChange={v => { setTargetType(v as 'class' | 'teacher'); setTargetId(''); }}
            >
              <option value="class">Classe</option>
              <option value="teacher">Enseignant</option>
            </SelectField>

            <SelectField
              label={targetType === 'class' ? 'Classe' : 'Enseignant'} id="target" required
              value={targetId} onChange={setTargetId}
              placeholder={targetType === 'class' ? '— Choisir une classe —' : '— Choisir un enseignant —'}
            >
              {targetType === 'class'
                ? classes.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))
                : teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
                  ))
              }
            </SelectField>
          </div>

          <div className="flex justify-end pt-2">
            <Button disabled={!step1Valid} onClick={() => setStep(2)}>
              Suivant <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ────────────── STEP 2 ────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Séances ({entries.length})
              </h2>
              {!showAddEntry && (
                <Button size="sm" onClick={() => setShowAddEntry(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Ajouter une séance
                </Button>
              )}
            </div>

            {entries.length === 0 && !showAddEntry && (
              <div className="py-10 text-center border border-dashed border-border rounded-xl text-sm text-muted-foreground">
                <Clock className="mx-auto mb-2 h-8 w-8 opacity-30" />
                Aucune séance. Cliquez sur "Ajouter une séance" pour commencer.
              </div>
            )}

            {entries.length > 0 && (
              <div className="space-y-2">
                {entries.map((e, i) => (
                  <div key={i} className={clsx(
                    "flex items-center gap-3 p-3 bg-background border rounded-xl transition-colors",
                    localConflicts.some(c => c.entryIndex === i) ? "border-amber-400/60 bg-amber-50/50 dark:bg-amber-900/10" : "border-border"
                  )}>
                    <div className="w-16 shrink-0 text-center">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {DAY_LABELS[DAY_NUMS.indexOf(e.dayOfWeek)] ?? `J${e.dayOfWeek}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      {e.startTime} – {e.endTime}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{subjectLabel(e.subjectId)}</p>
                      <p className="text-xs text-muted-foreground">
                        {SESSION_TYPE_LABELS[e.sessionType]}
                        {e.room && ` · Salle ${e.room}`}
                      </p>
                    </div>
                    {e.teacherId && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <User className="h-3 w-3" />
                        {teachers.find(t => t._id === e.teacherId)?.firstName ?? ''}
                      </div>
                    )}
                    <button
                      onClick={() => removeEntry(i)}
                      className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddEntry && (
              <div className="border border-primary/30 bg-primary/5 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Nouvelle séance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <SelectField
                    label="Jour" id="ne-day"
                    value={String(newEntry.dayOfWeek)}
                    onChange={v => setNewEntry(p => ({ ...p, dayOfWeek: Number(v) }))}
                  >
                    {DAY_LABELS.map((d, i) => (
                      <option key={d} value={DAY_NUMS[i]}>{d}</option>
                    ))}
                  </SelectField>

                  <div className="space-y-1.5">
                    <Label htmlFor="ne-start">Heure début</Label>
                    <Input id="ne-start" type="time" value={newEntry.startTime}
                      onChange={e => setNewEntry(p => ({ ...p, startTime: e.target.value }))} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ne-end">Heure fin</Label>
                    <Input id="ne-end" type="time" value={newEntry.endTime}
                      onChange={e => setNewEntry(p => ({ ...p, endTime: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Matière" id="ne-subject" required
                    value={newEntry.subjectId}
                    onChange={v => setNewEntry(p => ({ ...p, subjectId: v }))}
                    placeholder="— Choisir une matière —"
                  >
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.name} — {s.code}</option>
                    ))}
                  </SelectField>

                  {targetType === 'class' && (
                    <SelectField
                      label="Enseignant" id="ne-teacher"
                      value={newEntry.teacherId}
                      onChange={v => setNewEntry(p => ({ ...p, teacherId: v }))}
                      placeholder="— Choisir un enseignant —"
                    >
                      {teachers.map(t => (
                        <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
                      ))}
                    </SelectField>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="ghost" onClick={() => setShowAddEntry(false)}>Annuler</Button>
                  <Button onClick={addEntry} disabled={!newEntry.subjectId}>Ajouter</Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Button>
            <Button onClick={goToStep3} disabled={checkingConflicts}>
              {checkingConflicts ? "Vérification..." : <>Suivant <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      )}

      {/* ────────────── STEP 3 ────────────── */}
      {step === 3 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" /> Récapitulatif
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3 bg-muted/30 rounded-xl"><p className="text-xs opacity-60">Titre</p><p className="font-bold">{title}</p></div>
            <div className="p-3 bg-muted/30 rounded-xl"><p className="text-xs opacity-60">Année</p><p className="font-bold">{academicYearId}</p></div>
            <div className="p-3 bg-muted/30 rounded-xl"><p className="text-xs opacity-60">Semestre</p><p className="font-bold">S{semester}</p></div>
            <div className="p-3 bg-muted/30 rounded-xl"><p className="text-xs opacity-60">Cible</p><p className="font-bold truncate">{targetLabel()}</p></div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
            <Video className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Publication</p>
              <p className="text-xs opacity-60">Modifier le statut de visibilité</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!saveAsDraft} onChange={e => setSaveAsDraft(!e.target.checked)} className="h-4 w-4 rounded accent-primary" />
              <span className="text-sm font-medium">Publier</span>
            </label>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Mettre à jour'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

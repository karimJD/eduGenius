'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, Calendar,
  Clock, User, BookOpen, MapPin, Video, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getAcademicYears, getClasses, getTeachers, getSubjects, createSchedule,
} from '@/lib/api/admin';
import clsx from 'clsx';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface AcademicYear { _id: string; year: string; isCurrent: boolean }
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
}

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const DAY_NUMS   = [1, 2, 3, 4, 5]; // 1=Lun … 5=Ven  (JS-style 0-6)
// Backend stores 0=Sun…4=Thu Tunisian style; we'll remap on save:
// UI day index 0 (Lundi) → backend dayOfWeek 1, etc.

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
export default function CreateSchedulePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(true);

  // Lookups
  const [years, setYears]       = useState<AcademicYear[]>([]);
  const [classes, setClasses]   = useState<Cls[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Step 1 – general form
  const [title, setTitle]             = useState('');
  const [academicYearId, setYearId]   = useState('');
  const [semester, setSemester]       = useState<1 | 2>(1);
  const [targetType, setTargetType]   = useState<'class' | 'teacher'>('class');
  const [targetId, setTargetId]       = useState('');

  // Step 2 – entries
  const [entries, setEntries]   = useState<EntryForm[]>([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntry, setNewEntry] = useState<EntryForm>(emptyEntry());

  // ── Loaders
  const loadAll = useCallback(async () => {
    const [y, c, t, s] = await Promise.all([
      getAcademicYears().catch(() => []),
      getClasses().catch(() => []),
      getTeachers().catch(() => []),
      getSubjects().catch(() => []),
    ]);
    setYears(y);
    setClasses(Array.isArray(c) ? c : c.classes || []);
    setTeachers(Array.isArray(t) ? t : t.teachers || []);
    setSubjects(Array.isArray(s) ? s : []);
    // Pre-select current academic year
    const current = y.find((yr: AcademicYear) => yr.isCurrent);
    if (current) setYearId(current._id);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Step 2: add entry
  const addEntry = () => {
    if (!newEntry.subjectId || !newEntry.startTime || !newEntry.endTime) return;
    setEntries(prev => [...prev, { ...newEntry }]);
    setNewEntry(emptyEntry());
    setShowAddEntry(false);
  };

  const removeEntry = (i: number) => {
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  };

  // ── Step 1 validation
  const step1Valid = title.trim() && academicYearId && targetId;

  // ── Submit
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
        })),
      };
      await createSchedule(payload);
      router.push('/admin/schedules');
    } catch {
      alert("Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally { setSaving(false); }
  };

  // ── Target label helper
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

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════
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
          <h1 className="text-2xl font-bold">Créer un Emploi du Temps</h1>
          <p className="text-muted-foreground text-sm">Configurez le planning hebdomadaire</p>
        </div>
      </div>

      <StepBar current={step} />

      {/* ────────────── STEP 1 ────────────── */}
      {step === 1 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
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
              {years.map(y => (
                <option key={y._id} value={y._id}>
                  {y.year}{y.isCurrent ? ' (en cours)' : ''}
                </option>
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
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
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

            {/* Entry list */}
            {entries.length === 0 && !showAddEntry && (
              <div className="py-10 text-center border border-dashed border-border rounded-xl text-sm text-muted-foreground">
                <Clock className="mx-auto mb-2 h-8 w-8 opacity-30" />
                Aucune séance ajoutée. Cliquez sur "Ajouter une séance" pour commencer.
              </div>
            )}

            {entries.length > 0 && (
              <div className="space-y-2">
                {entries.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl">
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

            {/* Add Entry form */}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Type de séance" id="ne-type"
                    value={newEntry.sessionType}
                    onChange={v => setNewEntry(p => ({ ...p, sessionType: v as EntryForm['sessionType'] }))}
                  >
                    {Object.entries(SESSION_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </SelectField>

                  <div className="space-y-1.5">
                    <Label htmlFor="ne-room">Salle <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input id="ne-room" className="pl-8" placeholder="ex: A104"
                        value={newEntry.room}
                        onChange={e => setNewEntry(p => ({ ...p, room: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ne-notes">Notes <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                  <Input id="ne-notes" placeholder="Informations additionnelles..."
                    value={newEntry.notes}
                    onChange={e => setNewEntry(p => ({ ...p, notes: e.target.value }))} />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="ghost" onClick={() => { setShowAddEntry(false); setNewEntry(emptyEntry()); }}>
                    Annuler
                  </Button>
                  <Button onClick={addEntry} disabled={!newEntry.subjectId}>
                    <Plus className="mr-2 h-4 w-4" /> Ajouter
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
            <Button onClick={() => setStep(3)}>
              Suivant <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ────────────── STEP 3 ────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" /> Récapitulatif
            </h2>

            {/* General info summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Titre', value: title },
                { label: 'Année', value: years.find(y => y._id === academicYearId)?.year ?? '—' },
                { label: 'Semestre', value: `S${semester}` },
                { label: 'Cible', value: targetLabel() },
              ].map(({ label, value }) => (
                <div key={label} className="bg-background border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Visual grid by day */}
            {entries.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-border rounded-xl text-sm text-muted-foreground">
                Aucune séance — l'emploi du temps sera vide.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {DAY_LABELS.map((d, i) => (
                        <th key={d} className="p-2 text-xs font-semibold text-muted-foreground bg-muted/40 border border-border first:rounded-tl-lg last:rounded-tr-lg">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {DAY_NUMS.map(day => {
                        const dayEntries = entries.filter(e => e.dayOfWeek === day);
                        return (
                          <td key={day} className="align-top p-1.5 border border-border min-w-[120px]">
                            {dayEntries.length === 0 ? (
                              <div className="h-10 flex items-center justify-center text-muted-foreground/40 text-xs">—</div>
                            ) : (
                              <div className="space-y-1.5">
                                {dayEntries.map((e, i) => (
                                  <div key={i} className={clsx('p-2 rounded-lg text-xs space-y-0.5',
                                    e.sessionType === 'lecture'  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300' :
                                    e.sessionType === 'tutorial' ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300' :
                                    'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                  )}>
                                    <p className="font-semibold truncate">{subjectLabel(e.subjectId).split('—')[0].trim()}</p>
                                    <p className="opacity-80">{e.startTime}–{e.endTime}</p>
                                    {e.room && <p className="opacity-70">🏛 {e.room}</p>}
                                    <span className="inline-block opacity-60 text-[10px]">
                                      {e.sessionType === 'lecture' ? 'CM' : e.sessionType === 'tutorial' ? 'TD' : 'TP'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Publish option */}
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Video className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Publication</p>
                <p className="text-xs text-muted-foreground">
                  Un brouillon est visible uniquement par les admins. Un emploi publié est visible par les étudiants et enseignants.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={!saveAsDraft}
                  onChange={e => setSaveAsDraft(!e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm font-medium">Publier maintenant</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </span>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {saveAsDraft ? 'Enregistrer comme brouillon' : 'Enregistrer et publier'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

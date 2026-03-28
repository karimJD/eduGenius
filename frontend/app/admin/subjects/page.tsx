'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, ArrowLeft, GraduationCap, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  getSubjects, createSubject, deleteSubject
} from '@/lib/api/admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { DataTable, Column } from '@/components/shared/DataTable';
import { SearchBar } from '@/components/shared/SearchBar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  semester?: number;
  credits?: number;
  coefficient?: number;
  hoursDistribution?: {
    lecture?: number;
    tutorial?: number;
    practical?: number;
    total?: number;
  };
  evaluation?: {
    examWeight: number;
    continuousWeight: number;
  };
  isActive: boolean;
}

const DEFAULT_FORM = {
  name: '',
  code: '',
  description: '',
  semester: 1,
  credits: 3,
  coefficient: 2,
  hoursDistribution: {
    lecture: 1.5,
    tutorial: 1.5,
    practical: 0,
  },
  evaluation: {
    examWeight: 70,
    continuousWeight: 30,
  },
};

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newSubject, setNewSubject] = useState(DEFAULT_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSubjects({ page, limit: 20, search });
      if (Array.isArray(data)) {
        setSubjects(data);
        setTotal(data.length);
      } else {
        setSubjects(data.subjects || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...newSubject,
      hoursDistribution: {
        ...newSubject.hoursDistribution,
        total:
          (newSubject.hoursDistribution.lecture || 0) +
          (newSubject.hoursDistribution.tutorial || 0) +
          (newSubject.hoursDistribution.practical || 0),
      },
    };
    try {
      await createSubject(payload);
      setIsDialogOpen(false);
      setNewSubject(DEFAULT_FORM);
      loadData();
    } catch (err) {
      alert('Erreur lors de la création de la matière.');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteSubject(deleteId);
      setDeleteId(null);
      loadData();
    } catch (err) {
      alert('Erreur lors de la suppression de la matière.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExamWeightChange = (val: number) => {
    setNewSubject({
      ...newSubject,
      evaluation: { examWeight: val, continuousWeight: 100 - val },
    });
  };

  const columns: Column<Subject>[] = [
    {
      key: 'name',
      header: 'Matière',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-foreground">{row.name}</div>
          {row.description && (
            <div className="text-xs text-muted-foreground truncate max-w-xs">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (row) => (
        <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-bold text-muted-foreground border">
          {row.code}
        </code>
      ),
    },
    {
      key: 'semester',
      header: 'Semestre',
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className="text-[10px] px-1 h-5 border-primary/20 bg-primary/5 text-primary">
          S{row.semester}
        </Badge>
      ),
    },
    {
      key: 'coefficient',
      header: 'Coeff.',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
            {row.coefficient ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'credits',
      header: 'Crédits',
      sortable: true,
      render: (row) => <div className="text-center font-semibold text-sm">{row.credits ?? 0}</div>,
    },
    {
      key: 'hours',
      header: 'Volume H.',
      render: (row) => {
        const h = row.hoursDistribution;
        const totalH = h?.total || ((h?.lecture ?? 0) + (h?.tutorial ?? 0) + (h?.practical ?? 0));
        return (
          <div className="flex gap-1.5 flex-wrap">
            {h?.lecture ? (
              <div className="flex flex-col items-center px-2 py-1 bg-muted/60 rounded border">
                <span className="text-[8px] font-bold text-muted-foreground">CM</span>
                <span className="text-xs font-semibold">{h.lecture}h</span>
              </div>
            ) : null}
            {h?.tutorial ? (
              <div className="flex flex-col items-center px-2 py-1 bg-muted/60 rounded border">
                <span className="text-[8px] font-bold text-muted-foreground">TD</span>
                <span className="text-xs font-semibold">{h.tutorial}h</span>
              </div>
            ) : null}
            {h?.practical ? (
              <div className="flex flex-col items-center px-2 py-1 bg-muted/60 rounded border">
                <span className="text-[8px] font-bold text-muted-foreground">TP</span>
                <span className="text-xs font-semibold">{h.practical}h</span>
              </div>
            ) : null}
            {totalH > 0 && (
              <div className="flex flex-col items-center px-2 py-1 bg-primary/5 rounded border border-primary/20">
                <span className="text-[8px] font-bold text-primary">TOT</span>
                <span className="text-xs font-semibold text-primary">{totalH}h</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'evaluation',
      header: 'Évaluation',
      render: (row) => {
        const examW = row.evaluation?.examWeight ?? 70;
        const ccW = row.evaluation?.continuousWeight ?? 30;
        return (
          <div className="flex flex-col gap-1 min-w-[90px]">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden w-full">
              <div className="h-full bg-primary" style={{ width: `${examW}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Exam {examW}%</span>
              <span>CC {ccW}%</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => setDeleteId(row._id)}
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Supprimer
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Matières &amp; Modules</h1>
            <p className="text-muted-foreground text-sm">{total} matière(s) au total – système LMD tunisien</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter une matière</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Intitulé</Label>
                  <Input
                    id="name" required
                    value={newSubject.name}
                    onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                    placeholder="Algèbre 1"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="code">Code Matière</Label>
                  <Input
                    id="code" required
                    value={newSubject.code}
                    onChange={e => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                    placeholder="MATH101"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="semester">Semestre</Label>
                    <Select
                      value={String(newSubject.semester)}
                      onValueChange={val => setNewSubject({ ...newSubject, semester: Number(val) })}
                    >
                      <SelectTrigger id="semester">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <SelectItem key={s} value={String(s)}>S{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="credits">Crédits</Label>
                    <Input
                      id="credits" type="number" min="0" step="0.5"
                      value={newSubject.credits}
                      onChange={e => setNewSubject({ ...newSubject, credits: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coefficient">Coefficient</Label>
                    <Input
                      id="coefficient" type="number" min="1"
                      value={newSubject.coefficient}
                      onChange={e => setNewSubject({ ...newSubject, coefficient: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Volume Horaire Hebdomadaire</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Cours (CM)', key: 'lecture' },
                      { label: 'TD', key: 'tutorial' },
                      { label: 'TP', key: 'practical' },
                    ].map(({ label, key }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{label}</Label>
                        <Input
                          type="number" step="0.5" min="0"
                          value={newSubject.hoursDistribution[key as keyof typeof newSubject.hoursDistribution]}
                          onChange={e =>
                            setNewSubject({
                              ...newSubject,
                              hoursDistribution: {
                                ...newSubject.hoursDistribution,
                                [key]: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Pondération de l&apos;évaluation</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="examWeight">Examen (%)</Label>
                      <Input
                        id="examWeight" type="number" min="0" max="100"
                        value={newSubject.evaluation.examWeight}
                        onChange={e => handleExamWeightChange(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="continuousWeight">Contrôle Continu (%)</Label>
                      <Input
                        id="continuousWeight" type="number" min="0" max="100"
                        value={newSubject.evaluation.continuousWeight}
                        onChange={e =>
                          setNewSubject({
                            ...newSubject,
                            evaluation: {
                              ...newSubject.evaluation,
                              continuousWeight: Number(e.target.value),
                              examWeight: 100 - Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    La somme Examen + CC doit être égale à 100 %.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Input
                    id="description"
                    value={newSubject.description}
                    onChange={e => setNewSubject({ ...newSubject, description: e.target.value })}
                    placeholder="Contenu du cours…"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                  <Button type="submit">Créer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher par nom ou code..." onSearch={setSearch} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground bg-muted/30 px-4 py-2 rounded-xl border items-center">
        <GraduationCap className="h-3.5 w-3.5" />
        <span><strong>Système LMD tunisien</strong></span>
        <span>·</span>
        <span>Coefficient (Note × Coeff)</span>
        <span>·</span>
        <span>Pondération Examen / CC</span>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={subjects}
        isLoading={loading}
        emptyMessage="Aucune matière trouvée"
        totalItems={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* Confirm Deletion */}
      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer la matière"
        description="Cette action est irréversible. Toutes les données liées à cette matière seront impactées. Confirmer ?"
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleting}
      />
    </div>
  );
}

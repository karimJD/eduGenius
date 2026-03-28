'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Calendar, ArrowLeft, Check, Trash2, Edit2, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getAcademicYears, createAcademicYear,
} from '@/lib/api/admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface AcademicYear {
  _id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  semesters: {
    number: number;
    startDate: string;
    endDate: string;
  }[];
}

export default function AcademicYearsPage() {
  const router = useRouter();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [newYear, setNewYear] = useState({
    year: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    semesters: [
      { number: 1, startDate: '', endDate: '' },
      { number: 2, startDate: '', endDate: '' }
    ]
  });

  const loadYears = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAcademicYears();
      setYears(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAcademicYear(newYear);
      setIsDialogOpen(false);
      setNewYear({
        year: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        semesters: [
          { number: 1, startDate: '', endDate: '' },
          { number: 2, startDate: '', endDate: '' }
        ]
      });
      loadYears();
    } catch (err) {
      alert("Erreur lors de la création de l'année académique.");
    }
  };

  return (
    <div className="p-6 space-y-6">
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
            <h1 className="text-2xl font-bold">Années Académiques</h1>
            <p className="text-muted-foreground text-sm">Gérez les périodes d'études</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nouvelle Année
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter une année académique</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="year">Nom de l'année (ex: 2023-2024)</Label>
                <Input
                  id="year"
                  required
                  value={newYear.year}
                  onChange={e => setNewYear({ ...newYear, year: e.target.value })}
                  placeholder="2023-2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="start">Début</Label>
                  <Input
                    id="start"
                    type="date"
                    required
                    value={newYear.startDate}
                    onChange={e => setNewYear({ ...newYear, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end">Fin</Label>
                  <Input
                    id="end"
                    type="date"
                    required
                    value={newYear.endDate}
                    onChange={e => setNewYear({ ...newYear, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isCurrent"
                  checked={newYear.isCurrent}
                  onChange={e => setNewYear({ ...newYear, isCurrent: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <Label htmlFor="isCurrent" className="cursor-pointer">Définir comme année en cours</Label>
              </div>

              {/* Semesters */}
              <div className="space-y-4 border-t pt-4 mt-2">
                <h3 className="text-sm font-semibold">Semestres</h3>
                {newYear.semesters.map((s, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Semestre {s.number}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Début</Label>
                        <Input
                          type="date"
                          value={s.startDate}
                          onChange={e => {
                            const newSemesters = [...newYear.semesters];
                            newSemesters[i].startDate = e.target.value;
                            setNewYear({ ...newYear, semesters: newSemesters });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Fin</Label>
                        <Input
                          type="date"
                          value={s.endDate}
                          onChange={e => {
                            const newSemesters = [...newYear.semesters];
                            newSemesters[i].endDate = e.target.value;
                            setNewYear({ ...newYear, semesters: newSemesters });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button type="submit">Créer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : years.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/20">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">Aucune année académique enregistrée.</p>
          <Button variant="link" onClick={() => setIsDialogOpen(true)}>Ajouter la première</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {years.map((y) => (
            <div
              key={y._id}
              className={`group relative bg-card border rounded-2xl p-5 hover:shadow-lg transition-all ${
                y.isCurrent ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">{y.year}</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(y.startDate).toLocaleDateString('fr-FR')} — {new Date(y.endDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {y.isCurrent && (
                  <Badge className="bg-primary text-primary-foreground">Actuel</Badge>
                )}
              </div>

              <div className="space-y-3">
                {y.semesters.map((s) => (
                  <div key={s.number} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/40">
                    <span className="font-medium">Semestre {s.number}</span>
                    <span className="text-muted-foreground text-xs">
                      {s.startDate ? new Date(s.startDate).toLocaleDateString('fr-FR') : '?'} — {s.endDate ? new Date(s.endDate).toLocaleDateString('fr-FR') : '?'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Future: Edit/Delete buttons */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

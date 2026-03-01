'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, ClipboardList, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/shared/DataTable';
import { SearchBar } from '@/components/shared/SearchBar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  getPrograms, createProgram, updateProgram, deleteProgram, getDepartments,
} from '@/lib/api/admin';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Department { _id: string; name: string; code: string }

interface Program {
  _id: string;
  name: string;
  code: string;
  programType: string;
  duration: number;
  isActive: boolean;
  departmentId?: { _id: string; name: string };
  coordinatorId?: { firstName: string; lastName: string };
}

const TYPES = ['licence', 'master', 'doctorat', 'ingenieur', 'technicien'];

const emptyForm = () => ({
  name: '', code: '', programType: 'licence', duration: 3, departmentId: '',
});

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType) params.type = filterType;
      if (filterDept) params.department = filterDept;
      const data = await getPrograms(params);
      setPrograms(Array.isArray(data) ? data : []);
    } catch { } finally { setLoading(false); }
  }, [filterType, filterDept]);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);
  useEffect(() => { getDepartments().then(setDepartments).catch(() => {}); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (p: Program) => {
    setEditingId(p._id);
    setForm({
      name: p.name, code: p.code, programType: p.programType,
      duration: p.duration, departmentId: p.departmentId?._id || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) { await updateProgram(editingId, form); }
      else { await createProgram(form); }
      setModalOpen(false);
      fetchPrograms();
    } catch { alert('Erreur lors de l\'enregistrement'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteProgram(deleteId);
      setDeleteId(null);
      fetchPrograms();
    } catch { } finally { setDeleting(false); }
  };

  const filtered = programs.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const typeLabel = (t: string) => ({
    licence: 'Licence', master: 'Master', doctorat: 'Doctorat',
    ingenieur: 'Ingénieur', technicien: 'Technicien',
  }[t] || t);

  const typeColor = (t: string) => ({
    licence: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    master: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    doctorat: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
    ingenieur: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    technicien: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  }[t] || 'bg-muted text-muted-foreground');

  const columns: Column<Program>[] = [
    {
      key: 'name', header: 'Programme', sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{r.code}</p>
        </div>
      ),
    },
    {
      key: 'programType', header: 'Type',
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColor(r.programType)}`}>
          {typeLabel(r.programType)}
        </span>
      ),
    },
    { key: 'duration', header: 'Durée', render: (r) => `${r.duration} an(s)` },
    { key: 'dept', header: 'Département', render: (r) => r.departmentId?.name || '—' },
    {
      key: 'coordinator', header: 'Coordinateur',
      render: (r) => r.coordinatorId
        ? `${r.coordinatorId.firstName} ${r.coordinatorId.lastName}`
        : '—',
    },
    {
      key: 'isActive', header: 'Statut',
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          r.isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
            : 'bg-red-100 text-red-700'
        }`}>
          {r.isActive ? 'Actif' : 'Inactif'}
        </span>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(r)}
            className="rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
          >
            <Edit2 className="inline h-3 w-3 mr-1" />Modifier
          </button>
          <button
            onClick={() => setDeleteId(r._id)}
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="inline h-3 w-3 mr-1" />Supprimer
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programmes d'études</h1>
          <p className="text-muted-foreground">{programs.length} programme(s) au total</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <SearchBar placeholder="Rechercher par nom ou code..." onSearch={setSearch} />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Tous les types</option>
          {TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
        </select>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Tous les départements</option>
          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
          <ClipboardList className="mx-auto mb-3 h-8 w-8 opacity-40" />
          Aucun programme trouvé
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={loading}
          emptyMessage="Aucun programme trouvé"
        />
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier programme' : 'Nouveau programme'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="pname">Nom du programme</Label>
              <Input id="pname" required value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="pcode">Code</Label>
                <Input id="pcode" required value={form.code} placeholder="ex: LIC-INFO"
                  onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="duration">Durée (ans)</Label>
                <Input id="duration" type="number" min={1} max={10} required value={form.duration}
                  onChange={e => setForm({...form, duration: Number(e.target.value)})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type de programme</Label>
                <select
                  value={form.programType}
                  onChange={e => setForm({...form, programType: e.target.value})}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Département</Label>
                <select
                  value={form.departmentId}
                  onChange={e => setForm({...form, departmentId: e.target.value})}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Sélectionner —</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Désactiver le programme"
        description="Cette action désactivera le programme d'études. Confirmer ?"
        confirmLabel="Désactiver"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleting}
      />
    </div>
  );
}

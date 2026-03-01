'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Download, Search, Edit2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/shared/DataTable';
import { SearchBar } from '@/components/shared/SearchBar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  getTeachers, createTeacher, updateTeacher, deleteTeacher, getDepartments,
} from '@/lib/api/admin';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Department { _id: string; name: string; code: string }

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  cin: string;
  email: string;
  employeeId?: string;
  isActive: boolean;
  teacher?: {
    academicRank?: string;
    departmentId?: { _id: string; name: string };
    specialization?: string;
  };
}

const RANKS = [
  'Professeur',
  'Maître de Conférences A',
  'Maître de Conférences B',
  'Maître Assistant A',
  'Maître Assistant B',
  'Assistant',
];

const emptyForm = () => ({
  firstName: '', lastName: '', cin: '', email: '', password: '',
  employeeId: '',
  teacher: { academicRank: '', departmentId: '', specialization: '' },
});

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTeachers({ page, limit: 20, search });
      setTeachers(data.teachers || []);
      setTotal(data.total || 0);
    } catch { } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);
  useEffect(() => { getDepartments().then(setDepartments).catch(() => {}); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (t: Teacher) => {
    setEditingId(t._id);
    setForm({
      firstName: t.firstName, lastName: t.lastName, cin: t.cin, email: t.email,
      password: '', employeeId: t.employeeId || '',
      teacher: {
        academicRank: t.teacher?.academicRank || '',
        departmentId: t.teacher?.departmentId?._id || '',
        specialization: t.teacher?.specialization || '',
      },
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (!editingId && !form.password) { alert('Mot de passe requis'); setSaving(false); return; }
      if (!form.password) delete (payload as Record<string, unknown>).password;
      if (editingId) { await updateTeacher(editingId, payload); }
      else { await createTeacher(payload); }
      setModalOpen(false);
      fetchTeachers();
    } catch { alert('Erreur lors de l\'enregistrement'); } finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    setDeactivating(true);
    try {
      await deleteTeacher(deactivateId);
      setDeactivateId(null);
      fetchTeachers();
    } catch { } finally { setDeactivating(false); }
  };

  const columns: Column<Teacher>[] = [
    {
      key: 'name', header: 'Enseignant',
      render: (r) => (
        <div>
          <p className="font-medium">{r.lastName} {r.firstName}</p>
          <p className="text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    { key: 'cin', header: 'CIN', sortable: true },
    { key: 'employeeId', header: 'N° Employé', render: (r) => r.employeeId || '—' },
    {
      key: 'rank', header: 'Grade',
      render: (r) => r.teacher?.academicRank || '—',
    },
    {
      key: 'dept', header: 'Département',
      render: (r) => r.teacher?.departmentId?.name || '—',
    },
    {
      key: 'isActive', header: 'Statut',
      render: (r) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          r.isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
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
          {r.isActive && (
            <button
              onClick={() => setDeactivateId(r._id)}
              className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <UserX className="inline h-3 w-3 mr-1" />Désactiver
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enseignants</h1>
          <p className="text-muted-foreground">{total} enseignant(s) au total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exporter
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher par CIN, nom, email..." onSearch={setSearch} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={teachers}
        isLoading={loading}
        emptyMessage="Aucun enseignant trouvé"
        totalItems={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier enseignant' : 'Ajouter un enseignant'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" required value={form.firstName}
                  onChange={e => setForm({...form, firstName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" required value={form.lastName}
                  onChange={e => setForm({...form, lastName: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cin">CIN</Label>
                <Input id="cin" required value={form.cin}
                  onChange={e => setForm({...form, cin: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="empId">N° Employé</Label>
                <Input id="empId" value={form.employeeId}
                  onChange={e => setForm({...form, employeeId: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">{editingId ? 'Nouveau mot de passe (facultatif)' : 'Mot de passe'}</Label>
              <Input id="password" type="password" required={!editingId} value={form.password}
                onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Grade académique</Label>
                <select
                  value={form.teacher.academicRank}
                  onChange={e => setForm({...form, teacher: {...form.teacher, academicRank: e.target.value}})}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Sélectionner —</option>
                  {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Département</Label>
                <select
                  value={form.teacher.departmentId}
                  onChange={e => setForm({...form, teacher: {...form.teacher, departmentId: e.target.value}})}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Sélectionner —</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="spec">Spécialité</Label>
              <Input id="spec" value={form.teacher.specialization}
                onChange={e => setForm({...form, teacher: {...form.teacher, specialization: e.target.value}})} />
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
        open={!!deactivateId}
        title="Désactiver l'enseignant"
        description="Cette action désactivera le compte de l'enseignant. Confirmer ?"
        confirmLabel="Désactiver"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateId(null)}
        isLoading={deactivating}
      />
    </div>
  );
}

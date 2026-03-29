'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Building2, Edit2, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/shared/SearchBar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import Link from 'next/link';
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
} from '@/lib/api/admin';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  headOfDepartmentId?: { firstName: string; lastName: string } | null;
  teacherCount?: number;
}

const emptyForm = () => ({ name: '', code: '', description: '' });

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const fetchDepts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDepartments(search ? { search } : undefined);
      setDepartments(Array.isArray(data) ? data : []);
    } catch { } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (d: Department) => {
    setEditingId(d._id);
    setForm({ name: d.name, code: d.code, description: d.description || '' });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) { await updateDepartment(editingId, form); }
      else { await createDepartment(form); }
      setModalOpen(false);
      fetchDepts();
    } catch { alert('Erreur lors de l\'enregistrement'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDepartment(deleteId);
      setDeleteId(null);
      fetchDepts();
    } catch { } finally { setDeleting(false); }
  };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Départements</h1>
          <p className="text-muted-foreground">{departments.length} département(s) au total</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher par nom ou code..." onSearch={setSearch} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
          <Building2 className="mx-auto mb-3 h-8 w-8 opacity-40" />
          Aucun département trouvé
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(dept => (
            <div
              key={dept._id}
              className={`group relative rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md ${
                !dept.isActive ? 'opacity-60' : ''
              }`}
            >
              <Link href={`/admin/departments/${dept._id}`} className="absolute inset-0 z-0" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{dept.name}</h3>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
                      {dept.code}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(dept); }}
                    className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(dept._id); }}
                    className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="relative z-10">
                {dept.description && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{dept.description}</p>
                )}

                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  {dept.headOfDepartmentId && (
                    <span>
                      Chef : {dept.headOfDepartmentId.firstName} {dept.headOfDepartmentId.lastName}
                    </span>
                  )}
                  <span className={`ml-auto rounded-full px-2 py-0.5 font-medium ${
                    dept.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {dept.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier département' : 'Nouveau département'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="dname">Nom du département</Label>
              <Input id="dname" required value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dcode">Code</Label>
              <Input id="dcode" required value={form.code} placeholder="ex: INFO"
                onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="desc">Description</Label>
              <textarea
                id="desc"
                rows={3}
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="Description optionnelle..."
              />
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
        title="Désactiver le département"
        description="Cette action désactivera le département. Confirmer ?"
        confirmLabel="Désactiver"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleting}
      />
    </div>
  );
}

'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/shared/DataTable';
import { SearchBar } from '@/components/shared/SearchBar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { getStudents, deleteStudent } from '@/lib/api/admin';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  cin: string;
  email: string;
  isActive: boolean;
  student?: { level?: string; departmentId?: { name: string } };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudents({ page, limit: 20, search });
      setStudents(data.students || []);
      setTotal(data.total || 0);
    } catch { } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteStudent(deleteId);
      setDeleteId(null);
      fetchStudents();
    } catch { } finally { setDeleting(false); }
  };

  const columns: Column<Student>[] = [
    { key: 'cin', header: 'CIN', sortable: true },
    {
      key: 'name',
      header: 'Nom & Prénom',
      render: (row) => `${row.lastName} ${row.firstName}`,
    },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'department',
      header: 'Département',
      render: (row) => row.student?.departmentId?.name || '—',
    },
    {
      key: 'level',
      header: 'Niveau',
      render: (row) => row.student?.level || '—',
    },
    {
      key: 'isActive',
      header: 'Statut',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          row.isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
        }`}>
          {row.isActive ? 'Actif' : 'Inactif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <a
            href={`/admin/users/students/${row._id}`}
            className="rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
          >
            Modifier
          </a>
          <button
            onClick={() => setDeleteId(row._id)}
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            Désactiver
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Étudiants</h1>
          <p className="text-muted-foreground">{total} étudiant(s) au total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" /> Importer CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exporter
          </Button>
          <a href="/admin/users/students/create">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
          </a>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher par CIN, nom, email..." onSearch={setSearch} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={students}
        isLoading={loading}
        emptyMessage="Aucun étudiant trouvé"
        totalItems={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Désactiver l'étudiant"
        description="Cette action désactivera le compte de l'étudiant. Il ne pourra plus se connecter à la plateforme. Confirmer ?"
        confirmLabel="Désactiver"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleting}
      />
    </div>
  );
}

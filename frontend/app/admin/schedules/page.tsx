'use client';
import { useEffect, useState, useCallback } from 'react';
import { getSchedules, publishSchedule, deleteSchedule } from '@/lib/api/admin';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/shared/AdminPageHeader';
import { Calendar, Plus, Clock } from 'lucide-react';
import Link from 'next/link';

interface ScheduleEntry extends Record<string, unknown> {
  day: string;
  startTime: string;
  endTime: string;
  subject?: string;
  location?: string;
  meetingUrl?: string;
}

interface Schedule extends Record<string, unknown> {
  _id: string;
  title: string;
  semester: number;
  targetType: string;
  isPublished: boolean;
  createdAt: string;
  entries: ScheduleEntry[];
}

const columns: Column<Schedule>[] = [
  { key: 'title', header: 'Titre', sortable: true },
  { key: 'semester', header: 'Semestre', render: r => `S${r.semester}` },
  { key: 'targetType', header: 'Cible', render: r => r.targetType === 'class' ? 'Classe' : 'Enseignant' },
  {
    key: 'sessions',
    header: 'Sessions',
    render: r => <span>{r.entries?.length || 0} séance(s)</span>,
  },
  {
    key: 'isPublished',
    header: 'Statut',
    render: r => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        r.isPublished
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      }`}>
        {r.isPublished ? 'Publié' : 'Brouillon'}
      </span>
    ),
  },
  { key: 'createdAt', header: 'Créé le', render: r => new Date(r.createdAt).toLocaleDateString('fr-TN') },
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSchedules();
      setSchedules(data.schedules || data || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handlePublish = async (id: string) => {
    setPublishing(id);
    try {
      await publishSchedule(id);
      fetchSchedules();
    } catch { alert('Erreur lors de la publication'); } finally { setPublishing(null); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'emploi du temps "${title}" ?`)) return;
    try {
      await deleteSchedule(id);
      fetchSchedules();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const columnsWithActions: Column<Schedule>[] = [
    ...columns,
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <a
            href={`/admin/schedules/${row._id}`}
            className="rounded px-2 py-1 text-xs text-primary font-medium hover:bg-primary/10 transition-colors"
          >
            Voir
          </a>
          <a
            href={`/admin/schedules/${row._id}/edit`}
            className="rounded px-2 py-1 text-xs text-blue-600 font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
          >
            Modifier
          </a>
          {!row.isPublished && (
            <button
              onClick={() => handlePublish(row._id)}
              disabled={publishing === row._id}
              className="rounded px-2 py-1 text-xs text-emerald-600 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/30 disabled:opacity-50 transition-colors"
            >
              {publishing === row._id ? '...' : 'Publier'}
            </button>
          )}
          <button
            onClick={() => handleDelete(row._id, row.title)}
            className="rounded px-2 py-1 text-xs text-destructive font-medium hover:bg-destructive/10 transition-colors"
          >
            Supprimer
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pt-0">
      <AdminPageHeader 
        title="Emplois du Temps"
        subtitle="Gérez les horaires de cours par classe"
        icon={Clock}
        actions={
          <Link href="/admin/schedules/create">
            <Button className="rounded-xl px-4 py-5 shadow-lg shadow-blue-500/10 font-bold gap-2">
              <Plus className="h-4 w-4" /> Créer
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columnsWithActions}
        data={schedules}
        isLoading={loading}
        emptyMessage="Aucun emploi du temps"
      />
    </div>
  );
}

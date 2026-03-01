'use client';
import { useEffect, useState, useCallback } from 'react';
import { getSchedules, publishSchedule } from '@/lib/api/admin';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';

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

  const columnsWithActions: Column<Schedule>[] = [
    ...columns,
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <a
            href={`/admin/schedules/${row._id}`}
            className="rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
          >
            Voir
          </a>
          {!row.isPublished && (
            <button
              onClick={() => handlePublish(row._id)}
              disabled={publishing === row._id}
              className="rounded px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 disabled:opacity-50"
            >
              {publishing === row._id ? '...' : 'Publier'}
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
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Calendar className="h-6 w-6" /> Emplois du Temps
          </h1>
        </div>
        <a href="/admin/schedules/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Créer
          </Button>
        </a>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={schedules}
        isLoading={loading}
        emptyMessage="Aucun emploi du temps"
      />
    </div>
  );
}

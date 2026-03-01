'use client';
import { useState } from 'react';
import { getAttendanceRecords } from '@/lib/api/admin';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { BarChart2, FileDown } from 'lucide-react';

interface AttendanceRecord extends Record<string, unknown> {
  _id: string;
  sessionDate: string;
  className: string;
  subjectName: string;
  classId?: { name: string };
  subjectId?: { name: string };
  statistics: { attendanceRate: number; present: number; late: number; absent: number; totalStudents: number };
}

const columns: Column<AttendanceRecord>[] = [
  { key: 'sessionDate', header: 'Date', sortable: true, render: r => new Date(r.sessionDate).toLocaleDateString('fr-TN') },
  { key: 'class', header: 'Classe', render: r => r.classId?.name || r.className || '—' },
  { key: 'subject', header: 'Matière', render: r => r.subjectId?.name || r.subjectName || '—' },
  { key: 'present', header: 'Présents', render: r => String(r.statistics?.present ?? '—') },
  { key: 'late', header: 'En retard', render: r => String(r.statistics?.late ?? '—') },
  { key: 'absent', header: 'Absents', render: r => String(r.statistics?.absent ?? '—') },
  {
    key: 'rate',
    header: 'Taux',
    render: r => {
      const rate = r.statistics?.attendanceRate ?? 0;
      return (
        <span className={`font-semibold ${rate >= 75 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
          {rate.toFixed(1)}%
        </span>
      );
    },
  },
];

export default function AttendanceReportsPage() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await getAttendanceRecords({ startDate, endDate, page: String(page), limit: '20' });
      setRecords(data.records || []);
      setTotal(data.total || 0);
    } catch { } finally { setLoading(false); }
  };

  const avgRate = records.length > 0
    ? (records.reduce((s, r) => s + (r.statistics?.attendanceRate || 0), 0) / records.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <BarChart2 className="h-6 w-6" /> Rapports de Présence
          </h1>
        </div>
        <Button variant="outline" size="sm">
          <FileDown className="mr-2 h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Date de début</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Date de fin</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <Button onClick={generate} disabled={loading}>
          {loading ? 'Génération...' : 'Générer le rapport'}
        </Button>
      </div>

      {/* Summary stats */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Sessions', value: total },
            { label: 'Taux moyen', value: `${avgRate}%` },
            { label: 'Total présents', value: records.reduce((s, r) => s + (r.statistics?.present || 0), 0) },
            { label: 'Total absents', value: records.reduce((s, r) => s + (r.statistics?.absent || 0), 0) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        data={records}
        isLoading={loading}
        emptyMessage="Générez un rapport pour voir les données"
        totalItems={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
      />
    </div>
  );
}

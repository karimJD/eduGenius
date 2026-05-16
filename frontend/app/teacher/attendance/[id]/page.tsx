'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSessionAttendanceDetail } from '@/lib/api/teacher';
import { Loader2, ArrowLeft, Download, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AttendanceRecord {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'present' | 'late' | 'absent';
  joinTime: string | null;
  totalTimeSpent: number;
  attendancePercentage: number;
}

interface SessionDetail {
  _id: string;
  title: string;
  date: string;
  duration: number;
}

export default function AttendanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getSessionAttendanceDetail(params.id as string);
        setSession(data.session);
        setAttendance(data.attendance);
      } catch (error) {
        console.error('Failed to fetch attendance details:', error);
        toast.error('Erreur lors du chargement des présences');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchDetails();
  }, [params.id]);

  const handleExport = () => {
    // Basic CSV export logic
    const headers = ['Nom', 'Prénom', 'Email', 'Statut', 'Heure Arrivée', 'Durée (min)', 'Pourcentage'];
    const rows = attendance.map(record => [
      record.lastName,
      record.firstName,
      record.email,
      record.status,
      record.joinTime ? new Date(record.joinTime).toLocaleTimeString('fr-FR') : 'N/A',
      record.totalTimeSpent.toString(),
      `${record.attendancePercentage}%`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `presence_${session?.title}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold"><CheckCircle2 className="w-4 h-4"/> Présent</span>;
      case 'late':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-semibold"><AlertTriangle className="w-4 h-4"/> Retard</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-semibold"><XCircle className="w-4 h-4"/> Absent</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-xl hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Détails d'Assiduité : {session?.title}</h1>
            <p className="text-muted-foreground text-sm">
              Session du {session ? new Date(session.date).toLocaleDateString('fr-FR') : ''} • {session?.duration} minutes
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-emerald-500/20 p-4 rounded-2xl text-center">
          <div className="text-3xl font-bold text-emerald-500">{attendance.filter(a => a.status === 'present').length}</div>
          <div className="text-sm text-emerald-500/70 font-medium">Présents</div>
        </div>
        <div className="bg-card border border-orange-500/20 p-4 rounded-2xl text-center">
          <div className="text-3xl font-bold text-orange-500">{attendance.filter(a => a.status === 'late').length}</div>
          <div className="text-sm text-orange-500/70 font-medium">En Retard</div>
        </div>
        <div className="bg-card border border-red-500/20 p-4 rounded-2xl text-center">
          <div className="text-3xl font-bold text-red-500">{attendance.filter(a => a.status === 'absent').length}</div>
          <div className="text-sm text-red-500/70 font-medium">Absents</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-sm font-semibold text-muted-foreground">
            <tr>
              <th className="p-4">Étudiant</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Heure d'arrivée</th>
              <th className="p-4">Temps de participation</th>
              <th className="p-4">Présence (%)</th>
            </tr>
          </thead>
          <tbody className="text-sm text-muted-foreground divide-y divide-border">
            {attendance.map((record) => (
              <tr key={record.studentId} className="hover:bg-muted/50 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-foreground">{record.lastName} {record.firstName}</div>
                  <div className="text-xs text-muted-foreground">{record.email}</div>
                </td>
                <td className="p-4">{getStatusBadge(record.status)}</td>
                <td className="p-4 text-muted-foreground">
                  {record.joinTime ? new Date(record.joinTime).toLocaleTimeString('fr-FR') : '-'}
                </td>
                <td className="p-4 text-muted-foreground">{record.totalTimeSpent} min</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${record.attendancePercentage > 70 ? 'bg-emerald-500' : record.attendancePercentage > 30 ? 'bg-orange-500' : 'bg-red-500'}`}
                        style={{ width: `${record.attendancePercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono">{record.attendancePercentage}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendance.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Aucun étudiant inscrit dans cette classe.</div>
        )}
      </div>
    </div>
  );
}

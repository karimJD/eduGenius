'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAttendanceSessions } from '@/lib/api/teacher';
import { TeacherPageHeader } from '@/components/teacher/TeacherPageHeader';
import { Loader2, Calendar, Clock, Users, ArrowRight, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SessionInfo {
  _id: string;
  title: string;
  className: string;
  classCode: string;
  date: string;
  duration: number;
  participantsCount: number;
}

export default function AttendanceDashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getAttendanceSessions();
        setSessions(data);
      } catch (error) {
        console.error('Failed to fetch attendance sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.classCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'all' || s.className === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      <TeacherPageHeader 
        title="Dashboard d'Assiduité" 
        subtitle="Consultez l'historique des présences de vos classes virtuelles."
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une session, une classe..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="w-full sm:w-[250px]">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full bg-card border-border">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Filtrer par classe" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {Array.from(new Set(sessions.map(s => s.className))).map(className => (
                <SelectItem key={className} value={className}>{className}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-card border border-border rounded-2xl">
          <p className="text-muted-foreground">Aucune session trouvée avec ces filtres.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => (
            <div 
              key={session._id} 
              className="bg-card border border-border p-5 rounded-2xl flex flex-col gap-4 hover:border-violet-500/50 transition-colors"
            >
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">{session.title}</h3>
                <p className="text-sm text-muted-foreground">{session.className} ({session.classCode})</p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-400"/> Date</span>
                  <span>{new Date(session.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-400"/> Durée</span>
                  <span>{session.duration} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400"/> Participants</span>
                  <span>{session.participantsCount}</span>
                </div>
              </div>

              <Button 
                onClick={() => router.push(`/teacher/attendance/${session._id}`)}
                className="w-full mt-auto bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Voir les détails
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Users, GraduationCap, Phone, Mail, BookOpen, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getDepartment, getClasses } from '@/lib/api/admin';

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  headOfDepartmentId?: { firstName: string; lastName: string; email: string } | null;
  phone?: string;
  email?: string;
  statistics?: {
    totalTeachers: number;
    totalStudents: number;
    totalPrograms: number;
  };
}

interface Class {
  _id: string;
  name: string;
  code: string;
  level: string;
  currentEnrollment: number;
  capacity: number;
  isActive: boolean;
}

export default function DepartmentDetailPage() {
  const params = useParams();
  const slug = params.slug;
  const router = useRouter();
  const [department, setDepartment] = useState<Department | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [deptData, classesData] = await Promise.all([
        getDepartment(slug as string),
        getClasses({ department: slug as string })
      ]);
      setDepartment(deptData);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 col-span-2" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-xl font-semibold mb-2">Oups !</h2>
        <p className="text-muted-foreground mb-4">{error || 'Département non trouvé'}</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{department.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono">{department.code}</Badge>
              <Badge variant={department.isActive ? "default" : "destructive"}>
                {department.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Department Info */}
        <Card className="lg:col-span-2 shadow-sm border-none bg-gradient-to-br from-card to-muted/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Informations Générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {department.description || 'Aucune description disponible pour ce département.'}
            </p>
            <Separator className="my-4" />
            <div className="grid sm:grid-cols-2 gap-6">
              {department.headOfDepartmentId && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10">
                    <UserCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Chef de Département</p>
                    <p className="text-sm font-medium">
                      {department.headOfDepartmentId.firstName} {department.headOfDepartmentId.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{department.headOfDepartmentId.email}</p>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {department.email && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 rounded-lg bg-primary/10">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Email Contact</p>
                      <p className="text-sm font-medium">{department.email}</p>
                    </div>
                  </div>
                )}
                {department.phone && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 rounded-lg bg-primary/10">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Téléphone</p>
                      <p className="text-sm font-medium">{department.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">Total Étudiants</span>
              </div>
              <span className="text-xl font-bold">{department.statistics?.totalStudents || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span className="text-sm">Total Enseignants</span>
              </div>
              <span className="text-xl font-bold">{department.statistics?.totalTeachers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm">Programmes d'études</span>
              </div>
              <span className="text-xl font-bold">{department.statistics?.totalPrograms || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Classes Associées</h2>
          <Badge variant="secondary" className="px-3">
            {classes.length} {classes.length > 1 ? 'Classes' : 'Classe'}
          </Badge>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground bg-muted/20">
            <Users className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p className="text-lg font-medium">Aucune classe trouvée</p>
            <p className="text-sm">Il n'y a pas encore de classes associées à ce département.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes.map(cls => {
              const enrollmentPercent = Math.min(100, (cls.currentEnrollment / (cls.capacity || 1)) * 100);
              return (
                <Card key={cls._id} className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border-none group cursor-pointer" onClick={() => router.push(`/admin/classes/${cls._id}`)}>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{cls.name}</h3>
                        <p className="text-xs font-mono text-muted-foreground font-medium uppercase tracking-wider">{cls.code}</p>
                      </div>
                      <Badge variant="outline" className="bg-primary/5 border-primary/10 text-primary capitalize font-medium">
                        {cls.level}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Remplissage</span>
                        <span className="font-bold">{cls.currentEnrollment} / {cls.capacity || '∞'}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${enrollmentPercent > 90 ? 'bg-amber-500' : 'bg-primary'}`}
                          style={{ width: `${enrollmentPercent}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${cls.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                          {cls.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold px-2 hover:bg-primary/10 hover:text-primary">
                        Détails
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

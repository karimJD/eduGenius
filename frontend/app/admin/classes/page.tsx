'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit2, Trash2, User, Hash, GraduationCap, Building2, BookOpen, Users, UserPlus } from 'lucide-react';
import {
  getClasses,
  getTeachers,
  getDepartments,
  getSubjects,
  createClass,
  updateClass,
  deleteClass,
  enrollStudent,
  getStudents,
  assignTeacherToClass,
  removeTeacherFromClass
} from '@/lib/api/admin';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  cin: string;
  studentId: string;
  enrollmentNumber?: string;
}

interface Class {
  _id: string;
  name: string;
  code: string;
  departmentId: {
    _id: string;
    name: string;
    code: string;
  } | string;
  programId: {
    _id: string;
    name: string;
    code: string;
  } | string;
  academicYearId: {
    _id: string;
    year: string;
  } | string;
  level: string;
  groupNumber?: number;
  capacity?: number;
  currentEnrollment: number;
  academicAdvisorId?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | string | null;
  isActive: boolean;
  students: any[];
  teachers?: {
    subjectId: { _id: string; name: string } | string;
    teacherId: { _id: string; firstName: string; lastName: string; email: string } | string;
  }[];
}

interface ClassFormState {
  _id?: string;
  name: string;
  code: string;
  departmentId: string;
  level: string;
  groupNumber: number;
  capacity: number;
  academicAdvisorId: string | null;
}

export default function AdminClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<ClassFormState>({
    name: '',
    code: '',
    departmentId: '',
    level: '',
    groupNumber: 1,
    capacity: 30,
    academicAdvisorId: null,
  });

  // Teacher Modal state
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [selectedClassForTeacher, setSelectedClassForTeacher] = useState<Class | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // Enroll Modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedClassToEnroll, setSelectedClassToEnroll] = useState<Class | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [enrollSearchTerm, setEnrollSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes, deptsRes, subjectsRes, studentsRes] = await Promise.all([
        getClasses(),
        getTeachers({ limit: 100 }),
        getDepartments(),
        getSubjects({ limit: 100 }),
        getStudents({ limit: 500 }) // Fetching max students for selection, pagination should ideally be used in a real search.
      ]);
      setClasses(classesRes);
      setTeachers(teachersRes?.teachers || []);
      setDepartments(deptsRes);
      setSubjects(subjectsRes?.subjects || subjectsRes || []);
      setAllStudents(studentsRes?.students || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEnrollModal = (cls: Class) => {
    setSelectedClassToEnroll(cls);
    setIsEnrollModalOpen(true);
    setSelectedStudentIds([]);
    setEnrollSearchTerm('');
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassToEnroll || selectedStudentIds.length === 0) return;
    try {
      // Enroll each selected student sequentially (could be optimized on backend to accept an array)
      for (const studentId of selectedStudentIds) {
        await enrollStudent(selectedClassToEnroll._id, studentId);
      }
      toast.success(`${selectedStudentIds.length > 1 ? 'Étudiants inscrits' : 'Étudiant inscrit'} avec succès`);
      setIsEnrollModalOpen(false);
      fetchData(); // Refresh to show updated enrollment
    } catch (error: any) {
      console.error('Failed to enroll student:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'inscription');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (cls?: Class) => {
    if (cls) {
      setIsEditing(true);
      setFormState({
        _id: cls._id,
        name: cls.name,
        code: cls.code,
        departmentId: typeof cls.departmentId === 'object' ? cls.departmentId._id : cls.departmentId,
        level: cls.level,
        groupNumber: cls.groupNumber || 1,
        capacity: cls.capacity || 30,
        academicAdvisorId: (typeof cls.academicAdvisorId === 'object' ? cls.academicAdvisorId?._id : (cls.academicAdvisorId || null)) as string | null,
      });
    } else {
      setIsEditing(false);
      setFormState({
        name: '',
        code: '',
        departmentId: '',
        level: '',
        groupNumber: 1,
        capacity: 30,
        academicAdvisorId: null,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formState.name,
        code: formState.code.toUpperCase(),
        departmentId: formState.departmentId,
        level: formState.level,
        groupNumber: formState.groupNumber,
        capacity: formState.capacity,
        academicAdvisorId: formState.academicAdvisorId === 'none' ? null : formState.academicAdvisorId,
      };

      if (isEditing && formState._id) {
        await updateClass(formState._id, payload);
        toast.success('Classe mise à jour avec succès');
      } else {
        await createClass(payload);
        toast.success('Classe créée avec succès');
      }
      fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Failed to save class:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment désactiver cette classe ?')) {
      try {
        await deleteClass(id);
        toast.success('Classe désactivée');
        fetchData();
      } catch (error) {
        console.error('Failed to delete class:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const filteredClasses = classes.filter((c) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground uppercase tracking-tight">
            Gestion des Classes
          </h1>
          <p className="text-muted-foreground">Gérez les sections, les conseillers et les inscriptions.</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-6 rounded-2xl flex gap-2 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Classe
        </Button>
      </header>

      <div className="flex items-center gap-4 max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="text"
            placeholder="Rechercher une classe..."
            className="pl-11 bg-card border-border py-6 rounded-2xl focus:ring-primary/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-card border border-border rounded-3xl animate-pulse" />
            ))
          ) : filteredClasses.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground border border-dashed border-border rounded-3xl">
              Aucune classe trouvée.
            </div>
          ) : (
            filteredClasses.map((cls, idx) => (
              <motion.div
                key={cls._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card border border-border rounded-3xl p-6 hover:bg-accent/50 transition-all group relative overflow-hidden premium-card-shadow hover:premium-card-shadow-hover duration-300"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Hash size={80} />
                </div>
                
                <div className="flex justify-between items-start mb-4 relative z-20">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedClassForTeacher(cls);
                        setSelectedSubjectId('');
                        setSelectedTeacherId('');
                        setIsTeacherModalOpen(true);
                      }}
                      className="rounded-xl hover:bg-primary/10 hover:text-primary text-muted-foreground group/teacher relative"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-[10px] rounded opacity-0 group-hover/teacher:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        Professeurs
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEnrollModal(cls)}
                      className="rounded-xl hover:bg-primary/10 hover:text-primary text-muted-foreground group/enroll relative"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-[10px] rounded opacity-0 group-hover/enroll:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        Inscrire
                      </span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleOpenModal(cls)} 
                      className="rounded-xl hover:bg-muted"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(cls._id)} 
                      className="rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div 
                  className="space-y-4 relative z-10 cursor-pointer"
                  onClick={() => router.push(`/admin/classes/${cls._id}`)}
                >
                  <div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight truncate">
                      {cls.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] font-mono px-2 py-0">
                        {cls.code}
                      </Badge>
                      <Badge className="text-[10px] bg-primary/20 text-primary border-none">
                        {cls.level}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="truncate">{typeof cls.departmentId === 'object' ? cls.departmentId.name : cls.departmentId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4 text-primary" />
                      <span>Conseiller: {cls.academicAdvisorId && typeof cls.academicAdvisorId === 'object' ? `${cls.academicAdvisorId.firstName} ${cls.academicAdvisorId.lastName}` : 'Aucun'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{cls.currentEnrollment} / {cls.capacity || '∞'} Etudiants</span>
                    </div>
                    <Badge variant={cls.isActive ? "default" : "destructive"}>
                      {cls.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-background border-border text-foreground rounded-3xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {isEditing ? 'Modifier la Classe' : 'Créer une Classe'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveClass} className="space-y-6 mt-4 relative z-10 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground">Nom de la Classe</Label>
                <Input
                  id="name"
                  className="bg-muted/40 border-border rounded-xl py-6"
                  placeholder="e.g. Master GL - G1"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-muted-foreground">Code</Label>
                <Input
                  id="code"
                  className="bg-muted/40 border-border rounded-xl py-6 font-mono uppercase"
                  placeholder="e.g. MGLG1"
                  value={formState.code}
                  onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Département</Label>
                <Select
                  value={formState.departmentId}
                  onValueChange={(value) => setFormState({...formState, departmentId: value})}
                  required
                >
                  <SelectTrigger className="w-full h-12 rounded-xl border border-border bg-muted/40 px-3">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Niveau / Semestre</Label>
                <Select
                  value={formState.level}
                  onValueChange={(value) => setFormState({...formState, level: value})}
                  required
                >
                  <SelectTrigger className="w-full h-12 rounded-xl border border-border bg-muted/40 px-3">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {['L1', 'L2', 'L3', 'M1', 'M2', 'S1', 'S2', 'S3', 'S4'].map((lv) => (
                      <SelectItem key={lv} value={lv}>{lv}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupNumber" className="text-muted-foreground">Numéro de Groupe</Label>
                <Input
                  id="groupNumber"
                  type="number"
                  className="bg-muted/40 border-border rounded-xl py-6"
                  value={formState.groupNumber}
                  onChange={(e) => setFormState({ ...formState, groupNumber: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-muted-foreground">Capacité Max</Label>
                <Input
                  id="capacity"
                  type="number"
                  className="bg-muted/40 border-border rounded-xl py-6"
                  value={formState.capacity}
                  onChange={(e) => setFormState({ ...formState, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-muted-foreground">Conseiller Académique</Label>
                <Select
                  value={formState.academicAdvisorId || 'none'}
                  onValueChange={(value) => setFormState({...formState, academicAdvisorId: value === 'none' ? null : value})}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl border border-border bg-muted/40 px-3">
                    <SelectValue placeholder="Choisir un enseignant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.firstName} {t.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-muted-foreground rounded-xl px-8">Annuler</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-12 shadow-lg shadow-primary/20 active:scale-95 transition-all">
                {isEditing ? 'Mettre à jour' : 'Créer la Classe'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
        <DialogContent className="bg-background border-border text-foreground rounded-3xl sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Inscrire un étudiant
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Classe : {selectedClassToEnroll?.name} ({selectedClassToEnroll?.code})
            </p>
          </DialogHeader>

          <form onSubmit={handleEnrollStudent} className="space-y-6 mt-4 relative z-10 pb-4">
            <div className="space-y-4">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Rechercher un étudiant par nom ou matricule..."
                  className="pl-11 bg-muted/40 border-border py-4 rounded-xl focus:ring-primary/40"
                  value={enrollSearchTerm}
                  onChange={(e) => setEnrollSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-muted-foreground">
                  <Label>Sélectionner des étudiants</Label>
                  <span className="text-xs">{selectedStudentIds.length} sélectionné(s)</span>
                </div>
                <div className="max-h-64 overflow-y-auto border border-border rounded-xl bg-muted/20 custom-scrollbar">
                  {allStudents
                    .filter((s) =>
                      s.firstName.toLowerCase().includes(enrollSearchTerm.toLowerCase()) ||
                      s.lastName.toLowerCase().includes(enrollSearchTerm.toLowerCase()) ||
                      s.enrollmentNumber?.toLowerCase().includes(enrollSearchTerm.toLowerCase())
                    )
                    .map((student) => {
                      const isCurrentlyEnrolled = selectedClassToEnroll?.students?.some(
                        (enrolledStudent: any) =>
                          (typeof enrolledStudent === 'object' ? enrolledStudent._id : enrolledStudent) === student._id
                      );
                      const isSelected = selectedStudentIds.includes(student._id);

                      return (
                        <div
                          key={student._id}
                          className={`flex items-center gap-3 p-3 border-b border-border last:border-0 cursor-pointer transition-colors ${
                            isCurrentlyEnrolled ? 'opacity-50 cursor-not-allowed bg-muted/40' :
                            isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-accent/50'
                          }`}
                          onClick={() => {
                            if (!isCurrentlyEnrolled) {
                              setSelectedStudentIds(prev => 
                                prev.includes(student._id) 
                                ? prev.filter(id => id !== student._id) 
                                : [...prev, student._id]
                              );
                            }
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.enrollmentNumber || 'N/A'}
                            </p>
                          </div>
                          {isCurrentlyEnrolled && (
                            <Badge variant="secondary" className="ml-auto text-[10px]">Déjà inscrit</Badge>
                          )}
                          {isSelected && (
                            <Badge className="ml-auto text-[10px] bg-primary/20 text-primary border-none">Sélectionné</Badge>
                          )}
                        </div>
                      );
                    })}
                  {allStudents.filter((s) =>
                      s.firstName.toLowerCase().includes(enrollSearchTerm.toLowerCase()) ||
                      s.lastName.toLowerCase().includes(enrollSearchTerm.toLowerCase()) ||
                      s.enrollmentNumber?.toLowerCase().includes(enrollSearchTerm.toLowerCase())
                    ).length === 0 && (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Aucun étudiant trouvé.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-border mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsEnrollModalOpen(false)} className="text-muted-foreground rounded-xl px-6">Annuler</Button>
              <Button
                type="submit"
                disabled={selectedStudentIds.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Inscrire ({selectedStudentIds.length})
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Teacher Assignment Modal */}
      <Dialog open={isTeacherModalOpen} onOpenChange={setIsTeacherModalOpen}>
        <DialogContent className="bg-background border-border text-foreground rounded-3xl sm:max-w-xl max-h-[90vh] overflow-y-auto w-full">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Gérer les Professeurs</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Classe : {selectedClassForTeacher?.name}
            </p>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-2 flex-full w-full">
                <Label>Matière</Label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="w-full h-12 rounded-xl text-foreground bg-background">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border border-border z-[100]">
                    {subjects?.map(s => (
                      <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-full w-full">
                <Label>Enseignant</Label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger className="w-full h-12 rounded-xl text-foreground bg-background">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border border-border z-[100]">
                    {teachers?.map(t => (
                      <SelectItem key={t._id} value={t._id}>{t.firstName} {t.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={async () => {
                  if (!selectedClassForTeacher || !selectedSubjectId || !selectedTeacherId) return;
                  try {
                    await assignTeacherToClass(selectedClassForTeacher._id, selectedSubjectId, selectedTeacherId);
                    toast.success('Professeur assigné avec succès');
                    setSelectedSubjectId('');
                    setSelectedTeacherId('');
                    
                    // Optimistic update
                    const updatedClass = { ...selectedClassForTeacher };
                    const subject = subjects.find(s => s._id === selectedSubjectId);
                    const teacher = teachers.find(t => t._id === selectedTeacherId);
                    
                    if (!updatedClass.teachers) updatedClass.teachers = [];
                    const existingIdx = updatedClass.teachers.findIndex((t: any) => 
                      (typeof t.subjectId === 'object' ? t.subjectId._id : t.subjectId) === selectedSubjectId
                    );
                    
                    const newTeacherObj = { subjectId: subject, teacherId: teacher };
                    
                    if (existingIdx > -1) {
                      updatedClass.teachers[existingIdx] = newTeacherObj;
                    } else {
                      updatedClass.teachers.push(newTeacherObj);
                    }
                    setSelectedClassForTeacher(updatedClass);
                    fetchData();
                  } catch (error) {
                    toast.error("Erreur lors de l'assignation");
                  }
                }}
                disabled={!selectedSubjectId || !selectedTeacherId}
                className="h-12 rounded-xl px-6 w-full sm:w-auto"
              >
                Ajouter
              </Button>
            </div>
            
            <div className="space-y-3">
              <Label>Professeurs actuellement assignés</Label>
              <div className="border border-border rounded-xl divide-y divide-border bg-muted/20">
                {!selectedClassForTeacher?.teachers || selectedClassForTeacher?.teachers?.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">Aucun enseignant assigné.</div>
                ) : (
                  selectedClassForTeacher?.teachers?.map((t: any, idx) => {
                    const subjectName = typeof t.subjectId === 'object' ? t.subjectId.name : 'Matière inconnue';
                    const teacherName = typeof t.teacherId === 'object' ? `${t.teacherId.firstName} ${t.teacherId.lastName}` : 'Enseignant inconnu';
                    return (
                      <div key={idx} className="flex justify-between items-center p-3">
                        <div>
                          <p className="font-semibold text-sm">{subjectName}</p>
                          <p className="text-xs text-muted-foreground">{teacherName}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={async () => {
                            try {
                              const teacherIdToUse = typeof t.teacherId === 'object' ? t.teacherId._id : t.teacherId;
                              await removeTeacherFromClass(selectedClassForTeacher._id, teacherIdToUse);
                              toast.success('Professeur retiré');
                              
                              // Optimistic update
                              const updatedClass = { ...selectedClassForTeacher };
                              updatedClass.teachers = updatedClass.teachers?.filter((ct: any) => 
                                (typeof ct.teacherId === 'object' ? ct.teacherId._id : ct.teacherId) !== teacherIdToUse
                              );
                              setSelectedClassForTeacher(updatedClass);
                              fetchData();
                            } catch (error) {
                              toast.error('Erreur lors du retrait');
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

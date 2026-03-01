'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createStudent } from '@/lib/api/admin';

type FormData = {
  firstName: string;
  lastName: string;
  cin: string;
  email: string;
  password: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: { street: string; city: string; governorate: string };
  student: {
    level: string;
    enrollmentDate: string;
    hasScholarship: boolean;
    hasHousing: boolean;
  };
};

const LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2', 'Ing1', 'Ing2', 'Ing3'];

const steps = ['Informations personnelles', 'Informations académiques', 'Inscription'];

export default function CreateStudentPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: { student: { enrollmentDate: new Date().toISOString().slice(0, 10) } },
  });

  const onSubmit = async (data: FormData) => {
    if (step < steps.length - 1) { setStep(s => s + 1); return; }
    setLoading(true);
    setError('');
    try {
      await createStudent(data as unknown as Record<string, unknown>);
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold">Étudiant créé avec succès !</h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/admin/users/students'}>
            Liste des étudiants
          </Button>
          <Button onClick={() => { setSuccess(false); setStep(0); }}>Ajouter un autre</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-2xl font-bold">Ajouter un étudiant</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="hidden text-center text-xs text-muted-foreground sm:block">{s}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Step 0: Personal info */}
        {step === 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input id="lastName" {...register('lastName', { required: true })} className="mt-1" />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">Champ obligatoire</p>}
              </div>
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input id="firstName" {...register('firstName', { required: true })} className="mt-1" />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">Champ obligatoire</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="cin">CIN * (8 chiffres)</Label>
              <Input id="cin" {...register('cin', { required: true, pattern: /^[0-9]{8}$/ })} className="mt-1" maxLength={8} />
              {errors.cin && <p className="mt-1 text-xs text-red-500">CIN invalide (8 chiffres requis)</p>}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email', { required: true })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe *</Label>
              <Input id="password" type="password" {...register('password', { required: true, minLength: 8 })} className="mt-1" />
              {errors.password && <p className="mt-1 text-xs text-red-500">Minimum 8 caractères</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Genre</Label>
                <select {...register('gender')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">— Sélectionner —</option>
                  <option value="male">Masculin</option>
                  <option value="female">Féminin</option>
                </select>
              </div>
              <div>
                <Label htmlFor="phoneNumber">Téléphone (+216XXXXXXXX)</Label>
                <Input id="phoneNumber" {...register('phoneNumber')} placeholder="+21698765432" className="mt-1" />
              </div>
            </div>
          </>
        )}

        {/* Step 1: Academic info */}
        {step === 1 && (
          <>
            <div>
              <Label>Niveau</Label>
              <select {...register('student.level')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">— Sélectionner —</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Step 2: Enrollment */}
        {step === 2 && (
          <>
            <div>
              <Label htmlFor="enrollmentDate">Date d'inscription</Label>
              <Input id="enrollmentDate" type="date" {...register('student.enrollmentDate')} className="mt-1" />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('student.hasScholarship')} />
                Bénéficiaire d'une bourse
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('student.hasHousing')} />
                Logement universitaire
              </label>
            </div>
          </>
        )}

        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
          </Button>
          <Button type="submit" disabled={loading}>
            {step < steps.length - 1 ? (
              <><span>Suivant</span> <ArrowRight className="ml-2 h-4 w-4" /></>
            ) : loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Enregistrement...
              </span>
            ) : (
              <><Check className="mr-2 h-4 w-4" /> Enregistrer</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

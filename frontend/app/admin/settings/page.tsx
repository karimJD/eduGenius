'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, School, GraduationCap, Lock, Bot, Save } from 'lucide-react';

const tabs = [
  { id: 'institution', label: "Établissement", icon: School },
  { id: 'academic', label: "Paramètres académiques", icon: GraduationCap },
  { id: 'auth', label: "Authentification", icon: Lock },
  { id: 'ai', label: "Fonctionnalités IA", icon: Bot },
] as const;

type TabId = typeof tabs[number]['id'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('institution');
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then(data => setSettings(data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (path: string, value: unknown) => {
    setSettings(prev => {
      const keys = path.split('.');
      const next = { ...prev };
      let obj: Record<string, unknown> = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...(obj[keys[i]] as Record<string, unknown> || {}) };
        obj = obj[keys[i]] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const getValue = (path: string): unknown => {
    return path.split('.').reduce((obj, key) => (obj as Record<string, unknown>)?.[key], settings as unknown);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert('Erreur lors de la sauvegarde'); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Settings className="h-6 w-6" /> Paramètres
        </h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saved ? 'Sauvegardé ✓' : saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === tab.id ? 'bg-card font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        {activeTab === 'institution' && (
          <>
            <h2 className="font-semibold">Informations de l'établissement</h2>
            <div className="space-y-4">
              <div>
                <Label>Nom de l'établissement *</Label>
                <Input
                  className="mt-1"
                  value={(getValue('institutionName') as string) || ''}
                  onChange={e => set('institutionName', e.target.value)}
                />
              </div>
              <div>
                <Label>Nom en arabe</Label>
                <Input
                  className="mt-1 text-right"
                  dir="rtl"
                  value={(getValue('institutionNameArabic') as string) || ''}
                  onChange={e => set('institutionNameArabic', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'academic' && (
          <>
            <h2 className="font-semibold">Paramètres académiques</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Barème des notes</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={(getValue('academicSettings.gradingScale') as number) || 20}
                  onChange={e => set('academicSettings.gradingScale', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Note de passage</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={(getValue('academicSettings.passingGrade') as number) || 10}
                  onChange={e => set('academicSettings.passingGrade', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Semestre actuel</Label>
                <select
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={(getValue('academicSettings.currentSemester') as number) || ''}
                  onChange={e => set('academicSettings.currentSemester', Number(e.target.value))}
                >
                  <option value="">— Sélectionner —</option>
                  <option value={1}>Semestre 1</option>
                  <option value={2}>Semestre 2</option>
                </select>
              </div>
            </div>
          </>
        )}

        {activeTab === 'auth' && (
          <>
            <h2 className="font-semibold">Paramètres d'authentification</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Longueur minimale du mot de passe</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={(getValue('authSettings.passwordMinLength') as number) || 8}
                  onChange={e => set('authSettings.passwordMinLength', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Timeout de session (minutes)</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={(getValue('authSettings.sessionTimeout') as number) || 120}
                  onChange={e => set('authSettings.sessionTimeout', Number(e.target.value))}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'ai' && (
          <>
            <h2 className="font-semibold">Fonctionnalités IA</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={(getValue('aiSettings.quizGenerationEnabled') as boolean) ?? true}
                  onChange={e => set('aiSettings.quizGenerationEnabled', e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <div>
                  <p className="font-medium">Génération de quiz par IA</p>
                  <p className="text-sm text-muted-foreground">Permet aux enseignants de générer des quiz automatiquement</p>
                </div>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={(getValue('aiSettings.summaryGenerationEnabled') as boolean) ?? true}
                  onChange={e => set('aiSettings.summaryGenerationEnabled', e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <div>
                  <p className="font-medium">Génération de résumés par IA</p>
                  <p className="text-sm text-muted-foreground">Permet la génération automatique de résumés de cours</p>
                </div>
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

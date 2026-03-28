'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2, FileText, List, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerateSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: { _id: string; name: string }[];
  onGenerate: (data: { classId: string; style: string }) => Promise<void>;
}

const STYLES = [
  {
    id: 'detailed',
    title: 'Détaillé',
    desc: 'Un résumé complet couvrant tous les aspects.',
    icon: FileText,
  },
  {
    id: 'bullets',
    title: 'Points clés',
    desc: 'Idéal pour une lecture rapide et directe.',
    icon: List,
  },
  {
    id: 'cheatSheet',
    title: 'Fiche Mémo',
    desc: 'Focus sur les formules et concepts essentiels.',
    icon: Layers,
  },
];

export function GenerateSummaryModal({
  open,
  onOpenChange,
  classes,
  onGenerate,
}: GenerateSummaryModalProps) {
  const [classId, setClassId] = useState('');
  const [style, setStyle] = useState('detailed');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;

    try {
      setLoading(true);
      await onGenerate({ classId, style });
      onOpenChange(false);
      setClassId(''); // reset
    } catch (error) {
      console.error('Failed to generate summary', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-[#111111] border-[#222222] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
               <BrainCircuit className="w-5 h-5 text-purple-400" />
            </div>
            Nouveau Résumé IA
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">
              1. Sélectionnez la matière
            </label>
            <select
              required
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333333] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="">Choisir un cours...</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">
              2. Style du résumé
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
                    style === s.id
                      ? "bg-purple-500/10 border-purple-500"
                      : "bg-[#0a0a0a] border-[#333333] hover:border-[#444444]"
                  )}
                >
                  <s.icon className={cn(
                    "w-5 h-5 mb-2",
                    style === s.id ? "text-purple-400" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "font-medium text-sm mb-1",
                    style === s.id ? "text-white" : "text-gray-300"
                  )}>{s.title}</span>
                  <span className="text-[10px] text-gray-500 leading-tight">
                    {s.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#222222]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#333333] text-gray-300 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !classId}
              className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4 mr-2" />
                  Générer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

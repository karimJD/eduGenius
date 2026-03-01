'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface FilterBarProps {
  filters: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function FilterBar({ filters, onRemove, onClearAll }: FilterBarProps) {
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map(f => (
        <span
          key={f.key}
          className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
        >
          <span className="font-medium">{f.label}:</span> {f.value}
          <button onClick={() => onRemove(f.key)} className="ml-1 hover:opacity-70">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll} className="text-muted-foreground">
        Tout effacer
      </Button>
    </div>
  );
}

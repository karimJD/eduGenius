'use client';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
}

export function SearchBar({ placeholder = 'Rechercher...', onSearch, debounceMs = 400 }: SearchBarProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </div>
  );
}

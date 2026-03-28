'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, X, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardDeck {
  _id: string;
  title: string;
  classId: string;
  flashcards: Flashcard[];
}

interface FlashcardViewerProps {
  deck: FlashcardDeck;
  onClose: () => void;
}

export function FlashcardViewer({ deck, onClose }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  if (!deck.flashcards || deck.flashcards.length === 0) {
    return (
      <div className="bg-[#111111] border border-[#222222] rounded-3xl p-8 text-center max-w-2xl mx-auto">
         <Layers className="w-12 h-12 text-gray-500 mx-auto mb-4" />
         <h3 className="text-xl font-bold text-white mb-2">Aucune carte</h3>
         <p className="text-gray-400 mb-6">Ce deck ne contient aucune flashcard.</p>
         <Button onClick={onClose} variant="outline" className="text-white border-[#333333]">Retour</Button>
      </div>
    );
  }

  const handleNext = () => {
    if (currentIndex < deck.flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(i => i + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(i => i - 1), 150);
    }
  };

  const card = deck.flashcards[currentIndex];
  const progress = ((currentIndex + 1) / deck.flashcards.length) * 100;

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-3xl overflow-hidden shadow-xl max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-[#222222] flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
               <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <div>
               <h2 className="text-lg font-bold text-white">Révison : {deck.title}</h2>
               <p className="text-xs text-gray-400">
                 Carte {currentIndex + 1} sur {deck.flashcards.length}
               </p>
            </div>
         </div>
         <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-[#222222] rounded-full">
            <X className="w-5 h-5" />
         </Button>
      </div>

      {/* Progress */}
      <div className="h-1 bg-[#222222] w-full">
        <motion.div 
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card Area */}
      <div className="p-6 sm:p-12 min-h-[400px] flex items-center justify-center perspective-1000">
         <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex + (isFlipped ? '-back' : '-front')}
              initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsFlipped(!isFlipped)}
              className={cn(
                "w-full max-w-lg aspect-[4/3] rounded-2xl cursor-pointer p-8 flex items-center justify-center text-center shadow-2xl relative",
                isFlipped 
                  ? "bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-2 border-purple-500/50" 
                  : "bg-[#1a1a1a] border border-[#333333] hover:border-purple-500/30"
              )}
              style={{ transformStyle: 'preserve-3d' }}
            >
               <div className="absolute top-4 right-4">
                  <RotateCcw className={cn("w-5 h-5", isFlipped ? "text-purple-400" : "text-gray-500")} />
               </div>
               
               <div className="space-y-4">
                 <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-2">
                   {isFlipped ? 'Réponse' : 'Question'}
                 </span>
                 <p className={cn(
                   "font-medium",
                   isFlipped ? "text-xl sm:text-2xl text-white" : "text-2xl sm:text-3xl text-white leading-tight"
                 )}>
                   {isFlipped ? card.back : card.front}
                 </p>
               </div>
               
               <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="text-xs text-gray-500">Cliquez pour retourner</span>
               </div>
            </motion.div>
         </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="p-4 sm:p-6 border-t border-[#222222] flex items-center justify-between bg-[#0a0a0a]">
         <Button 
           variant="outline" 
           onClick={handlePrev} 
           disabled={currentIndex === 0}
           className="border-[#333333] text-gray-300 hover:text-white hover:bg-[#222222] w-12 h-12 rounded-xl p-0"
         >
           <ChevronLeft className="w-5 h-5" />
         </Button>
         
         <div className="flex gap-2">
            {!isFlipped ? (
               <Button 
                 onClick={() => setIsFlipped(true)}
                 className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-8 h-12 font-bold"
               >
                 Voir la réponse
               </Button>
            ) : currentIndex < deck.flashcards.length - 1 ? (
               <Button 
                 onClick={handleNext}
                 className="bg-white text-black hover:bg-gray-200 rounded-xl px-8 h-12 font-bold"
               >
                 Carte Suivante
               </Button>
            ) : (
               <Button 
                 onClick={onClose}
                 className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 h-12 font-bold"
               >
                 Terminer la session
               </Button>
            )}
         </div>

         <Button 
           variant="outline" 
           onClick={handleNext} 
           disabled={currentIndex === deck.flashcards.length - 1}
           className="border-[#333333] text-gray-300 hover:text-white hover:bg-[#222222] w-12 h-12 rounded-xl p-0"
         >
           <ChevronRight className="w-5 h-5" />
         </Button>
      </div>
    </div>
  );
}

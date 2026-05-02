'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Key,
  GraduationCap,
  Book,
  Camera,
  Save
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { PageHeader } from '../../../components/student/PageHeader';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: '06 12 34 56 78', // Mock
        address: '123 Rue de Paris, 75001 Paris', // Mock
        bio: 'Étudiant passionné par les sciences et l\'informatique. Toujours prêt à apprendre de nouvelles choses !' // Mock
      });
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // In a real app, send to API
    alert('Profil mis à jour ! (Simulation)');
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <PageHeader 
        title="Profil & Paramètres"
        description="Gérez vos informations personnelles et vos préférences de compte."
        icon={User}
        badgeText="Mon Compte"
        badgeClassName="bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"
      />

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-sm">
         {/* Decorative background */}
         <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-50" />
         
         <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 pt-12">
            <div className="relative group">
               <div className="w-32 h-32 rounded-3xl bg-zinc-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 shadow-xl overflow-hidden flex items-center justify-center">
                  <div className="text-4xl font-bold text-zinc-400 dark:text-zinc-500">
                     {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
               </div>
               <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                  <Camera className="w-5 h-5" />
               </button>
            </div>
            
            <div className="flex-1 text-center sm:text-left">
               <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{user.firstName} {user.lastName}</h1>
               <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2 text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-sm font-medium">
                     <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                     Étudiant
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                     <Book className="w-4 h-4" />
                     Niveau : Terminale S
                  </span>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Settings Navigation (Sidebar) */}
         <div className="md:col-span-1 space-y-2 relative">
            <div className="sticky top-24">
               <button className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-medium border border-zinc-200 dark:border-zinc-700 mb-2 transition-colors">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Informations Personnelles
               </button>
               <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl font-medium transition-colors mb-2">
                  <Shield className="w-5 h-5" />
                  Sécurité & Mot de passe
               </button>
               <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl font-medium transition-colors">
                  <Mail className="w-5 h-5" />
                  Préférences de Notification
               </button>
            </div>
         </div>

         {/* Form Area */}
         <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
               <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">Détails du Profil</h2>
               
               <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1">Prénom</label>
                        <input 
                           type="text" 
                           name="firstName"
                           value={formData.firstName}
                           onChange={handleChange}
                           className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1">Nom</label>
                        <input 
                           type="text" 
                           name="lastName"
                           value={formData.lastName}
                           onChange={handleChange}
                           className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Adresse Email
                     </label>
                     <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Téléphone
                     </label>
                     <input 
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Adresse Postale
                     </label>
                     <input 
                        type="text" 
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1">À propos de moi</label>
                     <textarea 
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium resize-none"
                     />
                  </div>
               </div>

               <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                  <Button 
                     onClick={handleSave}
                     className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-blue-600/20"
                  >
                     <Save className="w-4 h-4 mr-2" />
                     Enregistrer les modifications
                  </Button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

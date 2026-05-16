'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, KeyRound, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { forgotPassword } from '../../services/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'envoi de l\'e-mail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-zinc-950 overflow-hidden font-sans">
      {/* Left side: Content & Visual */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden border-r border-zinc-100 dark:border-zinc-800">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">EduGenius</span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-5xl font-extrabold text-zinc-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
              Vous avez perdu vos <span className="text-blue-600">clés</span> ?
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Ne vous inquiétez pas ! Entrez votre adresse e-mail et nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe et vous permettre de retourner en classe.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-auto flex justify-center">
          <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full"></div>
            <div className="relative z-10 w-64 h-64 bg-white dark:bg-zinc-800 rounded-[3rem] shadow-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700 rotate-6 animate-float">
               <KeyRound className="w-32 h-32 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex items-center justify-center p-8 relative overflow-hidden bg-white dark:bg-zinc-950">
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">EduGenius</span>
        </div>

        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="w-full max-w-md relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
          >
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 mb-6 group transition-all duration-300 hover:scale-110">
                <KeyRound className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform" />
              </div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
                Réinitialiser le mot de passe
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Entrez votre adresse e-mail pour recevoir un lien de récupération
              </p>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Vérifiez votre boîte de réception</h3>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Nous avons envoyé un lien de réinitialisation à <br />
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{email}</span>
                  </p>
                </div>
                <Link href="/login" className="block">
                  <Button className="w-full py-6 mt-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-2xl border-none shadow-xl shadow-zinc-500/20 transition-all duration-300">
                    Retour à la connexion
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Adresse Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="email"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-300"
                      placeholder="nom@ecole.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-6 mt-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-2xl border-none shadow-xl shadow-zinc-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    <span>Envoyer le lien de réinitialisation</span>
                  )}
                </Button>

                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                  <Link href="/login" className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-all group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour à la connexion
                  </Link>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

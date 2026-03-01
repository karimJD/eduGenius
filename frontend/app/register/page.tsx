'use client';

import { AuthForm } from '../../components/ui/AuthForm';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();

  const handleRegister = async (data: any) => {
    return await register(data.firstName, data.lastName, data.email, data.password, data.role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      <div className="absolute bottom-0 right-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] translate-x-1/2" />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <AuthForm type="register" onSubmit={handleRegister} />
      </div>
    </div>
  );
}

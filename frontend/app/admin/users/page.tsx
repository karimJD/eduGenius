'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX, Shield, GraduationCap, School } from 'lucide-react';
import api from '@/lib/axios';
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

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'student',
    isActive: true,
  });
  const [password, setPassword] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setIsEditing(true);
      setCurrentUser(user);
      setPassword(''); 
    } else {
      setIsEditing(false);
      setCurrentUser({
        firstName: '',
        lastName: '',
        email: '',
        role: 'student',
        isActive: true,
      });
      setPassword('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const payload: any = { ...currentUser };
        if (password) payload.password = password;
        await api.put(`/users/${currentUser._id}`, payload);
      } else {
        await api.post('/users', { ...currentUser, password });
      }
      fetchUsers();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Error saving user');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const filteredUsers = users.filter((u) => 
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
      switch(role) {
          case 'admin': return <Shield className="w-4 h-4" />;
          case 'teacher': return <School className="w-4 h-4" />;
          case 'student': return <GraduationCap className="w-4 h-4" />;
          default: return null;
      }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
        case 'admin': return 'bg-primary/10 text-primary border-primary/20';
        case 'teacher': return 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20';
        case 'student': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
        default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-8 mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground">Manage students, teachers, and platform administrators.</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
        >
          <Plus className="w-5 h-5" />
          Add New User
        </Button>
      </header>

      <div className="bg-card border border-border rounded-3xl overflow-hidden backdrop-blur-sm relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        
        {/* Toolbar */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Search by name, email, or role..."
              className="pl-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Showing <span className="text-foreground font-medium">{filteredUsers.length}</span> users
          </div>
        </div>

        {/* List */}
      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden premium-card-shadow relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-8 py-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">User</th>
                <th className="px-8 py-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">Role</th>
                <th className="px-8 py-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-8 py-6 text-sm font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-muted-foreground">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <motion.tr 
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-accent/40 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shadow-sm group-hover:scale-105 transition-transform">
                          {user.firstName?.[0] ?? '?'}{user.lastName?.[0] ?? '?'}
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors text-lg">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      {user.isActive ? (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                          <UserCheck className="w-4 h-4" /> Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-destructive text-sm font-bold">
                          <UserX className="w-4 h-4" /> Inactive
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => handleOpenModal(user)} 
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => handleDelete(user._id)} 
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div> {/* ← closes outer card div (line 159) */}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-background border-border text-foreground rounded-3xl sm:max-w-lg overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-bold">
                {isEditing ? 'Edit Account' : 'Create Account'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSaveUser} className="space-y-6 mt-4 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  required
                  value={currentUser.firstName}
                  onChange={(e) => setCurrentUser({...currentUser, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  required
                  value={currentUser.lastName}
                  onChange={(e) => setCurrentUser({...currentUser, lastName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                value={currentUser.email}
                onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {isEditing ? 'New Password (Optional)' : 'Password'}
              </Label>
              <Input
                id="password"
                type="password"
                required={!isEditing}
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Account Role</Label>
                <Select
                  value={currentUser.role}
                  onValueChange={(value) => setCurrentUser({...currentUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end pb-2">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={currentUser.isActive}
                            onChange={(e) => setCurrentUser({...currentUser, isActive: e.target.checked})}
                        />
                    <div className={`w-12 h-6 rounded-full transition-colors ${currentUser.isActive ? 'bg-primary' : 'bg-muted'}`}></div>
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-background rounded-full transition-transform ${currentUser.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Active Status</span>
             </label>
          </div>
        </div>

        <DialogFooter className="pt-6 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
              >
                {isEditing ? 'Update Account' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

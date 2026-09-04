import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Clock, Star, Activity, Search, Filter } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { isQuotaExceededError, markQuotaExceeded, safeFirestoreWrite } from '../lib/firestoreService';

interface AudienceMember {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  isNewUser: boolean;
  engagementScore: number;
  firstSeen: string;
  lastSeen: string;
}

export function AudiencePanel() {
  const [audience, setAudience] = useState<AudienceMember[]>(() => {
    try {
      const saved = localStorage.getItem('pwstream_audience_local');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'active'>('all');

  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const q = query(collection(db, 'users', userId, 'audience'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AudienceMember));
      if (data.length > 0) {
        setAudience(data);
        localStorage.setItem('pwstream_audience_local', JSON.stringify(data));
      }
    }, (error) => {
      if (isQuotaExceededError(error)) {
        markQuotaExceeded();
      } else {
        console.warn('Error fetching audience from Firestore:', error?.message || error);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddMockUser = async () => {
    const newId = `user-${Date.now()}`;
    const isNew = Math.random() > 0.5;
    const newMember: AudienceMember = {
      id: newId,
      name: `Usuário ${Math.floor(Math.random() * 1000)}`,
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      avatar: `https://i.pravatar.cc/150?u=${newId}`,
      isNewUser: isNew,
      engagementScore: Math.floor(Math.random() * 100),
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };

    setAudience(prev => {
      const updated = [newMember, ...prev];
      localStorage.setItem('pwstream_audience_local', JSON.stringify(updated));
      return updated;
    });

    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    await safeFirestoreWrite(() => {
      return setDoc(doc(db, 'users', userId, 'audience', newId), newMember);
    });
  };

  const filteredAudience = audience.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                          (user.email && user.email.toLowerCase().includes(search.toLowerCase()));
    
    if (filter === 'new') return matchesSearch && user.isNewUser;
    if (filter === 'active') return matchesSearch && user.engagementScore > 50;
    return matchesSearch;
  });

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <Users size={18} className="text-blue-500" />
          CRM da Audiência
        </h2>
        <button 
          onClick={handleAddMockUser}
          className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition-colors"
          title="Adicionar usuário mock"
        >
          <UserPlus size={16} />
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar espectadores..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0F1115] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="bg-[#0F1115] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="all">Todos</option>
          <option value="new">Novos</option>
          <option value="active">Mais Ativos</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredAudience.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-10">
            Nenhum usuário encontrado na sua base.
          </div>
        ) : (
          filteredAudience.map(user => (
            <div key={user.id} className="bg-[#0F1115] border border-slate-800/80 hover:border-slate-700 p-3 rounded-xl flex items-center gap-3 transition-colors">
              <img 
                src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} 
                alt={user.name} 
                className="w-10 h-10 rounded-full border border-slate-700 object-cover"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white truncate">{user.name}</h3>
                  {user.isNewUser && (
                    <span className="shrink-0 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Novo</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user.email || 'Sem e-mail cadastrado'}
                </div>
                
                <div className="flex gap-3 mt-1.5 text-[9px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Activity size={10} className={user.engagementScore > 50 ? 'text-amber-400' : 'text-slate-500'} />
                    Score: {user.engagementScore}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(user.lastSeen).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

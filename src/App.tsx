import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { 
  LayoutDashboard, Users, UserPlus, Search, Trash2, Edit, 
  Briefcase, CheckCircle2, Clock, Target, FileText, 
  LogOut, Shield, UserCog, Menu, Loader2, Calendar, User, Lock, Filter, KeyRound
} from 'lucide-react';

// --- IMPORTAMOS EL NUEVO LOGO ---
import logoM from './assets/m-logo.png';

// --- IMPORTACIONES ---
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { SectionHeader } from './components/ui/SectionHeader';
import ContactForm from './components/crm/ContactForm';

// --- VERSIÓN ACTUALIZADA ---
const APP_VERSION = "V9.1 - Login Desplegable"; 

// --- CONFIGURACIÓN SUPER ADMIN ---
const SUPER_ADMIN_EMAIL = "jesusblanco@mmesl.com";

// --- ESTILOS COMUNES ---
const inputClass = "w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-sm";
const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";
const selectClass = "w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none text-sm";

// --- COMPONENTES AUXILIARES ---

// 1. VISTA ADMINISTRACIÓN
const AdminView = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [newPass, setNewPass] = useState('');
    const [newName, setNewName] = useState(''); 
    const [newRole, setNewRole] = useState('sales');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const { data } = await supabase.from('profiles').select('*').order('email');
        setUsers(data || []);
    };

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data, error } = await supabase.auth.signUp({ 
            email: newEmail, 
            password: newPass, 
            options: { data: { role: newRole, full_name: newName } } 
        });

        if (error) {
            alert('Error: ' + error.message);
        } else if (data.user) {
            await supabase.from('profiles').insert([{ 
                id: data.user.id, 
                email: newEmail, 
                role: newRole,
                full_name: newName 
            }]);
            
            alert('Usuario creado correctamente.');
            setNewEmail(''); setNewPass(''); setNewName('');
            fetchUsers();
        }
    };

    const updateUserField = async (id: string, field: string, value: string, currentValue: string) => {
        if (value === currentValue) return;
        const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', id);
        if (!error) {
             setUsers(users.map(u => u.id === id ? { ...u, [field]: value } : u));
        } else {
            alert('Error al actualizar: ' + error.message);
            fetchUsers(); 
        }
    };

    const deleteUser = async (id: string, email: string) => {
        if (email === SUPER_ADMIN_EMAIL) {
            alert("Acción no permitida: No puedes borrar al Super Admin.");
            return;
        }
        if (!window.confirm(`¿Estás SEGURO de eliminar a ${email}?`)) return;
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) alert('Error: ' + error.message);
        else setUsers(users.filter(u => u.id !== id));
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-24">
             <Card className="p-6 border-l-4 border-l-purple-600">
                <SectionHeader title="Gestión de Usuarios" icon={Shield} subtitle="Crear, Editar y Eliminar usuarios" />
                <form onSubmit={createUser} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-1"><label className={labelClass}>Email</label><input type="email" required className={inputClass} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@..." /></div>
                    <div className="md:col-span-1"><label className={labelClass}>Nombre</label><input type="text" required className={inputClass} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Juan Pérez" /></div>
                    <div className="md:col-span-1"><label className={labelClass}>Contraseña</label><input type="text" required className={inputClass} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 6 car." /></div>
                    <div className="md:col-span-1"><label className={labelClass}>Rol</label><select className={selectClass} value={newRole} onChange={e => setNewRole(e.target.value)}><option value="sales">Comercial</option><option value="manager">Jefe Ventas</option><option value="admin">Administrador</option></select></div>
                    <Button type="submit" icon={UserPlus} className="w-full">Crear</Button>
                </form>
                <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                    <table className="w-full text-sm text-left bg-white">
                        <thead className="bg-slate-100 text-slate-500 uppercase font-bold text-xs">
                            <tr><th className="p-4">Email</th><th className="p-4">Nombre</th><th className="p-4">Rol</th><th className="p-4 text-right">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => {
                                const isSuperAdmin = u.email === SUPER_ADMIN_EMAIL;
                                return (
                                <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4 font-medium text-slate-700 flex items-center gap-2">{u.email}{isSuperAdmin && <span title="Super Admin"><Lock size={12} className="text-amber-500"/></span>}</td>
                                    <td className="p-3"><div className="relative"><input className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1.5 outline-none text-slate-800" defaultValue={u.full_name || ''} onBlur={(e) => updateUserField(u.id, 'full_name', e.target.value, u.full_name)} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} /><Edit size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none" /></div></td>
                                    <td className="p-3"><select className={`p-1.5 border rounded w-full text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : u.role === 'manager' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-slate-700 border-slate-200'} ${isSuperAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} value={u.role} disabled={isSuperAdmin} onChange={(e) => updateUserField(u.id, 'role', e.target.value, u.role)}><option value="sales">Comercial</option><option value="manager">Jefe Ventas</option><option value="admin">Administrador</option></select></td>
                                    <td className="p-3 text-right">{!isSuperAdmin && (<button onClick={() => deleteUser(u.id, u.email)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>)}</td>
                                </tr>
                            )})} 
                        </tbody>
                    </table>
                </div>
             </Card>
        </div>
    );
};

// 2. VISTA DASHBOARD
const DashboardView = ({ contacts, userRole, session, setEditingContact, setView, userProfile }: any) => {
    const [filterUserId, setFilterUserId] = useState<string>('all');

    const uniqueSalesUsers = Array.from(new Set(contacts.map((c: any) => c.user_id)))
        .map(id => {
            const contact = contacts.find((c: any) => c.user_id === id);
            const name = contact?.profiles?.full_name || contact?.profiles?.email || 'Desconocido';
            return { id, label: name };
        })
        .filter(u => u.label !== 'Desconocido');

    let relevantContacts = contacts;
    if (userRole === 'sales') {
        relevantContacts = contacts.filter((c: any) => c.user_id === session.user.id);
    } else {
        if (filterUserId !== 'all') {
            relevantContacts = contacts.filter((c: any) => c.user_id === filterUserId);
        }
    }

    const total = relevantContacts.length;
    const clients = relevantContacts.filter((c: any) => c.sap_status === 'Cliente SAP').length;
    const leads = relevantContacts.filter((c: any) => ['Lead SAP', 'Nuevo Prospecto'].includes(c.sap_status)).length;
    const today = new Date().toISOString().split('T')[0];
    const pending = relevantContacts.filter((c: any) => c.next_action_date && c.next_action_date <= today).length;

    const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Usuario';

    return (
      <div className="space-y-6 animate-in fade-in duration-500 w-full overflow-hidden pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-1 gap-4">
             <div>
                <h2 className="text-lg md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                    Hola, <span className="text-blue-600">{displayName}</span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{userRole === 'sales' ? 'Comercial' : userRole === 'manager' ? 'Jefe Ventas' : 'Administrador'}</span>
                    <span className="text-[10px] text-slate-400">{APP_VERSION}</span>
                </div>
             </div>

             {(userRole !== 'sales') && (
                 <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <Filter size={14} className="text-slate-400 ml-1" />
                    <select 
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer min-w-[150px]"
                        value={filterUserId}
                        onChange={(e) => setFilterUserId(e.target.value)}
                    >
                        <option value="all">Ver: Todos</option>
                        <option disabled>──────────</option>
                        {uniqueSalesUsers.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.label}</option>
                        ))}
                    </select>
                 </div>
             )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
          <Card className="p-4 border-l-4 border-l-blue-600 flex justify-between items-center"><div><p className="text-xs text-slate-500 font-bold uppercase">Total</p><h3 className="text-2xl font-bold text-slate-900">{total}</h3></div><div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Users size={20}/></div></Card>
          <Card className="p-4 border-l-4 border-l-emerald-500 flex justify-between items-center"><div><p className="text-xs text-slate-500 font-bold uppercase">Clientes</p><h3 className="text-2xl font-bold text-slate-900">{clients}</h3></div><div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><CheckCircle2 size={20}/></div></Card>
          <Card className="p-4 border-l-4 border-l-indigo-500 flex justify-between items-center"><div><p className="text-xs text-slate-500 font-bold uppercase">Prospectos</p><h3 className="text-2xl font-bold text-slate-900">{leads}</h3></div><div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Target size={20}/></div></Card>
          <Card className={`p-4 border-l-4 flex justify-between items-center ${pending > 0 ? 'border-l-red-500 bg-red-50/30' : 'border-l-slate-300'}`}><div><p className="text-xs text-slate-500 font-bold uppercase">Hoy</p><h3 className={`text-2xl font-bold ${pending > 0 ? 'text-red-600' : 'text-slate-900'}`}>{pending}</h3></div><div className="bg-white p-2 rounded-lg text-slate-400 border border-slate-100"><Clock size={20}/></div></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <Card className="p-4 md:p-6 h-full">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Calendar className="text-blue-600"/> Agenda {filterUserId !== 'all' && <span className="text-xs font-normal text-slate-400 ml-2">(Filtrada)</span>}</h3>
            <div className="space-y-3">
               {relevantContacts.filter((c: any) => c.next_action_date).sort((a: any, b: any) => new Date(a.next_action_date).getTime() - new Date(b.next_action_date).getTime()).slice(0,5).map((c: any) => (
                 <div key={c.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm active:bg-blue-50 transition-colors cursor-pointer" onClick={() => { setEditingContact(c); setView('form'); }}>
                   <div className="min-w-0"><span className="font-bold text-slate-800 text-sm block truncate">{c.next_action}</span><p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate"><FileText size={12}/> {c.fiscal_name}</p></div>
                   <div className="text-right shrink-0 ml-2"><p className={`text-xs font-bold ${c.next_action_date <= today ? 'text-red-600' : 'text-blue-600'}`}>{c.next_action_date}</p><p className="text-xs text-slate-400">{c.next_action_time?.slice(0,5)}</p></div>
                 </div>
               ))}
               {relevantContacts.length === 0 && <div className="p-6 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">Sin acciones para esta selección.</div>}
            </div>
          </Card>
          <Card className="p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-white to-slate-50">
             <div className="p-4 mb-4"><img src={logoM} alt="Logo" className="w-16 h-16 object-contain opacity-90" /></div>
             <h3 className="font-bold text-lg text-slate-800 mb-2">Comenzar Trabajo</h3>
             <Button onClick={() => { setEditingContact(null); setView('form'); }} icon={UserPlus} className="px-6 py-3 shadow-xl w-full md:w-auto">Nuevo Briefing</Button>
          </Card>
        </div>
      </div>
    );
};

// 3. VISTA LISTA
const ListView = ({ contacts, loading, searchTerm, setSearchTerm, userRole, session, setEditingContact, setView, handleDelete }: any) => {
    const [viewFilter, setViewFilter] = useState<string>('all'); 
    
    let displayContacts = contacts;

    if (userRole === 'sales') {
        displayContacts = contacts.filter((c: any) => c.user_id === session.user.id);
    } else {
        if (viewFilter === 'mine') {
            displayContacts = contacts.filter((c: any) => c.user_id === session.user.id);
        } else if (viewFilter !== 'all') {
            displayContacts = contacts.filter((c: any) => c.user_id === viewFilter);
        }
    }

    const filtered = displayContacts.filter((c: any) => 
        c.fiscal_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const uniqueSalesUsers = Array.from(new Set(contacts.map((c: any) => c.user_id)))
        .map(id => {
            const contact = contacts.find((c: any) => c.user_id === id);
            const name = contact?.profiles?.full_name || contact?.profiles?.email || 'Desconocido';
            return { id, label: name };
        })
        .filter(u => u.label !== 'Desconocido');

    return (
      <div className="space-y-4 animate-in fade-in duration-500 pb-24 w-full overflow-hidden">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                   <h2 className="text-xl font-bold text-slate-800">Base de Datos</h2>
                   <p className="text-xs text-slate-500">
                       {userRole === 'sales' ? 'Mis Fichas' : `Mostrando: ${viewFilter === 'all' ? 'Todos' : viewFilter === 'mine' ? 'Mis Fichas' : 'Filtro Usuario'}`}
                   </p>
               </div>

               {(userRole === 'manager' || userRole === 'admin') && (
                   <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200 w-full md:w-auto overflow-x-auto">
                       <button onClick={() => setViewFilter('all')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${viewFilter === 'all' ? 'bg-white text-blue-600 shadow-sm border' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
                       <button onClick={() => setViewFilter('mine')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${viewFilter === 'mine' ? 'bg-white text-blue-600 shadow-sm border' : 'text-slate-500 hover:text-slate-700'}`}>Míos</button>
                       <div className="h-4 w-px bg-slate-300 mx-1"></div>
                       <select 
                            value={viewFilter !== 'all' && viewFilter !== 'mine' ? viewFilter : ''} 
                            onChange={(e) => setViewFilter(e.target.value || 'all')}
                            className="bg-transparent text-xs font-bold text-slate-600 outline-none min-w-[120px]"
                       >
                           <option value="">Filtrar por usuario...</option>
                           {uniqueSalesUsers.map((u: any) => (
                               <option key={u.id} value={u.id}>{u.label}</option>
                           ))}
                       </select>
                   </div>
               )}
           </div>

           <div className="relative w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Buscar empresa o contacto..." className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        </div>

        {loading ? <div className="text-center p-20"><Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={32}/><p className="text-slate-500">Cargando...</p></div> : (
          <div className="grid gap-3 w-full">
            {filtered.length === 0 && <div className="text-center py-10 text-slate-400">No se encontraron resultados.</div>}
            {filtered.map((c: any) => (
              <Card key={c.id} className="p-4 hover:shadow-lg transition-all border border-slate-200">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1 mb-2">
                        <h3 className="font-bold text-base text-slate-900 truncate">{c.fiscal_name}</h3>
                        <div className="flex gap-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border w-fit ${c.sap_status === 'Cliente SAP' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{c.sap_status}</span>
                            {(userRole !== 'sales' && c.profiles) && (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200 flex items-center gap-1 max-w-[120px] truncate">
                                    <User size={10}/> {c.profiles.full_name || c.profiles.email.split('@')[0]}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-slate-600"><span className="flex items-center gap-2 truncate"><Users size={14} className="text-slate-400 shrink-0"/> {c.contact_person || 'Sin contacto'}</span><span className="flex items-center gap-2 truncate"><Briefcase size={14} className="text-slate-400 shrink-0"/> <span className="text-slate-500 text-xs">Titular:</span> {c.profiles?.full_name || c.profiles?.email || 'N/A'}</span></div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0"><button onClick={() => { setEditingContact(c); setView('form'); }} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg"><Edit size={18}/></button>{(userRole === 'admin' || c.user_id === session.user.id) && (<button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg"><Trash2 size={18}/></button>)}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('sales');
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [view, setView] = useState('dashboard');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingContact, setEditingContact] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  // AUTH STATES
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // NUEVO: Lista de usuarios para el login
  const [loginUsersList, setLoginUsersList] = useState<any[]>([]);

  // NUEVO: ESTADO PARA CONTROLAR EL MODO RECUPERACIÓN DE CONTRASEÑA
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Cargar lista de usuarios al inicio (Para el login)
  useEffect(() => {
    async function loadLoginUsers() {
        const { data } = await supabase.from('profiles').select('email, full_name').order('full_name');
        if (data) setLoginUsersList(data);
    }
    // Solo cargamos si no hay sesión
    if (!session) loadLoginUsers();
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // AQUÍ DETECTAMOS SI VIENE DEL LINK DE RECUPERACIÓN
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
      
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else { 
          setContacts([]); 
          setUserRole('sales'); 
          setUserProfile(null); 
          setRecoveryMode(false); // Reset al salir
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchContacts();
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [session]);

  async function fetchUserProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
        setUserRole(data.role);
        setUserProfile(data);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return alert("Selecciona un usuario");
    
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setAuthLoading(false);
  }

  async function handleResetPassword() {
    if (!email) {
        return alert("Por favor, selecciona tu usuario en el campo de arriba para poder enviarte el correo de recuperación.");
    }
    setAuthLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://crm-industrial-v7-final.vercel.app/',
    });
    setAuthLoading(false);
    
    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("¡Enviado! Revisa tu bandeja de entrada (y spam) para restablecer tu contraseña.");
    }
  }

  // NUEVA FUNCIÓN: ACTUALIZAR CONTRASEÑA FINAL
  async function handleUpdateUserPassword(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
        alert("Error al guardar: " + error.message);
    } else {
        alert("Contraseña actualizada correctamente. Ya puedes usar el CRM.");
        setRecoveryMode(false); // Quitamos el modo recuperación
        setNewPassword('');
    }
    setAuthLoading(false);
  }

  async function handleLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    window.location.reload(); 
  }

  async function fetchContacts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('industrial_contacts')
        .select('*, profiles:user_id(email, full_name, role)')
        .range(0, 9999)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Borrar registro permanentemente?')) return;
    const { error } = await supabase.from('industrial_contacts').delete().eq('id', id);
    if (!error) fetchContacts();
    else alert("No tienes permisos para borrar este registro.");
  }

  const navBtnClass = (active: boolean) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`;

  // --- 1. PANTALLA ESPECIAL: RESTABLECER CONTRASEÑA ---
  if (session && recoveryMode) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-100 p-4">
            <Card className="max-w-md p-8 shadow-2xl w-11/12 border-t-4 border-t-blue-600">
                <div className="flex justify-center mb-6 text-blue-600">
                    <KeyRound size={48} />
                </div>
                <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Nueva Contraseña</h1>
                <p className="text-center text-slate-500 text-sm mb-6">Introduce tu nueva contraseña para acceder.</p>
                <form onSubmit={handleUpdateUserPassword} className="space-y-4">
                    <div>
                        <label className={labelClass}>Nueva Contraseña</label>
                        <input type="password" required className={inputClass} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} />
                    </div>
                    <Button type="submit" className="w-full py-3" disabled={authLoading}>
                        {authLoading ? <Loader2 className="animate-spin"/> : 'Guardar Nueva Contraseña'}
                    </Button>
                </form>
            </Card>
        </div>
      );
  }

  // --- 2. PANTALLA LOGIN MODIFICADA (CON SELECT) ---
  if (!session) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-100 p-4">
            <Card className="max-w-md p-8 shadow-2xl w-11/12">
                <div className="flex justify-center mb-6">
                    <img src={logoM} alt="Logo" className="w-20 h-20 object-contain" />
                </div>
                <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Briefing Colaborativo</h1>
                <p className="text-center text-slate-500 font-bold mb-1">{APP_VERSION}</p>
                <p className="text-center text-slate-400 text-xs mb-8">Inicia sesión para acceder</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    
                    {/* CAMBIO: INPUT EMAIL POR SELECT */}
                    <div>
                        <label className={labelClass}>Usuario</label>
                        <div className="relative">
                            <select 
                                required 
                                className={`${selectClass} cursor-pointer`} 
                                value={email} 
                                onChange={e => setEmail(e.target.value)}
                            >
                                <option value="">-- Selecciona tu nombre --</option>
                                {loginUsersList.map(u => (
                                    <option key={u.email} value={u.email}>
                                        {u.full_name || u.email}
                                    </option>
                                ))}
                            </select>
                            {/* Flechita custom para que se vea bonito */}
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Contraseña</label>
                        <input type="password" required className={inputClass} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    
                    <Button type="submit" className="w-full py-3" disabled={authLoading}>
                        {authLoading ? <Loader2 className="animate-spin"/> : 'Entrar'}
                    </Button>
                    
                    <div className="text-center pt-2">
                        <button 
                            type="button" 
                            onClick={handleResetPassword}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                            disabled={authLoading}
                        >
                           ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
  }

  // --- 3. APP PRINCIPAL (Si hay sesión y NO es recovery) ---
  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 w-full fixed inset-0 max-w-[100vw] overflow-x-hidden">
       <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col shadow-2xl shrink-0`}>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
             <div className="bg-white rounded-lg p-1 w-12 h-12 flex items-center justify-center shrink-0">
                <img src={logoM} alt="Logo" className="w-full h-full object-contain" />
             </div>
             <div className="min-w-0">
                <span className="text-lg font-bold tracking-tight block truncate">Briefing Colaborativo</span>
                <span className="text-[10px] block opacity-70">{APP_VERSION}</span>
             </div>
          </div>
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
             <button onClick={() => { setView('dashboard'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'dashboard')}><LayoutDashboard size={20}/> <span>Dashboard</span></button>
             <button onClick={() => { setView('list'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'list')}><Users size={20}/> <span>Base de Datos</span></button>
             {userRole === 'admin' && (<><div className="pt-4 pb-2 px-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Admin</p></div><button onClick={() => { setView('admin'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'admin')}><UserCog size={20}/> <span>Gestión Usuarios</span></button></>)}
             <div className="pt-6 pb-2 px-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Acciones</p></div>
             <button onClick={() => { setEditingContact(null); setView('form'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'form')}><UserPlus size={20}/> <span>Briefing</span></button>
          </nav>
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
             <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors"><LogOut size={20}/> <span>Cerrar Sesión</span></button>
          </div>
       </aside>
       <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full bg-slate-50">
          <header className="bg-white border-b border-slate-200 p-3 flex items-center justify-between lg:hidden shadow-sm z-10 shrink-0 h-14">
             <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2 active:bg-slate-100 rounded"><Menu size={24} /></button>
             <span className="font-bold text-slate-800">Briefing Colaborativo</span><div className="w-8"></div>
          </header>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 md:p-8 w-full scroll-smooth bg-slate-50">
            <div className="p-1 md:p-0 pb-20"> 
                {view === 'dashboard' && <DashboardView contacts={contacts} userRole={userRole} userProfile={userProfile} session={session} setEditingContact={setEditingContact} setView={setView} />}
                
                {view === 'list' && (
                    <ListView 
                        contacts={contacts} 
                        loading={loading} 
                        searchTerm={searchTerm} 
                        setSearchTerm={setSearchTerm} 
                        userRole={userRole} 
                        session={session} 
                        setEditingContact={setEditingContact} 
                        setView={setView} 
                        handleDelete={handleDelete}
                    />
                )}

                {view === 'admin' && <AdminView />}
            </div>
            
            {view === 'form' && (
                <ContactForm 
                    session={session}
                    initialData={editingContact}
                    onCancel={() => setView('list')}
                    onSuccess={() => { fetchContacts(); setView('list'); }}
                />
            )}
          </div>
       </main>
       {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}
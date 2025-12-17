import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { 
  LayoutDashboard, Users, UserPlus, Search, Trash2, Edit, 
  Briefcase, CheckCircle2, Clock, Target, FileText, 
  LogOut, Shield, UserCog, Menu, Loader2, Factory, Calendar
} from 'lucide-react';

// --- IMPORTACIONES ---
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { SectionHeader } from './components/ui/SectionHeader';
import ContactForm from './components/crm/ContactForm';

// --- AQUÍ ESTÁ LA LÍNEA DE LA VERSIÓN (Línea 15 aprox) ---
const APP_VERSION = "V7.4 - Mobile Fixed"; 

// --- ESTILOS COMUNES ---
const inputClass = "w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-sm";
const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";
const selectClass = "w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none text-sm";

// --- APP PRINCIPAL ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('sales');
  const [view, setView] = useState('dashboard');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingContact, setEditingContact] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  // Estados para Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else { setContacts([]); setUserRole('sales'); }
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
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (data) setUserRole(data.role);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
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
        .select('*, profiles:user_id(email)')
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

  // --- VISTA ADMINISTRACIÓN ---
  const AdminView = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [newPass, setNewPass] = useState('');
    const [newRole, setNewRole] = useState('sales');

    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase.from('profiles').select('*');
            setUsers(data || []);
        };
        fetchUsers();
    }, []);

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data, error } = await supabase.auth.signUp({ email: newEmail, password: newPass, options: { data: { role: newRole } } });
        if (error) {
            alert('Error: ' + error.message);
        } else if (data.user) {
            await supabase.from('profiles').insert([{ id: data.user.id, email: newEmail, role: newRole }]);
            alert('Usuario creado.');
            setNewEmail(''); setNewPass('');
            const { data: newData } = await supabase.from('profiles').select('*');
            setUsers(newData || []);
        }
    };

    const updateUserRole = async (id: string, role: string) => {
        const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
        if (!error) {
             setUsers(users.map(u => u.id === id ? { ...u, role } : u));
             alert('Rol actualizado');
        } else {
            alert('Error al actualizar rol');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-24">
             <Card className="p-6 border-l-4 border-l-purple-600">
                <SectionHeader title="Gestión de Usuarios" icon={Shield} subtitle="Crear usuarios y asignar roles" />
                <form onSubmit={createUser} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1"><label className={labelClass}>Email Nuevo</label><input type="email" required className={inputClass} value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
                    <div className="md:col-span-1"><label className={labelClass}>Contraseña</label><input type="text" required className={inputClass} value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
                    <div className="md:col-span-1"><label className={labelClass}>Rol</label><select className={selectClass} value={newRole} onChange={e => setNewRole(e.target.value)}><option value="sales">Comercial</option><option value="manager">Jefe Ventas</option><option value="admin">Administrador</option></select></div>
                    <Button type="submit" icon={UserPlus} className="w-full">Crear</Button>
                </form>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-500 uppercase font-bold"><tr><th className="p-3">Email</th><th className="p-3">Rol</th></tr></thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b"><td className="p-3 font-medium">{u.email}</td><td className="p-3">
                                    <select className="p-2 border rounded bg-white w-full" value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value)}><option value="sales">Comercial</option><option value="manager">Jefe</option><option value="admin">Admin</option></select>
                                </td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </Card>
        </div>
    );
  };

  // --- DASHBOARD ---
  const DashboardView = () => {
    const total = contacts.length;
    const clients = contacts.filter(c => c.sap_status === 'Cliente SAP').length;
    const leads = contacts.filter(c => ['Lead SAP', 'Nuevo Prospecto'].includes(c.sap_status)).length;
    const today = new Date().toISOString().split('T')[0];
    const pending = contacts.filter(c => c.next_action_date && c.next_action_date <= today).length;

    return (
      <div className="space-y-6 animate-in fade-in duration-500 w-full overflow-hidden pb-24">
        <div className="flex justify-between items-center px-1">
             <div>
                <h2 className="text-lg md:text-2xl font-bold text-slate-800">Hola, {userRole === 'admin' ? 'Admin' : userRole === 'manager' ? 'Jefe' : 'Comercial'}</h2>
                <p className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded inline-block mt-1">{APP_VERSION}</p>
             </div>
             {userRole === 'sales' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">Mis Datos</span>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
          <Card className="p-4 border-l-4 border-l-blue-600 flex justify-between items-center"><div><p className="text-xs text-slate-500 font-bold uppercase">Total</p><h3 className="text-2xl font-bold text-slate-900">{total}</h3></div><div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Users size={20}/></div></Card>
          <Card className="p-4 border-l-4 border-l-emerald-500 flex justify-between items-center"><div><p className="text-xs text-slate-500 font-bold uppercase">Clientes</p><h3 className="text-2xl font-bold text-slate-900">{clients}</h3></div><div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><CheckCircle2 size={20}/></div></Card>
          <Card className="p-4 border-l-4 border-l-indigo-500 flex justify-between items-center"><div><p className="text-xs text-slate-500 font-bold uppercase">Prospectos</p><h3 className="text-2xl font-bold text-slate-900">{leads}</h3></div><div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Target size={20}/></div></Card>
          <Card className={`p-4 border-l-4 flex justify-between items-center ${pending > 0 ? 'border-l-red-500 bg-red-50/30' : 'border-l-slate-300'}`}><div><p className="text-xs text-slate-500 font-bold uppercase">Hoy</p><h3 className={`text-2xl font-bold ${pending > 0 ? 'text-red-600' : 'text-slate-900'}`}>{pending}</h3></div><div className="bg-white p-2 rounded-lg text-slate-400 border border-slate-100"><Clock size={20}/></div></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <Card className="p-4 md:p-6 h-full">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Calendar className="text-blue-600"/> Agenda</h3>
            <div className="space-y-3">
               {contacts.filter(c => c.next_action_date).sort((a,b) => new Date(a.next_action_date).getTime() - new Date(b.next_action_date).getTime()).slice(0,5).map(c => (
                 <div key={c.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm active:bg-blue-50 transition-colors cursor-pointer" onClick={() => { setEditingContact(c); setView('form'); }}>
                   <div className="min-w-0"><span className="font-bold text-slate-800 text-sm block truncate">{c.next_action}</span><p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate"><FileText size={12}/> {c.fiscal_name}</p></div>
                   <div className="text-right shrink-0 ml-2"><p className={`text-xs font-bold ${c.next_action_date <= today ? 'text-red-600' : 'text-blue-600'}`}>{c.next_action_date}</p><p className="text-xs text-slate-400">{c.next_action_time?.slice(0,5)}</p></div>
                 </div>
               ))}
               {contacts.length === 0 && <div className="p-6 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">Sin acciones.</div>}
            </div>
          </Card>
          <Card className="p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-white to-slate-50">
             <div className="bg-white p-4 rounded-full shadow-lg mb-4"><UserPlus size={40} className="text-blue-600" /></div>
             <h3 className="font-bold text-lg text-slate-800 mb-2">Comenzar Trabajo</h3>
             <Button onClick={() => { setEditingContact(null); setView('form'); }} icon={UserPlus} className="px-6 py-3 shadow-xl w-full md:w-auto">Nuevo Diagnóstico</Button>
          </Card>
        </div>
      </div>
    );
  };

  // --- LISTA ---
  const ListView = () => {
    const filtered = contacts.filter(c => c.fiscal_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div className="space-y-4 animate-in fade-in duration-500 pb-24 w-full overflow-hidden">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
           <div className="w-full md:w-auto"><h2 className="text-xl font-bold text-slate-800">Base de Datos</h2><p className="text-xs text-slate-500">{userRole === 'sales' ? 'Mis Fichas' : 'Global'}</p></div>
           <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        </div>
        {loading ? <div className="text-center p-20"><Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={32}/><p className="text-slate-500">Cargando...</p></div> : (
          <div className="grid gap-3 w-full">
            {filtered.map(c => (
              <Card key={c.id} className="p-4 hover:shadow-lg transition-all border border-slate-200">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1 mb-2"><h3 className="font-bold text-base text-slate-900 truncate">{c.fiscal_name}</h3><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border w-fit ${c.sap_status === 'Cliente SAP' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{c.sap_status}</span></div>
                    <div className="flex flex-col gap-1 text-sm text-slate-600"><span className="flex items-center gap-2 truncate"><Users size={14} className="text-slate-400 shrink-0"/> {c.contact_person || 'Sin contacto'}</span><span className="flex items-center gap-2 truncate"><Briefcase size={14} className="text-slate-400 shrink-0"/> <span className="text-slate-500 text-xs">Titular:</span> {c.profiles?.email || 'N/A'}</span></div>
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

  const navBtnClass = (active: boolean) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`;

  // --- LOGIN SCREEN ---
  if (!session) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-100 p-4">
            <Card className="max-w-md p-8 shadow-2xl w-11/12">
                <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Factory size={32}/></div></div>
                <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">CRM Industrial</h1>
                <p className="text-center text-slate-500 font-bold mb-1">{APP_VERSION}</p>
                <p className="text-center text-slate-400 text-xs mb-8">Inicia sesión para acceder</p>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div><label className={labelClass}>Email Corporativo</label><input type="email" required className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@empresa.com" /></div>
                    <div><label className={labelClass}>Contraseña</label><input type="password" required className={inputClass} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></div>
                    <Button type="submit" className="w-full py-3" disabled={authLoading}>{authLoading ? <Loader2 className="animate-spin"/> : 'Entrar al CRM'}</Button>
                </form>
            </Card>
        </div>
    );
  }

  // --- APP LAYOUT ---
  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 w-full fixed inset-0 max-w-[100vw] overflow-x-hidden">
       <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col shadow-2xl shrink-0`}>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg"><Factory size={20} className="text-white" /></div>
             <div className="min-w-0"><span className="text-xl font-bold tracking-tight block">CRM {APP_VERSION}</span><span className="text-xs text-slate-500 truncate block">{session.user.email}</span></div>
          </div>
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
             <button onClick={() => { setView('dashboard'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'dashboard')}><LayoutDashboard size={20}/> <span>Dashboard</span></button>
             <button onClick={() => { setView('list'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'list')}><Users size={20}/> <span>Base de Datos</span></button>
             {userRole === 'admin' && (<><div className="pt-4 pb-2 px-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Admin</p></div><button onClick={() => { setView('admin'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'admin')}><UserCog size={20}/> <span>Gestión Usuarios</span></button></>)}
             <div className="pt-6 pb-2 px-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Acciones</p></div>
             <button onClick={() => { setEditingContact(null); setView('form'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'form')}><UserPlus size={20}/> <span>Nuevo Diagnóstico</span></button>
          </nav>
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
             <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors"><LogOut size={20}/> <span>Cerrar Sesión</span></button>
          </div>
       </aside>
       <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full bg-slate-50">
          <header className="bg-white border-b border-slate-200 p-3 flex items-center justify-between lg:hidden shadow-sm z-10 shrink-0 h-14">
             <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2 active:bg-slate-100 rounded"><Menu size={24} /></button>
             <span className="font-bold text-slate-800">CRM Industrial</span><div className="w-8"></div>
          </header>
          {/* AQUÍ HE APLICADO EL CAMBIO DE PADDING: p-1 para móvil y pb-20 extra */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 md:p-8 w-full scroll-smooth bg-slate-50">
            <div className="p-1 md:p-0 pb-20"> {/* Padding interno para Dashboard y Listas */}
                {view === 'dashboard' && <DashboardView />}
                {view === 'list' && <ListView />}
                {view === 'admin' && <AdminView />}
            </div>
            
            {/* El formulario ya trae su propio padding interno */}
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
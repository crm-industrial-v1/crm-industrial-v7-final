import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { 
  LayoutDashboard, Users, UserPlus, Search, Trash2, Edit, 
  Briefcase, Save, Calendar, Factory, Package, Menu, 
  Loader2, CheckCircle2, X, Clock, ArrowRight, 
  ArrowLeft, Target, FileText, LogOut, Shield, UserCog
} from 'lucide-react';

// --- CONSTANTES ---
const APP_VERSION = "V5.2 - Usuarios y Grid Movil"; // <--- VERSIÓN VISIBLE

const MATERIAL_OPTIONS = [
  "00 - Fleje Manual", "00 - Fleje Automático", "00 - Fleje Poliéster (PET)", "00 - Fleje Acero",
  "01 - Film Estirable Manual", "01 - Film Estirable Automático", "01 - Film Macroperforado",
  "02 - Precinto PP", "02 - Precinto PVC", "02 - Precinto Personalizado",
  "03 - Film Retráctil", "05 - Protección", "06 - Bolsas", "99 - Otros"
];

const SECTORS = [
  "Agroalimentario", "Logística y Transporte", "Industria Metal", 
  "Construcción", "Químico / Farmacéutico", "E-commerce / Retail", "Otro"
];

// --- ESTILOS COMUNES ---
const inputClass = "w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-sm";
const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";
const selectClass = "w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none text-sm";

// --- COMPONENTES UI ---
const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 w-full ${className}`}>{children}</div>
);

const SectionHeader = ({ title, icon: Icon, subtitle }: any) => (
  <div className="mt-6 md:mt-8 mb-4 md:mb-6 border-b border-slate-200 pb-3 w-full">
    <div className="flex items-center gap-3 text-slate-800">
      <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
        {Icon && <Icon size={22} className="md:w-6 md:h-6" />}
      </div>
      <div className="min-w-0">
        <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight truncate">{title}</h3>
        {subtitle && <p className="text-xs md:text-sm text-slate-500 font-normal normal-case mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, type = "button", disabled = false }: any) => {
  const variants: any = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:bg-blue-300",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
  };
  return (
    <button 
      type={type} onClick={onClick} disabled={disabled}
      className={`px-4 md:px-5 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm md:text-base whitespace-nowrap ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} className="shrink-0" />} {children}
    </button>
  );
};

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
    await supabase.auth.signOut();
    setView('dashboard');
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
                <p className="text-xs text-blue-600 font-bold">{APP_VERSION}</p>
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

  // --- FORMULARIO (GRID ARREGLADO) ---
  const FormView = () => {
    const [activeTab, setActiveTab] = useState('sap');
    const [saving, setSaving] = useState(false);
    
    const TABS = [
        { id: 'sap', label: 'Identificación SAP', icon: Search },
        { id: 'registro', label: 'Datos Registro', icon: Briefcase },
        { id: 'negocio', label: 'Negocio', icon: Factory },
        { id: 'materiales', label: 'Materiales', icon: Package },
        { id: 'maquinaria', label: 'Maquinaria', icon: Factory },
        { id: 'necesidades', label: 'Necesidades', icon: Search },
        { id: 'cierre', label: 'Cierre', icon: Calendar }
    ];

    const generateInitialState = () => {
        let mats: any = {};
        for(let i=1; i<=7; i++) {
            mats[`mat${i}_type`] = ''; mats[`mat${i}_id`] = ''; mats[`mat${i}_consumption`] = '';
            mats[`mat${i}_supplier`] = ''; mats[`mat${i}_price`] = ''; mats[`mat${i}_notes`] = '';
            if(i > 1) mats[`hasMat${i}`] = false;
        }
        return {
            sap_status: 'Nuevo Prospecto', sap_id: '',
            fiscal_name: '', cif: '', contact_person: '', job_title: '', phone: '', email: '', address: '',
            sector: 'Agroalimentario', main_products: '', volume: 'Medio', packaging_mgmt: 'Mixto',
            ...mats,
            quality_rating: '3', sustainable_interest: 'No',
            mac1_type: '', mac1_brand: '', mac1_age: 'Media', mac1_status: 'Operativa',
            pain_points: [], budget: 'Sin presupuesto fijo',
            detected_interest: [], solution_summary: '', next_action: 'Llamada de seguimiento', next_action_date: '', next_action_time: '09:00', responsible: ''
        };
    };

    const [formData, setFormData] = useState(() => {
        if (editingContact) {
            const data = { ...editingContact };
            for(let i=2; i<=7; i++) {
                if(data[`mat${i}_type`] || data[`mat${i}_id`]) data[`hasMat${i}`] = true;
            }
            return data;
        }
        return generateInitialState();
    });

    const handleChange = (field: string, value: any) => setFormData({ ...formData, [field]: value });
    const handleMultiSelect = (field: string, value: string) => {
        const current = formData[field] || [];
        const updated = current.includes(value) ? current.filter((i: string) => i !== value) : [...current, value];
        setFormData({ ...formData, [field]: updated });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      const payload: any = { ...formData };
      for(let i=2; i<=7; i++) delete payload[`hasMat${i}`];
      delete payload.id; delete payload.created_at; delete payload.profiles;
      if (!payload.next_action_date) payload.next_action_date = null;
      if (!payload.next_action_time) payload.next_action_time = null;
      if (!editingContact) payload.user_id = session.user.id;

      let error;
      try {
        if (editingContact) {
            const res = await supabase.from('industrial_contacts').update(payload).eq('id', editingContact.id);
            error = res.error;
        } else {
            const res = await supabase.from('industrial_contacts').insert([payload]);
            error = res.error;
        }
        if (!error) { await fetchContacts(); setView('list'); } 
        else { throw error; }
      } catch(err: any) { alert('Error: ' + err.message); } 
      finally { setSaving(false); }
    };

    const goToNextTab = () => {
        const idx = TABS.findIndex(t => t.id === activeTab);
        if(idx < TABS.length -1) setActiveTab(TABS[idx+1].id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const goToPrevTab = () => {
        const idx = TABS.findIndex(t => t.id === activeTab);
        if(idx > 0) setActiveTab(TABS[idx-1].id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
      <div className="max-w-5xl mx-auto pb-32 w-full overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between mb-4 sticky top-0 bg-slate-100/95 z-30 p-4 -mx-2 md:-mx-4 backdrop-blur-md border-b border-slate-200">
           <div className="mb-3 md:mb-0"><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">{editingContact ? <Edit className="text-blue-600 w-5 h-5"/> : <UserPlus className="text-blue-600 w-5 h-5"/>}{editingContact ? 'Editar' : 'Nuevo'}</h2></div>
           <div className="flex gap-2 w-full md:w-auto"><Button variant="secondary" onClick={() => setView('list')} className="flex-1 md:flex-none justify-center">Cancelar</Button><Button variant="primary" onClick={handleSubmit} icon={Save} disabled={saving} className="flex-1 md:flex-none justify-center">{saving ? '...' : 'Guardar'}</Button></div>
        </div>

        {/* --- GRID DE 3 COLUMNAS PARA MÓVIL --- */}
        <div className="sticky top-[85px] z-20 mb-6 bg-slate-100 pt-2 pb-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
                <div className="grid grid-cols-3 md:flex md:gap-2 gap-1"> 
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all text-[10px] md:text-sm gap-1 border ${activeTab === tab.id ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm' : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'} ${'min-h-[55px] md:min-w-[120px]'}`}
                        >
                            <tab.icon size={18} className={`mb-0.5 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`}/>
                            <span className="whitespace-normal text-center leading-none px-0.5 break-words w-full">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 w-full px-1">
            {activeTab === 'sap' && (<Card className="p-4 md:p-8"><SectionHeader title="Identificación SAP" icon={Search} /><div className="grid grid-cols-1 gap-4"><div><label className={labelClass}>Estado</label><select className={selectClass} value={formData.sap_status} onChange={e => handleChange('sap_status', e.target.value)}><option>Nuevo Prospecto</option><option>Lead SAP</option><option>Cliente SAP</option></select></div><div><label className={labelClass}>Código SAP</label><input className={inputClass} placeholder="Ej: C000450" value={formData.sap_id} onChange={e => handleChange('sap_id', e.target.value)} /></div></div><div className="flex justify-end mt-6 pt-4 border-t"><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="w-full md:w-auto">Siguiente</Button></div></Card>)}
            {activeTab === 'registro' && (<Card className="p-4 md:p-8"><SectionHeader title="Datos" icon={Briefcase} /><div className="grid grid-cols-1 gap-4"><div><label className={labelClass}>Fiscal *</label><input required className={inputClass} value={formData.fiscal_name} onChange={e => handleChange('fiscal_name', e.target.value)} /></div><div><label className={labelClass}>CIF *</label><input required className={inputClass} value={formData.cif} onChange={e => handleChange('cif', e.target.value)} /></div><div><label className={labelClass}>Contacto</label><input className={inputClass} value={formData.contact_person} onChange={e => handleChange('contact_person', e.target.value)} /></div><div><label className={labelClass}>Cargo</label><input className={inputClass} value={formData.job_title} onChange={e => handleChange('job_title', e.target.value)} /></div><div><label className={labelClass}>Teléfono</label><input className={inputClass} value={formData.phone} onChange={e => handleChange('phone', e.target.value)} /></div><div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={formData.email} onChange={e => handleChange('email', e.target.value)} /></div><div className="md:col-span-2"><label className={labelClass}>Dirección</label><input className={inputClass} value={formData.address} onChange={e => handleChange('address', e.target.value)} /></div></div><div className="flex gap-3 mt-6 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div></Card>)}
            {activeTab === 'negocio' && (<Card className="p-4 md:p-8"><SectionHeader title="Negocio" icon={Factory} /><div className="grid grid-cols-1 gap-4"><div><label className={labelClass}>Sector</label><select className={selectClass} value={formData.sector} onChange={e => handleChange('sector', e.target.value)}>{SECTORS.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><label className={labelClass}>Volumen</label><select className={selectClass} value={formData.volume} onChange={e => handleChange('volume', e.target.value)}><option>Bajo</option><option>Medio</option><option>Alto</option></select></div><div><label className={labelClass}>Embalaje</label><select className={selectClass} value={formData.packaging_mgmt} onChange={e => handleChange('packaging_mgmt', e.target.value)}><option>Interno</option><option>Externalizado</option><option>Mixto</option></select></div><div><label className={labelClass}>Productos</label><input className={inputClass} value={formData.main_products} onChange={e => handleChange('main_products', e.target.value)} /></div></div><div className="flex gap-3 mt-6 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div></Card>)}
            {activeTab === 'materiales' && (<Card className="p-4 md:p-8 bg-slate-50"><SectionHeader title="Materiales" icon={Package} />{[1,2,3,4,5,6,7].map(num => {if (!(num === 1 || formData[`hasMat${num}`])) return null;return (<div key={num} className="rounded-xl border border-slate-200 mb-6 bg-white overflow-hidden"><div className="p-3 border-b bg-slate-50 flex justify-between items-center"><span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700">MAT {num}</span>{num > 1 && <button type="button" onClick={() => handleChange(`hasMat${num}`, false)} className="text-slate-400"><X size={18}/></button>}</div><div className="p-4 grid grid-cols-1 gap-4"><div><label className={labelClass}>Tipo</label><select className={selectClass} value={formData[`mat${num}_type`]} onChange={e => handleChange(`mat${num}_type`, e.target.value)}><option value="">Seleccionar...</option>{MATERIAL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}</select></div><div><label className={labelClass}>ID / Medidas</label><input className={inputClass} value={formData[`mat${num}_id`]} onChange={e => handleChange(`mat${num}_id`, e.target.value)} /></div><div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>Consumo</label><input className={inputClass} value={formData[`mat${num}_consumption`]} onChange={e => handleChange(`mat${num}_consumption`, e.target.value)} /></div><div><label className={labelClass}>Precio</label><input className={inputClass} value={formData[`mat${num}_price`]} onChange={e => handleChange(`mat${num}_price`, e.target.value)} /></div></div><div><label className={labelClass}>Proveedor</label><input className={inputClass} value={formData[`mat${num}_supplier`]} onChange={e => handleChange(`mat${num}_supplier`, e.target.value)} /></div><div><label className={labelClass}>Notas</label><input className={inputClass} value={formData[`mat${num}_notes`]} onChange={e => handleChange(`mat${num}_notes`, e.target.value)} /></div></div></div>);})}{[1,2,3,4,5,6].map(num => {if ((num === 1 || formData[`hasMat${num}`]) && !formData[`hasMat${num+1}`]) {return <button key={num} type="button" onClick={() => handleChange(`hasMat${num+1}`, true)} className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 rounded-lg font-bold mb-4 text-sm">+ Añadir Material</button>}return null;})}<div className="flex gap-3 mt-4 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div></Card>)}
            {activeTab === 'maquinaria' && (<Card className="p-4 md:p-8"><SectionHeader title="Maquinaria" icon={Factory} /><div className="grid grid-cols-1 gap-6 mb-6"><div className="p-4 bg-purple-50 rounded-xl border border-purple-100"><label className="block text-xs font-bold text-purple-900 mb-3 uppercase">Calidad Percibida</label><div className="flex justify-between">{[1,2,3,4,5].map(v => (<button key={v} type="button" onClick={() => handleChange('quality_rating', v.toString())} className={`w-10 h-10 rounded-full font-bold shadow-sm ${formData.quality_rating === v.toString() ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border'}`}>{v}</button>))}</div></div><div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100"><label className="block text-xs font-bold text-emerald-900 mb-2 uppercase">¿Interés Sostenible?</label><select className="w-full p-2 border rounded bg-white" value={formData.sustainable_interest} onChange={e => handleChange('sustainable_interest', e.target.value)}><option>No</option><option>Sí</option></select></div></div><div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h4 className="font-bold text-slate-800 mb-4 text-sm">Máquina Principal</h4><div className="grid grid-cols-1 gap-4"><div><label className={labelClass}>Tipo</label><input className={inputClass} value={formData.mac1_type} onChange={e => handleChange('mac1_type', e.target.value)} /></div><div><label className={labelClass}>Marca</label><input className={inputClass} value={formData.mac1_brand} onChange={e => handleChange('mac1_brand', e.target.value)} /></div><div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>Edad</label><select className={selectClass} value={formData.mac1_age} onChange={e => handleChange('mac1_age', e.target.value)}><option>Nueva</option><option>Media</option><option>Antigua</option></select></div><div><label className={labelClass}>Estado</label><select className={selectClass} value={formData.mac1_status} onChange={e => handleChange('mac1_status', e.target.value)}><option>Ok</option><option>Averías</option><option>Cambio</option></select></div></div></div></div><div className="flex gap-3 mt-6 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div></Card>)}
            {activeTab === 'necesidades' && (<Card className="p-4 md:p-8 border-l-4 border-l-blue-600"><SectionHeader title="Necesidades" icon={Search} /><div className="grid grid-cols-1 gap-6"><div><label className="block text-sm font-bold text-slate-700 mb-3">Puntos de Dolor</label><div className="space-y-2">{['Ahorro de costes', 'Renovación maquinaria', 'Mejorar estabilidad', 'Servicio Técnico', 'Reducir plástico'].map(opt => (<label key={opt} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"><input type="checkbox" checked={formData.pain_points?.includes(opt)} onChange={() => handleMultiSelect('pain_points', opt)} className="w-5 h-5 text-blue-600 rounded"/><span className="text-sm font-medium text-slate-700">{opt}</span></label>))}</div></div><div><label className={labelClass}>Presupuesto</label><select className={selectClass} value={formData.budget} onChange={e => handleChange('budget', e.target.value)}><option>Sin presupuesto fijo</option><option>Partida anual</option><option>Solo precio bajo</option></select></div></div><div className="flex gap-3 mt-6 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div></Card>)}
            {activeTab === 'cierre' && (<Card className="p-4 md:p-8 border-l-4 border-l-red-500 bg-red-50/10"><SectionHeader title="Cierre" icon={Calendar} /><div className="grid grid-cols-1 gap-6 mb-6"><div><label className="block text-sm font-bold text-slate-700 mb-3">Interés real:</label><div className="grid grid-cols-1 gap-2">{['Visita Técnica', 'Oferta Materiales', 'Propuesta Maquinaria', 'Mantenimiento'].map(opt => (<label key={opt} className="flex items-center gap-2 p-3 bg-white rounded border border-slate-200 shadow-sm"><input type="checkbox" checked={formData.detected_interest?.includes(opt)} onChange={() => handleMultiSelect('detected_interest', opt)} className="text-red-600 rounded w-5 h-5"/> <span className="text-sm font-bold text-slate-700">{opt}</span></label>))}</div></div><div><label className={labelClass}>Resumen</label><textarea className={`${inputClass} h-24 resize-none`} placeholder="Resumen..." value={formData.solution_summary} onChange={e => handleChange('solution_summary', e.target.value)} /></div></div><div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm"><div className="grid grid-cols-1 gap-4"><div><label className="block text-xs font-bold text-red-700 uppercase mb-1">ACCIÓN</label><select className="w-full p-3 border border-red-200 rounded-lg bg-red-50 font-bold" value={formData.next_action} onChange={e => handleChange('next_action', e.target.value)}><option>Llamada</option><option>Visita</option><option>Oferta</option><option>Cierre</option></select></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-red-700 uppercase mb-1">FECHA</label><input type="date" required className="w-full p-3 border border-red-200 rounded-lg" value={formData.next_action_date} onChange={e => handleChange('next_action_date', e.target.value)} /></div><div><label className="block text-xs font-bold text-red-700 uppercase mb-1">HORA</label><input type="time" required className="w-full p-3 border border-red-200 rounded-lg" value={formData.next_action_time} onChange={e => handleChange('next_action_time', e.target.value)} /></div></div><div><label className="block text-xs font-bold text-red-700 uppercase mb-1">RESPONSABLE</label><input className="w-full p-3 border border-red-200 rounded-lg" value={formData.responsible} onChange={e => handleChange('responsible', e.target.value)} /></div></div></div><div className="flex flex-col-reverse gap-3 mt-6 pt-4 border-t border-red-200"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="w-full">Anterior</Button><Button variant="primary" type="submit" icon={CheckCircle2} className="w-full py-4 text-lg bg-gradient-to-r from-red-600 to-red-700 border-none shadow-xl">FINALIZAR</Button></div></Card>)}
        </form>
      </div>
    );
  };

  const navBtnClass = (active: boolean) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`;

  // --- LOGIN SCREEN ---
  if (!session) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-100 p-4">
            <Card className="max-w-md p-8 shadow-2xl w-full">
                <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Factory size={32}/></div></div>
                <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">CRM Industrial</h1>
                <p className="text-center text-slate-500 font-bold mb-1">{APP_VERSION}</p> {/* <--- AQUÍ AÑADIDO */}
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
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden w-full fixed inset-0">
       <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col shadow-2xl shrink-0`}>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg"><Factory size={20} className="text-white" /></div>
             <div className="min-w-0"><span className="text-xl font-bold tracking-tight block">CRM V5.2</span><span className="text-xs text-slate-500 truncate block">{session.user.email}</span></div>
          </div>
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
             <button onClick={() => { setView('dashboard'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'dashboard')}><LayoutDashboard size={20}/> <span>Dashboard</span></button>
             <button onClick={() => { setView('list'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'list')}><Users size={20}/> <span>Base de Datos</span></button>
             {userRole === 'admin' && (<><div className="pt-4 pb-2 px-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Admin</p></div><button onClick={() => { setView('admin'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'admin')}><UserCog size={20}/> <span>Gestión Usuarios</span></button></>)}
             <div className="pt-6 pb-2 px-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Acciones</p></div>
             <button onClick={() => { setEditingContact(null); setView('form'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'form')}><UserPlus size={20}/> <span>Nuevo Diagnóstico</span></button>
          </nav>
          <div className="p-4 bg-slate-950 border-t border-slate-800"><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors"><LogOut size={20}/> <span>Cerrar Sesión</span></button></div>
       </aside>
       <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full bg-slate-50">
          <header className="bg-white border-b border-slate-200 p-3 flex items-center justify-between lg:hidden shadow-sm z-10 shrink-0 h-14">
             <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2 active:bg-slate-100 rounded"><Menu size={24} /></button>
             <span className="font-bold text-slate-800">CRM Industrial</span><div className="w-8"></div>
          </header>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 md:p-8 w-full scroll-smooth bg-slate-50">
            {view === 'dashboard' && <DashboardView />}
            {view === 'list' && <ListView />}
            {view === 'form' && <FormView />}
            {view === 'admin' && <AdminView />}
          </div>
       </main>
       {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}
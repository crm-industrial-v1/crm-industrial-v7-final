import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { 
  LayoutDashboard, Users, UserPlus, Search, Trash2, Edit, 
  Briefcase, CheckCircle2, Clock, FileText, 
  LogOut, Shield, UserCog, Menu, Loader2, Calendar, User, Lock, Filter, KeyRound,
  ArrowLeft, ArrowRight, Phone, BarChart2, CheckSquare, X, CalendarPlus, Save, AlertCircle, ClipboardList, Activity,
  AlertTriangle, ListTodo
} from 'lucide-react';

// --- IMPORTAMOS EL NUEVO LOGO ---
import logoM from './assets/m-logo.png';

// --- IMPORTACIONES ---
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { SectionHeader } from './components/ui/SectionHeader';
import ContactForm from './components/crm/ContactForm';

// --- VERSIÓN ACTUALIZADA ---
const APP_VERSION = "V10.28 - Final Clean (Unused Imports Removed)"; 

// --- CONFIGURACIÓN SUPER ADMIN ---
const SUPER_ADMIN_EMAIL = "jesusblanco@mmesl.com";

// --- ESTILOS COMUNES ---
const inputClass = "w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-sm";
const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";
const selectClass = "w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none text-sm";

// --- COMPONENTES AUXILIARES ---

// 0.1. MODAL PARA AGENDAR ACCIÓN RÁPIDA
const NewActionModal = ({ isOpen, onClose, onSave, clientName }: any) => {
    const [actionType, setActionType] = useState('Llamada de Seguimiento');
    const [objective, setObjective] = useState(''); 
    const [date, setDate] = useState('');
    const [time, setTime] = useState('09:00');

    useEffect(() => {
        if (isOpen) {
            setActionType('Llamada de Seguimiento');
            setObjective('');
            setDate('');
            setTime('09:00');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!date) return alert("Por favor, selecciona una fecha.");
        let finalAction = actionType;
        if (objective) { finalAction = `${actionType} [Obj: ${objective}]`; }
        onSave(finalAction, date, time);
    };

    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold flex items-center gap-2"><CalendarPlus size={20}/> Agendar Próximo Paso</h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="bg-blue-50 p-2 rounded border border-blue-100 mb-2"><p className="text-[10px] uppercase font-bold text-blue-500">Cliente</p><p className="text-sm font-bold text-blue-900 truncate">{clientName}</p></div>
                    <div><label className={labelClass}>¿Qué vas a hacer?</label><select className={selectClass} value={actionType} onChange={e => setActionType(e.target.value)}><option>Llamada de Seguimiento</option><option>Visita Técnica</option><option>Visita de Cierre</option><option>Enviar Presupuesto</option><option>Demo Producto</option></select></div>
                    <div><label className={labelClass}>¿Cuál es el Objetivo? (Interés)</label><select className={selectClass} value={objective} onChange={e => setObjective(e.target.value)}><option value="">-- Selecciona Objetivo --</option><option value="Visita Técnica">Visita Técnica</option><option value="Oferta Materiales">Oferta Materiales</option><option value="Propuesta Maquinaria">Propuesta Maquinaria</option><option value="Mantenimiento">Mantenimiento</option><option value="Proyecto Ingeniería">Proyecto de Ingeniería</option></select></div>
                    <div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>Fecha</label><input type="date" className={inputClass} value={date} onChange={e => setDate(e.target.value)} required /></div><div><label className={labelClass}>Hora</label><input type="time" className={inputClass} value={time} onChange={e => setTime(e.target.value)} required /></div></div>
                    <div className="pt-2"><button onClick={handleSubmit} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"><Save size={18}/> Guardar en Agenda</button></div>
                </div>
            </div>
        </div>
    );
};

// 0.2. MODAL DE GESTIÓN DE TAREA (AGENDA)
const TaskActionModal = ({ isOpen, onClose, onAction, taskTitle, currentTask }: any) => {
    const [step, setStep] = useState(1);
    const [report, setReport] = useState('');
    const [newActionType, setNewActionType] = useState('Llamada de Seguimiento');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('09:00');

    useEffect(() => { 
        if (isOpen) { 
            setStep(1); 
            setReport(''); 
            if(currentTask) {
                setNewDate(currentTask.next_action_date || '');
                setNewTime(currentTask.next_action_time || '09:00');
            }
        } 
    }, [isOpen, currentTask]);

    if (!isOpen) return null;

    const isReportValid = report.trim().length > 5;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {step === 3 ? <Calendar className="text-blue-600" size={18}/> : <CheckSquare className="text-blue-600" size={18}/>} 
                        {step === 3 ? 'Reprogramar Tarea' : 'Gestionar Tarea'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                {step === 1 && (
                    <div className="p-5 space-y-4">
                        <div><p className="text-xs font-bold text-slate-500 uppercase mb-1">Tarea Actual</p><p className="text-sm font-medium text-slate-800 bg-blue-50 p-2 rounded border border-blue-100 text-blue-900">{taskTitle}</p></div>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => setStep(2)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"><CheckCircle2 size={18}/> Marcar como Realizada / Finalizar</button>
                            <button onClick={() => setStep(3)} className="w-full py-3 bg-white border-2 border-blue-100 hover:border-blue-300 text-blue-700 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"><ArrowRight size={18}/> Cambiar Fecha (Reprogramar)</button>
                            <button onClick={() => onAction('delete', '', null)} className="w-full py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-all">Eliminar Tarea (Error)</button>
                        </div>
                    </div>
                )}
                {step === 2 && (
                    <div className="p-5 space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-emerald-50 p-3 rounded text-xs text-emerald-800 mb-2 border border-emerald-100 flex items-center gap-2"><CheckCircle2 size={14}/> Estás cerrando esta tarea.</div>
                        <div>
                            <label className={labelClass}>Resultado / Reporte (Obligatorio *)</label>
                            <textarea className={`w-full p-3 border rounded-lg text-sm h-28 focus:ring-2 outline-none resize-none transition-all ${!isReportValid ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-emerald-500'}`} placeholder="Describe qué ha ocurrido..." value={report} onChange={(e) => setReport(e.target.value)} autoFocus />
                            {!isReportValid && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/> El reporte es obligatorio.</p>}
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-bold text-sm">Atrás</button>
                            <button onClick={() => onAction('complete', report, null)} disabled={!isReportValid} className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm shadow-lg">Finalizar Tarea</button>
                        </div>
                        <button onClick={() => { if(!isReportValid) return; setStep(4); }} disabled={!isReportValid} className="w-full py-2 text-blue-600 font-bold text-xs hover:bg-blue-50 rounded mt-1 disabled:opacity-50">¿Quieres Agendar la Siguiente ya?</button>
                    </div>
                )}
                {step === 3 && (
                    <div className="p-5 space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 mb-2 border border-blue-100">Cambia la fecha de esta tarea sin cerrarla.</div>
                        <div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>Nueva Fecha</label><input type="date" className={inputClass} value={newDate} onChange={e => setNewDate(e.target.value)} required /></div><div><label className={labelClass}>Nueva Hora</label><input type="time" className={inputClass} value={newTime} onChange={e => setNewTime(e.target.value)} required /></div></div>
                        <div className="flex gap-2 pt-4">
                            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-bold text-sm">Atrás</button>
                            <button onClick={() => onAction('reschedule', '', { date: newDate, time: newTime })} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-lg">Guardar Cambio</button>
                        </div>
                    </div>
                )}
                {step === 4 && (
                    <div className="p-5 space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-slate-100 p-2 rounded text-xs text-slate-500 mb-2">Reporte guardado. Define la siguiente acción.</div>
                        <div><label className={labelClass}>Próxima Acción</label><select className={selectClass} value={newActionType} onChange={e => setNewActionType(e.target.value)}><option>Llamada de Seguimiento</option><option>Visita Técnica</option><option>Visita de Cierre</option><option>Enviar Presupuesto</option></select></div>
                        <div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>Fecha</label><input type="date" className={inputClass} value={newDate} onChange={e => setNewDate(e.target.value)} required /></div><div><label className={labelClass}>Hora</label><input type="time" className={inputClass} value={newTime} onChange={e => setNewTime(e.target.value)} required /></div></div>
                        <div className="flex gap-2 pt-4"><button onClick={() => setStep(2)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-bold text-sm">Atrás</button><button onClick={() => onAction('complete_new', report, { action: newActionType, date: newDate, time: newTime })} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-lg">Confirmar Agenda</button></div>
                    </div>
                )}
            </div>
        </div>
    );
};

// 0.3. MODAL DE HISTORIAL
const ClientHistoryModal = ({ isOpen, onClose, client, onOpenNewAction }: any) => {
    if (!isOpen || !client) return null;

    const materialsCount = client.contact_materials?.length || 0;
    const machinesCount = client.contact_machinery?.length || 0;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div><h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Activity className="text-blue-600"/> Historial del Cliente</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{client.fiscal_name}</p></div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X size={20}/></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center gap-2"><Clock size={14}/> Próxima Acción</h4>
                        {client.next_action_date ? (
                            <div className="flex justify-between items-center"><div><p className="font-bold text-slate-800">{client.next_action}</p><p className="text-xs text-slate-600">{client.next_action_date} a las {client.next_action_time}</p></div><span className="bg-white text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 shadow-sm">Pendiente</span></div>
                        ) : (<p className="text-sm text-slate-500 italic">No hay acciones agendadas.</p>)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-[10px] uppercase font-bold text-slate-400">Sector</p><p className="text-sm font-bold text-slate-700 truncate" title={client.sector}>{client.sector || '-'}</p></div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-[10px] uppercase font-bold text-slate-400">Volumen</p><p className="text-sm font-bold text-slate-700 truncate" title={client.volume}>{client.volume || '-'}</p></div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-[10px] uppercase font-bold text-slate-400">Máquinas</p><p className="text-sm font-bold text-slate-700">{machinesCount} Reg.</p></div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-[10px] uppercase font-bold text-slate-400">Materiales</p><p className="text-sm font-bold text-slate-700">{materialsCount} Reg.</p></div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><ClipboardList size={14}/> Historial de Actividad</h4>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 h-64 overflow-y-auto text-sm text-slate-700 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                            {client.solution_summary ? client.solution_summary : <span className="text-slate-400 italic">No hay historial registrado aún.</span>}
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <Button onClick={onClose} variant="secondary">Cerrar</Button>
                    <Button onClick={() => { onClose(); onOpenNewAction(client); }} icon={CalendarPlus}>Agendar Nueva Acción</Button>
                </div>
            </div>
        </div>
    );
};

// 1. VISTA ADMINISTRACIÓN
const AdminView = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [newPass, setNewPass] = useState('');
    const [newName, setNewName] = useState(''); 
    const [newRole, setNewRole] = useState('sales');

    useEffect(() => { fetchUsers(); }, []);
    const fetchUsers = async () => { const { data } = await supabase.from('profiles').select('*').order('email'); setUsers(data || []); };
    const createUser = async (e: React.FormEvent) => { e.preventDefault(); const { data, error } = await supabase.auth.signUp({ email: newEmail, password: newPass, options: { data: { role: newRole, full_name: newName } } }); if (error) { alert('Error: ' + error.message); } else if (data.user) { await supabase.from('profiles').insert([{ id: data.user.id, email: newEmail, role: newRole, full_name: newName }]); alert('Usuario creado.'); setNewEmail(''); setNewPass(''); setNewName(''); fetchUsers(); } };
    const updateUserField = async (id: string, field: string, value: string, currentValue: string) => { if (value === currentValue) return; const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', id); if (!error) { setUsers(users.map(u => u.id === id ? { ...u, [field]: value } : u)); } else { alert('Error: ' + error.message); fetchUsers(); } };
    const deleteUser = async (id: string, email: string) => { if (email === SUPER_ADMIN_EMAIL) { alert("No puedes borrar al Super Admin."); return; } if (!window.confirm(`¿Eliminar a ${email}?`)) return; const { error } = await supabase.from('profiles').delete().eq('id', id); if (error) alert('Error: ' + error.message); else setUsers(users.filter(u => u.id !== id)); };

    return (
        <div className="space-y-6 animate-in fade-in pb-24">
             <Card className="p-6 border-l-4 border-l-purple-600 w-full overflow-x-auto">
                <SectionHeader title="Gestión de Usuarios" icon={Shield} subtitle="Crear, Editar y Eliminar usuarios" />
                <form onSubmit={createUser} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-1"><label className={labelClass}>Email</label><input type="email" required className={inputClass} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@..." /></div>
                    <div className="md:col-span-1"><label className={labelClass}>Nombre</label><input type="text" required className={inputClass} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Juan Pérez" /></div>
                    <div className="md:col-span-1"><label className={labelClass}>Contraseña</label><input type="text" required className={inputClass} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 6 car." /></div>
                    <div className="md:col-span-1"><label className={labelClass}>Rol</label><select className={selectClass} value={newRole} onChange={e => setNewRole(e.target.value)}><option value="sales">Comercial</option><option value="manager">Jefe Ventas</option><option value="admin">Administrador</option></select></div>
                    <Button type="submit" icon={UserPlus} className="w-full">Crear</Button>
                </form>
                <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                    <table className="w-full text-sm text-left bg-white min-w-[600px]">
                        <thead className="bg-slate-100 text-slate-500 uppercase font-bold text-xs"><tr><th className="p-4">Email</th><th className="p-4">Nombre</th><th className="p-4">Rol</th><th className="p-4 text-right">Acciones</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">{users.map(u => { const isSuperAdmin = u.email === SUPER_ADMIN_EMAIL; return ( <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group"><td className="p-4 font-medium text-slate-700 flex items-center gap-2">{u.email}{isSuperAdmin && <span title="Super Admin"><Lock size={12} className="text-amber-500"/></span>}</td><td className="p-3"><div className="relative"><input className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1.5 outline-none text-slate-800" defaultValue={u.full_name || ''} onBlur={(e) => updateUserField(u.id, 'full_name', e.target.value, u.full_name)} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} /><Edit size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none" /></div></td><td className="p-3"><select className={`p-1.5 border rounded w-full text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : u.role === 'manager' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-slate-700 border-slate-200'} ${isSuperAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} value={u.role} disabled={isSuperAdmin} onChange={(e) => updateUserField(u.id, 'role', e.target.value, u.role)}><option value="sales">Comercial</option><option value="manager">Jefe Ventas</option><option value="admin">Administrador</option></select></td><td className="p-3 text-right">{!isSuperAdmin && (<button onClick={() => deleteUser(u.id, u.email)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>)}</td></tr> )})}</tbody>
                    </table>
                </div>
             </Card>
        </div>
    );
};

// 2. VISTA DASHBOARD
const DashboardView = ({ contacts, userRole, session, setEditingContact, setView, userProfile }: any) => {
    const [filterUserId, setFilterUserId] = useState<string>('all');
    const uniqueSalesUsers = Array.from(new Set(contacts.map((c: any) => c.user_id))).map(id => { const contact = contacts.find((c: any) => c.user_id === id); const name = contact?.profiles?.full_name || contact?.profiles?.email || 'Desconocido'; return { id, label: name }; }).filter(u => u.label !== 'Desconocido');
    let relevantContacts = contacts; if (userRole === 'sales') { relevantContacts = contacts.filter((c: any) => c.user_id === session.user.id); } else { if (filterUserId !== 'all') { relevantContacts = contacts.filter((c: any) => c.user_id === filterUserId); } }
    const total = relevantContacts.length; const clients = relevantContacts.filter((c: any) => c.sap_status === 'Cliente SAP').length; const leads = relevantContacts.filter((c: any) => ['Lead SAP', 'Nuevo Prospecto'].includes(c.sap_status)).length; 
    
    // LOGICA DE FECHAS MEJORADA
    const today = new Date().toISOString().split('T')[0]; 
    const overdue = relevantContacts.filter((c: any) => c.next_action_date && c.next_action_date < today).length;
    
    const todayTasks = relevantContacts.filter((c: any) => c.next_action_date === today);
    const todayTotal = todayTasks.length;
    const todayVisits = todayTasks.filter((c: any) => c.next_action?.toLowerCase().includes('visita')).length;
    const todayCalls = todayTasks.filter((c: any) => c.next_action?.toLowerCase().includes('llamada')).length;
    const todayOthers = todayTotal - todayVisits - todayCalls;

    const withMaterials = relevantContacts.filter((c: any) => c.contact_materials && c.contact_materials.length > 0).length; const withMachines = relevantContacts.filter((c: any) => c.contact_machinery && c.contact_machinery.length > 0).length; const materialsPct = total > 0 ? Math.round((withMaterials / total) * 100) : 0; const machinesPct = total > 0 ? Math.round((withMachines / total) * 100) : 0;
    const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Usuario';

    // NUEVA LÓGICA: Obtener últimos 5 contactos modificados para "Actividad Reciente"
    const recentActivity = [...relevantContacts]
        .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
        .slice(0, 5);

    return (
      <div className="space-y-6 animate-in fade-in duration-500 w-full overflow-hidden pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-1 gap-4">
             <div><h2 className="text-lg md:text-2xl font-bold text-slate-800 flex items-center gap-2">Hola, <span className="text-blue-600">{displayName}</span></h2><div className="flex items-center gap-2 mt-1"><span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{userRole === 'sales' ? 'Comercial' : userRole === 'manager' ? 'Jefe Ventas' : 'Administrador'}</span><span className="text-[10px] text-slate-400">{APP_VERSION}</span></div></div>
             {(userRole !== 'sales') && (<div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto"><Filter size={14} className="text-slate-400 ml-1 shrink-0" /><select className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full md:min-w-[150px]" value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)}><option value="all">Ver: Todos</option><option disabled>──────────</option>{uniqueSalesUsers.map((u: any) => (<option key={u.id} value={u.id}>{u.label}</option>))}</select></div>)}
        </div>
        
        {/* KPI CARDS CONSOLIDATED & ACTIONABLE (NUEVO DISEÑO HORIZONTAL) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full mb-2">
            
            {/* 1. ESTADÍSTICAS GENERALES (De Izquierda a Derecha) */}
            <Card className="p-2 md:p-4 border-l-4 border-l-blue-600 flex items-center h-full">
                <div className="flex w-full justify-between items-center divide-x divide-slate-100">
                    <div className="px-2 md:px-4 flex-1 text-center">
                        <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase mb-1">Base de Datos</p>
                        <h3 className="text-xl md:text-2xl font-bold text-slate-800">{total}</h3>
                    </div>
                    <div className="px-2 md:px-4 flex-1 text-center">
                        <p className="text-[9px] md:text-[10px] text-emerald-600 font-bold uppercase mb-1">Clientes</p>
                        <h3 className="text-xl md:text-2xl font-bold text-emerald-700">{clients}</h3>
                    </div>
                    <div className="px-2 md:px-4 flex-1 text-center">
                        <p className="text-[9px] md:text-[10px] text-indigo-500 font-bold uppercase mb-1">Prospectos</p>
                        <h3 className="text-xl md:text-2xl font-bold text-indigo-600">{leads}</h3>
                    </div>
                </div>
            </Card>

            {/* 2. GESTIÓN DE TIEMPO (Lado a Lado) */}
            <div className="grid grid-cols-2 gap-3 h-full">
                {/* ATRASADAS */}
                <div className="h-full cursor-pointer" onClick={() => setView('agenda')}>
                    <Card className={`p-3 border-l-4 flex flex-col justify-center items-center text-center transition-all h-full hover:shadow-md ${overdue > 0 ? 'border-l-red-500 bg-red-50/40 hover:bg-red-50' : 'border-l-slate-300 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-1 mb-1">
                            <AlertTriangle size={14} className={overdue > 0 ? 'text-red-600' : 'text-slate-400'}/>
                            <p className={`text-[9px] font-bold uppercase ${overdue > 0 ? 'text-red-700' : 'text-slate-500'}`}>Atrasado</p>
                        </div>
                        <h3 className={`text-2xl font-bold ${overdue > 0 ? 'text-red-700' : 'text-slate-400'}`}>{overdue}</h3>
                    </Card>
                </div>

                {/* AGENDA HOY */}
                <div className="h-full cursor-pointer" onClick={() => setView('agenda')}>
                    <Card className="p-3 border-l-4 border-l-blue-500 bg-blue-50/20 hover:bg-blue-50 transition-all h-full hover:shadow-md flex flex-col justify-center items-center text-center">
                        <div className="flex items-center gap-1 mb-1">
                            <ListTodo size={14} className="text-blue-600"/>
                            <p className="text-[9px] font-bold uppercase text-blue-700">Para Hoy</p>
                        </div>
                        <h3 className="text-2xl font-bold text-blue-900">{todayTotal}</h3>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                            {todayTotal > 0 ? (
                                <>
                                    {todayVisits} Vis, {todayCalls} Llam
                                    {todayOthers > 0 && `, ${todayOthers} Otros`}
                                </>
                            ) : 'Libre'}
                        </p>
                    </Card>
                </div>
            </div>
        </div>

        {/* SECCIÓN PRINCIPAL DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            
            {/* ACTIVIDAD RECIENTE */}
            <Card className="p-0 overflow-hidden flex flex-col h-full">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><Activity size={16} className="text-blue-600"/> Últimos Movimientos</h3>
                </div>
                <div className="divide-y divide-slate-50">
                    {recentActivity.length > 0 ? recentActivity.map((c: any) => (
                        <div key={c.id} onClick={() => { setEditingContact(c); setView('form'); }} className="p-3 hover:bg-blue-50/50 cursor-pointer transition-colors flex justify-between items-center group">
                            <div>
                                <p className="text-xs font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{c.fiscal_name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold ${c.sap_status === 'Cliente SAP' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{c.sap_status}</span>
                                    <span className="text-[9px] text-slate-400 truncate max-w-[150px]">{c.next_action || 'Sin acción'}</span>
                                </div>
                            </div>
                            <Edit size={14} className="text-slate-300 group-hover:text-blue-500" />
                        </div>
                    )) : (
                        <div className="p-8 text-center text-slate-400 text-sm italic">No hay actividad reciente.</div>
                    )}
                </div>
            </Card>

            {/* COLUMNA DERECHA: ACCESO RÁPIDO + CALIDAD */}
            <div className="flex flex-col gap-4 h-full">
                {/* ACCESO RÁPIDO COMPACTO */}
                <Card className="p-3 flex flex-col justify-center items-center text-center bg-white border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2"><KeyRound size={14} className="text-blue-500"/> Acceso Rápido</h3>
                    <div className="flex flex-row gap-2 w-full">
                        <Button onClick={() => { setEditingContact(null); setView('form'); }} icon={UserPlus} className="flex-1 shadow-sm justify-center bg-blue-600 hover:bg-blue-700 text-white border-none py-2 text-xs">Nuevo Briefing</Button>
                        <Button onClick={() => setView('agenda')} icon={Calendar} variant="secondary" className="flex-1 justify-center border border-slate-200 bg-white hover:bg-slate-50 py-2 text-xs">Ver Agenda</Button>
                    </div>
                </Card>

                <Card className="p-4 flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-xs mb-3 flex items-center gap-2 text-slate-600 uppercase tracking-wide"><BarChart2 size={14} className="text-purple-600"/> Calidad de Datos</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Materiales</span><span className="font-bold text-slate-800">{materialsPct}%</span></div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${materialsPct}%` }}></div></div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Maquinaria</span><span className="font-bold text-slate-800">{machinesPct}%</span></div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${machinesPct}%` }}></div></div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      </div>
    );
};

// 4. VISTA AGENDA SEMANAL (MODIFICADA - CON COLUMNA BACKLOG / ATRASADAS)
const AgendaView = ({ contacts, onActionComplete }: any) => {
    const [weekOffset, setWeekOffset] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, taskId: string) => { setDraggedTaskId(taskId); e.dataTransfer.effectAllowed = "move"; };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    
    // Al soltar en un día de la semana
    const handleDrop = async (e: React.DragEvent, targetDate: string) => {
        e.preventDefault();
        if (!draggedTaskId) return;
        const task = contacts.find((c: any) => c.id === draggedTaskId);
        // Solo actualizamos si la fecha cambia
        if (task && task.next_action_date !== targetDate) {
            try { 
                const { error } = await supabase.from('industrial_contacts').update({ next_action_date: targetDate }).eq('id', draggedTaskId); 
                if (error) throw error; 
                await onActionComplete(); 
            } catch (err: any) { alert("Error: " + err.message); }
        }
        setDraggedTaskId(null);
    };

    const handleModalAction = async (type: 'delete' | 'complete' | 'complete_new' | 'reschedule', report: string, nextActionData: any) => {
        if (!selectedTask) return;
        try {
            let updates: any = {};
            const today = new Date().toISOString().split('T')[0];
            const timeNow = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            
            if (type === 'reschedule') {
                updates = { next_action_date: nextActionData.date, next_action_time: nextActionData.time };
            } else {
                let actionLabel = "✅ COMPLETADO"; if (type === 'delete') actionLabel = "❌ CANCELADO";
                const logEntry = `\n[${today} ${timeNow}] ${actionLabel}: ${selectedTask.next_action}\n> Reporte: ${report}\n-------------------`;
                const currentSummary = selectedTask.solution_summary || '';
                
                if (type === 'delete' || type === 'complete') { updates = { next_action_date: null, next_action_time: null, next_action: type === 'delete' ? 'Tarea Cancelada' : 'Acción Completada (Definir siguiente)', solution_summary: currentSummary + logEntry }; } 
                else if (type === 'complete_new') { updates = { next_action: nextActionData.action, next_action_date: nextActionData.date, next_action_time: nextActionData.time, solution_summary: currentSummary + logEntry }; }
            }

            const { error } = await supabase.from('industrial_contacts').update(updates).eq('id', selectedTask.id);
            if (error) throw error;
            await onActionComplete(); setModalOpen(false);
        } catch (error: any) { alert("Error: " + error.message); }
    };

    // Generar días de la semana
    const getWeekDays = (offset: number) => { const curr = new Date(); const day = curr.getDay(); const diff = curr.getDate() - day + (day === 0 ? -6 : 1); const monday = new Date(curr.setDate(diff)); monday.setDate(monday.getDate() + (offset * 7)); const week = []; for (let i = 0; i < 5; i++) { const d = new Date(monday); d.setDate(monday.getDate() + i); week.push(d.toISOString().split('T')[0]); } return week; };
    const weekDays = getWeekDays(weekOffset); 
    const currentWeekStart = weekDays[0]; // El Lunes de la semana visualizada
    const today = new Date().toISOString().split('T')[0]; 
    const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    
    // Tareas generales
    const tasks = contacts.filter((c: any) => c.next_action_date);

    // FILTRO: Tareas Atrasadas (Fecha anterior al Lunes de esta semana visualizada)
    const overdueTasks = tasks.filter((c: any) => c.next_action_date < currentWeekStart).sort((a: any, b: any) => a.next_action_date.localeCompare(b.next_action_date));

    // Renderizador de Tarjeta (Reutilizable)
    const renderTaskCard = (task: any, isOverdue: boolean = false) => {
        let borderColor = "border-l-blue-500"; 
        let icon = <Phone size={12} />; 
        const action = task.next_action?.toLowerCase() || ''; 
        
        if (isOverdue) borderColor = "border-l-red-500 bg-red-50"; // Color rojo para atrasadas
        else {
            if (action.includes("visita")) { borderColor = "border-l-emerald-500"; icon = <Users size={12}/>; } 
            if (action.includes("oferta") || action.includes("presupuesto")) { borderColor = "border-l-orange-500"; icon = <FileText size={12}/>; }
        }

        return ( 
            <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} onClick={() => { setSelectedTask(task); setModalOpen(true); }} className={`bg-white p-3 rounded-lg border border-slate-100 border-l-4 ${borderColor} shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all active:scale-95 group relative mb-2`}>
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                        {icon} {isOverdue ? `${task.next_action_date.split('-')[2]}/${task.next_action_date.split('-')[1]}` : task.next_action_time?.slice(0,5)}
                    </span>
                    {isOverdue && <span className="text-[9px] font-bold text-red-600 animate-pulse">!</span>}
                </div>
                <p className="text-xs font-bold text-slate-800 line-clamp-1">{task.fiscal_name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 capitalize">{task.next_action}</p>
            </div> 
        );
    };

    return (
        <div className="space-y-4 animate-in fade-in pb-24 h-full flex flex-col">
            <TaskActionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} taskTitle={selectedTask?.next_action || 'Tarea'} currentTask={selectedTask} onAction={handleModalAction} />
            
            {/* CABECERA AGENDA */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0 gap-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="text-blue-600"/> Agenda Semanal</h2>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 hover:bg-white rounded-md shadow-sm transition-all text-slate-600"><ArrowLeft size={18}/></button>
                    <span className="text-sm font-bold w-32 text-center text-slate-700">{weekOffset === 0 ? "Esta Semana" : weekOffset === 1 ? "Próxima" : weekOffset === -1 ? "Pasada" : `Semana ${weekOffset > 0 ? '+' : ''}${weekOffset}`}</span>
                    <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 hover:bg-white rounded-md shadow-sm transition-all text-slate-600"><ArrowRight size={18}/></button>
                </div>
            </div>

            {/* GRID DE 6 COLUMNAS (1 Backlog + 5 Días) */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 h-full overflow-y-auto">
                
                {/* COLUMNA 1: ATRASADAS / PENDIENTES */}
                <div className="flex flex-col h-full min-h-[200px] rounded-xl border border-red-200 bg-red-50/30">
                    <div className="p-3 text-center border-b border-red-200 bg-red-100/50 rounded-t-xl">
                        <p className="text-xs font-bold uppercase text-red-700 flex items-center justify-center gap-1"><AlertCircle size={12}/> Pendientes</p>
                        <p className="text-[10px] font-bold text-red-800 opacity-70">Anteriores a esta semana</p>
                    </div>
                    <div className="p-2 flex-1 overflow-y-auto">
                        {overdueTasks.length > 0 ? (
                            overdueTasks.map((task: any) => renderTaskCard(task, true))
                        ) : (
                            <div className="h-20 flex items-center justify-center opacity-40"><p className="text-[10px] text-slate-500 italic text-center">¡Todo al día! <br/>Sin tareas antiguas.</p></div>
                        )}
                    </div>
                </div>

                {/* COLUMNAS 2-6: LUNES A VIERNES */}
                {weekDays.map((dateStr, index) => { 
                    const dayTasks = tasks.filter((c: any) => c.next_action_date === dateStr).sort((a: any, b: any) => (a.next_action_time || '00:00').localeCompare(b.next_action_time || '00:00')); 
                    const isToday = dateStr === today; 
                    
                    return ( 
                        <div key={dateStr} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, dateStr)} className={`flex flex-col h-full min-h-[200px] rounded-xl border transition-colors ${isToday ? 'border-blue-400 ring-1 ring-blue-200 bg-blue-50/20' : 'border-slate-200 bg-slate-50/30'}`}>
                            <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-100/50 border-blue-200' : 'bg-slate-100/50 border-slate-200'} rounded-t-xl`}>
                                <p className={`text-xs font-bold uppercase ${isToday ? 'text-blue-700' : 'text-slate-500'}`}>{dayNames[index]}</p>
                                <p className={`text-sm font-bold ${isToday ? 'text-blue-900' : 'text-slate-700'}`}>{dateStr.split('-')[2]}/{dateStr.split('-')[1]}</p>
                            </div>
                            <div className="p-2 flex-1 overflow-y-auto">
                                {dayTasks.map((task: any) => renderTaskCard(task, false))}
                                {dayTasks.length === 0 && <div className="h-20 flex items-center justify-center opacity-30"><p className="text-xs text-slate-400 italic">--</p></div>}
                            </div>
                        </div> 
                    ); 
                })}
            </div>
        </div>
    );
};

// 5. VISTA LISTA
// CORRECCIÓN: Optimización de anchura para móvil y búsqueda
const ListView = ({ contacts, loading, searchTerm, setSearchTerm, userRole, session, setEditingContact, setView, handleDelete }: any) => {
    const [viewFilter, setViewFilter] = useState<string>('all'); 
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedClientHistory, setSelectedClientHistory] = useState<any>(null);
    const [newActionModalOpen, setNewActionModalOpen] = useState(false);
    const [selectedClientForAction, setSelectedClientForAction] = useState<any>(null);

    const handleSaveNewAction = async (action: string, date: string, time: string) => {
        if (!selectedClientForAction) return;
        try { const { error } = await supabase.from('industrial_contacts').update({ next_action: action, next_action_date: date, next_action_time: time }).eq('id', selectedClientForAction.id); if (error) throw error; setNewActionModalOpen(false); } catch (err: any) { alert("Error: " + err.message); }
    };

    let displayContacts = contacts;
    if (userRole === 'sales') { displayContacts = contacts.filter((c: any) => c.user_id === session.user.id); } 
    else { if (viewFilter === 'mine') { displayContacts = contacts.filter((c: any) => c.user_id === session.user.id); } else if (viewFilter !== 'all') { displayContacts = contacts.filter((c: any) => c.user_id === viewFilter); } }
    
    // CORRECCIÓN BÚSQUEDA: Añadido filtro por persona de contacto
    const filtered = displayContacts.filter((c: any) => c.fiscal_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()));
    const uniqueSalesUsers = Array.from(new Set(contacts.map((c: any) => c.user_id))).map(id => { const contact = contacts.find((c: any) => c.user_id === id); const name = contact?.profiles?.full_name || contact?.profiles?.email || 'Desconocido'; return { id, label: name }; }).filter(u => u.label !== 'Desconocido');

    return (
      <div className="space-y-4 animate-in fade-in duration-500 pb-24 w-full overflow-hidden">
        <ClientHistoryModal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} client={selectedClientHistory} onOpenNewAction={(client: any) => { setSelectedClientForAction(client); setNewActionModalOpen(true); }} />
        <NewActionModal isOpen={newActionModalOpen} onClose={() => setNewActionModalOpen(false)} onSave={handleSaveNewAction} clientName={selectedClientForAction?.fiscal_name || 'Cliente'} />
        <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div><h2 className="text-xl font-bold text-slate-800">Base de Datos</h2><p className="text-xs text-slate-500">{userRole === 'sales' ? 'Mis Fichas' : `Mostrando: ${viewFilter === 'all' ? 'Todos' : viewFilter === 'mine' ? 'Mis Fichas' : 'Filtro Usuario'}`}</p></div>
               {(userRole === 'manager' || userRole === 'admin') && (<div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200 w-full md:w-auto overflow-x-auto no-scrollbar"><button onClick={() => setViewFilter('all')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${viewFilter === 'all' ? 'bg-white text-blue-600 shadow-sm border' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button><button onClick={() => setViewFilter('mine')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${viewFilter === 'mine' ? 'bg-white text-blue-600 shadow-sm border' : 'text-slate-500 hover:text-slate-700'}`}>Míos</button><div className="h-4 w-px bg-slate-300 mx-1"></div><select value={viewFilter !== 'all' && viewFilter !== 'mine' ? viewFilter : ''} onChange={(e) => setViewFilter(e.target.value || 'all')} className="bg-transparent text-xs font-bold text-slate-600 outline-none min-w-[120px]"><option value="">Filtrar por usuario...</option>{uniqueSalesUsers.map((u: any) => (<option key={u.id} value={u.id}>{u.label}</option>))}</select></div>)}
           </div>
           {/* CORRECCIÓN ESTILO INPUT: Añadido bg-white y text-slate-900 */}
           <div className="relative w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Buscar empresa o contacto..." className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        </div>
        {loading ? <div className="text-center p-20"><Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={32}/><p className="text-slate-500">Cargando...</p></div> : (
          <div className="grid gap-3 w-full">
            {filtered.length === 0 && <div className="text-center py-10 text-slate-400">No se encontraron resultados.</div>}
            {filtered.map((c: any) => (
              <Card key={c.id} className="p-3 md:p-4 hover:shadow-lg transition-all border border-slate-200 w-full max-w-full overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start gap-3 w-full">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col gap-1 mb-2">
                        <h3 className="font-bold text-base text-slate-900 truncate">{c.fiscal_name}</h3>
                        <div className="flex gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border w-fit ${c.sap_status === 'Cliente SAP' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{c.sap_status}</span>
                            {(userRole !== 'sales' && c.profiles) && (<span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200 flex items-center gap-1 max-w-[120px] truncate"><User size={10}/> {c.profiles.full_name || c.profiles.email.split('@')[0]}</span>)}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-slate-600"><span className="flex items-center gap-2 truncate"><Users size={14} className="text-slate-400 shrink-0"/> {c.contact_person || 'Sin contacto'}</span><span className="flex items-center gap-2 truncate"><Briefcase size={14} className="text-slate-400 shrink-0"/> <span className="text-slate-500 text-xs">Titular:</span> {c.profiles?.full_name || c.profiles?.email || 'N/A'}</span></div>
                  </div>
                  <div className={`grid ${userRole === 'admin' || c.user_id === session.user.id ? 'grid-cols-4' : 'grid-cols-3'} gap-1 w-full md:w-auto md:flex md:gap-2 shrink-0 self-end md:self-start justify-end border-t md:border-none pt-2 md:pt-0 mt-2 md:mt-0`}>
                      <button onClick={() => { setSelectedClientHistory(c); setHistoryModalOpen(true); }} className="p-1.5 md:p-2 text-slate-400 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 rounded-lg flex justify-center transition-colors" title="Ver Historial"><ClipboardList size={18}/></button>
                      <button onClick={() => { setSelectedClientForAction(c); setNewActionModalOpen(true); }} className="p-1.5 md:p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg flex justify-center"><CalendarPlus size={18}/></button>
                      <button onClick={() => { setEditingContact(c); setView('form'); }} className="p-1.5 md:p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg flex justify-center"><Edit size={18}/></button>
                      {(userRole === 'admin' || c.user_id === session.user.id) && (<button onClick={() => handleDelete(c.id)} className="p-1.5 md:p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg flex justify-center"><Trash2 size={18}/></button>)}
                  </div>
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
  
  const [loginUsersList, setLoginUsersList] = useState<any[]>([]);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { async function loadLoginUsers() { const { data } = await supabase.from('profiles').select('email, full_name').order('full_name'); if (data) setLoginUsersList(data); } if (!session) loadLoginUsers(); }, [session]);
  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) fetchUserProfile(session.user.id); }); const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => { if (event === 'PASSWORD_RECOVERY') { setRecoveryMode(true); } setSession(session); if (session) fetchUserProfile(session.user.id); else { setContacts([]); setUserRole('sales'); setUserProfile(null); setRecoveryMode(false); } }); return () => subscription.unsubscribe(); }, []);
  useEffect(() => { if (session) fetchContacts(); const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, [session]);

  async function fetchUserProfile(userId: string) { const { data } = await supabase.from('profiles').select('*').eq('id', userId).single(); if (data) { setUserRole(data.role); setUserProfile(data); } }
  async function handleLogin(e: React.FormEvent) { e.preventDefault(); if (!email) return alert("Selecciona un usuario"); setAuthLoading(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) alert(error.message); setAuthLoading(false); }
  async function handleResetPassword() { if (!email) { return alert("Por favor, selecciona tu usuario en el campo de arriba para poder enviarte el correo de recuperación."); } setAuthLoading(true); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://crm-industrial-v7-final.vercel.app/', }); setAuthLoading(false); if (error) { alert("Error: " + error.message); } else { alert("¡Enviado! Revisa tu bandeja de entrada (y spam) para restablecer tu contraseña."); } }
  async function handleUpdateUserPassword(e: React.FormEvent) { e.preventDefault(); setAuthLoading(true); const { error } = await supabase.auth.updateUser({ password: newPassword }); if (error) { alert("Error al guardar: " + error.message); } else { alert("Contraseña actualizada correctamente. Ya puedes usar el CRM."); setRecoveryMode(false); setNewPassword(''); } setAuthLoading(false); }
  async function handleLogout() { setLoading(true); await supabase.auth.signOut(); setSession(null); window.location.reload(); }

  // FETCH CONTACTS
  async function fetchContacts() {
    try {
      setLoading(true);
      try {
          const { data, error } = await supabase.from('industrial_contacts').select('*, profiles:user_id(email, full_name, role), contact_materials(id), contact_machinery(id)').range(0, 9999).order('created_at', { ascending: false });
          if (error) throw error;
          setContacts(data || []);
      } catch (innerError) {
          console.warn("Fallo al cargar relaciones:", innerError);
          const { data } = await supabase.from('industrial_contacts').select('*, profiles:user_id(email, full_name, role)').range(0, 9999).order('created_at', { ascending: false });
          setContacts(data || []);
      }
    } catch (error) { console.error('Error fatal:', error); } finally { setLoading(false); }
  }

  async function handleDelete(id: string) { if (!window.confirm('¿Borrar registro permanentemente?')) return; const { error } = await supabase.from('industrial_contacts').delete().eq('id', id); if (!error) fetchContacts(); else alert("No tienes permisos para borrar este registro."); }

  const navBtnClass = (active: boolean) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`;

  // --- 1. PANTALLA ESPECIAL: RESTABLECER CONTRASEÑA ---
  if (session && recoveryMode) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-100 p-4">
            <Card className="max-w-md p-8 shadow-2xl w-11/12 border-t-4 border-t-blue-600">
                <div className="flex justify-center mb-6 text-blue-600"><KeyRound size={48} /></div>
                <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Nueva Contraseña</h1>
                <p className="text-center text-slate-500 text-sm mb-6">Introduce tu nueva contraseña para acceder.</p>
                <form onSubmit={handleUpdateUserPassword} className="space-y-4">
                    <div><label className={labelClass}>Nueva Contraseña</label><input type="password" required className={inputClass} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} /></div>
                    <Button type="submit" className="w-full py-3" disabled={authLoading}>{authLoading ? <Loader2 className="animate-spin"/> : 'Guardar Nueva Contraseña'}</Button>
                </form>
            </Card>
        </div>
      );
  }

  // --- 2. PANTALLA LOGIN ---
  if (!session) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-100 p-4">
            <Card className="max-w-md p-8 shadow-2xl w-11/12">
                <div className="flex justify-center mb-6"><img src={logoM} alt="Logo" className="w-20 h-20 object-contain" /></div>
                <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Briefing Colaborativo</h1>
                <p className="text-center text-slate-500 font-bold mb-1">{APP_VERSION}</p>
                <p className="text-center text-slate-400 text-xs mb-8">Inicia sesión para acceder</p>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div><label className={labelClass}>Usuario</label><div className="relative"><select required className={`${selectClass} cursor-pointer`} value={email} onChange={e => setEmail(e.target.value)}><option value="">-- Selecciona tu nombre --</option>{loginUsersList.map(u => (<option key={u.email} value={u.email}>{u.full_name || u.email}</option>))}</select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500"><svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg></div></div></div>
                    <div><label className={labelClass}>Contraseña</label><input type="password" required className={inputClass} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></div>
                    <Button type="submit" className="w-full py-3" disabled={authLoading}>{authLoading ? <Loader2 className="animate-spin"/> : 'Entrar'}</Button>
                    <div className="text-center pt-2"><button type="button" onClick={handleResetPassword} className="text-xs text-blue-600 hover:text-blue-800 font-bold underline" disabled={authLoading}>¿Olvidaste tu contraseña?</button></div>
                </form>
            </Card>
        </div>
    );
  }

  // --- 3. APP PRINCIPAL ---
  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 w-full fixed inset-0 max-w-[100vw] overflow-x-hidden">
       {/* MENU LATERAL */}
       <aside className={`fixed lg:static inset-y-0 left-0 z-[100] w-72 bg-slate-900 text-white transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col shadow-2xl shrink-0`}>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
             <div className="bg-white rounded-lg p-1 w-12 h-12 flex items-center justify-center shrink-0"><img src={logoM} alt="Logo" className="w-full h-full object-contain" /></div>
             <div className="min-w-0"><span className="text-lg font-bold tracking-tight block truncate">Briefing Colaborativo</span><span className="text-[10px] block opacity-70">{APP_VERSION}</span></div>
          </div>
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
             <button onClick={() => { setView('dashboard'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'dashboard')}><LayoutDashboard size={20}/> <span>Dashboard</span></button>
             <button onClick={() => { setView('agenda'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'agenda')}><Calendar size={20}/> <span>Agenda</span></button>
             <button onClick={() => { setView('list'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'list')}><Users size={20}/> <span>Base de Datos</span></button>
             {userRole === 'admin' && (<><div className="pt-4 pb-2 px-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Admin</p></div><button onClick={() => { setView('admin'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'admin')}><UserCog size={20}/> <span>Gestión Usuarios</span></button></>)}
             <div className="pt-6 pb-2 px-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Acciones</p></div>
             <button onClick={() => { setEditingContact(null); setView('form'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={navBtnClass(view === 'form')}><UserPlus size={20}/> <span>Briefing</span></button>
          </nav>
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2"><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors"><LogOut size={20}/> <span>Cerrar Sesión</span></button></div>
       </aside>
       
       <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full bg-slate-50">
          <header className="bg-white border-b border-slate-200 p-3 flex items-center justify-between lg:hidden shadow-sm z-10 shrink-0 h-14">
             <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2 active:bg-slate-100 rounded"><Menu size={24} /></button>
             <span className="font-bold text-slate-800">Briefing Colaborativo</span><div className="w-8"></div>
          </header>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-0 md:p-8 w-full scroll-smooth bg-slate-50">
            {/* CORRECCIÓN: Renderizado condicional estricto para evitar espacio fantasma */}
            {view !== 'form' ? (
                <div className="px-1 pt-0 md:p-0 pb-20 w-full"> 
                    {view === 'dashboard' && <DashboardView contacts={contacts} userRole={userRole} userProfile={userProfile} session={session} setEditingContact={setEditingContact} setView={setView} />}
                    {view === 'agenda' && <AgendaView contacts={contacts} setEditingContact={setEditingContact} setView={setView} onActionComplete={fetchContacts} />}
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
            ) : (
                // CORRECCIÓN: Margen negativo aumentado a -10 para subir el formulario
                <div className="-mt-10 md:mt-0">
                    <ContactForm 
                        session={session}
                        initialData={editingContact}
                        onCancel={() => setView('list')}
                        onSuccess={() => { fetchContacts(); setView('list'); }}
                    />
                </div>
            )}
          </div>
       </main>
       {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-[90] lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}
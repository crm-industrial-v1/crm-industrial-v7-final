import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, Briefcase, Factory, Package, Calendar, 
  ArrowRight, ArrowLeft, CheckCircle2, Wrench, MessageCircle,
  X, Plus, Truck, Settings, HelpCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SectionHeader } from '../ui/SectionHeader';

// --- OPCIONES ESTÁTICAS ---
const MATERIAL_OPTIONS = [
  "00 - Fleje Manual", "00 - Fleje Automático", "00 - Fleje Poliéster (PET)", "00 - Fleje Acero",
  "01 - Film Estirable Manual", "01 - Film Estirable Automático", "01 - Film Macroperforado",
  "02 - Precinto PP", "02 - Precinto PVC", "02 - Precinto Personalizado",
  "03 - Film Retráctil", "05 - Protección", "06 - Bolsas", "99 - Otros"
];

const MACHINE_TYPE_OPTIONS = [
    "Envolvedora", "Retractiladora", "Flejadora", "Precintadora", 
    "Formadora de Cajas", "Impresión", "Inspección", "Pesaje", 
    "Aplicación Etiquetas", "Otro"
];

const MACHINE_STATUS_OPTIONS = ["Óptimo", "Medio", "Pésimo"];

// --- NUEVAS OPCIONES ESTANDARIZADAS (PERFIL PRODUCCIÓN) ---
const SECTOR_OPTIONS = [
  "Alimentación - Frescos",
  "Alimentación - Secos/Procesados",
  "Bebidas y Líquidos",
  "Cosmética y Farmacia",
  "Industrial / Automoción",
  "E-commerce / Retail",
  "Químico / Agrícola",
  "Otro"
];

const VOLUME_OPTIONS = [
  "< 50 pallets/año (Bajo)",
  "50 - 300 pallets/año (Pyme)",
  "300 - 1.200 pallets/año (Media)",
  "1.200 - 5.000 pallets/año (Grande)",
  "> 5.000 pallets/año (Key Account)"
];

const OPERATING_MODEL_OPTIONS = [
  "100% Interno (Fabrican y envasan)",
  "Maquilador / Envasador",
  "Marca (Solo gestionan, envasa otro)"
];

// --- ORDEN DE PESTAÑAS: Diagnóstico ANTES de Materiales ---
const TABS = [
    { id: 'sap', label: 'Identificación SAP', icon: Search },
    { id: 'registro', label: 'Datos Registro', icon: Briefcase },
    { id: 'negocio', label: 'Perfil Prod.', icon: Factory }, 
    { id: 'necesidades', label: 'Diagnóstico', icon: Search }, 
    { id: 'materiales', label: 'Materiales', icon: Package },
    { id: 'maquinaria', label: 'Maquinaria', icon: Wrench }, 
    { id: 'cierre', label: 'Próximos pasos', icon: Calendar } 
];

// Estilos
const inputClass = "w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-sm";
const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";
const selectClass = "w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none text-sm";

interface Props {
    session: any;
    initialData: any; 
    onCancel: () => void;
    onSuccess: () => void;
}

export default function ContactForm({ session, initialData, onCancel, onSuccess }: Props) {
    const [activeTab, setActiveTab] = useState('sap');
    const [saving, setSaving] = useState(false);
    
    // Estado principal del contacto
    const [formData, setFormData] = useState({
        // ID y SAP
        sap_status: 'Nuevo Prospecto', sap_id: '',
        
        // Datos Contacto
        fiscal_name: '', cif: '', contact_person: '', job_title: '', phone: '', email: '', 
        address: '', city: '', state: '', 
        
        // Perfil Producción
        sector: '', main_products: '', volume: '', packaging_mgmt: '',
        
        // Diagnóstico
        process_description: '', 
        bottlenecks: '', 
        production_peaks: '',

        // Necesidades y Cierre
        pain_points: [] as string[], 
        budget: 'Sin presupuesto fijo',
        detected_interest: [] as string[], 
        solution_summary: '', 
        next_action: 'Llamada de seguimiento', 
        next_action_date: '', 
        next_action_time: '09:00', 
        responsible: ''
    });

    const [materials, setMaterials] = useState<any[]>([]);
    const [machines, setMachines] = useState<any[]>([]);

    useEffect(() => {
        if (initialData) {
            const { id, created_at, user_id, profiles, ...rest } = initialData;
            const cleanData = { ...rest };
            
            // Limpieza de campos legacy
            delete cleanData.quality_rating; delete cleanData.sustainable_interest;
            delete cleanData.mac1_type; delete cleanData.mac1_brand; 
            delete cleanData.mac1_age; delete cleanData.mac1_status;

            setFormData(cleanData);
            fetchRelatedData(initialData.id);
        } else {
            addMaterial();
            addMachine();
        }
    }, [initialData]);

    const fetchRelatedData = async (contactId: string) => {
        const { data: matData } = await supabase.from('contact_materials').select('*').eq('contact_id', contactId);
        if (matData && matData.length > 0) setMaterials(matData);
        else addMaterial();

        const { data: macData } = await supabase.from('contact_machinery').select('*').eq('contact_id', contactId);
        if (macData && macData.length > 0) setMachines(macData);
        else addMachine();
    };

    const handleChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
    
    const handleMultiSelect = (field: keyof typeof formData, value: string) => {
        const current = (formData[field] as string[]) || [];
        const updated = current.includes(value) ? current.filter(i => i !== value) : [...current, value];
        setFormData(prev => ({ ...prev, [field]: updated }));
    };

    // --- GESTIÓN DE MATERIALES ---
    const addMaterial = () => setMaterials([...materials, { tempId: Date.now(), material_type: '', id_medidas: '', consumption: '', price: '', supplier: '', notes: '' }]);
    const removeMaterial = (index: number) => { const newMats = [...materials]; newMats.splice(index, 1); setMaterials(newMats); };
    const updateMaterial = (index: number, field: string, value: string) => { const newMats = [...materials]; newMats[index] = { ...newMats[index], [field]: value }; setMaterials(newMats); };

    // --- GESTIÓN DE MAQUINARIA ---
    const addMachine = () => setMachines([...machines, { tempId: Date.now(), machine_type: '', custom_type: '', brand: '', model: '', age: '', status: 'Medio', maintenance_contract: 'No', substitution_potential: 'No' }]);
    const removeMachine = (index: number) => { const newMacs = [...machines]; newMacs.splice(index, 1); setMachines(newMacs); };
    const updateMachine = (index: number, field: string, value: string) => { 
        const newMacs = [...machines]; 
        newMacs[index] = { ...newMacs[index], [field]: value }; 
        if (field === 'machine_type' && value !== 'Otro') {
            newMacs[index].custom_type = ''; 
        }
        setMachines(newMacs); 
    };

    // --- GUARDADO ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const contactPayload: any = { ...formData };
            if (!contactPayload.next_action_date) contactPayload.next_action_date = null;
            if (!contactPayload.next_action_time) contactPayload.next_action_time = null;
            if (!initialData) contactPayload.user_id = session.user.id;

            let contactId = initialData?.id;
            
            if (initialData) {
                const { error } = await supabase.from('industrial_contacts').update(contactPayload).eq('id', initialData.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('industrial_contacts').insert([contactPayload]).select().single();
                if (error) throw error;
                contactId = data.id;
            }

            if (contactId) {
                // 1. Materiales
                await supabase.from('contact_materials').delete().eq('contact_id', contactId);
                const matsToSave = materials.filter(m => m.material_type).map(m => ({
                    contact_id: contactId,
                    material_type: m.material_type,
                    id_medidas: m.id_medidas,
                    consumption: m.consumption,
                    price: m.price,
                    supplier: m.supplier,
                    notes: m.notes
                }));
                if (matsToSave.length > 0) await supabase.from('contact_materials').insert(matsToSave);

                // 2. Maquinaria
                await supabase.from('contact_machinery').delete().eq('contact_id', contactId);
                const macsToSave = machines.filter(m => m.machine_type).map(m => ({
                    contact_id: contactId,
                    machine_type: m.machine_type === 'Otro' ? (m.custom_type || 'Otro') : m.machine_type,
                    brand: m.brand,
                    model: m.model,
                    age: m.age,
                    status: m.status,
                    maintenance_contract: m.maintenance_contract,
                    substitution_potential: m.substitution_potential
                }));
                if (macsToSave.length > 0) await supabase.from('contact_machinery').insert(macsToSave);
            }
            onSuccess();
        } catch (err: any) {
            alert('Error al guardar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const goToNextTab = () => { const idx = TABS.findIndex(t => t.id === activeTab); if(idx < TABS.length -1) setActiveTab(TABS[idx+1].id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const goToPrevTab = () => { const idx = TABS.findIndex(t => t.id === activeTab); if(idx > 0) setActiveTab(TABS[idx-1].id); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    return (
        <div className="max-w-5xl mx-auto pb-32 w-full px-0 md:px-0">
            
            {/* TÍTULO SIMPLE */}
            <div className="hidden md:block mb-4 mt-2 px-1">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {initialData ? 'Editar Briefing' : 'Nuevo Briefing'}
                </h2>
                <p className="text-xs text-slate-500">Complete la información paso a paso.</p>
            </div>

            {/* TABS NAVEGACIÓN */}
            <div className="sticky top-0 z-50 py-2 bg-slate-100/95 backdrop-blur-md shadow-sm border-b border-slate-200/50 transition-all -mt-2 md:mt-0 w-full rounded-none md:rounded-xl">
                <div className="bg-white md:rounded-xl shadow-sm border border-slate-200 p-2 overflow-x-auto no-scrollbar">
                    <div className="flex md:grid md:grid-cols-7 gap-2 min-w-max md:min-w-0"> 
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all text-[10px] md:text-sm gap-1 border ${activeTab === tab.id ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm' : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'} w-24 md:w-full`}
                            >
                                <tab.icon size={18} className={`mb-0.5 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`}/>
                                <span className="whitespace-nowrap md:whitespace-normal text-center leading-none">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 w-full px-0.5 mt-4 md:mt-0">
                
                {/* 1. SAP */}
                {activeTab === 'sap' && (<Card className="p-4 md:p-8"><SectionHeader title="Identificación SAP" icon={Search} /><div className="grid grid-cols-1 gap-4"><div><label className={labelClass}>Estado</label><select className={selectClass} value={formData.sap_status} onChange={e => handleChange('sap_status', e.target.value)}><option>Nuevo Prospecto</option><option>Lead SAP</option><option>Cliente SAP</option></select></div><div><label className={labelClass}>Código SAP</label><input className={inputClass} placeholder="Ej: C000450" value={formData.sap_id} onChange={e => handleChange('sap_id', e.target.value)} /></div></div><div className="flex justify-end mt-6 pt-4 border-t"><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary">Siguiente</Button></div></Card>)}
                
                {/* 2. DATOS REGISTRO */}
                {activeTab === 'registro' && (
                    <Card className="p-4 md:p-8">
                        <SectionHeader title="Datos" icon={Briefcase} />
                        <div className="grid grid-cols-1 gap-4">
                            <div><label className={labelClass}>Fiscal *</label><input required className={inputClass} value={formData.fiscal_name} onChange={e => handleChange('fiscal_name', e.target.value)} /></div>
                            <div><label className={labelClass}>CIF *</label><input required className={inputClass} value={formData.cif} onChange={e => handleChange('cif', e.target.value)} /></div>
                            <div><label className={labelClass}>Contacto</label><input className={inputClass} value={formData.contact_person} onChange={e => handleChange('contact_person', e.target.value)} /></div>
                            <div><label className={labelClass}>Cargo</label><input className={inputClass} value={formData.job_title} onChange={e => handleChange('job_title', e.target.value)} /></div>
                            <div><label className={labelClass}>Teléfono</label><input className={inputClass} value={formData.phone} onChange={e => handleChange('phone', e.target.value)} /></div>
                            <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={formData.email} onChange={e => handleChange('email', e.target.value)} /></div>
                            <div className="md:col-span-2"><label className={labelClass}>Dirección</label><input className={inputClass} value={formData.address} onChange={e => handleChange('address', e.target.value)} /></div>
                            <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                <div><label className={labelClass}>Ciudad</label><input className={inputClass} value={formData.city || ''} onChange={e => handleChange('city', e.target.value)} placeholder="Ej: Sevilla" /></div>
                                <div><label className={labelClass}>Provincia</label><input className={inputClass} value={formData.state || ''} onChange={e => handleChange('state', e.target.value)} placeholder="Ej: Sevilla" /></div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div>
                    </Card>
                )}

                {/* 3. PERFIL PRODUCCIÓN */}
                {activeTab === 'negocio' && (
                    <Card className="p-4 md:p-8">
                        <SectionHeader title="Perfil de Producción" icon={Factory} />
                        
                        <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-2">
                                <MessageCircle size={16}/> Preguntas Clave
                            </h4>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 ml-1">
                                <li>"¿Qué productos fabricáis o manipuláis aquí?"</li>
                                <li>"¿Qué volumen movéis? ¿Cuántos camiones/pallets salen a la semana?"</li>
                                <li>"¿El envasado lo hacéis vosotros o lo externalizáis?"</li>
                            </ul>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className={labelClass}>Sector / Tipo de Producto</label>
                                <select className={selectClass} value={formData.sector} onChange={e => handleChange('sector', e.target.value)}>
                                    <option value="">-- Selecciona Sector --</option>
                                    {SECTOR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass} title="Ayuda a clasificar la cuenta por potencial">
                                    <span className="flex items-center gap-1"><Truck size={14}/> Volumen Anual (Pallets)</span>
                                </label>
                                <select className={`${selectClass} font-medium`} value={formData.volume} onChange={e => handleChange('volume', e.target.value)}>
                                    <option value="">-- Selecciona Rango --</option>
                                    {VOLUME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <span className="flex items-center gap-1"><Settings size={14}/> Gestión del Proceso</span>
                                </label>
                                <select className={selectClass} value={formData.packaging_mgmt} onChange={e => handleChange('packaging_mgmt', e.target.value)}>
                                    <option value="">-- Selecciona Modelo --</option>
                                    {OPERATING_MODEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Notas de Producto</label>
                                <textarea 
                                    className={`${inputClass} h-20 resize-none`} 
                                    placeholder="Detalles específicos (ej: 'Naranjas en mallas de 2kg', 'Piezas de automoción pesadas'...)" 
                                    value={formData.main_products} 
                                    onChange={e => handleChange('main_products', e.target.value)} 
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div>
                    </Card>
                )}

                {/* 4. DIAGNÓSTICO */}
                {activeTab === 'necesidades' && (
                    <Card className="p-4 md:p-8 border-l-4 border-l-purple-600">
                        <SectionHeader title="Diagnóstico del Proceso" icon={Search} />
                        
                        <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <h4 className="text-sm font-bold text-purple-800 flex items-center gap-2 mb-2">
                                <MessageCircle size={16}/> Objetivo: Detectar Dolor
                            </h4>
                            <p className="text-xs text-slate-600 mb-2">
                                No vendas todavía. Haz que el cliente te cuente sus problemas.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            
                            <div>
                                <label className={labelClass}>¿Cómo es el proceso actual? (Flujo)</label>
                                <textarea 
                                    className={`${inputClass} h-20`} 
                                    placeholder="Desde que sale de producción hasta que queda embalado..." 
                                    value={formData.process_description || ''} 
                                    onChange={e => handleChange('process_description', e.target.value)} 
                                />
                            </div>

                            <div>
                                <label className={labelClass}>¿Dónde están los problemas / Cuellos de botella?</label>
                                <textarea 
                                    className={`${inputClass} h-20 border-red-200 bg-red-50/30`} 
                                    placeholder="Roturas, paradas de línea, falta de personal, material defectuoso..." 
                                    value={formData.bottlenecks || ''} 
                                    onChange={e => handleChange('bottlenecks', e.target.value)} 
                                />
                            </div>

                            <div>
                                <label className={labelClass}>¿Tenéis picos de producción?</label>
                                <input 
                                    className={inputClass} 
                                    placeholder="Ej: Sí, en campaña de Navidad se nos acumula el stock..." 
                                    value={formData.production_peaks || ''} 
                                    onChange={e => handleChange('production_peaks', e.target.value)} 
                                />
                            </div>

                            <div className="border-t border-slate-200 my-2"></div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Etiquetado Rápido (Pain Points)</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {['Ahorro de costes', 'Renovación maquinaria', 'Mejorar estabilidad', 'Servicio Técnico', 'Reducir plástico', 'Exceso de mermas', 'Automatización'].map(opt => (
                                        <label key={opt} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-white transition-colors cursor-pointer">
                                            <input type="checkbox" checked={formData.pain_points?.includes(opt)} onChange={() => handleMultiSelect('pain_points', opt)} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"/>
                                            <span className="text-sm font-medium text-slate-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Presupuesto / Expectativa</label>
                                <select className={selectClass} value={formData.budget} onChange={e => handleChange('budget', e.target.value)}>
                                    <option>Sin presupuesto fijo</option>
                                    <option>Partida anual asignada</option>
                                    <option>Buscan solo precio bajo (Low Cost)</option>
                                    <option>Inversión por ahorro (ROI)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t">
                            <Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button>
                            <Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button>
                        </div>
                    </Card>
                )}
                
                {/* 5. MATERIALES (CON GUÍA ACTUALIZADA) */}
                {activeTab === 'materiales' && (
                    <Card className="p-4 md:p-8 bg-slate-50">
                        <SectionHeader title="Materiales de Consumo" icon={Package} />
                        
                        {/* --- GUÍA CONVERSACIONAL INTEGRADA --- */}
                        <div className="mb-6 bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
                                <HelpCircle size={16}/> Preguntas para no parecer un "interrogatorio":
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                                <div className="p-2 bg-blue-50 rounded border border-blue-100">
                                    <strong className="block text-blue-700 mb-1">Para el TIPO (Verificar):</strong>
                                    "Para ver si hay compatibilidad 100% con tu máquina... ¿me dejas ver una etiqueta de la caja?"
                                </div>
                                <div className="p-2 bg-blue-50 rounded border border-blue-100">
                                    <strong className="block text-blue-700 mb-1">Para el CONSUMO (Logística):</strong>
                                    "¿Cómo pedís esto? ¿Os traen palets sueltos o camiones completos?"
                                </div>
                                <div className="p-2 bg-blue-50 rounded border border-blue-100">
                                    <strong className="block text-blue-700 mb-1">Para detectar DOLOR (Calidad):</strong>
                                    "¿Os da mucha guerra el material actual? ¿Tenéis roturas o paradas?"
                                </div>
                                <div className="p-2 bg-blue-50 rounded border border-blue-100">
                                    <strong className="block text-blue-700 mb-1">Para el SUMINISTRO:</strong>
                                    "¿Os cumplen bien los plazos de entrega o sufrís para recibir material?"
                                </div>
                                <div className="p-2 bg-blue-50 rounded border border-blue-100 col-span-1 md:col-span-2">
                                    <strong className="block text-blue-700 mb-1">Para el FUTURO (Sostenibilidad/Ahorro):</strong>
                                    "¿Qué urge más ahora: reducir coste anual o reducir plástico (sostenibilidad)?"
                                </div>
                            </div>
                        </div>

                        {materials.map((mat, index) => (
                            <div key={index} className="rounded-xl border border-slate-200 mb-6 bg-white overflow-hidden shadow-sm animate-in slide-in-from-bottom-2">
                                <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700">MATERIAL {index + 1}</span>
                                    <button type="button" onClick={() => removeMaterial(index)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
                                </div>
                                <div className="p-4 grid grid-cols-1 gap-4">
                                    <div>
                                        <label className={labelClass}>Tipo</label>
                                        <select className={selectClass} value={mat.material_type} onChange={e => updateMaterial(index, 'material_type', e.target.value)}>
                                            <option value="">Seleccionar...</option>
                                            {MATERIAL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>ID / Medidas (Ver etiqueta)</label>
                                        <input className={inputClass} value={mat.id_medidas} onChange={e => updateMaterial(index, 'id_medidas', e.target.value)} placeholder="Ej: 500mm x 23mic" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Consumo (Pallets/Mes)</label>
                                            <input className={inputClass} value={mat.consumption} onChange={e => updateMaterial(index, 'consumption', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Precio Actual</label>
                                            <input className={inputClass} value={mat.price} onChange={e => updateMaterial(index, 'price', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Proveedor Actual (¿Falla en servicio?)</label>
                                        <input className={inputClass} value={mat.supplier} onChange={e => updateMaterial(index, 'supplier', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Notas (Incidencias / Calidad)</label>
                                        <input className={inputClass} value={mat.notes} onChange={e => updateMaterial(index, 'notes', e.target.value)} placeholder="Roturas, problemas, sostenibilidad..." />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addMaterial} className="w-full py-4 border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"><Plus size={20} /> Añadir Otro Material</button>
                        <div className="flex gap-3 mt-8 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div>
                    </Card>
                )}
                
                {/* 6. MAQUINARIA */}
                {activeTab === 'maquinaria' && (
                    <Card className="p-4 md:p-8 bg-slate-50">
                        <SectionHeader title="Parque de Maquinaria" icon={Wrench} />
                        {machines.map((mac, index) => (
                            <div key={index} className="rounded-xl border border-slate-200 mb-6 bg-white overflow-hidden shadow-sm animate-in slide-in-from-bottom-2">
                                <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-orange-100 text-orange-700">MÁQUINA {index + 1}</span>
                                    <button type="button" onClick={() => removeMachine(index)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
                                </div>
                                <div className="p-4 grid grid-cols-1 gap-4">
                                    <div>
                                        <label className={labelClass}>Tipo de Máquina</label>
                                        <select className={selectClass} value={mac.machine_type === 'Otro' || !MACHINE_TYPE_OPTIONS.includes(mac.machine_type) && mac.machine_type ? 'Otro' : mac.machine_type} onChange={e => updateMachine(index, 'machine_type', e.target.value)}>
                                            <option value="">Seleccionar...</option>
                                            {MACHINE_TYPE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        {(mac.machine_type === 'Otro' || (!MACHINE_TYPE_OPTIONS.includes(mac.machine_type) && mac.machine_type)) && (
                                            <input className={`${inputClass} mt-2 border-orange-300 bg-orange-50`} placeholder="Especifique el tipo de máquina..." value={mac.custom_type || (mac.machine_type !== 'Otro' ? mac.machine_type : '')} onChange={e => updateMachine(index, 'custom_type', e.target.value)} />
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className={labelClass}>Marca</label><input className={inputClass} value={mac.brand} onChange={e => updateMachine(index, 'brand', e.target.value)} /></div>
                                        <div><label className={labelClass}>Modelo</label><input className={inputClass} value={mac.model} onChange={e => updateMachine(index, 'model', e.target.value)} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className={labelClass}>Antigüedad (Años)</label><input type="number" className={inputClass} value={mac.age} onChange={e => updateMachine(index, 'age', e.target.value)} /></div>
                                        <div><label className={labelClass}>Estado</label><select className={selectClass} value={mac.status} onChange={e => updateMachine(index, 'status', e.target.value)}>{MACHINE_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className={labelClass}>Contrato Mant.</label><select className={selectClass} value={mac.maintenance_contract} onChange={e => updateMachine(index, 'maintenance_contract', e.target.value)}><option>No</option><option>Sí</option></select></div>
                                        <div><label className={labelClass}>¿Sustitución?</label><select className={`${selectClass} ${mac.substitution_potential === 'Sí' ? 'bg-green-50 border-green-300 text-green-700 font-bold' : ''}`} value={mac.substitution_potential} onChange={e => updateMachine(index, 'substitution_potential', e.target.value)}><option>No</option><option>Sí</option></select></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addMachine} className="w-full py-4 border-2 border-dashed border-orange-300 bg-orange-50 text-orange-600 rounded-xl font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"><Plus size={20} /> Añadir Otra Máquina</button>
                        <div className="flex gap-3 mt-8 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div>
                    </Card>
                )}
                
                {/* 7. CIERRE */}
                {activeTab === 'cierre' && (
                    <Card className="p-4 md:p-8 border-l-4 border-l-red-500 bg-red-50/10">
                        <SectionHeader title="Próximos pasos" icon={Calendar} />
                        <div className="grid grid-cols-1 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Interés real:</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['Visita Técnica', 'Oferta Materiales', 'Propuesta Maquinaria', 'Mantenimiento'].map(opt => (
                                        <label key={opt} className="flex items-center gap-2 p-3 bg-white rounded border border-slate-200 shadow-sm"><input type="checkbox" checked={formData.detected_interest?.includes(opt)} onChange={() => handleMultiSelect('detected_interest', opt)} className="text-red-600 rounded w-5 h-5"/> <span className="text-sm font-bold text-slate-700">{opt}</span></label>
                                    ))}
                                </div>
                            </div>
                            <div><label className={labelClass}>Resumen</label><textarea className={`${inputClass} h-24 resize-none`} placeholder="Resumen..." value={formData.solution_summary} onChange={e => handleChange('solution_summary', e.target.value)} /></div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                            <div className="grid grid-cols-1 gap-4">
                                <div><label className="block text-xs font-bold text-red-700 uppercase mb-1">ACCIÓN</label><select className="w-full p-3 border border-red-200 rounded-lg bg-red-50 font-bold" value={formData.next_action} onChange={e => handleChange('next_action', e.target.value)}><option>Llamada</option><option>Visita</option><option>Oferta</option><option>Cierre</option></select></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs font-bold text-red-700 uppercase mb-1">FECHA</label><input type="date" required className="w-full p-3 border border-red-200 rounded-lg" value={formData.next_action_date} onChange={e => handleChange('next_action_date', e.target.value)} /></div>
                                    <div><label className={labelClass}>HORA</label><input type="time" required className="w-full p-3 border border-red-200 rounded-lg" value={formData.next_action_time} onChange={e => handleChange('next_action_time', e.target.value)} /></div>
                                </div>
                                <div><label className={labelClass}>RESPONSABLE</label><input className="w-full p-3 border border-red-200 rounded-lg" value={formData.responsible} onChange={e => handleChange('responsible', e.target.value)} /></div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-8 pt-4 border-t border-red-200">
                            <Button 
                                variant="primary" 
                                type="submit" 
                                icon={saving ? undefined : CheckCircle2} 
                                disabled={saving}
                                className="w-full py-4 text-lg bg-gradient-to-r from-red-600 to-red-700 border-none shadow-xl"
                            >
                                {saving ? 'GUARDANDO...' : 'GUARDAR Y FINALIZAR'}
                            </Button>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600">
                                    Anterior
                                </Button>
                                <Button onClick={onCancel} variant="ghost" className="w-full bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-600">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </form>
        </div>
    );
}
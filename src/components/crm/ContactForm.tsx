import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, Briefcase, Factory, Package, Calendar, 
  ArrowRight, ArrowLeft, Save, X, Plus, CheckCircle2 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SectionHeader } from '../ui/SectionHeader';

// Opciones estáticas
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

const TABS = [
    { id: 'sap', label: 'Identificación SAP', icon: Search },
    { id: 'registro', label: 'Datos Registro', icon: Briefcase },
    { id: 'negocio', label: 'Negocio', icon: Factory },
    { id: 'materiales', label: 'Materiales', icon: Package },
    { id: 'maquinaria', label: 'Maquinaria', icon: Factory },
    { id: 'necesidades', label: 'Necesidades', icon: Search },
    { id: 'cierre', label: 'Cierre', icon: Calendar }
];

// Estilos
const inputClass = "w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-sm";
const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";
const selectClass = "w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none text-sm";

interface Props {
    session: any;
    initialData: any; // El contacto a editar (o null)
    onCancel: () => void;
    onSuccess: () => void;
}

export default function ContactForm({ session, initialData, onCancel, onSuccess }: Props) {
    const [activeTab, setActiveTab] = useState('sap');
    const [saving, setSaving] = useState(false);
    
    // Estado principal del contacto
    const [formData, setFormData] = useState({
        sap_status: 'Nuevo Prospecto', sap_id: '',
        fiscal_name: '', cif: '', contact_person: '', job_title: '', phone: '', email: '', address: '',
        sector: 'Agroalimentario', main_products: '', volume: 'Medio', packaging_mgmt: 'Mixto',
        quality_rating: '3', sustainable_interest: 'No',
        mac1_type: '', mac1_brand: '', mac1_age: 'Media', mac1_status: 'Operativa',
        pain_points: [] as string[], budget: 'Sin presupuesto fijo',
        detected_interest: [] as string[], solution_summary: '', 
        next_action: 'Llamada de seguimiento', next_action_date: '', next_action_time: '09:00', responsible: ''
    });

    // Estado separado para materiales (Array dinámico)
    const [materials, setMaterials] = useState<any[]>([]);

    // Cargar datos al iniciar
    useEffect(() => {
        if (initialData) {
            // 1. Cargar datos planos del contacto
            const { id, created_at, user_id, profiles, ...rest } = initialData;
            
            // Limpieza de campos antiguos (mat1..mat7) para que no ensucien el estado
            const cleanData = { ...rest };
            for(let i=1; i<=7; i++) {
                delete cleanData[`mat${i}_type`]; delete cleanData[`mat${i}_id`];
                delete cleanData[`mat${i}_consumption`]; delete cleanData[`mat${i}_supplier`];
                delete cleanData[`mat${i}_price`]; delete cleanData[`mat${i}_notes`];
            }
            setFormData(cleanData);

            // 2. Cargar materiales desde la tabla relacionada
            fetchMaterials(initialData.id);
        } else {
            // Si es nuevo, iniciamos con 1 material vacío
            addMaterial();
        }
    }, [initialData]);

    const fetchMaterials = async (contactId: string) => {
        const { data } = await supabase.from('contact_materials').select('*').eq('contact_id', contactId);
        if (data && data.length > 0) {
            setMaterials(data);
        } else {
            // Si no hay materiales en la tabla nueva (migración), intentamos leer los antiguos del initialData
            // (Esta lógica es opcional, pero ayuda a no perder datos visualmente si acabas de cambiar la DB)
            const oldMats = [];
            for(let i=1; i<=7; i++) {
                if (initialData[`mat${i}_type`]) {
                    oldMats.push({
                        tempId: i, // ID temporal
                        material_type: initialData[`mat${i}_type`],
                        id_medidas: initialData[`mat${i}_id`],
                        consumption: initialData[`mat${i}_consumption`],
                        price: initialData[`mat${i}_price`],
                        supplier: initialData[`mat${i}_supplier`],
                        notes: initialData[`mat${i}_notes`]
                    });
                }
            }
            if (oldMats.length > 0) setMaterials(oldMats);
            else addMaterial();
        }
    };

    const handleChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
    
    const handleMultiSelect = (field: keyof typeof formData, value: string) => {
        const current = (formData[field] as string[]) || [];
        const updated = current.includes(value) ? current.filter(i => i !== value) : [...current, value];
        setFormData(prev => ({ ...prev, [field]: updated }));
    };

    // --- GESTIÓN DE MATERIALES ---
    const addMaterial = () => {
        setMaterials([...materials, { tempId: Date.now(), material_type: '', id_medidas: '', consumption: '', price: '', supplier: '', notes: '' }]);
    };

    const removeMaterial = (index: number) => {
        const newMats = [...materials];
        newMats.splice(index, 1);
        setMaterials(newMats);
    };

    const updateMaterial = (index: number, field: string, value: string) => {
        const newMats = [...materials];
        newMats[index] = { ...newMats[index], [field]: value };
        setMaterials(newMats);
    };

    // --- GUARDADO ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // 1. Preparar payload del contacto
            const contactPayload: any = { ...formData };
            if (!contactPayload.next_action_date) contactPayload.next_action_date = null;
            if (!contactPayload.next_action_time) contactPayload.next_action_time = null;
            
            if (!initialData) contactPayload.user_id = session.user.id;

            // 2. Insertar o Actualizar Contacto
            let contactId = initialData?.id;
            
            if (initialData) {
                const { error } = await supabase.from('industrial_contacts').update(contactPayload).eq('id', initialData.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('industrial_contacts').insert([contactPayload]).select().single();
                if (error) throw error;
                contactId = data.id;
            }

            // 3. Guardar Materiales (Estrategia: Borrar viejos e insertar nuevos para evitar duplicados complejos)
            if (contactId) {
                // a. Borrar existentes
                await supabase.from('contact_materials').delete().eq('contact_id', contactId);
                
                // b. Filtrar vacíos e insertar
                const matsToSave = materials
                    .filter(m => m.material_type) // Solo guardar si tienen tipo seleccionado
                    .map(m => ({
                        contact_id: contactId,
                        material_type: m.material_type,
                        id_medidas: m.id_medidas,
                        consumption: m.consumption,
                        price: m.price,
                        supplier: m.supplier,
                        notes: m.notes
                    }));
                
                if (matsToSave.length > 0) {
                    const { error: matError } = await supabase.from('contact_materials').insert(matsToSave);
                    if (matError) throw matError;
                }
            }

            onSuccess();
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Navegación Tabs
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
             {/* HEADER FIJO */}
            <div className="flex flex-col md:flex-row justify-between mb-4 sticky top-0 bg-slate-100/95 z-30 p-4 -mx-2 md:-mx-4 backdrop-blur-md border-b border-slate-200">
                <div className="mb-3 md:mb-0"><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">{initialData ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico'}</h2></div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="secondary" onClick={onCancel} className="flex-1 md:flex-none justify-center">Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit} icon={Save} disabled={saving} className="flex-1 md:flex-none justify-center">{saving ? 'Guardando...' : 'Guardar'}</Button>
                </div>
            </div>

            {/* BARRA DE NAVEGACIÓN MÓVIL/DESKTOP */}
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
                {/* --- PESTAÑA 1: SAP --- */}
                {activeTab === 'sap' && (<Card className="p-4 md:p-8"><SectionHeader title="Identificación SAP" icon={Search} /><div className="grid grid-cols-1 gap-4"><div><label className={labelClass}>Estado</label><select className={selectClass} value={formData.sap_status} onChange={e => handleChange('sap_status', e.target.value)}><option>Nuevo Prospecto</option><option>Lead SAP</option><option>Cliente SAP</option></select></div><div><label className={labelClass}>Código SAP</label><input className={inputClass} placeholder="Ej: C000450" value={formData.sap_id} onChange={e => handleChange('sap_id', e.target.value)} /></div></div><div className="flex justify-end mt-6 pt-4 border-t"><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary">Siguiente</Button></div></Card>)}

                {/* --- PESTAÑA 2: REGISTRO --- */}
                {activeTab === 'registro' && (<Card className="p-4 md:p-8"><SectionHeader title="Datos" icon={Briefcase} /><div className="grid grid-cols-1 gap-4"><div><label className={labelClass}>Fiscal *</label><input required className={inputClass} value={formData.fiscal_name} onChange={e => handleChange('fiscal_name', e.target.value)} /></div><div><label className={labelClass}>CIF *</label><input required className={inputClass} value={formData.cif} onChange={e => handleChange('cif', e.target.value)} /></div><div><label className={labelClass}>Contacto</label><input className={inputClass} value={formData.contact_person} onChange={e => handleChange('contact_person', e.target.value)} /></div><div><label className={labelClass}>Cargo</label><input className={inputClass} value={formData.job_title} onChange={e => handleChange('job_title', e.target.value)} /></div><div><label className={labelClass}>Teléfono</label><input className={inputClass} value={formData.phone} onChange={e => handleChange('phone', e.target.value)} /></div><div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={formData.email} onChange={e => handleChange('email', e.target.value)} /></div><div className="md:col-span-2"><label className={labelClass}>Dirección</label><input className={inputClass} value={formData.address} onChange={e => handleChange('address', e.target.value)} /></div></div><div className="flex gap-3 mt-6 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div></Card>)}

                {/* --- PESTAÑA 3: NEGOCIO --- */}
                {activeTab === 'negocio' && (<Card className="p-4 md:p-8"><SectionHeader title="Negocio" icon={Factory} /><div className="grid grid-cols-1 gap-4"><div><label className={labelClass}>Sector</label><select className={selectClass} value={formData.sector} onChange={e => handleChange('sector', e.target.value)}>{SECTORS.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><label className={labelClass}>Volumen</label><select className={selectClass} value={formData.volume} onChange={e => handleChange('volume', e.target.value)}><option>Bajo</option><option>Medio</option><option>Alto</option></select></div><div><label className={labelClass}>Embalaje</label><select className={selectClass} value={formData.packaging_mgmt} onChange={e => handleChange('packaging_mgmt', e.target.value)}><option>Interno</option><option>Externalizado</option><option>Mixto</option></select></div><div><label className={labelClass}>Productos</label><input className={inputClass} value={formData.main_products} onChange={e => handleChange('main_products', e.target.value)} /></div></div><div className="flex gap-3 mt-6 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div></Card>)}

                {/* --- PESTAÑA 4: MATERIALES (DINÁMICO AHORA) --- */}
                {activeTab === 'materiales' && (
                    <Card className="p-4 md:p-8 bg-slate-50">
                        <SectionHeader title="Materiales de Consumo" icon={Package} />
                        
                        {/* LISTA DE MATERIALES DINÁMICA */}
                        {materials.map((mat, index) => (
                            <div key={index} className="rounded-xl border border-slate-200 mb-6 bg-white overflow-hidden shadow-sm animate-in slide-in-from-bottom-2">
                                <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700">MATERIAL {index + 1}</span>
                                    <button type="button" onClick={() => removeMaterial(index)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <X size={18}/>
                                    </button>
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
                                        <label className={labelClass}>ID / Medidas</label>
                                        <input className={inputClass} value={mat.id_medidas} onChange={e => updateMaterial(index, 'id_medidas', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className={labelClass}>Consumo</label><input className={inputClass} value={mat.consumption} onChange={e => updateMaterial(index, 'consumption', e.target.value)} /></div>
                                        <div><label className={labelClass}>Precio</label><input className={inputClass} value={mat.price} onChange={e => updateMaterial(index, 'price', e.target.value)} /></div>
                                    </div>
                                    <div><label className={labelClass}>Proveedor</label><input className={inputClass} value={mat.supplier} onChange={e => updateMaterial(index, 'supplier', e.target.value)} /></div>
                                    <div><label className={labelClass}>Notas</label><input className={inputClass} value={mat.notes} onChange={e => updateMaterial(index, 'notes', e.target.value)} /></div>
                                </div>
                            </div>
                        ))}

                        <button type="button" onClick={addMaterial} className="w-full py-4 border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                            <Plus size={20} /> Añadir Otro Material
                        </button>

                        <div className="flex gap-3 mt-8 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div>
                    </Card>
                )}

                {/* --- PESTAÑA 5: MAQUINARIA --- */}
                {activeTab === 'maquinaria' && (<Card className="p-4 md:p-8"><SectionHeader title="Maquinaria" icon={Factory} /><div className="grid grid-cols-1 gap-6 mb-6"><div className="p-4 bg-purple-50 rounded-xl border border-purple-100"><label className="block text-xs font-bold text-purple-900 mb-3 uppercase">Calidad Percibida</label><div className="flex justify-between">{[1,2,3,4,5].map(v => (<button key={v} type="button" onClick={() => handleChange('quality_rating', v.toString())} className={`w-10 h-10 rounded-full font-bold shadow-sm ${formData.quality_rating === v.toString() ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border'}`}>{v}</button>))}</div></div><div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100"><label className="block text-xs font-bold text-emerald-900 mb-2 uppercase">¿Interés Sostenible?</label><select className="w-full p-2 border rounded bg-white" value={formData.sustainable_interest} onChange={e => handleChange('sustainable_interest', e.target.value)}><option>No</option><option>Sí</option></select></div></div><div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h4 className="font-bold text-slate-800 mb-4 text-sm">Máquina Principal</h4><div className="grid grid-cols-1 gap-4"><div><label className={labelClass}>Tipo</label><input className={inputClass} value={formData.mac1_type} onChange={e => handleChange('mac1_type', e.target.value)} /></div><div><label className={labelClass}>Marca</label><input className={inputClass} value={formData.mac1_brand} onChange={e => handleChange('mac1_brand', e.target.value)} /></div><div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>Edad</label><select className={selectClass} value={formData.mac1_age} onChange={e => handleChange('mac1_age', e.target.value)}><option>Nueva</option><option>Media</option><option>Antigua</option></select></div><div><label className={labelClass}>Estado</label><select className={selectClass} value={formData.mac1_status} onChange={e => handleChange('mac1_status', e.target.value)}><option>Ok</option><option>Averías</option><option>Cambio</option></select></div></div></div></div><div className="flex gap-3 mt-6 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div></Card>)}

                {/* --- PESTAÑA 6: NECESIDADES --- */}
                {activeTab === 'necesidades' && (<Card className="p-4 md:p-8 border-l-4 border-l-blue-600"><SectionHeader title="Necesidades" icon={Search} /><div className="grid grid-cols-1 gap-6"><div><label className="block text-sm font-bold text-slate-700 mb-3">Puntos de Dolor</label><div className="space-y-2">{['Ahorro de costes', 'Renovación maquinaria', 'Mejorar estabilidad', 'Servicio Técnico', 'Reducir plástico'].map(opt => (<label key={opt} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"><input type="checkbox" checked={formData.pain_points?.includes(opt)} onChange={() => handleMultiSelect('pain_points', opt)} className="w-5 h-5 text-blue-600 rounded"/><span className="text-sm font-medium text-slate-700">{opt}</span></label>))}</div></div><div><label className={labelClass}>Presupuesto</label><select className={selectClass} value={formData.budget} onChange={e => handleChange('budget', e.target.value)}><option>Sin presupuesto fijo</option><option>Partida anual</option><option>Solo precio bajo</option></select></div></div><div className="flex gap-3 mt-6 pt-4 border-t"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="flex-1">Anterior</Button><Button onClick={goToNextTab} icon={ArrowRight} variant="secondary" className="flex-1">Siguiente</Button></div></Card>)}

                {/* --- PESTAÑA 7: CIERRE --- */}
                {activeTab === 'cierre' && (<Card className="p-4 md:p-8 border-l-4 border-l-red-500 bg-red-50/10"><SectionHeader title="Cierre" icon={Calendar} /><div className="grid grid-cols-1 gap-6 mb-6"><div><label className="block text-sm font-bold text-slate-700 mb-3">Interés real:</label><div className="grid grid-cols-1 gap-2">{['Visita Técnica', 'Oferta Materiales', 'Propuesta Maquinaria', 'Mantenimiento'].map(opt => (<label key={opt} className="flex items-center gap-2 p-3 bg-white rounded border border-slate-200 shadow-sm"><input type="checkbox" checked={formData.detected_interest?.includes(opt)} onChange={() => handleMultiSelect('detected_interest', opt)} className="text-red-600 rounded w-5 h-5"/> <span className="text-sm font-bold text-slate-700">{opt}</span></label>))}</div></div><div><label className={labelClass}>Resumen</label><textarea className={`${inputClass} h-24 resize-none`} placeholder="Resumen..." value={formData.solution_summary} onChange={e => handleChange('solution_summary', e.target.value)} /></div></div><div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm"><div className="grid grid-cols-1 gap-4"><div><label className="block text-xs font-bold text-red-700 uppercase mb-1">ACCIÓN</label><select className="w-full p-3 border border-red-200 rounded-lg bg-red-50 font-bold" value={formData.next_action} onChange={e => handleChange('next_action', e.target.value)}><option>Llamada</option><option>Visita</option><option>Oferta</option><option>Cierre</option></select></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-red-700 uppercase mb-1">FECHA</label><input type="date" required className="w-full p-3 border border-red-200 rounded-lg" value={formData.next_action_date} onChange={e => handleChange('next_action_date', e.target.value)} /></div><div><label className="block text-xs font-bold text-red-700 uppercase mb-1">HORA</label><input type="time" required className="w-full p-3 border border-red-200 rounded-lg" value={formData.next_action_time} onChange={e => handleChange('next_action_time', e.target.value)} /></div></div><div><label className="block text-xs font-bold text-red-700 uppercase mb-1">RESPONSABLE</label><input className="w-full p-3 border border-red-200 rounded-lg" value={formData.responsible} onChange={e => handleChange('responsible', e.target.value)} /></div></div></div><div className="flex flex-col-reverse gap-3 mt-6 pt-4 border-t border-red-200"><Button onClick={goToPrevTab} icon={ArrowLeft} variant="ghost" className="w-full">Anterior</Button><Button variant="primary" type="submit" icon={CheckCircle2} className="w-full py-4 text-lg bg-gradient-to-r from-red-600 to-red-700 border-none shadow-xl">FINALIZAR</Button></div></Card>)}
            </form>
        </div>
    );
}
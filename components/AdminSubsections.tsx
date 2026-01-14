import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { 
    BarChart2, Activity, Target, Palmtree, Users, Settings, Plus, Trash2, Database, Download, Upload, Info, ShieldCheck, Mail, Megaphone, Server, Layout, Edit2, RotateCcw, Send, Lock, Loader2, Search, Save, X, UserCheck, ShieldAlert, Briefcase, Calendar, Clock, HardHat, Check, Minus, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Role, RequestStatus, RequestType, EmailTemplate, Department, Holiday, ShiftType, LeaveTypeConfig, PPEType } from '../types';
import { supabase } from '../services/supabase';

// Estadísticas Inteligentes
export const AdminStats = () => {
    const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'];
    const deptDistribution = store.departments.map(d => ({
        name: d.name,
        value: store.users.filter(u => u.departmentId === d.id).length
    })).filter(d => d.value > 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Users size={20} className="text-blue-500"/> Distribución Plantilla</h4>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={deptDistribution} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                                {deptDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Activity size={20} className="text-red-500"/> Ausentismo Crítico</h4>
                <div className="space-y-4">
                    {store.departments.slice(0,4).map(d => (
                        <div key={d.id}>
                            <div className="flex justify-between text-xs font-bold uppercase mb-1"><span>{d.name}</span><span className="text-slate-400">85% Operatividad</span></div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full" style={{width: '85%'}}></div></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Gestión de Departamentos (SUPERVISORES)
export const DepartmentManager = () => {
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!editingDept) return;
        setIsSaving(true);
        if (editingDept.id === 'new') {
            await store.createDepartment(editingDept.name, editingDept.supervisorIds);
        } else {
            await store.updateDepartment(editingDept.id, editingDept.name, editingDept.supervisorIds);
        }
        setIsSaving(false);
        setEditingDept(null);
    };

    const toggleSupervisor = (userId: string) => {
        if (!editingDept) return;
        const current = editingDept.supervisorIds || [];
        const newIds = current.includes(userId) 
            ? current.filter(id => id !== userId) 
            : [...current, userId];
        setEditingDept({ ...editingDept, supervisorIds: newIds });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Departamentos y Responsables</h3>
                <button 
                    onClick={() => setEditingDept({ id: 'new', name: '', supervisorIds: [] })}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                    <Plus size={16}/> Nuevo Departamento
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {store.departments.map(d => (
                    <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group">
                        <div>
                            <h4 className="font-bold text-slate-700">{d.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">
                                {d.supervisorIds?.length || 0} Responsables
                            </p>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setEditingDept(d)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 size={16}/></button>
                            <button onClick={() => store.deleteDepartment(d.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>

            {editingDept && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[130] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-scale-in">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">{editingDept.id === 'new' ? 'Nuevo' : 'Editar'} Departamento</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Nombre</label>
                                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={editingDept.name} onChange={e => setEditingDept({...editingDept, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Responsables / Supervisores</label>
                                <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1 bg-slate-50">
                                    {store.users.sort((a,b) => a.name.localeCompare(b.name)).map(u => (
                                        <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-blue-600 rounded" 
                                                checked={editingDept.supervisorIds.includes(u.id)}
                                                onChange={() => toggleSupervisor(u.id)}
                                            />
                                            <span className="text-sm font-medium text-slate-700">{u.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setEditingDept(null)} className="flex-1 py-3 text-slate-500 font-bold">Cancelar</button>
                                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2">
                                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Configuración RRHH (Tipos de Ausencia, Festivos, etc.)
export const HRConfigManager = () => {
    const [editingType, setEditingType] = useState<LeaveTypeConfig | null>(null);
    const [newShift, setNewShift] = useState({ name: '', color: '#3b82f6', start: '08:00', end: '16:30' });
    const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

    const handleSaveType = async () => {
        if (!editingType) return;
        if (editingType.id.startsWith('temp_')) {
            await store.createLeaveType(editingType.label, editingType.subtractsDays, editingType.fixedRanges);
        } else {
            await store.updateLeaveType(editingType.id, editingType.label, editingType.subtractsDays, editingType.fixedRanges);
        }
        setEditingType(null);
    };

    const addRange = () => {
        if (!editingType) return;
        const newRanges = [...(editingType.fixedRanges || []), { startDate: '', endDate: '', label: 'Nuevo Periodo' }];
        setEditingType({ ...editingType, fixedRanges: newRanges });
    };

    const removeRange = (idx: number) => {
        if (!editingType) return;
        const newRanges = (editingType.fixedRanges || []).filter((_, i) => i !== idx);
        setEditingType({ ...editingType, fixedRanges: newRanges });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
            {/* TIPOS DE AUSENCIA */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipos de Ausencia</h3>
                    <button onClick={() => setEditingType({ id: 'temp_' + Date.now(), label: '', subtractsDays: true, fixedRanges: [] })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Plus size={18}/></button>
                </div>
                <div className="space-y-2">
                    {store.config.leaveTypes.map(t => (
                        <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm group">
                            <div>
                                <p className="font-bold text-sm text-slate-700">{t.label}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t.subtractsDays ? 'Resta días' : 'No resta días'}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingType(t)} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit2 size={14}/></button>
                                <button onClick={() => store.deleteLeaveType(t.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>

                {editingType && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center"><h4 className="font-bold text-slate-800 text-sm">Editar Tipo</h4><button onClick={() => setEditingType(null)}><X size={16}/></button></div>
                        <input className="w-full p-2.5 border rounded-xl text-sm" placeholder="Nombre (Ej: Vacaciones 2026)" value={editingType.label} onChange={e => setEditingType({...editingType, label: e.target.value})} />
                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-xl border border-slate-100">
                            <input type="checkbox" checked={editingType.subtractsDays} onChange={e => setEditingType({...editingType, subtractsDays: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-xs font-bold text-slate-600">Resta días del saldo anual</span>
                        </label>
                        
                        <div className="pt-2 border-t border-slate-200">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Rangos Fijos / Turnos</span>
                                <button onClick={addRange} className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><Plus size={14}/></button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {(editingType.fixedRanges || []).map((range, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-[10px] space-y-2">
                                        <input className="w-full p-1.5 border-b outline-none font-bold" placeholder="Etiqueta (Ej: Junio)" value={range.label} onChange={e => {
                                            const newR = [...(editingType.fixedRanges || [])];
                                            newR[idx].label = e.target.value;
                                            setEditingType({...editingType, fixedRanges: newR});
                                        }} />
                                        <div className="flex gap-2">
                                            <input type="date" className="flex-1" value={range.startDate} onChange={e => {
                                                const newR = [...(editingType.fixedRanges || [])];
                                                newR[idx].startDate = e.target.value;
                                                setEditingType({...editingType, fixedRanges: newR});
                                            }} />
                                            <input type="date" className="flex-1" value={range.endDate} onChange={e => {
                                                const newR = [...(editingType.fixedRanges || [])];
                                                newR[idx].endDate = e.target.value;
                                                setEditingType({...editingType, fixedRanges: newR});
                                            }} />
                                            <button onClick={() => removeRange(idx)} className="text-red-400"><Trash2 size={12}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleSaveType} className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg">Guardar Tipo de Ausencia</button>
                    </div>
                )}
            </div>

            {/* TIPOS DE TURNO */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Turnos de Trabajo</h3>
                <div className="space-y-2">
                    {store.config.shiftTypes.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: s.color}}></div>
                                <div>
                                    <span className="font-bold text-sm text-slate-700">{s.name}</span>
                                    <p className="text-[9px] text-slate-400 font-mono">{s.segments[0].start} - {s.segments[0].end}</p>
                                </div>
                            </div>
                            <button onClick={() => store.deleteShiftType(s.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                    ))}
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 mt-6">
                    <h4 className="font-bold text-slate-800 text-sm border-b pb-2">Crear Turno</h4>
                    <input className="w-full p-2.5 border rounded-xl text-sm" placeholder="Nombre Turno..." value={newShift.name} onChange={e=>setNewShift({...newShift, name: e.target.value})} />
                    <div className="flex gap-4">
                        <div className="flex-1"><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Inicio</label><input type="time" className="w-full p-2 border rounded-lg text-xs" value={newShift.start} onChange={e=>setNewShift({...newShift, start: e.target.value})}/></div>
                        <div className="flex-1"><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Fin</label><input type="time" className="w-full p-2 border rounded-lg text-xs" value={newShift.end} onChange={e=>setNewShift({...newShift, end: e.target.value})}/></div>
                        <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Color</label><input type="color" className="h-8 w-12 border-none rounded-lg p-0 cursor-pointer" value={newShift.color} onChange={e=>setNewShift({...newShift, color: e.target.value})}/></div>
                    </div>
                    <button onClick={async () => { await store.createShiftType(newShift.name, newShift.color, newShift.start, newShift.end); setNewShift({name: '', color:'#3b82f6', start:'08:00', end:'16:30'}); }} className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Guardar Turno</button>
                </div>
            </div>

            {/* FESTIVOS */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Festivos Nacionales</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {store.config.holidays.sort((a,b) => a.date.localeCompare(b.date)).map(h => (
                        <div key={h.id} className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex justify-between items-center group">
                            <div><p className="text-[10px] font-black text-red-600 uppercase">{new Date(h.date).toLocaleDateString()}</p><p className="font-bold text-xs">{h.name}</p></div>
                            <button onClick={() => store.deleteHoliday(h.id)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                        </div>
                    ))}
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 mt-6">
                    <h4 className="font-bold text-slate-800 text-sm border-b pb-2">Añadir Festivo</h4>
                    <input type="date" className="w-full p-2.5 border rounded-xl text-sm" value={newHoliday.date} onChange={e=>setNewHoliday({...newHoliday, date: e.target.value})} />
                    <input className="w-full p-2.5 border rounded-xl text-sm" placeholder="Nombre Festividad..." value={newHoliday.name} onChange={e=>setNewHoliday({...newHoliday, name: e.target.value})} />
                    <button onClick={async () => { if(newHoliday.date && newHoliday.name) { await store.createHoliday(newHoliday.date, newHoliday.name); setNewHoliday({date:'', name:''}); } }} className="w-full py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/30">Añadir Festivo</button>
                </div>
            </div>
        </div>
    );
};

// Gestión de Catálogo de EPIs
export const EPIManager = () => {
    const [editingPPE, setEditingPPE] = useState<PPEType | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!editingPPE) return;
        setIsSaving(true);
        if (editingPPE.id === 'new') {
            await store.createPPEType(editingPPE.name, editingPPE.sizes);
        } else {
            await store.updatePPEType(editingPPE.id, editingPPE.name, editingPPE.sizes);
        }
        setEditingPPE(null);
        setIsSaving(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Catálogo de Protección (EPI)</h3>
                <button 
                    onClick={() => setEditingPPE({ id: 'new', name: '', sizes: ['S', 'M', 'L', 'XL'] })}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                    <Plus size={16}/> Nuevo Material
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {store.config.ppeTypes.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><HardHat size={20}/></div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingPPE(p)} className="p-2 text-slate-400 hover:text-blue-500"><Edit2 size={16}/></button>
                                <button onClick={() => store.deletePPEType(p.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2">{p.name}</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {p.sizes.map(s => <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded border border-slate-100">{s}</span>)}
                        </div>
                    </div>
                ))}
            </div>

            {editingPPE && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[130] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-scale-in">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">{editingPPE.id === 'new' ? 'Nuevo' : 'Editar'} Material EPI</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Nombre del Artículo</label>
                                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={editingPPE.name} onChange={e => setEditingPPE({...editingPPE, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Tallas / Medidas (Separadas por comas)</label>
                                <input 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                                    value={editingPPE.sizes.join(', ')} 
                                    onChange={e => setEditingPPE({...editingPPE, sizes: e.target.value.split(',').map(s => s.trim())})} 
                                    placeholder="Ej: S, M, L, XL o 38, 40, 42..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setEditingPPE(null)} className="flex-1 py-3 text-slate-500 font-bold">Cancelar</button>
                                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2">
                                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Comunicaciones (SMTP y Plantillas)
export const CommunicationsManager = () => {
    const [smtp, setSmtp] = useState(store.config.smtpSettings);
    const [templates, setTemplates] = useState(store.config.emailTemplates);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [isSavingSmtp, setIsSavingSmtp] = useState(false);
    const [isSavingTemplates, setIsSavingTemplates] = useState(false);
    
    // Testing states
    const [testEmail, setTestEmail] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testLog, setTestLog] = useState('');

    useEffect(() => {
        setSmtp(store.config.smtpSettings);
        setTemplates(store.config.emailTemplates);
        const unsubscribe = store.subscribe(() => {
            setSmtp(store.config.smtpSettings);
            setTemplates(store.config.emailTemplates);
        });
        return unsubscribe;
    }, []);

    const handleSaveSmtp = async () => {
        setIsSavingSmtp(true);
        try {
            await store.saveSmtpSettings(smtp);
            alert('Configuración SMTP guardada correctamente');
        } catch (e) {
            alert('Error al guardar SMTP');
        } finally {
            setIsSavingSmtp(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) return;
        setIsTesting(true);
        setTestLog('⏳ Iniciando prueba de conexión...');
        try {
            const { data, error } = await supabase.functions.invoke('send-test-email', {
                body: {
                    to: testEmail,
                    config: smtp,
                    subject: "Test de Conexión SMTP - GdA RRHH",
                    message: "Esta es una prueba de configuración SMTP desde el panel de administración. Si lees esto, el servidor SMTP y la función Edge están vinculados correctamente."
                }
            });
            
            if (error) {
                setTestLog(`❌ Error de Red / Invocación:\n${JSON.stringify(error, null, 2)}`);
            } else if (data?.success) {
                setTestLog('✅ Éxito: El correo ha sido aceptado por el servidor SMTP y enviado satisfactoriamente.');
            } else {
                setTestLog(`⚠️ Fallo de Servidor SMTP:\nError: ${data?.error || 'Desconocido'}\nDetalles: ${data?.details || 'No se proporcionaron detalles adicionales'}`);
            }
        } catch (e: any) {
            setTestLog(`❌ Error Crítico de Aplicación:\n${e.message || e}`);
        } finally {
            setIsTesting(false);
        }
    };

    const handleUpdateTemplate = async () => {
        if (!editingTemplate) return;
        setIsSavingTemplates(true);
        try {
            const newTemplates = templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
            await store.saveEmailTemplates(newTemplates);
            setTemplates(newTemplates);
            setEditingTemplate(null);
            alert('Plantilla actualizada correctamente');
        } catch (e) {
            alert('Error al actualizar plantilla');
        } finally {
            setIsSavingTemplates(false);
        }
    };

    const toggleRecipient = (key: 'admin' | 'supervisor' | 'worker') => {
        if (!editingTemplate) return;
        setEditingTemplate({
            ...editingTemplate,
            recipients: {
                ...editingTemplate.recipients,
                [key]: !editingTemplate.recipients[key]
            }
        });
    };

    return (
        <div className="max-w-2xl space-y-8 animate-fade-in pb-12">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><Server className="text-blue-500"/> Configuración Servidor SMTP</h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Estado: {smtp.enabled ? 'Activo' : 'Inactivo'}</span>
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={smtp.enabled} onChange={e => setSmtp({...smtp, enabled: e.target.checked})} />
                    </label>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Host del Servidor</label>
                            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="ej: smtp.gmail.com" value={smtp.host} onChange={e => setSmtp({...smtp, host: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Puerto</label>
                            <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="587" value={smtp.port} onChange={e => setSmtp({...smtp, port: parseInt(e.target.value) || 0})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Usuario / Email de Envío</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="email@empresa.com" value={smtp.user} onChange={e => setSmtp({...smtp, user: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Contraseña de Aplicación</label>
                        <div className="relative">
                            <input type="password" px-3 className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="••••••••" value={smtp.password || ''} onChange={e => setSmtp({...smtp, password: e.target.value})} />
                            <Lock className="absolute left-3 top-3.5 text-slate-300" size={16}/>
                        </div>
                    </div>
                    <button 
                        onClick={handleSaveSmtp}
                        disabled={isSavingSmtp}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex justify-center items-center gap-2"
                    >
                        {isSavingSmtp ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar Configuración SMTP
                    </button>
                </div>
                
                {/* Email Testing Section */}
                <div className="mt-10 pt-8 border-t border-slate-100">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2"><Send size={12}/> Diagnóstico de Envío Real</h5>
                    <p className="text-[11px] text-slate-500 mb-4 italic">Esta herramienta utiliza la configuración SMTP guardada arriba para enviar un correo de prueba.</p>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="email" 
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium" 
                            placeholder="Introduce email para recibir la prueba..." 
                            value={testEmail}
                            onChange={e => setTestEmail(e.target.value)}
                        />
                        <button 
                            onClick={handleTestEmail}
                            disabled={isTesting || !testEmail}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Probar Envío
                        </button>
                    </div>
                    {testLog && (
                        <div className="bg-slate-900 rounded-2xl p-5 font-mono text-[10px] text-blue-300 overflow-hidden relative border border-slate-800 shadow-inner">
                            <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                                <span className="flex items-center gap-2 text-white font-bold tracking-widest"><AlertCircle size={14} className="text-blue-400"/> DEBUG LOG / SALIDA DE CONSOLA</span>
                                <button onClick={() => setTestLog('')} className="text-white/40 hover:text-white transition-colors" title="Limpiar log"><X size={14}/></button>
                            </div>
                            <pre className="whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">{testLog}</pre>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 px-2"><Mail className="text-blue-500"/> Plantillas de Notificación</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(t => (
                        <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-slate-800">{t.label}</h4>
                                    <p className="text-[10px] text-slate-400 italic font-medium line-clamp-1">"{t.subject}"</p>
                                </div>
                                <button onClick={() => setEditingTemplate(t)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors bg-slate-50 rounded-lg"><Edit2 size={16}/></button>
                            </div>
                            <div className="flex gap-1.5 border-t border-slate-50 pt-3 mt-auto">
                                {t.recipients?.worker && <span className="text-[8px] font-black uppercase bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded" title="Recibe el empleado">Emp</span>}
                                {t.recipients?.supervisor && <span className="text-[8px] font-black uppercase bg-purple-50 text-purple-500 px-1.5 py-0.5 rounded" title="Recibe el supervisor">Sup</span>}
                                {t.recipients?.admin && <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded" title="Recibe el administrador">Adm</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {editingTemplate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[130] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-scale-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Editar Plantilla</h3>
                            <button onClick={() => setEditingTemplate(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Etiqueta Identificativa</label>
                                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={editingTemplate.label} readOnly />
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 ml-1 tracking-widest">¿Quién recibe esta notificación?</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button type="button" onClick={() => toggleRecipient('worker')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${editingTemplate.recipients?.worker ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-200'}`}><UserCheck size={18} /><span className="text-[9px] font-black uppercase">Empleado</span></button>
                                    <button type="button" onClick={() => toggleRecipient('supervisor')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${editingTemplate.recipients?.supervisor ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-200'}`}><Briefcase size={18} /><span className="text-[9px] font-black uppercase">Supervisor</span></button>
                                    <button type="button" onClick={() => toggleRecipient('admin')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${editingTemplate.recipients?.admin ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}><ShieldAlert size={18} /><span className="text-[9px] font-black uppercase">Admin</span></button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Asunto del Email</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={editingTemplate.subject} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Cuerpo del Mensaje (HTML compatible)</label>
                                <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm h-32" value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})} />
                                <p className="text-[9px] text-slate-400 mt-2 italic px-1">Variables: {'{empleado}'}, {'{tipo}'}, {'{fechas}'}, {'{supervisor}'}, {'{comentario_admin}'}, {'{horas}'}</p>
                            </div>
                            <button onClick={handleUpdateTemplate} disabled={isSavingTemplates} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all flex justify-center items-center gap-2">{isSavingTemplates ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Actualizar Plantilla</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Consultas de Ausencias
export const AbsenceQueryManager = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex gap-4">
                <input type="date" className="p-3 bg-white border border-slate-200 rounded-xl text-sm" />
                <input type="date" className="p-3 bg-white border border-slate-200 rounded-xl text-sm" />
                <button className="px-6 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-lg">Consultar</button>
            </div>
            <div className="bg-white p-20 text-center rounded-3xl border border-dashed text-slate-400 italic">No hay resultados en el rango seleccionado.</div>
        </div>
    );
};

// Mantenimiento
export const MaintenanceManager = () => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-blue-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Database size={120} /></div>
                <h4 className="text-xl font-bold mb-4">Punto de Restauración y Backup</h4>
                <div className="flex gap-4">
                    <button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"><Download size={18}/> Exportar JSON</button>
                    <button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"><Upload size={18}/> Importar Backup</button>
                </div>
            </div>
        </div>
    );
};
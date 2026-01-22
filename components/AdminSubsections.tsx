
import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { 
    BarChart2, Activity, Target, Palmtree, Users, Settings, Plus, Trash2, Database, Download, Upload, Info, ShieldCheck, Mail, Megaphone, Server, Layout, Edit2, RotateCcw, Send, Lock, Loader2, Search, Save, X, UserCheck, ShieldAlert, Briefcase, Calendar, Clock, HardHat, Check, Minus, AlertCircle, Printer, AlertTriangle, Archive, ShoppingCart, List, History
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

// Gestión de Catálogo de EPIs y Stock
export const EPIManager = () => {
    const [view, setView] = useState<'catalog' | 'stock'>('catalog');
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

    const handleUpdateStock = async (typeId: string, size: string, newQty: number) => {
        const type = store.config.ppeTypes.find(t => t.id === typeId);
        if (type) {
            const updatedStock = { ...(type.stock || {}) };
            updatedStock[size] = Math.max(0, newQty);
            await store.updatePPEStock(typeId, updatedStock);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl shrink-0">
                    <button onClick={() => setView('catalog')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'catalog' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Catálogo</button>
                    <button onClick={() => setView('stock')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'stock' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Control de Stock</button>
                </div>
                
                {view === 'catalog' && (
                    <button onClick={() => setEditingPPE({ id: 'new', name: '', sizes: ['S', 'M', 'L', 'XL'], stock: {} })} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"><Plus size={16}/> Nuevo Material</button>
                )}
            </div>

            {view === 'catalog' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {store.config.ppeTypes.map(p => (
                        <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-20"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><HardHat size={20}/></div>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingPPE(p)} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 rounded-lg"><Edit2 size={16}/></button>
                                    <button onClick={() => store.deletePPEType(p.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <h4 className="font-bold text-slate-800 mb-4">{p.name}</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {p.sizes.map(s => (
                                    <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-black rounded border border-slate-100">{s}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Tipo de Material</th>
                                <th className="px-6 py-4">Tallas y Existencias Disponibles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {store.config.ppeTypes.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-700">{p.name}</td>
                                    <td className="px-6 py-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                            {p.sizes.map(size => {
                                                const currentStock = p.stock?.[size] || 0;
                                                return (
                                                    <div key={size} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex flex-col items-center">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase mb-2">Talla {size}</span>
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => handleUpdateStock(p.id, size, currentStock - 1)}
                                                                className="p-1 text-slate-400 hover:text-red-500 bg-slate-50 rounded transition-colors"
                                                            >
                                                                <Minus size={14}/>
                                                            </button>
                                                            <span className={`w-8 text-center font-black text-lg ${currentStock <= 0 ? 'text-red-600' : currentStock < 5 ? 'text-orange-600' : 'text-green-600'}`}>
                                                                {currentStock}
                                                            </span>
                                                            <button 
                                                                onClick={() => handleUpdateStock(p.id, size, currentStock + 1)}
                                                                className="p-1 text-slate-400 hover:text-blue-500 bg-slate-50 rounded transition-colors"
                                                            >
                                                                <Plus size={14}/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" 
                                    value={editingPPE.sizes.join(', ')} 
                                    onChange={e => setEditingPPE({...editingPPE, sizes: e.target.value.split(',').map(s => s.trim())})} 
                                    placeholder="Ej: S, M, L, XL o 38, 40, 42..."
                                />
                                <p className="text-[9px] text-slate-400 mt-2 italic px-1">Al añadir tallas nuevas, aparecerán con stock 0 en la sección de control.</p>
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

// Gestión de Comunicaciones (Muro de anuncios, etc.)
export const CommunicationsManager = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleCreatePost = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsSaving(true);
        await store.createNewsPost(title, content, store.currentUser?.id || 'admin');
        setTitle('');
        setContent('');
        setIsSaving(false);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Megaphone size={20} className="text-blue-500"/> Crear Comunicado en el Muro</h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Título del Anuncio</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Nueva política de vestuario..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Contenido del Mensaje</label>
                        <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-32" value={content} onChange={e => setContent(e.target.value)} placeholder="Escribe aquí el mensaje para todos los empleados..." />
                    </div>
                    <button onClick={handleCreatePost} disabled={isSaving} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 transition-all">
                        {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
                        Publicar Anuncio
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><History size={20} className="text-slate-400"/> Historial de Anuncios</h4>
                <div className="space-y-4">
                    {store.config.news.length === 0 ? (
                        <p className="text-center text-slate-400 italic py-4">No hay anuncios publicados.</p>
                    ) : store.config.news.map(post => (
                        <div key={post.id} className="flex justify-between items-start p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <div className="flex-1">
                                <h5 className="font-bold text-slate-800">{post.title}</h5>
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{post.content}</p>
                                <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 block">{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button onClick={() => store.deleteNewsPost(post.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Consultas de Ausencias
export const AbsenceQueryManager = () => {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleQuery = () => {
        if (!start || !end) {
            alert("Por favor, selecciona un rango de fechas completo.");
            return;
        }
        
        const filtered = store.requests.filter(req => {
            // Solo ausencias aprobadas
            if (req.status !== RequestStatus.APPROVED) return false;
            
            // EXCLUIR REGULARIZACIONES
            if (req.typeId === RequestType.ADJUSTMENT_DAYS || req.typeId === RequestType.ADJUSTMENT_OVERTIME) return false;
            
            // Excluir registros que son puramente de horas extra (a menos que sea canje por días)
            const isPureOvertime = store.isOvertimeRequest(req.typeId);
            const isDayOffExchange = req.typeId === RequestType.OVERTIME_SPEND_DAYS;
            
            // Queremos: Bajas médicas, Vacaciones, Asuntos Propios, Ausencias justificables y Canjes por días
            if (isPureOvertime && !isDayOffExchange) return false;
            
            const rStart = req.startDate.split('T')[0];
            const rEnd = (req.endDate || req.startDate).split('T')[0];
            
            // Lógica de solapamiento de fechas
            return rStart <= end && rEnd >= start;
        }).map(req => {
            const u = store.users.find(usr => usr.id === req.userId);
            return { ...req, user: u };
        });

        setResults(filtered);
        setHasSearched(true);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-wrap gap-4 items-end print:hidden">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Fecha Inicial</label>
                    <input 
                        type="date" 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                        value={start} 
                        onChange={e => setStart(e.target.value)} 
                    />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Fecha Final</label>
                    <input 
                        type="date" 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                        value={end} 
                        onChange={e => setEnd(e.target.value)} 
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleQuery} 
                        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        <Search size={18}/> Consultar
                    </button>
                    {hasSearched && results.length > 0 && (
                        <button 
                            onClick={handlePrint} 
                            className="px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <Printer size={18}/> Imprimir
                        </button>
                    )}
                </div>
            </div>

            {hasSearched && results.length > 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in-up">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center print:bg-white">
                        <h4 className="font-bold text-slate-800">Informe de Ausencias y Bajas</h4>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Rango: {new Date(start).toLocaleDateString()} al {new Date(end).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                <tr>
                                    <th className="px-6 py-4">Empleado / Departamento</th>
                                    <th className="px-6 py-4">Tipo de Ausencia</th>
                                    <th className="px-6 py-4">Periodo Completo</th>
                                    <th className="px-6 py-4 text-center">Días en Rango</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {results.sort((a,b) => a.startDate.localeCompare(b.startDate)).map(req => {
                                    // Calculamos el solapamiento real para mostrar los días ausentes DENTRO del rango consultado
                                    const rStart = req.startDate.split('T')[0];
                                    const rEnd = (req.endDate || req.startDate).split('T')[0];
                                    
                                    const overlapStartStr = rStart > start ? rStart : start;
                                    const overlapEndStr = rEnd < end ? rEnd : end;
                                    
                                    const d1 = new Date(overlapStartStr);
                                    const d2 = new Date(overlapEndStr);
                                    d1.setHours(0,0,0,0);
                                    d2.setHours(0,0,0,0);
                                    
                                    const daysInRange = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                    
                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={req.user?.avatar} className="w-8 h-8 rounded-full border border-slate-100 shadow-sm" />
                                                    <div>
                                                        <div className="font-bold text-slate-800">{req.user?.name || 'Desconocido'}</div>
                                                        <div className="text-[10px] text-slate-400 font-black uppercase">
                                                            {store.departments.find(d => d.id === req.user?.departmentId)?.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-lg font-bold text-[10px] uppercase border ${
                                                    req.typeId === RequestType.SICKNESS 
                                                        ? 'bg-red-50 text-red-600 border-red-100' 
                                                        : req.typeId === RequestType.OVERTIME_SPEND_DAYS 
                                                            ? 'bg-purple-50 text-purple-600 border-purple-100'
                                                            : 'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                    {store.getTypeLabel(req.typeId)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {new Date(req.startDate).toLocaleDateString()} {req.endDate ? `- ${new Date(req.endDate).toLocaleDateString()}` : ''}
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-blue-700 bg-blue-50/30">
                                                {daysInRange}d
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                hasSearched && (
                    <div className="bg-white p-20 text-center rounded-3xl border border-dashed text-slate-400 italic animate-fade-in">
                        <AlertTriangle className="mx-auto mb-4 opacity-20" size={48} />
                        No se han encontrado ausencias aprobadas o bajas en el rango seleccionado.
                    </div>
                )
            )}
            
            {!hasSearched && (
                <div className="bg-white p-20 text-center rounded-3xl border border-dashed text-slate-300 italic flex flex-col items-center gap-4">
                    <Calendar size={64} className="opacity-10" />
                    <p className="max-w-xs mx-auto">Selecciona un rango de fechas arriba para generar el informe de personal ausente o de baja.</p>
                </div>
            )}
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

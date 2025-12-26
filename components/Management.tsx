
import React, { useState, useMemo, useEffect } from 'react';
import { User, RequestStatus, Role, LeaveRequest, RequestType, Department, EmailTemplate, DateRange, LeaveTypeConfig, NewsPost } from '../types';
import { store } from '../services/store';
import ShiftScheduler from './ShiftScheduler';
import RequestFormModal from './RequestFormModal';
import { User as UserIcon, Check, X, Users, Edit2, Shield, Trash2, AlertTriangle, Briefcase, FileText, Activity, Clock, CalendarDays, ExternalLink, UserPlus, MessageSquare, PieChart, Calendar, Filter, Paintbrush, Plus, CalendarClock, Search, CheckCircle, FileWarning, Printer, CheckSquare, Square, Lock as LockIcon, Sparkles, Loader2, Settings, List, ToggleLeft, ToggleRight, ShieldCheck, Mail, HardHat, Save, Send, XCircle, TrendingUp, UserMinus, UserCheck, CalendarPlus, Terminal, Megaphone, History, Palmtree } from 'lucide-react';

// --- SUB-COMPONENTS FOR ADMIN ---

const DepartmentManager: React.FC = () => {
    const [departments, setDepartments] = useState(store.departments);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [name, setName] = useState('');
    const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);
    useEffect(() => { const unsub = store.subscribe(() => setDepartments([...store.departments])); return unsub; }, []);
    const openModal = (dept?: Department) => { setEditingDept(dept || null); setName(dept ? dept.name : ''); setSelectedSupervisors(dept ? dept.supervisorIds : []); setIsModalOpen(true); };
    const handleSave = async (e: React.FormEvent) => { e.preventDefault(); if (!name) return; if (editingDept) await store.updateDepartment(editingDept.id, name, selectedSupervisors); else await store.createDepartment(name, selectedSupervisors); setIsModalOpen(false); };
    const toggleSupervisor = (userId: string) => { if (selectedSupervisors.includes(userId)) setSelectedSupervisors(selectedSupervisors.filter(id => id !== userId)); else setSelectedSupervisors([...selectedSupervisors, userId]); };
    const getEmployeeCount = (deptId: string) => store.users.filter(u => u.departmentId === deptId).length;
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Departamentos</h3>
                <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md transition-all"><Plus size={18}/> Nuevo</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map(d => (
                    <div key={d.id} className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group relative">
                        <div className="flex justify-between items-start">
                            <div><h4 className="font-bold text-lg text-slate-800">{d.name}</h4><p className="text-sm text-slate-500 mt-1">{getEmployeeCount(d.id)} empleados</p></div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openModal(d)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"><Settings size={16}/></button>
                                <button onClick={() => { if(confirm('¿Eliminar departamento?')) store.deleteDepartment(d.id); }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100"><h3 className="text-xl font-bold text-slate-800">{editingDept ? 'Editar Departamento' : 'Nuevo Departamento'}</h3></div>
                        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                            <div><label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Departamento</label><input type="text" required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={name} onChange={e => setName(e.target.value)} /></div>
                            <div><label className="block text-sm font-bold text-slate-700 mb-2">Supervisores Asignados</label><div className="border border-slate-200 rounded-xl p-2 max-h-48 overflow-y-auto bg-slate-50">{store.users.sort((a,b) => a.name.localeCompare(b.name)).map(u => (
                                <div key={u.id} onClick={() => toggleSupervisor(u.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white transition-colors ${selectedSupervisors.includes(u.id) ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}`}><div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedSupervisors.includes(u.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>{selectedSupervisors.includes(u.id) && <Check size={12}/>}</div><span className="text-sm font-medium text-slate-700">{u.name}</span></div>
                            ))}</div></div>
                        </form>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-2xl"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancelar</button><button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg">Guardar</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const HRConfigManager: React.FC = () => {
    const [activeModal, setActiveModal] = useState<'holiday' | 'type' | 'shift' | null>(null);
    const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
    const [typeName, setTypeName] = useState('');
    const [typeSubtracts, setTypeSubtracts] = useState(true);
    const [isFixedDates, setIsFixedDates] = useState(false);
    const [tempRanges, setTempRanges] = useState<DateRange[]>([]);
    const [editingRangeIdx, setEditingRangeIdx] = useState<number | null>(null);
    const [newRangeStart, setNewRangeStart] = useState('');
    const [newRangeEnd, setNewRangeEnd] = useState('');
    const [newRangeLabel, setNewRangeLabel] = useState('');
    const [holidayDate, setHolidayDate] = useState('');
    const [holidayName, setHolidayName] = useState('');
    const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
    const [shiftName, setShiftName] = useState('');
    const [shiftColor, setShiftColor] = useState('#3b82f6');
    const [shiftStart, setShiftStart] = useState('');
    const [shiftEnd, setShiftEnd] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [refresh, setRefresh] = useState(0); 
    useEffect(() => { const unsub = store.subscribe(() => setRefresh(prev => prev + 1)); return unsub; }, []);
    const calculateDaysInRange = (start: string, end: string) => { if (!start || !end) return 0; const s = new Date(start); const e = new Date(end); s.setHours(0,0,0,0); e.setHours(0,0,0,0); const diffTime = Math.abs(e.getTime() - s.getTime()); return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; };
    const handleAddRange = () => { if (!newRangeStart || !newRangeEnd) return; const newRange: DateRange = { startDate: newRangeStart, endDate: newRangeEnd, label: newRangeLabel }; if (editingRangeIdx !== null) { const updated = [...tempRanges]; updated[editingRangeIdx] = newRange; setTempRanges(updated); setEditingRangeIdx(null); } else setTempRanges([...tempRanges, newRange]); setNewRangeStart(''); setNewRangeEnd(''); setNewRangeLabel(''); };
    const removeRange = (idx: number) => { setTempRanges(tempRanges.filter((_, i) => i !== idx)); if (editingRangeIdx === idx) { setEditingRangeIdx(null); setNewRangeStart(''); setNewRangeEnd(''); setNewRangeLabel(''); } };
    const startEditRange = (idx: number) => { const range = tempRanges[idx]; setEditingRangeIdx(idx); setNewRangeLabel(range.label || ''); setNewRangeStart(range.startDate); setNewRangeEnd(range.endDate); };
    const handleSaveType = async (e: React.FormEvent) => { e.preventDefault(); const ranges = isFixedDates ? tempRanges : undefined; if (isFixedDates && tempRanges.length === 0) { alert("Si activas Fechas Fijas, debes añadir al menos un rango de fechas."); return; } setIsSaving(true); if (editingTypeId) await store.updateLeaveType(editingTypeId, typeName, typeSubtracts, ranges); else await store.createLeaveType(typeName, typeSubtracts, ranges); setIsSaving(false); setActiveModal(null); setTypeName(''); setIsFixedDates(false); setTempRanges([]); setEditingTypeId(null); setEditingRangeIdx(null); };
    const openEditLeaveType = (t: LeaveTypeConfig) => { setEditingTypeId(t.id); setTypeName(t.label); setTypeSubtracts(t.subtractsDays); if (t.fixedRanges && t.fixedRanges.length > 0) { setIsFixedDates(true); setTempRanges([...t.fixedRanges]); } else { setIsFixedDates(false); setTempRanges([]); } setActiveModal('type'); };
    const handleSaveHoliday = async (e: React.FormEvent) => { e.preventDefault(); if (editingHolidayId) await store.updateHoliday(editingHolidayId, holidayDate, holidayName); else await store.createHoliday(holidayDate, holidayName); setActiveModal(null); setHolidayDate(''); setHolidayName(''); setEditingHolidayId(null); };
    const handleSaveShift = async (e: React.FormEvent) => { e.preventDefault(); await store.createShiftType(shiftName, shiftColor, shiftStart, shiftEnd); setActiveModal(null); setShiftName(''); setShiftStart(''); setShiftEnd(''); };
    const openEditHoliday = (h: any) => { setEditingHolidayId(h.id); setHolidayName(h.name); setHolidayDate(h.date); setActiveModal('holiday'); };
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2"><h3 className="font-bold text-slate-800">Tipos de Ausencia</h3></div>
                <div className="space-y-3">
                    {store.config.leaveTypes.map(t => (
                        <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center group">
                            <div><div className="font-bold text-slate-800">{t.label}</div><div className="text-xs text-slate-500 mt-1">{t.subtractsDays ? 'Resta Días' : 'No Resta'} {t.fixedRanges && t.fixedRanges.length > 0 ? ` • ${t.fixedRanges.length} Rangos Fijos` : ''}</div></div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openEditLeaveType(t)} className="text-blue-400 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16}/></button><button onClick={() => store.deleteLeaveType(t.id)} className="text-slate-300 hover:text-red-500 p-1.5 rounded"><Trash2 size={16}/></button></div>
                        </div>
                    ))}
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6">
                        <button onClick={() => { setActiveModal('type'); setTypeName(''); setTempRanges([]); setIsFixedDates(false); setEditingTypeId(null); }} className="w-full text-sm font-bold text-slate-500 hover:text-blue-600 text-left">CREAR TIPO</button>
                        {activeModal === 'type' && (
                            <form onSubmit={handleSaveType} className="mt-4 space-y-3 animate-fade-in"><h4 className="text-xs font-bold text-slate-500 mb-3 uppercase">{editingTypeId ? 'Editar Tipo' : 'Crear Tipo'}</h4><div><label className="text-xs font-bold text-slate-500">Nombre</label><input autoFocus required className="w-full p-2 border rounded-lg text-sm" value={typeName} onChange={e=>setTypeName(e.target.value)}/></div><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={typeSubtracts} onChange={e=>setTypeSubtracts(e.target.checked)} className="rounded text-blue-600"/> Resta días</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={isFixedDates} onChange={e=>setIsFixedDates(e.target.checked)} className="rounded text-blue-600"/> Fechas Fijas / Turnos</label>
                                {isFixedDates && (
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4"><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Gestión de Franjas Vacacionales</p>
                                        {tempRanges.length > 0 && (
                                            <div className="overflow-hidden border border-slate-100 rounded-lg"><table className="w-full text-left text-[10px]"><thead className="bg-slate-50 text-slate-500 font-bold uppercase"><tr><th className="p-2">Nombre/Días</th><th className="p-2">Rango</th><th className="p-2 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{tempRanges.map((r, idx) => { const days = calculateDaysInRange(r.startDate, r.endDate); return (
                                                <tr key={idx} className={`hover:bg-slate-50 transition-colors ${editingRangeIdx === idx ? 'bg-blue-50/50' : ''}`}><td className="p-2"><div className="font-bold text-slate-700">{r.label || 'S/N'}</div><div className="text-blue-600 font-bold">{days} {days === 1 ? 'día' : 'días'}</div></td><td className="p-2 text-slate-500 whitespace-nowrap">{new Date(r.startDate).toLocaleDateString()} al<br/>{new Date(r.endDate).toLocaleDateString()}</td><td className="p-2 text-right"><div className="flex justify-end gap-1"><button type="button" onClick={() => startEditRange(idx)} className="text-blue-500 hover:bg-white p-1 rounded shadow-sm"><Edit2 size={12}/></button><button type="button" onClick={() => removeRange(idx)} className="text-red-400 hover:bg-white p-1 rounded shadow-sm"><X size={12}/></button></div></td></tr>
                                            ); })}</tbody></table></div>
                                        )}
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3"><div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">{editingRangeIdx !== null ? 'Editando Franja' : 'Nueva Franja'}</span>{editingRangeIdx !== null && ( <button type="button" onClick={() => { setEditingRangeIdx(null); setNewRangeStart(''); setNewRangeEnd(''); setNewRangeLabel(''); }} className="text-[10px] text-red-500 font-bold underline">Cancelar</button> )}</div><input type="text" placeholder="Nombre de la franja (ej: Turno A)" className="w-full p-2 border rounded text-xs" value={newRangeLabel} onChange={e => setNewRangeLabel(e.target.value)}/><div className="grid grid-cols-2 gap-2"><div><label className="text-[9px] font-bold text-slate-400 uppercase">Inicio</label><input type="date" className="w-full p-2 border rounded text-xs" value={newRangeStart} onChange={e => setNewRangeStart(e.target.value)}/></div><div><label className="text-[9px] font-bold text-slate-400 uppercase">Fin</label><input type="date" className="w-full p-2 border rounded text-xs" value={newRangeEnd} onChange={e => setNewRangeEnd(e.target.value)}/></div></div>{newRangeStart && newRangeEnd && ( <div className="text-center text-xs font-bold text-blue-600 bg-blue-50/50 py-1 rounded">Días calculados: {calculateDaysInRange(newRangeStart, newRangeEnd)}</div> )}<button type="button" onClick={handleAddRange} disabled={!newRangeStart || !newRangeEnd} className={`w-full py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${editingRangeIdx !== null ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-800 text-white hover:bg-slate-900'} disabled:opacity-50`}>{editingRangeIdx !== null ? 'Actualizar Franja' : '+ Añadir a la lista'}</button></div>
                                    </div>
                                )}<button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20">{isSaving && <Loader2 className="animate-spin" size={16}/>}{isSaving ? 'Guardando...' : (editingTypeId ? 'Actualizar Tipo' : 'Crear Tipo de Ausencia')}</button>{editingTypeId && ( <button type="button" onClick={() => { setActiveModal(null); setEditingTypeId(null); setTypeName(''); }} className="w-full text-xs text-slate-500 underline mt-2 text-center">Cancelar Edición</button> )}</form>
                        )}
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2"><h3 className="font-bold text-slate-800">Tipos de Turno</h3></div>
                <div className="space-y-3">
                    {store.config.shiftTypes.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center border-l-4" style={{borderLeftColor: s.color}}><div><div className="font-bold text-slate-800">{s.name}</div><div className="text-xs text-slate-500 mt-1">{s.segments[0]?.start}-{s.segments[0]?.end}</div></div><button onClick={() => store.deleteShiftType(s.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></div>
                    ))}
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6"><h4 className="text-xs font-bold text-slate-500 mb-3 uppercase">Crear Turno</h4><form onSubmit={handleSaveShift} className="space-y-3"><div className="flex gap-2"><input required placeholder="Nombre" className="flex-1 p-2 border rounded-lg text-sm" value={shiftName} onChange={e=>setShiftName(e.target.value)}/><input type="color" className="w-10 h-9 p-1 border rounded-lg" value={shiftColor} onChange={e=>setShiftColor(e.target.value)}/></div><div className="grid grid-cols-2 gap-2"><div className="flex items-center gap-1"><Clock size={12}/><input type="time" required className="w-full p-2 border rounded-lg text-xs" value={shiftStart} onChange={e=>setShiftStart(e.target.value)}/></div><div className="flex items-center gap-1"><input type="time" required className="w-full p-2 border rounded-lg text-xs" value={shiftEnd} onChange={e=>setShiftEnd(e.target.value)}/></div></div><button className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-bold">Guardar Turno</button></form></div>
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2"><h3 className="font-bold text-slate-800">Días Festivos</h3></div>
                <div className="space-y-3">
                    {store.config.holidays.sort((a,b) => a.date.localeCompare(b.date)).map(h => (
                        <div key={h.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center group"><div><div className="text-xs font-bold text-red-600">{new Date(h.date).toLocaleDateString()}</div><div className="font-medium text-slate-700 text-sm">{h.name}</div></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openEditHoliday(h)} className="text-blue-400 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={14}/></button><button onClick={() => store.deleteHoliday(h.id)} className="text-slate-300 hover:text-red-500 p-1.5 rounded"><Trash2 size={14}/></button></div></div>
                    ))}
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6"><h4 className="text-xs font-bold text-slate-500 mb-3 uppercase">{editingHolidayId ? 'Editar' : 'Añadir'} Festivo</h4><form onSubmit={handleSaveHoliday} className="space-y-3"><input type="date" required className="w-full p-2 border rounded-lg text-sm" value={holidayDate} onChange={e=>setHolidayDate(e.target.value)}/><input type="text" required placeholder="Nombre Festividad" className="w-full p-2 border rounded-lg text-sm" value={holidayName} onChange={e=>setHolidayName(e.target.value)}/><button className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-bold">{editingHolidayId ? 'Actualizar' : 'Añadir'}</button>{editingHolidayId && <button type="button" onClick={() => { setEditingHolidayId(null); setHolidayName(''); setHolidayDate(''); setActiveModal(null); }} className="w-full text-xs text-slate-500 underline mt-1">Cancelar</button>}</form></div>
                </div>
            </div>
        </div>
    );
};

const PPEConfigManager: React.FC = () => {
    const [editingPPEId, setEditingPPEId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [sizes, setSizes] = useState('');
    const handleSave = async (e: React.FormEvent) => { e.preventDefault(); if(!name || !sizes) return; const sizeArray = sizes.split(',').map(s => s.trim()).filter(s => s !== ''); if (editingPPEId) await store.updatePPEType(editingPPEId, name, sizeArray); else await store.createPPEType(name, sizeArray); setEditingPPEId(null); setName(''); setSizes(''); };
    const startEdit = (p: any) => { setEditingPPEId(p.id); setName(p.name); setSizes(p.sizes.join(', ')); };
    return (
        <div className="space-y-6"><h3 className="text-xl font-bold text-slate-800">Gestión de EPIs</h3><div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm"><form onSubmit={handleSave} className="flex gap-4 items-end"><div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nombre del Equipo</label><input required placeholder="Ej: Botas de Seguridad" className="w-full p-2 border rounded-lg" value={name} onChange={e=>setName(e.target.value)}/></div><div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tallas (Separadas por comas)</label><input required placeholder="Ej: 38, 39, 40, 41, 42" className="w-full p-2 border rounded-lg" value={sizes} onChange={e=>setSizes(e.target.value)}/></div><button className={`${editingPPEId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'} text-white px-4 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2`}>{editingPPEId ? <Save size={18}/> : <Plus size={18}/>} {editingPPEId ? 'Actualizar' : 'Añadir'}</button>{editingPPEId && <button type="button" onClick={() => { setEditingPPEId(null); setName(''); setSizes(''); }} className="px-4 py-2.5 bg-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-300">Cancelar</button>}</form></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{store.config.ppeTypes.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative group"><div className="font-bold text-slate-800 flex items-center gap-2"><HardHat size={16} className="text-orange-500"/> {p.name}</div><div className="mt-2 flex flex-wrap gap-1">{p.sizes.map(s => <span key={s} className="px-2 py-0.5 bg-slate-100 text-xs rounded font-mono">{s}</span>)}</div><div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => startEdit(p)} className="text-blue-400 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16}/></button><button onClick={() => store.deletePPEType(p.id)} className="text-slate-300 hover:text-red-500 p-1.5 rounded"><Trash2 size={16}/></button></div></div>
        ))}</div></div>
    );
};

const CommunicationsManager: React.FC = () => {
    const [subTab, setSubTab] = useState<'templates' | 'smtp' | 'message' | 'news'>('templates');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('request_created');
    const [tempTemplates, setTempTemplates] = useState<EmailTemplate[]>(store.config.emailTemplates);
    const [smtp, setSmtp] = useState(store.config.smtpSettings);
    const [msgBody, setMsgBody] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [newsTitle, setNewsTitle] = useState('');
    const [newsContent, setNewsContent] = useState('');
    const [testEmail, setTestEmail] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testLogs, setTestLogs] = useState<string[]>([]);
    const [showDebug, setShowDebug] = useState(false);
    const activeTemplate = tempTemplates.find(t => t.id === selectedTemplateId) || tempTemplates[0];
    const handleTemplateChange = (field: keyof EmailTemplate, value: any) => { setTempTemplates(prev => prev.map(t => t.id === selectedTemplateId ? { ...t, [field]: value } : t)); };
    const handleRecipientChange = (role: 'worker' | 'supervisor' | 'admin', checked: boolean) => { setTempTemplates(prev => prev.map(t => t.id === selectedTemplateId ? { ...t, recipients: { ...t.recipients, [role]: checked } } : t)); };
    const saveTemplates = async () => { await store.saveEmailTemplates(tempTemplates); alert('Plantillas guardadas correctamente.'); };
    const handleSaveSmtp = async (e: React.FormEvent) => { e.preventDefault(); await store.saveSmtpSettings(smtp); alert('Configuración SMTP guardada.'); };
    const addLog = (msg: string) => { setTestLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]); };
    const handleTestConnection = async (e: React.MouseEvent) => { e.preventDefault(); if(!testEmail) return alert("Introduce un email para la prueba."); setIsTesting(true); setShowDebug(true); setTestLogs([]); addLog("Iniciando prueba..."); if (!smtp.host || !smtp.user || !smtp.password) { addLog("❌ Error: Faltan datos."); setIsTesting(false); return; } try { await store.sendTestEmail(testEmail); addLog("✅ Éxito."); } catch (err: any) { addLog("❌ ERROR: " + err.message); } finally { setIsTesting(false); } };
    const handleSendMessage = async () => { if (!msgBody) return alert('Escribe un mensaje.'); if (selectedUsers.length === 0) return alert('Selecciona destinatarios.'); await store.sendMassNotification(selectedUsers, msgBody); alert('Enviado.'); setMsgBody(''); setSelectedUsers([]); setSelectAll(false); };
    const handlePostNews = async () => { if (!newsTitle || !newsContent) return alert('Completa título y contenido.'); await store.createNewsPost(newsTitle, newsContent, store.currentUser!.id); alert('Anuncio publicado en el muro.'); setNewsTitle(''); setNewsContent(''); };
    const toggleUser = (id: string) => { if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter(u => u.id !== id)); else { const found = store.users.find(u => u.id === id); if (found) setSelectedUsers([...selectedUsers, found.id]); } };
    const toggleSelectAll = () => { if (selectAll) setSelectedUsers([]); else setSelectedUsers(store.users.map(u => u.id)); setSelectAll(!selectAll); };
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[600px]">
            <div className="space-y-2"><h3 className="font-bold text-slate-700 mb-4">Configuración</h3>
                <button onClick={() => setSubTab('templates')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-2 font-medium transition-all ${subTab === 'templates' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}><Mail size={18}/> Plantillas Email</button>
                <button onClick={() => setSubTab('smtp')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-2 font-medium transition-all ${subTab === 'smtp' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}><List size={18}/> Servidor SMTP</button>
                <button onClick={() => setSubTab('message')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-2 font-medium transition-all ${subTab === 'message' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}><MessageSquare size={18}/> Notificar</button>
                <button onClick={() => setSubTab('news')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-2 font-medium transition-all ${subTab === 'news' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}><Megaphone size={18}/> Muro de Anuncios</button>
            </div>
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-0 overflow-hidden flex flex-col">
                {subTab === 'templates' && activeTemplate && (
                    <div className="flex flex-col h-full"><div className="flex border-b border-slate-100 overflow-x-auto">{[{ id: 'request_created', label: 'Ausencia: Crea' }, { id: 'request_approved', label: 'Ausencia: OK' }, { id: 'request_rejected', label: 'Ausencia: KO' }, { id: 'overtime_created', label: 'Horas: Reg' }, { id: 'overtime_approved', label: 'Horas: OK' }, { id: 'overtime_consumed', label: 'Horas: Canje' }, { id: 'adjustment_applied', label: 'Regularización' }].map(type => ( <button key={type.id} onClick={() => setSelectedTemplateId(type.id)} className={`px-4 py-4 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${selectedTemplateId === type.id ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>{type.label}</button> ))}</div><div className="p-8 flex-1 overflow-y-auto animate-fade-in"><div className="grid grid-cols-2 gap-6 mb-4"><div className="col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asunto</label><input className="w-full p-3 border rounded-xl text-sm font-medium" value={activeTemplate.subject} onChange={e => handleTemplateChange('subject', e.target.value)}/></div><div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200"><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Destinatarios</label><div className="flex gap-6"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={activeTemplate.recipients.worker} onChange={e => handleRecipientChange('worker', e.target.checked)} className="rounded text-blue-600"/> Empleado</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={activeTemplate.recipients.supervisor} onChange={e => handleRecipientChange('supervisor', e.target.checked)} className="rounded text-blue-600"/> Supervisor</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={activeTemplate.recipients.admin} onChange={e => handleRecipientChange('admin', e.target.checked)} className="rounded text-blue-600"/> Admins</label></div></div></div><div className="mb-4"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cuerpo</label><textarea className="w-full p-4 border rounded-xl h-64 text-sm font-mono text-slate-700 leading-relaxed resize-none" value={activeTemplate.body} onChange={e => handleTemplateChange('body', e.target.value)}/></div><div className="flex justify-end"><button onClick={saveTemplates} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg"><Save size={18}/> Guardar Plantilla</button></div></div></div>
                )}
                {subTab === 'smtp' && (
                    <div className="p-8 animate-fade-in max-w-lg mx-auto w-full overflow-y-auto"><h2 className="text-lg font-bold text-slate-800 mb-6 text-center">SMTP</h2><form onSubmit={handleSaveSmtp} className="space-y-4"><div><label className="text-sm font-semibold">Host</label><input className="w-full p-3 border rounded-xl text-sm" value={smtp.host} onChange={e => setSmtp({...smtp, host: e.target.value})}/></div><div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-semibold">Puerto</label><input type="number" className="w-full p-3 border rounded-xl text-sm" value={smtp.port} onChange={e => setSmtp({...smtp, port: parseInt(e.target.value)})}/></div><div className="flex items-end pb-3"><label className="flex items-center gap-2 cursor-pointer font-semibold"><input type="checkbox" checked={smtp.enabled} onChange={e => setSmtp({...smtp, enabled: e.target.checked})} className="w-5 h-5 rounded text-blue-600"/> Activar</label></div></div><div><label className="text-sm font-semibold">Usuario</label><input className="w-full p-3 border rounded-xl text-sm" value={smtp.user} onChange={e => setSmtp({...smtp, user: e.target.value})}/></div><div><label className="text-sm font-semibold">Pass</label><input type="password" className="w-full p-3 border rounded-xl text-sm" value={smtp.password} onChange={e => setSmtp({...smtp, password: e.target.value})}/></div><button type="submit" className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">Guardar</button></form></div>
                )}
                {subTab === 'message' && (
                    <div className="p-8 animate-fade-in flex flex-col h-full"><h2 className="text-lg font-bold text-slate-800 mb-4">Mensaje Masivo</h2><div className="flex-1 flex gap-6 min-h-0"><div className="flex-1 flex flex-col"><label className="text-sm font-semibold">Mensaje</label><textarea className="flex-1 w-full p-4 border rounded-xl text-sm resize-none" placeholder="Escribe..." value={msgBody} onChange={e => setMsgBody(e.target.value)}/><div className="mt-4 flex justify-end"><button onClick={handleSendMessage} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Send size={18}/> Enviar</button></div></div><div className="w-64 border rounded-xl overflow-hidden flex flex-col"><div className="bg-slate-50 p-3 border-b flex items-center justify-between"><span className="font-bold text-sm">Destinatarios</span><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selectedUsers.length}</span></div><div className="p-2 border-b bg-slate-50/50"><label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="rounded text-blue-600" /> Todos</label></div><div className="overflow-y-auto p-2 space-y-1 flex-1">{store.users.map(u => ( <label key={u.id} className="flex items-center gap-2 text-sm p-2 hover:bg-slate-50 rounded cursor-pointer"><input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUser(u.id)} className="rounded text-blue-600"/><span className="truncate">{u.name}</span></label> ))}</div></div></div></div>
                )}
                {subTab === 'news' && (
                    <div className="p-8 animate-fade-in flex flex-col h-full">
                        <h2 className="text-lg font-bold text-slate-800 mb-6">Publicar Anuncio en el Muro</h2>
                        <div className="space-y-4 max-w-2xl">
                            <div><label className="text-sm font-bold text-slate-500 uppercase block mb-1">Título del Anuncio</label><input className="w-full p-3 border rounded-xl" placeholder="Ej: Nueva cafetera en el office" value={newsTitle} onChange={e => setNewsTitle(e.target.value)}/></div>
                            <div><label className="text-sm font-bold text-slate-500 uppercase block mb-1">Contenido</label><textarea className="w-full p-3 border rounded-xl h-32 resize-none" placeholder="Escribe el anuncio aquí..." value={newsContent} onChange={e => setNewsContent(e.target.value)}/></div>
                            <div className="flex justify-end"><button onClick={handlePostNews} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all"><Megaphone size={18}/> Publicar Anuncio</button></div>
                        </div>
                        <div className="mt-8 border-t border-slate-100 pt-6 flex-1 overflow-y-auto">
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Anuncios Recientes</h3>
                            <div className="space-y-3">
                                {store.config.news.map(post => (
                                    <div key={post.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center group">
                                        <div><p className="font-bold text-slate-800">{post.title}</p><p className="text-xs text-slate-500 truncate max-w-md">{post.content}</p></div>
                                        <button onClick={() => store.deleteNewsPost(post.id)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 p-2"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- EXPORTED MANAGEMENT COMPONENTS ---

export const Approvals: React.FC<{ user: User, onViewRequest: (req: LeaveRequest) => void }> = ({ user, onViewRequest }) => {
  const [refresh, setRefresh] = useState(0);
  useEffect(() => store.subscribe(() => setRefresh(r => r+1)), []);
  
  const pending = store.getPendingApprovalsForUser(user.id);
  const absences = pending.filter(r => !store.isOvertimeRequest(r.typeId));
  const overtimes = pending.filter(r => store.isOvertimeRequest(r.typeId));

  const handleAction = async (req: LeaveRequest, status: RequestStatus) => { 
    const message = status === RequestStatus.APPROVED ? 'Comentario (opcional):' : 'Motivo del rechazo (Obligatorio):'; 
    const comment = prompt(message); 
    if (comment === null) return; 
    if (status === RequestStatus.REJECTED && !comment.trim()) { alert("Debes indicar un motivo."); return; } 
    await store.updateRequestStatus(req.id, status, user.id, comment || undefined); 
  };

  const renderRequestList = (list: LeaveRequest[]) => (
    <div className="grid gap-4">
        {list.map(req => { 
            const conflicts = store.getRequestConflicts(req); 
            const hasConflict = conflicts.length > 0;
            const start = new Date(req.startDate);
            const end = new Date(req.endDate || req.startDate);
            const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return ( <div key={req.id} className={`bg-white p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-6 items-start md:items-center transition-all ${hasConflict ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-100'}`}><div className="flex-1"><div className="flex items-center gap-2 mb-2"><span className="font-bold text-lg text-slate-800">{store.users.find(u => u.id === req.userId)?.name}</span><span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">{store.departments.find(d => d.id === store.users.find(u => u.id === req.userId)?.departmentId)?.name}</span></div><div className="flex flex-wrap gap-4 text-sm text-slate-600"><div className="flex items-center gap-1 font-medium"><FileText size={16}/> {store.getTypeLabel(req.typeId)}</div><div className="flex items-center gap-1"><Calendar size={16}/> {new Date(req.startDate).toLocaleDateString()} {req.endDate && ` - ${new Date(req.endDate).toLocaleDateString()}`}</div>{!store.isOvertimeRequest(req.typeId) && <div className="flex items-center gap-1 font-bold text-blue-600"><CalendarDays size={16}/> {diffDays} {diffDays === 1 ? 'día' : 'días'}</div>}{req.hours && <div className="flex items-center gap-1 font-bold text-indigo-600"><Clock size={16}/> {req.hours}h</div>}</div>{hasConflict && ( 
                <div className="mt-3 bg-red-50 text-red-700 p-3 rounded-xl text-xs space-y-2 border border-red-100 shadow-sm animate-pulse">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                        <AlertTriangle size={14} className="shrink-0"/>
                        Conflictos Detectados ({conflicts.length})
                    </div>
                    <div className="space-y-1 pl-6">
                        {conflicts.map(c => {
                            const otherUser = store.users.find(u => u.id === c.userId);
                            const overlapStart = new Date(Math.max(new Date(req.startDate).getTime(), new Date(c.startDate).getTime()));
                            const overlapEnd = new Date(Math.min(new Date(req.endDate || req.startDate).getTime(), new Date(c.endDate || c.startDate).getTime()));
                            return (
                                <div key={c.id} className="flex flex-col border-l-2 border-red-200 pl-2 py-0.5">
                                    <span className="font-bold text-red-800">{otherUser?.name}</span>
                                    <span className="text-[10px] text-red-600 opacity-80 italic">
                                        Solapa del {overlapStart.toLocaleDateString()} al {overlapEnd.toLocaleDateString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div> 
            )}</div><div className="flex gap-3"><button onClick={() => onViewRequest(req)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><ExternalLink size={20}/></button><button onClick={() => handleAction(req, RequestStatus.REJECTED)} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors">Rechazar</button><button onClick={() => handleAction(req, RequestStatus.APPROVED)} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg transition-colors">Aprobar</button></div></div> ); 
        })}
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ShieldCheck className="text-blue-600"/> Aprobaciones Pendientes</h2>
        {pending.length === 0 ? ( 
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400">
                <CheckCircle size={48} className="mx-auto mb-4 opacity-20"/><p>¡Todo al día!</p>
            </div> 
        ) : ( 
            <div className="space-y-12">
                {absences.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <CalendarDays size={16} /> Solicitudes de Ausencia ({absences.length})
                        </h3>
                        {renderRequestList(absences)}
                    </div>
                )}

                {overtimes.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <Clock size={16} /> Solicitudes de Horas ({overtimes.length})
                        </h3>
                        {renderRequestList(overtimes)}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export const UpcomingAbsences: React.FC<{ user: User, onViewRequest: (req: LeaveRequest) => void }> = ({ user, onViewRequest }) => {
    const today = new Date().toISOString().split('T')[0];
    const teamIds = useMemo(() => { if (user.role === Role.ADMIN) return store.users.map(u => u.id); const myDepts = store.departments.filter(d => d.supervisorIds.includes(user.id)).map(d => d.id); return store.users.filter(u => myDepts.includes(u.departmentId)).map(u => u.id); }, [user]);
    const absences = store.requests.filter(r => (r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING) && !store.isOvertimeRequest(r.typeId) && (r.endDate || r.startDate) >= today && teamIds.includes(r.userId) ).sort((a,b) => a.startDate.localeCompare(b.startDate));
    const handleAction = async (e: React.MouseEvent, req: LeaveRequest, status: RequestStatus) => { e.stopPropagation(); const message = status === RequestStatus.APPROVED ? 'Comentario:' : 'Motivo del rechazo:'; const comment = prompt(message); if (comment === null) return; if (status === RequestStatus.REJECTED && !comment.trim()) { alert("Obligatorio."); return; } await store.updateRequestStatus(req.id, status, user.id, comment || undefined); };
    return (
        <div className="space-y-6 animate-fade-in print:bg-white print:p-0 print:m-0 print:w-full"><div className="flex justify-between items-center print:hidden"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><CalendarClock className="text-blue-600"/> Próximas Ausencias</h2><button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg font-bold text-slate-600 shadow-sm"><Printer size={18}/> Imprimir</button></div>{absences.length === 0 ? ( <p className="text-slate-500 italic">No hay ausencias programadas.</p> ) : ( <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"><table className="w-full text-left text-sm print:text-xs"><thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs"><tr><th className="px-6 py-4">Empleado</th><th className="px-6 py-4">Tipo</th><th className="px-6 py-4">Fechas</th><th className="px-6 py-4">Días</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 print:hidden">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{absences.map(req => { const u = store.users.find(usr => usr.id === req.userId); const start = new Date(req.startDate); const end = new Date(req.endDate || req.startDate); const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1; 
        const conflicts = store.getRequestConflicts(req); 
        const hasConflict = conflicts.length > 0;
        return ( <tr key={req.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onViewRequest(req)}><td className="px-6 py-4">
            <div className="font-bold text-slate-700">{u?.name}</div>
            {hasConflict && (
                <div className="mt-1 flex flex-col gap-1.5 animate-pulse">
                    <div className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                        <AlertTriangle size={10}/> CONFLICTO ({conflicts.length})
                    </div>
                    {conflicts.map(c => {
                        const otherUser = store.users.find(usr => usr.id === c.userId);
                        const overlapStart = new Date(Math.max(new Date(req.startDate).getTime(), new Date(c.startDate).getTime()));
                        const overlapEnd = new Date(Math.min(new Date(req.endDate || req.startDate).getTime(), new Date(c.endDate || c.startDate).getTime()));
                        return (
                            <div key={c.id} className="text-[9px] bg-red-50 text-red-800 px-2 py-1 rounded border border-red-100 flex flex-col leading-tight">
                                <span className="font-bold">vs {otherUser?.name.split(' ')[0]}</span>
                                <span className="opacity-70">{overlapStart.toLocaleDateString()} - {overlapEnd.toLocaleDateString()}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </td><td className="px-6 py-4">{store.getTypeLabel(req.typeId)}</td><td className="px-6 py-4 text-slate-500">{start.toLocaleDateString()} - {end.toLocaleDateString()}</td><td className="px-6 py-4 font-mono font-bold text-blue-600">{diff}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{req.status}</span></td><td className="px-6 py-4 print:hidden" onClick={e => e.stopPropagation()}><div className="flex gap-2">{req.status === RequestStatus.PENDING && ( <button onClick={(e) => handleAction(e, req, RequestStatus.APPROVED)} className="p-1.5 bg-green-50 text-green-600 rounded border border-green-200"><Check size={16}/></button> )}<button onClick={(e) => handleAction(e, req, RequestStatus.REJECTED)} className="p-1.5 bg-red-50 text-red-600 rounded border border-red-200"><X size={16}/></button></div></td></tr> ) })}</tbody></table></div> )}</div>
    );
};

// Sub-component for user creation/editing
const UserModal: React.FC<{ onClose: () => void, editingUser: User | null }> = ({ onClose, editingUser }) => {
    const [name, setName] = useState(editingUser?.name || '');
    const [email, setEmail] = useState(editingUser?.email || '');
    const [role, setRole] = useState<Role>(editingUser?.role || Role.WORKER);
    const [deptId, setDeptId] = useState(editingUser?.departmentId || '');
    const [days, setDays] = useState(editingUser?.daysAvailable || 22);
    const [hours, setHours] = useState(editingUser?.overtimeHours || 0);
    const [pass, setPass] = useState('');
    const [birthdate, setBirthdate] = useState(editingUser?.birthdate || '');
    const [isSaving, setIsSaving] = useState(false);

    const [adjDays, setAdjDays] = useState(0);
    const [adjDaysReason, setAdjDaysReason] = useState('');
    const [adjHours, setAdjHours] = useState(0);
    const [adjHoursReason, setAdjHoursReason] = useState('');

    const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
    const [editingRequestLocal, setEditingRequestLocal] = useState<LeaveRequest | null>(null);
    const [refresh, setRefresh] = useState(0);

    const movements = useMemo(() => {
        if (!editingUser) return [];
        return store.requests.filter(r => r.userId === editingUser.id).sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }, [editingUser?.id, store.requests, refresh]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        if (editingUser) {
            await store.updateUserAdmin(editingUser.id, { name, email, departmentId: deptId, birthdate });
            if (editingUser.role !== role) await store.updateUserRole(editingUser.id, role);
            if (pass) await store.updateUserProfile(editingUser.id, { name, email, password: pass });
            if (adjDays !== 0) {
                await store.createRequest({ typeId: RequestType.ADJUSTMENT_DAYS, startDate: new Date().toISOString(), hours: adjDays, reason: adjDaysReason || 'Ajuste manual de administrador', isJustified: true, reportedToAdmin: false }, editingUser.id, RequestStatus.APPROVED);
            }
            if (adjHours !== 0) {
                await store.createRequest({ typeId: RequestType.ADJUSTMENT_OVERTIME, startDate: new Date().toISOString(), hours: adjHours, reason: adjHoursReason || 'Ajuste manual de administrador', isJustified: true, reportedToAdmin: false }, editingUser.id, RequestStatus.APPROVED);
            }
        } else {
            await store.createUser({ name, email, role, departmentId: deptId, daysAvailable: days, overtimeHours: hours, birthdate }, pass || '123456');
        }
        setIsSaving(false);
        onClose();
    };

    const handleDeleteMovement = async (id: string) => {
        if(confirm('¿Seguro que deseas eliminar este registro?')) {
            await store.deleteRequest(id);
            setRefresh(r => r+1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[95vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/30"><Users size={20}/></div>
                        <h3 className="text-xl font-bold text-slate-800">{editingUser ? 'Ficha del Empleado' : 'Nuevo Empleado'}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {editingUser && (
                            <button onClick={() => { setEditingRequestLocal(null); setShowCreateRequestModal(true); }} className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 flex items-center gap-2 transition-all">
                                <Plus size={18}/> Nueva Solicitud
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={24}/></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-10">
                    <form id="userForm" onSubmit={handleSubmit} className="flex flex-col gap-10">
                        {/* Profile Section */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2"><UserIcon size={14}/> Datos de Perfil</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                                    <input required className="w-full p-2.5 border rounded-xl bg-slate-50" value={name} onChange={e=>setName(e.target.value)}/>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Corporativo</label>
                                    <input type="email" required className="w-full p-2.5 border rounded-xl bg-slate-50" value={email} onChange={e=>setEmail(e.target.value)}/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rol en Sistema</label>
                                    <select className="w-full p-2.5 border rounded-xl bg-slate-50" value={role} onChange={e=>setRole(e.target.value as Role)}>
                                        <option value={Role.WORKER}>Trabajador</option>
                                        <option value={Role.SUPERVISOR}>Supervisor</option>
                                        <option value={Role.ADMIN}>Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Departamento</label>
                                    <select required className="w-full p-2.5 border rounded-xl bg-slate-50" value={deptId} onChange={e=>setDeptId(e.target.value)}>
                                        <option value="">Seleccionar...</option>
                                        {store.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">F. Nacimiento</label>
                                    <input type="date" className="w-full p-2.5 border rounded-xl bg-slate-50" value={birthdate} onChange={e=>setBirthdate(e.target.value)}/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contraseña</label>
                                    <input type="password" placeholder={editingUser ? 'Mantiene actual' : '123456 por defecto'} className="w-full p-2.5 border rounded-xl bg-slate-50" value={pass} onChange={e=>setPass(e.target.value)}/>
                                </div>
                            </div>
                        </div>

                        {/* Balance Section - BELOW PROFILE */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2"><PieChart size={14}/> Ajustes de Saldo</h4>
                            {editingUser ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Días</span>
                                                <span className="text-3xl font-black text-orange-600 leading-none">{editingUser.daysAvailable.toFixed(1)}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="number" step="0.5" className="w-20 p-2 border rounded-xl text-center font-bold" placeholder="0" value={adjDays || ''} onChange={e=>setAdjDays(parseFloat(e.target.value) || 0)}/>
                                                <input className="flex-1 p-2 border rounded-xl text-xs" placeholder="Motivo..." value={adjDaysReason} onChange={e=>setAdjDaysReason(e.target.value)}/>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Horas</span>
                                                <span className="text-3xl font-black text-blue-600 leading-none">{editingUser.overtimeHours}h</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="number" step="0.5" className="w-20 p-2 border rounded-xl text-center font-bold" placeholder="0" value={adjHours || ''} onChange={e=>setAdjHours(parseFloat(e.target.value) || 0)}/>
                                                <input className="flex-1 p-2 border rounded-xl text-xs" placeholder="Motivo..." value={adjHoursReason} onChange={e=>setAdjHoursReason(e.target.value)}/>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-[10px] text-slate-500 italic">Introduce valores positivos para sumar o negativos para restar. Se generará un registro de "Regularización" automático.</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Días Vacaciones Iniciales</label><input type="number" className="w-full p-2.5 border rounded-xl bg-slate-50" value={days} onChange={e=>setDays(parseFloat(e.target.value))}/></div>
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Saldo Horas Inicial</label><input type="number" className="w-full p-2.5 border rounded-xl bg-slate-50" value={hours} onChange={e=>setHours(parseFloat(e.target.value))}/></div>
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Movements Section - BELOW BALANCE */}
                    {editingUser && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History size={14}/> Historial de Movimientos</h4>
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">{movements.length} registros</span>
                            </div>
                            {movements.length === 0 ? <div className="text-center py-8 text-slate-400 italic text-sm">Sin movimientos registrados.</div> : (
                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase"><tr><th className="px-4 py-3">Tipo / Motivo</th><th className="px-4 py-3">Fechas / Aplicación</th><th className="px-4 py-3 text-center">Cantidad</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {movements.map(m => (
                                                <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-slate-700">{store.getTypeLabel(m.typeId)}</div>
                                                        <div className="text-slate-400 italic truncate max-w-[200px]">{m.reason || '-'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 font-medium">
                                                        {m.startDate.includes('T') ? new Date(m.startDate).toLocaleDateString() : m.startDate}{m.endDate && ` - ${new Date(m.endDate).toLocaleDateString()}`}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {(() => {
                                                            const isOvertime = store.isOvertimeRequest(m.typeId);
                                                            const tid = m.typeId.toLowerCase();
                                                            // Identificar si debe mostrar días (vacaciones, asuntos propios, canje, justificable)
                                                            const isAbsence = (!isOvertime || tid.includes('canje') || tid.includes('vacac') || tid.includes('asuntos')) && !tid.includes('registro_horas') && !tid.includes('abono_en_nomina');
                                                            
                                                            let val = m.hours || 0;
                                                            
                                                            // Lógica de signo y cantidad
                                                            if (isOvertime) {
                                                                // Consumos de horas (canje o abono) deben ser negativos
                                                                if (tid.includes('canje') || tid.includes('abono')) {
                                                                    val = -Math.abs(val);
                                                                }
                                                                // Ganancias de horas (registro, festivo, ajuste) positivos (val ya lo es)
                                                            } else if (isAbsence && !tid.includes('ajuste') && (!val || val === 0)) {
                                                                // Cálculo automático de días para ausencias normales
                                                                const start = new Date(m.startDate);
                                                                const end = new Date(m.endDate || m.startDate);
                                                                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                                                    const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                                                    val = -diff;
                                                                }
                                                            }

                                                            // Si es un "Canje por días libres", la cantidad en días debe ser 0.0d según el requisito
                                                            const displayVal = tid.includes('canje') && !isOvertime ? 0 : val;
                                                            
                                                            const colorClass = (val || 0) < 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';
                                                            const unit = (isOvertime && !tid.includes('vacac') && !tid.includes('asuntos')) ? 'h' : 'd';
                                                            
                                                            return (
                                                                <span className={`font-mono font-bold px-2 py-0.5 rounded ${colorClass}`}>
                                                                    {val && val > 0 ? `+${val.toFixed(1)}` : (val ? val.toFixed(1) : '0.0')}{unit}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${m.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' : m.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => { setEditingRequestLocal(m); setShowCreateRequestModal(true); }} className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-white rounded shadow-sm border border-transparent hover:border-blue-100 transition-all"><Edit2 size={14}/></button>
                                                            <button onClick={() => handleDeleteMovement(m.id)} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-white rounded shadow-sm border border-transparent hover:border-red-100 transition-all"><Trash2 size={14}/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
                    <button form="userForm" disabled={isSaving} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 flex items-center gap-2 transition-all">
                        {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                        {editingUser ? 'Actualizar Ficha' : 'Crear Usuario'}
                    </button>
                </div>
            </div>
            {showCreateRequestModal && editingUser && (
                <RequestFormModal 
                    onClose={() => { setShowCreateRequestModal(false); setEditingRequestLocal(null); setRefresh(r=>r+1); }}
                    user={store.currentUser!}
                    targetUser={editingUser}
                    initialTab="absence"
                    editingRequest={editingRequestLocal}
                />
            )}
        </div>
    );
};

export const UserManagement: React.FC<{ currentUser: User, onViewRequest: (req: LeaveRequest) => void }> = ({ currentUser, onViewRequest }) => {
    const [viewMode, setViewMode] = useState<'list' | 'shifts'>('list');
    const [search, setSearch] = useState('');
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        const unsubscribe = store.subscribe(() => setRefresh(prev => prev + 1));
        return unsubscribe;
    }, []);

    const users = useMemo(() => {
        let list = store.users;
        if (currentUser.role === Role.SUPERVISOR) {
            const myDepts = store.departments.filter(d => d.supervisorIds.includes(currentUser.id)).map(d => d.id);
            list = list.filter(u => myDepts.includes(u.departmentId));
        }
        if (search) {
            list = list.filter(u => 
                u.name.toLowerCase().includes(search.toLowerCase()) || 
                u.email.toLowerCase().includes(search.toLowerCase())
            );
        }
        return list.sort((a,b) => a.name.localeCompare(b.name));
    }, [search, currentUser.id, refresh]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-2 w-full md:w-auto p-1 bg-slate-100 rounded-xl">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                        Listado
                    </button>
                    <button 
                        onClick={() => setViewMode('shifts')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${viewMode === 'shifts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                        Planificación
                    </button>
                </div>
                {currentUser.role === Role.ADMIN && (
                    <button 
                        onClick={() => { setEditingUser(null); setShowUserModal(true); }}
                        className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all"
                    >
                        <UserPlus size={18}/> Nuevo Empleado
                    </button>
                )}
            </div>

            {viewMode === 'list' ? (
                <div className="space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                        <input 
                            type="text" 
                            placeholder="Buscar empleado..." 
                            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {users.map(u => (
                            <div key={u.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 group">
                                <div className="flex items-center gap-4">
                                    <img src={u.avatar} className="w-14 h-14 rounded-full border-2 border-slate-50 shadow-sm object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 truncate">{u.name}</h4>
                                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                    </div>
                                    {currentUser.role === Role.ADMIN && (
                                        <button 
                                            onClick={() => { setEditingUser(u); setShowUserModal(true); }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        >
                                            <Edit2 size={16}/>
                                        </button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Vacaciones</p>
                                        <p className="text-lg font-bold text-orange-600">
                                            {u.daysAvailable.toFixed(1)} <span className="text-xs font-normal text-slate-400">días</span>
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Horas Extra</p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {u.overtimeHours} <span className="text-xs font-normal text-slate-400">h</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        {store.departments.find(d => d.id === u.departmentId)?.name || 'Sin Dept.'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        u.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : 
                                        u.role === Role.SUPERVISOR ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {u.role}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <ShiftScheduler users={users} />
            )}

            {showUserModal && (
                <UserModal 
                    onClose={() => setShowUserModal(false)} 
                    editingUser={editingUser}
                />
            )}
        </div>
    );
};

export const AdminSettings: React.FC<{ onViewRequest: (req: LeaveRequest) => void }> = ({ onViewRequest }) => {
    const [adminTab, setAdminTab] = useState<'users' | 'depts' | 'config' | 'ppe' | 'comm'>('users');
    const [refresh, setRefresh] = useState(0);
    const currentUser = store.currentUser!;

    useEffect(() => {
        const unsubscribe = store.subscribe(() => setRefresh(prev => prev + 1));
        return unsubscribe;
    }, []);

    const stats = useMemo(() => {
        const total = store.users.length;
        
        // Obtenemos la fecha de hoy en formato local YYYY-MM-DD para comparación segura
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        const absentCount = store.users.filter(u => 
            store.requests.some(r => {
                // Debe ser del mismo usuario y estar aprobada
                if (r.userId !== u.id || r.status !== RequestStatus.APPROVED) return false;
                
                // Determinamos si es una solicitud que representa una ausencia física hoy
                const tid = r.typeId.toLowerCase();
                const absenceTypes = [
                    RequestType.VACATION, 
                    RequestType.SICKNESS, 
                    RequestType.PERSONAL, 
                    RequestType.OVERTIME_SPEND_DAYS, 
                    RequestType.UNJUSTIFIED
                ];

                const leaveConfig = store.config.leaveTypes.find(t => t.id === r.typeId);
                const isPhysicalAbsence = absenceTypes.includes(r.typeId as RequestType) || 
                                          tid.includes('vacac') || tid.includes('asuntos') || tid.includes('canje') ||
                                          (leaveConfig && leaveConfig.subtractsDays);

                if (!isPhysicalAbsence) return false;

                // Extraemos solo la parte YYYY-MM-DD de las fechas de la solicitud
                const startStr = r.startDate.split('T')[0];
                const endStr = (r.endDate || r.startDate).split('T')[0];

                // Comprobamos si el día de hoy cae dentro del rango (inclusive)
                return todayStr >= startStr && todayStr <= endStr;
            })
        ).length;

        const percent = total > 0 ? ((absentCount / total) * 100).toFixed(1) : "0";
        return { total, absent: absentCount, percent };
    }, [refresh, store.users, store.requests]);
    
    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Settings className="text-blue-600"/> Administración del Sistema</h2>
            
            {/* Estadísticas de Administración */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-all">
                    <div className="bg-blue-50 p-4 rounded-xl text-blue-600 group-hover:scale-110 transition-transform"><Users size={32}/></div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Empleados</p>
                        <h4 className="text-3xl font-black text-slate-800">{stats.total}</h4>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-all">
                    <div className="bg-orange-50 p-4 rounded-xl text-orange-600 group-hover:scale-110 transition-transform"><Palmtree size={32}/></div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Ausencias Hoy</p>
                        <h4 className="text-3xl font-black text-slate-800">{stats.absent}</h4>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-all">
                    <div className="bg-purple-50 p-4 rounded-xl text-purple-600 group-hover:scale-110 transition-transform"><TrendingUp size={32}/></div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">% Plantilla Ausente</p>
                        <h4 className="text-3xl font-black text-slate-800">{stats.percent}%</h4>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-200">
                <button onClick={() => setAdminTab('users')} className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${adminTab === 'users' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Usuarios</button>
                <button onClick={() => setAdminTab('depts')} className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${adminTab === 'depts' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Dptos</button>
                <button onClick={() => setAdminTab('config')} className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${adminTab === 'config' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>RRHH</button>
                <button onClick={() => setAdminTab('ppe')} className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${adminTab === 'ppe' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>EPIs</button>
                <button onClick={() => setAdminTab('comm')} className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${adminTab === 'comm' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Comunicaciones</button>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[500px]">
                {adminTab === 'users' && <UserManagement currentUser={currentUser} onViewRequest={onViewRequest} />}
                {adminTab === 'depts' && <DepartmentManager />}
                {adminTab === 'config' && <HRConfigManager />}
                {adminTab === 'ppe' && <PPEConfigManager />}
                {adminTab === 'comm' && <CommunicationsManager />}
            </div>
        </div>
    );
};

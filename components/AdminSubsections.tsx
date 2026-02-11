import React, { useState, useEffect, useMemo } from 'react';
import { store } from '../services/store';
import { 
    BarChart2, Activity, Target, Palmtree, Users, Settings, Plus, Trash2, Database, Download, Upload, Info, ShieldCheck, Mail, Megaphone, Server, Layout, Edit2, RotateCcw, Send, Lock, Loader2, Search, Save, X, UserCheck, ShieldAlert, Briefcase, Calendar, Clock, HardHat, Check, Minus, AlertCircle, Printer, AlertTriangle, Archive, ShoppingCart, List, History, RefreshCcw, Timer, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
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

// Gestión de Departamentos
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
                <button onClick={() => setEditingDept({ id: 'new', name: '', supervisorIds: [] })} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"><Plus size={16}/> Nuevo Departamento</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {store.departments.map(d => (
                    <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group">
                        <div><h4 className="font-bold text-slate-700">{d.name}</h4><p className="text-[10px] text-slate-400 font-bold uppercase">{d.supervisorIds?.length || 0} Responsables</p></div>
                        <div className="flex gap-1"><button onClick={() => setEditingDept(d)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 size={16}/></button><button onClick={() => store.deleteDepartment(d.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>
                    </div>
                ))}
            </div>
            {editingDept && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[130] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-scale-in">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">{editingDept.id === 'new' ? 'Nuevo' : 'Editar'} Departamento</h3>
                        <div className="space-y-6">
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Nombre</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={editingDept.name} onChange={e => setEditingDept({...editingDept, name: e.target.value})} /></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Responsables / Supervisores</label>
                                <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1 bg-slate-50">
                                    {store.users.sort((a,b) => a.name.localeCompare(b.name)).map(u => (
                                        <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={editingDept.supervisorIds.includes(u.id)} onChange={() => toggleSupervisor(u.id)}/>
                                            <span className="text-sm font-medium text-slate-700">{u.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2"><button onClick={() => setEditingDept(null)} className="flex-1 py-3 text-slate-500 font-bold">Cancelar</button><button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Guardar</button></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Configuración RRHH
export const HRConfigManager = () => {
    const [editingType, setEditingType] = useState<LeaveTypeConfig | null>(null);
    const [newShift, setNewShift] = useState({ name: '', color: '#3b82f6', start: '08:00', end: '16:30' });
    const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

    const handleSaveType = async () => {
        if (!editingType) return;
        if (editingType.id.startsWith('temp_')) await store.createLeaveType(editingType.label, editingType.subtractsDays, editingType.fixedRanges);
        else await store.updateLeaveType(editingType.id, editingType.label, editingType.subtractsDays, editingType.fixedRanges);
        setEditingType(null);
    };

    const addRange = () => { if (!editingType) return; setEditingType({ ...editingType, fixedRanges: [...(editingType.fixedRanges || []), { startDate: '', endDate: '', label: 'Nuevo Periodo' }] }); };
    const removeRange = (idx: number) => { if (!editingType) return; setEditingType({ ...editingType, fixedRanges: (editingType.fixedRanges || []).filter((_, i) => i !== idx) }); };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipos de Ausencia</h3><button onClick={() => setEditingType({ id: 'temp_' + Date.now(), label: '', subtractsDays: true, fixedRanges: [] })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Plus size={18}/></button></div>
                <div className="space-y-2">{store.config.leaveTypes.map(t => (<div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm group"><div><p className="font-bold text-sm text-slate-700">{t.label}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t.subtractsDays ? 'Resta días' : 'No resta días'}</p></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditingType(t)} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit2 size={14}/></button><button onClick={() => store.deleteLeaveType(t.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button></div></div>))}</div>
                {editingType && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center"><h4 className="font-bold text-slate-800 text-sm">Editar Tipo</h4><button onClick={() => setEditingType(null)}><X size={16}/></button></div>
                        <input className="w-full p-2.5 border rounded-xl text-sm" placeholder="Nombre" value={editingType.label} onChange={e => setEditingType({...editingType, label: e.target.value})} />
                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-xl border border-slate-100"><input type="checkbox" checked={editingType.subtractsDays} onChange={e => setEditingType({...editingType, subtractsDays: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" /><span className="text-xs font-bold text-slate-600">Resta saldo anual</span></label>
                        <div className="pt-2 border-t border-slate-200">
                            <div className="flex justify-between items-center mb-3"><span className="text-[10px] font-black text-slate-400 uppercase">Rangos Turnos</span><button onClick={addRange} className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><Plus size={14}/></button></div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">{(editingType.fixedRanges || []).map((range, idx) => (<div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-[10px] space-y-2"><input className="w-full p-1.5 border-b outline-none font-bold" placeholder="Etiqueta" value={range.label} onChange={e => { const newR = [...(editingType.fixedRanges || [])]; newR[idx].label = e.target.value; setEditingType({...editingType, fixedRanges: newR}); }} /><div className="flex gap-2"><input type="date" className="flex-1" value={range.startDate} onChange={e => { const newR = [...(editingType.fixedRanges || [])]; newR[idx].startDate = e.target.value; setEditingType({...editingType, fixedRanges: newR}); }} /><input type="date" className="flex-1" value={range.endDate} onChange={e => { const newR = [...(editingType.fixedRanges || [])]; newR[idx].endDate = e.target.value; setEditingType({...editingType, fixedRanges: newR}); }} /><button onClick={() => removeRange(idx)} className="text-red-400"><Trash2 size={12}/></button></div></div>))}</div>
                        </div>
                        <button onClick={handleSaveType} className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Guardar</button>
                    </div>
                )}
            </div>
            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Turnos de Trabajo</h3>
                <div className="space-y-2">{store.config.shiftTypes.map(s => (<div key={s.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm"><div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: s.color}}></div><div><span className="font-bold text-sm text-slate-700">{s.name}</span><p className="text-[9px] text-slate-400 font-mono">{s.segments[0].start} - {s.segments[0].end}</p></div></div><button onClick={() => store.deleteShiftType(s.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={14}/></button></div>))}</div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 mt-6"><h4 className="font-bold text-slate-800 text-sm border-b pb-2">Crear Turno</h4><input className="w-full p-2.5 border rounded-xl text-sm" placeholder="Nombre..." value={newShift.name} onChange={e=>setNewShift({...newShift, name: e.target.value})} /><div className="flex gap-4"><div className="flex-1"><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Inicio</label><input type="time" className="w-full p-2 border rounded-lg text-xs" value={newShift.start} onChange={e=>setNewShift({...newShift, start: e.target.value})}/></div><div className="flex-1"><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Fin</label><input type="time" className="w-full p-2 border rounded-lg text-xs" value={newShift.end} onChange={e=>setNewShift({...newShift, end: e.target.value})}/></div><div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Color</label><input type="color" className="h-8 w-12 border-none rounded-lg p-0 cursor-pointer" value={newShift.color} onChange={e=>setNewShift({...newShift, color: e.target.value})}/></div></div><button onClick={async () => { await store.createShiftType(newShift.name, newShift.color, newShift.start, newShift.end); setNewShift({name: '', color:'#3b82f6', start:'08:00', end:'16:30'}); }} className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Guardar</button></div>
            </div>
            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Festivos Nacionales</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">{store.config.holidays.sort((a,b) => a.date.localeCompare(b.date)).map(h => (<div key={h.id} className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex justify-between items-center group"><div><p className="text-[10px] font-black text-red-600 uppercase">{new Date(h.date).toLocaleDateString()}</p><p className="font-bold text-xs">{h.name}</p></div><button onClick={() => store.deleteHoliday(h.id)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></div>))}</div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 mt-6"><h4 className="font-bold text-slate-800 text-sm border-b pb-2">Añadir Festivo</h4><input type="date" className="w-full p-2.5 border rounded-xl text-sm" value={newHoliday.date} onChange={e=>setNewHoliday({...newHoliday, date: e.target.value})} /><input className="w-full p-2.5 border rounded-xl text-sm" placeholder="Nombre..." value={newHoliday.name} onChange={e=>setNewHoliday({...newHoliday, name: e.target.value})} /><button onClick={async () => { if(newHoliday.date && newHoliday.name) { await store.createHoliday(newHoliday.date, newHoliday.name); setNewHoliday({date:'', name:''}); } }} className="w-full py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg">Añadir</button></div>
            </div>
        </div>
    );
};

// Gestión de Comunicaciones y Configuración de Email
export const CommunicationsManager = () => {
    const [activeSection, setActiveSection] = useState<'news' | 'email'>('news');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // SMTP y Plantillas
    const [smtp, setSmtp] = useState(store.config.smtpSettings);
    const [templates, setTemplates] = useState<EmailTemplate[]>(store.config.emailTemplates);

    const handleCreatePost = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsSaving(true);
        await store.createNewsPost(title, content, store.currentUser?.id || 'admin');
        setTitle(''); setContent(''); setIsSaving(false);
    };

    const handleSaveSmtp = async () => {
        setIsSaving(true);
        await store.saveSmtpSettings(smtp);
        setIsSaving(false);
        alert('Configuración SMTP guardada.');
    };

    const handleSaveTemplates = async () => {
        setIsSaving(true);
        await store.saveEmailTemplates(templates);
        setIsSaving(false);
        alert('Plantillas de email actualizadas.');
    };

    const updateTemplate = (id: string, field: string, value: any) => {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const updateRecipients = (id: string, role: string, checked: boolean) => {
        setTemplates(prev => prev.map(t => {
            if (t.id === id) {
                return { ...t, recipients: { ...t.recipients, [role]: checked } };
            }
            return t;
        }));
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                <button onClick={() => setActiveSection('news')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeSection === 'news' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Anuncios</button>
                <button onClick={() => setActiveSection('email')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeSection === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Configuración Email</button>
            </div>

            {activeSection === 'news' ? (
                <>
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Megaphone size={20} className="text-blue-500"/> Nuevo Comunicado</h4>
                        <div className="space-y-4">
                            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título..." />
                            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-32" value={content} onChange={e => setContent(e.target.value)} placeholder="Mensaje..." />
                            <button onClick={handleCreatePost} disabled={isSaving} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg flex justify-center items-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>} Publicar</button>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><History size={20} className="text-slate-400"/> Historial</h4>
                        <div className="space-y-4">{store.config.news.map(post => (<div key={post.id} className="flex justify-between items-start p-4 bg-slate-50 rounded-2xl border border-slate-100 group"><div className="flex-1"><h5 className="font-bold text-slate-800">{post.title}</h5><p className="text-xs text-slate-500 mt-1">{post.content}</p></div><button onClick={() => store.deleteNewsPost(post.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>))}</div>
                    </div>
                </>
            ) : (
                <div className="space-y-8">
                    {/* SMTP */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2"><Server size={20} className="text-blue-500"/> Configuración SMTP</h4>
                            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl">
                                <input type="checkbox" checked={smtp.enabled} onChange={e => setSmtp({...smtp, enabled: e.target.checked})} className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-bold uppercase text-slate-600">Servicio Activo</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Host</label><input className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={smtp.host} onChange={e=>setSmtp({...smtp, host: e.target.value})}/></div>
                            <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Puerto</label><input className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={smtp.port} onChange={e=>setSmtp({...smtp, port: parseInt(e.target.value)})}/></div>
                            <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Usuario</label><input className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={smtp.user} onChange={e=>setSmtp({...smtp, user: e.target.value})}/></div>
                            <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Contraseña</label><input type="password" className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={smtp.password} onChange={e=>setSmtp({...smtp, password: e.target.value})}/></div>
                        </div>
                        <button onClick={handleSaveSmtp} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2"><Save size={14}/> Guardar Servidor</button>
                    </div>

                    {/* PLANTILLAS */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Layout size={18} className="text-indigo-500"/> Automatización de Plantillas</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {templates.map(t => (
                                <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center bg-indigo-50/50 p-3 rounded-2xl">
                                        <span className="text-xs font-black text-indigo-700 uppercase">{t.label}</span>
                                        <div className="flex gap-3">
                                            {['worker', 'supervisor', 'admin'].map(role => (
                                                <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                                                    <input type="checkbox" checked={(t.recipients as any)[role]} onChange={e => updateRecipients(t.id, role, e.target.checked)} className="w-3.5 h-3.5 rounded" />
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{role === 'worker' ? 'Emp' : role === 'supervisor' ? 'Sup' : 'Adm'}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <input className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-bold" value={t.subject} onChange={e => updateTemplate(t.id, 'subject', e.target.value)} placeholder="Asunto..." />
                                    <textarea className="w-full p-3 bg-slate-50 border rounded-xl text-xs h-32 leading-relaxed" value={t.body} onChange={e => updateTemplate(t.id, 'body', e.target.value)} placeholder="Cuerpo..." />
                                    <div className="text-[8px] text-slate-400 font-bold uppercase p-2 border border-dashed rounded-lg bg-slate-50">Variables: {'{empleado}, {tipo}, {fechas}, {motivo}, {comentario_admin}, {supervisor}, {saldo_horas}'}</div>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSaveTemplates} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><Save size={20}/> Actualizar Todas las Plantillas</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// EPIS
export const EPIManager = () => {
    const [view, setView] = useState<'catalog' | 'stock'>('catalog');
    const [editingPPE, setEditingPPE] = useState<PPEType | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [, setRefresh] = useState(0);
    useEffect(() => { const unsubscribe = store.subscribe(() => setRefresh(prev => prev + 1)); return unsubscribe; }, []);
    const handleSave = async () => {
        if (!editingPPE) return; setIsSaving(true);
        if (editingPPE.id === 'new') await store.createPPEType(editingPPE.name, editingPPE.sizes);
        else await store.updatePPEType(editingPPE.id, editingPPE.name, editingPPE.sizes);
        setEditingPPE(null); setIsSaving(false);
    };
    const handleUpdateStock = async (typeId: string, size: string, newQty: number) => {
        const type = store.config.ppeTypes.find(t => t.id === typeId);
        if (type) { const updatedStock = { ...(type.stock || {}) }; updatedStock[size] = Math.max(0, newQty); await store.updatePPEStock(typeId, updatedStock); }
    };
    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl shrink-0"><button onClick={() => setView('catalog')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'catalog' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Catálogo</button><button onClick={() => setView('stock')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'stock' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Stock</button></div>
                {view === 'catalog' && (<button onClick={() => setEditingPPE({ id: 'new', name: '', sizes: ['S', 'M', 'L', 'XL'], stock: {} })} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"><Plus size={16}/> Nuevo Material</button>)}
            </div>
            {view === 'catalog' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{store.config.ppeTypes.map(p => (<div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-20"></div><div className="flex justify-between items-start mb-4"><div className="bg-orange-50 p-2 rounded-xl text-orange-600"><HardHat size={20}/></div><div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditingPPE(p)} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 rounded-lg"><Edit2 size={16}/></button><button onClick={() => store.deletePPEType(p.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg"><Trash2 size={16}/></button></div></div><h4 className="font-bold text-slate-800 mb-4">{p.name}</h4><div className="flex flex-wrap gap-1.5">{p.sizes.map(s => (<span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-black rounded border border-slate-100">{s}</span>))}</div></div>))}</div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase"><tr><th className="px-6 py-4">Material</th><th className="px-6 py-4">Tallas y Stock</th></tr></thead><tbody className="divide-y divide-slate-50">{store.config.ppeTypes.map(p => (<tr key={p.id} className="hover:bg-slate-50/50 transition-colors"><td className="px-6 py-4 font-bold text-slate-700">{p.name}</td><td className="px-6 py-4"><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">{p.sizes.map(size => { const cur = p.stock?.[size] || 0; return (<div key={size} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex flex-col items-center"><span className="text-[10px] font-black text-slate-400 uppercase mb-2">Talla {size}</span><div className="flex items-center gap-2"><button onClick={() => handleUpdateStock(p.id, size, cur - 1)} className="p-1 text-slate-400 hover:text-red-500 bg-slate-50 rounded"><Minus size={14}/></button><span className={`w-8 text-center font-black text-lg ${cur <= 0 ? 'text-red-600' : cur < 5 ? 'text-orange-600' : 'text-green-600'}`}>{cur}</span><button onClick={() => handleUpdateStock(p.id, size, cur + 1)} className="p-1 text-slate-400 hover:text-blue-500 bg-slate-50 rounded"><Plus size={14}/></button></div></div>); })}</div></td></tr>))}</tbody></table></div>
            )}
            {editingPPE && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[130] p-4 backdrop-blur-sm"><div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-scale-in"><h3 className="text-xl font-bold text-slate-800 mb-6">{editingPPE.id === 'new' ? 'Nuevo' : 'Editar'} Material</h3><div className="space-y-6"><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Nombre</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={editingPPE.name} onChange={e => setEditingPPE({...editingPPE, name: e.target.value})} /></div><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Tallas (Separadas por comas)</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={editingPPE.sizes.join(', ')} onChange={e => setEditingPPE({...editingPPE, sizes: e.target.value.split(',').map(s => s.trim())})} placeholder="Ej: S, M, L, XL" /></div><div className="flex gap-3 pt-2"><button onClick={() => setEditingPPE(null)} className="flex-1 py-3 text-slate-500 font-bold">Cancelar</button><button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Guardar</button></div></div></div></div>
            )}
        </div>
    );
};

// Consultas
export const AbsenceQueryManager = () => {
    const [start, setStart] = useState(''); const [end, setEnd] = useState(''); const [queryMode, setQueryMode] = useState<'absences' | 'overtime'>('absences');
    const [results, setResults] = useState<any[]>([]); const [hasSearched, setHasSearched] = useState(false);
    const handleQuery = () => {
        if (!start || !end) { alert("Selecciona un rango."); return; }
        const filtered = store.requests.filter(req => {
            if (req.status !== RequestStatus.APPROVED) return false;
            if (req.typeId === RequestType.ADJUSTMENT_DAYS || req.typeId === RequestType.ADJUSTMENT_OVERTIME) return false;
            const isO = store.isOvertimeRequest(req.typeId); const isD = req.typeId === RequestType.OVERTIME_SPEND_DAYS;
            if (queryMode === 'absences') { if (isO && !isD) return false; } else { if (!isO) return false; if ((req.hours || 0) <= 0) return false; }
            const rs = req.startDate.split('T')[0]; const re = (req.endDate || req.startDate).split('T')[0];
            return rs <= end && re >= start;
        }).map(req => ({ ...req, user: store.users.find(usr => usr.id === req.userId) }));
        setResults(filtered); setHasSearched(true);
    };
    return (
        <div className="space-y-6 animate-fade-in"><div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-6 print:hidden"><div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-xl self-start"><button onClick={() => { setQueryMode('absences'); setResults([]); setHasSearched(false); }} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${queryMode === 'absences' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}><Palmtree size={14}/> Ausencias</button><button onClick={() => { setQueryMode('overtime'); setResults([]); setHasSearched(false); }} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${queryMode === 'overtime' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}><Timer size={14}/> Horas</button></div><div className="flex flex-wrap gap-4 items-end"><div className="flex-1 min-w-[200px]"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Inicio</label><input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={start} onChange={e => setStart(e.target.value)} /></div><div className="flex-1 min-w-[200px]"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Fin</label><input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={end} onChange={e => setEnd(e.target.value)} /></div><button onClick={handleQuery} className={`px-8 py-3 ${queryMode === 'absences' ? 'bg-blue-600' : 'bg-indigo-600'} text-white font-bold rounded-xl text-sm shadow-lg`}>Consultar</button></div></div>
            {hasSearched && results.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"><div className="p-6 border-b bg-slate-50"> <h4 className="font-bold">{queryMode === 'absences' ? 'Informe Ausencias' : 'Informe Horas'}</h4> </div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-[10px] font-black uppercase"><tr><th>Empleado</th><th>Tipo</th><th>Periodo</th><th>Cantidad</th></tr></thead><tbody className="divide-y divide-slate-100">{results.map(req => (<tr key={req.id}><td>{req.user?.name}</td><td>{store.getTypeLabel(req.typeId)}</td><td>{req.startDate}</td><td>{req.hours || '-'}</td></tr>))}</tbody></table></div></div>
            )}
        </div>
    );
};

// Mantenimiento
export const MaintenanceManager = () => {
    const [isRepairing, setIsRepairing] = useState(false);
    const handleRepair = async () => { if (confirm('¿Sincronizar trazabilidad?')) { setIsRepairing(true); await store.repairOvertimeIntegrity(); setIsRepairing(false); } };
    return (
        <div className="space-y-8 animate-fade-in"><div className="bg-blue-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden"><div className="absolute top-0 right-0 p-8 opacity-10"><Database size={120} /></div><h4 className="text-xl font-bold mb-4">Mantenimiento</h4><div className="flex gap-4"><button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Download size={18}/> Exportar</button><button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Upload size={18}/> Importar</button></div></div><div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><RotateCcw size={20} className="text-orange-500"/> Integridad</h4><button onClick={handleRepair} disabled={isRepairing} className="bg-orange-50 text-orange-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2">{isRepairing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18}/>} Sincronizar Horas</button></div></div>
    );
};
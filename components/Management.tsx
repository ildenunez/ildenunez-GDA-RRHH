
import React, { useState, useMemo, useEffect } from 'react';
import { User, RequestStatus, Role, LeaveRequest, RequestType, Department, EmailTemplate, DateRange, LeaveTypeConfig, NewsPost } from '../types';
import { store } from '../services/store';
import ShiftScheduler from './ShiftScheduler';
import RequestFormModal from './RequestFormModal';
import { Check, X, Users, Edit2, Shield, Trash2, AlertTriangle, Briefcase, FileText, Activity, Clock, CalendarDays, ExternalLink, UserPlus, MessageSquare, PieChart, Calendar, Filter, Paintbrush, Plus, CalendarClock, Search, CheckCircle, FileWarning, Printer, CheckSquare, Square, Lock as LockIcon, Sparkles, Loader2, Settings, List, ToggleLeft, ToggleRight, ShieldCheck, Mail, HardHat, Save, Send, XCircle, TrendingUp, UserMinus, UserCheck, CalendarPlus, Terminal, Megaphone, CalendarCheck, History } from 'lucide-react';

// --- SUB-COMPONENTS FOR ADMIN ---

const DepartmentManager: React.FC = () => {
    const [name, setName] = useState('');
    const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleSave = async () => {
        if (!name) return;
        if (editingId) await store.updateDepartment(editingId, name, selectedSupervisors);
        else await store.createDepartment(name, selectedSupervisors);
        setName(''); setSelectedSupervisors([]); setEditingId(null);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">{editingId ? 'Editar Departamento' : 'Nuevo Departamento'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="p-3 border rounded-xl" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
                    <div className="p-3 border rounded-xl max-h-40 overflow-y-auto">
                        <p className="text-xs font-bold text-slate-400 mb-2">Supervisores</p>
                        {store.users.filter(u => u.role !== Role.WORKER).map(u => (
                            <label key={u.id} className="flex items-center gap-2 text-sm p-1">
                                <input type="checkbox" checked={selectedSupervisors.includes(u.id)} onChange={e => e.target.checked ? setSelectedSupervisors([...selectedSupervisors, u.id]) : setSelectedSupervisors(selectedSupervisors.filter(id => id !== u.id))} />
                                {u.name}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold transition-colors hover:bg-blue-700">Guardar</button>
                    {editingId && <button onClick={() => {setEditingId(null); setName(''); setSelectedSupervisors([]);}} className="text-slate-500 hover:text-slate-700 font-medium">Cancelar</button>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {store.departments.map(d => (
                    <div key={d.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-all shadow-sm">
                        <div>
                            <p className="font-bold text-slate-800">{d.name}</p>
                            <p className="text-xs text-slate-500">{d.supervisorIds.length} supervisores asignados</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => {setEditingId(d.id); setName(d.name); setSelectedSupervisors(d.supervisorIds);}} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                            <button onClick={() => { if(confirm('¿Eliminar departamento?')) store.deleteDepartment(d.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ShiftConfigurator: React.FC = () => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3b82f6');
    const [start, setStart] = useState('08:00');
    const [end, setEnd] = useState('17:00');

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                    <input className="w-full p-2 border rounded-lg text-sm" placeholder="Ej: Mañana" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Color</label>
                    <input type="color" className="p-1 border rounded-lg w-full h-10 cursor-pointer" value={color} onChange={e => setColor(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Inicio</label>
                    <input type="time" className="w-full p-2 border rounded-lg text-sm" value={start} onChange={e => setStart(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fin</label>
                    <input type="time" className="w-full p-2 border rounded-lg text-sm" value={end} onChange={e => setEnd(e.target.value)} />
                </div>
                <button onClick={() => {store.createShiftType(name, color, start, end); setName('');}} className="md:col-span-4 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95">Añadir Tipo de Turno</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {store.config.shiftTypes.map(s => (
                    <div key={s.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm transition-all hover:shadow-md" style={{ borderLeft: `6px solid ${s.color}` }}>
                        <div className="text-xs">
                            <p className="font-bold text-slate-800 text-sm mb-1">{s.name}</p>
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <Clock size={12}/>
                                <span>{s.segments[0].start} - {s.segments[0].end}</span>
                            </div>
                        </div>
                        <button onClick={() => { if(confirm('¿Eliminar turno?')) store.deleteShiftType(s.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HRConfigManager: React.FC = () => {
    const [subTab, setSubTab] = useState<'types' | 'holidays' | 'shifts'>('types');
    const [typeName, setTypeName] = useState('');
    const [subtracts, setSubtracts] = useState(false);
    const [holidayDate, setHolidayDate] = useState('');
    const [holidayName, setHolidayName] = useState('');

    return (
        <div className="space-y-6">
            <div className="flex gap-6 border-b border-slate-200">
                <button onClick={() => setSubTab('types')} className={`pb-3 text-sm font-bold transition-all border-b-2 ${subTab === 'types' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Tipos Ausencia</button>
                <button onClick={() => setSubTab('holidays')} className={`pb-3 text-sm font-bold transition-all border-b-2 ${subTab === 'holidays' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Festivos</button>
                <button onClick={() => setSubTab('shifts')} className={`pb-3 text-sm font-bold transition-all border-b-2 ${subTab === 'shifts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Turnos</button>
            </div>
            {subTab === 'types' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end shadow-inner">
                        <div className="flex-1 w-full space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre del Motivo</label>
                            <input className="w-full p-2.5 border rounded-lg text-sm bg-white" placeholder="Ej: Boda Familiar" value={typeName} onChange={e => setTypeName(e.target.value)} />
                        </div>
                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer h-[42px] px-4 whitespace-nowrap">
                            <input type="checkbox" checked={subtracts} onChange={e => setSubtracts(e.target.checked)} className="w-4 h-4 rounded text-blue-600" /> Resta Vacaciones
                        </label>
                        <button onClick={() => { if(!typeName) return; store.createLeaveType(typeName, subtracts); setTypeName(''); }} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md">Añadir</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {store.config.leaveTypes.map(t => (
                            <div key={t.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm hover:border-blue-100 transition-all group">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{t.label}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{t.subtractsDays ? 'Descuenta saldo' : 'No descuenta'}</p>
                                </div>
                                <button onClick={() => { if(confirm('¿Eliminar tipo?')) store.deleteLeaveType(t.id); }} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {subTab === 'holidays' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end shadow-inner">
                        <div className="w-full md:w-48 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha</label>
                            <input type="date" className="w-full p-2.5 border rounded-lg text-sm bg-white" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} />
                        </div>
                        <div className="flex-1 w-full space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre del Festivo</label>
                            <input className="w-full p-2.5 border rounded-lg text-sm bg-white" placeholder="Ej: Navidad" value={holidayName} onChange={e => setHolidayName(e.target.value)} />
                        </div>
                        <button onClick={() => { if(!holidayDate || !holidayName) return; store.createHoliday(holidayDate, holidayName); setHolidayDate(''); setHolidayName(''); }} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md">Añadir</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {store.config.holidays.map(h => (
                            <div key={h.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm hover:border-red-100 transition-all group">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{h.name}</p>
                                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{new Date(h.date).toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => { if(confirm('¿Eliminar festivo?')) store.deleteHoliday(h.id); }} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {subTab === 'shifts' && (
                <div className="animate-fade-in">
                    <ShiftConfigurator />
                </div>
            )}
        </div>
    );
};

const PPEConfigManager: React.FC = () => {
    const [name, setName] = useState('');
    const [sizesStr, setSizesStr] = useState('');

    const handleAdd = () => {
        if (!name || !sizesStr) return;
        const sizes = sizesStr.split(',').map(s => s.trim());
        store.createPPEType(name, sizes);
        setName(''); setSizesStr('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <HardHat size={20} className="text-orange-500"/> Configurar Catálogo de EPIs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Elemento de Protección</label>
                        <input className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors" placeholder="Ej: Botas de Seguridad S3" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Tallas / Variantes</label>
                        <input className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors" placeholder="Separadas por coma: 38, 39, 40..." value={sizesStr} onChange={e => setSizesStr(e.target.value)} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={handleAdd} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
                        <Plus size={18}/> Añadir al Catálogo
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {store.config.ppeTypes.map(p => (
                    <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-start group hover:border-orange-200 shadow-sm transition-all">
                        <div className="flex-1">
                            <p className="font-bold text-slate-800 text-lg mb-1">{p.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {p.sizes.map(size => (
                                    <span key={size} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200 uppercase">{size}</span>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => { if(confirm('¿Eliminar del catálogo?')) store.deletePPEType(p.id); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                    </div>
                ))}
            </div>
        </div>
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
    const [newsPublishDate, setNewsPublishDate] = useState(''); 
    const [isScheduled, setIsScheduled] = useState(false);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            setRefresh(prev => prev + 1);
            setTempTemplates(store.config.emailTemplates);
            setSmtp(store.config.smtpSettings);
        });
        return unsubscribe;
    }, []);

    const activeTemplate = tempTemplates.find(t => t.id === selectedTemplateId) || tempTemplates[0];
    const handleTemplateChange = (field: keyof EmailTemplate, value: any) => { setTempTemplates(prev => prev.map(t => t.id === selectedTemplateId ? { ...t, [field]: value } : t)); };
    const handleRecipientChange = (role: 'worker' | 'supervisor' | 'admin', checked: boolean) => { setTempTemplates(prev => prev.map(t => t.id === selectedTemplateId ? { ...t, recipients: { ...t.recipients, [role]: checked } } : t)); };
    const saveTemplates = async () => { await store.saveEmailTemplates(tempTemplates); alert('Plantillas guardadas correctamente.'); };
    const handleSaveSmtp = async (e: React.FormEvent) => { e.preventDefault(); await store.saveSmtpSettings(smtp); alert('Configuración SMTP guardada.'); };
    const handleSendMessage = async () => { if (!msgBody) return alert('Escribe un mensaje.'); if (selectedUsers.length === 0) return alert('Selecciona destinatarios.'); await store.sendMassNotification(selectedUsers, msgBody); alert('Enviado.'); setMsgBody(''); setSelectedUsers([]); setSelectAll(false); };
    
    const handlePostNews = async () => { 
        if (!newsTitle || !newsContent) return alert('Completa título y contenido.'); 
        
        let publishAt: string | undefined = undefined;
        if (isScheduled && newsPublishDate) {
            publishAt = new Date(newsPublishDate).toISOString();
        }

        try {
            await store.createNewsPost(newsTitle, newsContent, store.currentUser!.id, publishAt); 
            alert(isScheduled ? 'Anuncio programado correctamente.' : 'Anuncio publicado en el muro.'); 
            setNewsTitle(''); 
            setNewsContent(''); 
            setNewsPublishDate('');
            setIsScheduled(false);
        } catch(e) {
            alert('Error al publicar. Revisa que la tabla "news" exista en Supabase.');
        }
    };

    const toggleUser = (id: string) => { if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter(u => u !== id)); else setSelectedUsers([...selectedUsers, id]); };
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
                    <div className="p-8 animate-fade-in flex flex-col h-full overflow-y-auto">
                        <h2 className="text-lg font-bold text-slate-800 mb-6">Publicar Anuncio en el Muro</h2>
                        <div className="space-y-4 max-w-2xl bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <div>
                                <label className="text-sm font-bold text-slate-500 uppercase block mb-1">Título del Anuncio</label>
                                <input className="w-full p-3 border rounded-xl bg-white shadow-sm" placeholder="Ej: Nueva cafetera en el office" value={newsTitle} onChange={e => setNewsTitle(e.target.value)}/>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-500 uppercase block mb-1">Contenido</label>
                                <textarea className="w-full p-3 border rounded-xl bg-white shadow-sm h-32 resize-none" placeholder="Escribe el anuncio aquí..." value={newsContent} onChange={e => setNewsContent(e.target.value)}/>
                            </div>
                            
                            <div className="pt-2">
                                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors shadow-sm">
                                    <input type="checkbox" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} className="w-5 h-5 text-blue-600 rounded"/>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-700">Programar publicación</p>
                                        <p className="text-[10px] text-slate-500">El anuncio se mostrará automáticamente en la fecha elegida.</p>
                                    </div>
                                    <CalendarCheck className={isScheduled ? 'text-blue-600' : 'text-slate-300'} size={24}/>
                                </label>
                                
                                {isScheduled && (
                                    <div className="mt-3 animate-fade-in">
                                        <label className="text-xs font-bold text-blue-600 uppercase block mb-1">Fecha y hora de publicación</label>
                                        <input 
                                            type="datetime-local" 
                                            className="w-full p-3 border border-blue-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newsPublishDate}
                                            onChange={e => setNewsPublishDate(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-2">
                                <button onClick={handlePostNews} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-100">
                                    <Megaphone size={18}/> 
                                    {isScheduled ? 'Programar Anuncio' : 'Publicar Inmediato'}
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-slate-100 pt-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                                <History size={16}/> Historial de Anuncios
                            </h3>
                            <div className="space-y-3">
                                {store.config.news.length === 0 ? (
                                    <p className="text-slate-400 italic text-sm text-center py-8">No hay anuncios registrados.</p>
                                ) : store.config.news.map(post => {
                                    const isFuture = new Date(post.publishAt) > new Date();
                                    return (
                                        <div key={post.id} className={`p-4 rounded-xl flex justify-between items-center group border transition-all ${isFuture ? 'bg-orange-50/50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800 truncate">{post.title}</p>
                                                    {isFuture && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-black uppercase rounded-full">Programado</span>}
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-1">
                                                    Pub: {new Date(post.publishAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <button onClick={() => store.deleteNewsPost(post.id)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export const Approvals: React.FC<{ user: User, onViewRequest: (req: LeaveRequest) => void }> = ({ user, onViewRequest }) => {
  const [refresh, setRefresh] = useState(0);
  useEffect(() => store.subscribe(() => setRefresh(r => r+1)), []);
  const pending = store.getPendingApprovalsForUser(user.id);
  const handleAction = async (req: LeaveRequest, status: RequestStatus) => { const message = status === RequestStatus.APPROVED ? 'Comentario (opcional):' : 'Motivo del rechazo (Obligatorio):'; const comment = prompt(message); if (comment === null) return; if (status === RequestStatus.REJECTED && !comment.trim()) { alert("Debes indicar un motivo."); return; } await store.updateRequestStatus(req.id, status, user.id, comment || undefined); };
  return (
    <div className="space-y-6 animate-fade-in"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ShieldCheck className="text-blue-600"/> Aprobaciones Pendientes</h2>{pending.length === 0 ? ( <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400"><CheckCircle size={48} className="mx-auto mb-4 opacity-20"/><p>¡Todo al día!</p></div> ) : ( <div className="grid gap-4">{pending.map(req => { const conflicts = store.getRequestConflicts(req); const hasConflict = conflicts.length > 0; return ( <div key={req.id} className={`bg-white p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-6 items-start md:items-center transition-all ${hasConflict ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-100'}`}><div className="flex-1"><div className="flex items-center gap-2 mb-2"><span className="font-bold text-lg text-slate-800">{store.users.find(u => u.id === req.userId)?.name}</span><span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">{store.departments.find(d => d.id === store.users.find(u => u.id === req.userId)?.departmentId)?.name}</span></div><div className="flex flex-wrap gap-4 text-sm text-slate-600"><div className="flex items-center gap-1 font-medium"><FileText size={16}/> {store.getTypeLabel(req.typeId)}</div><div className="flex items-center gap-1"><Calendar size={16}/> {new Date(req.startDate).toLocaleDateString()} {req.endDate && ` - ${new Date(req.endDate).toLocaleDateString()}`}</div>{req.hours && <div className="flex items-center gap-1"><Clock size={16}/> {req.hours}h</div>}</div>{hasConflict && ( <div className="mt-3 bg-red-50 text-red-700 p-2 rounded-lg text-xs flex items-start gap-2 border border-red-100 animate-pulse"><AlertTriangle size={16} className="mt-0.5 shrink-0"/><div>CONFLICTO DE DEPARTAMENTO coincide con {conflicts.length} aprobaciones.</div></div> )}</div><div className="flex gap-3"><button onClick={() => onViewRequest(req)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><ExternalLink size={20}/></button><button onClick={() => handleAction(req, RequestStatus.REJECTED)} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors">Rechazar</button><button onClick={() => handleAction(req, RequestStatus.APPROVED)} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg transition-colors">Aprobar</button></div></div> ); })}</div> )}</div>
  );
};

export const UpcomingAbsences: React.FC<{ user: User, onViewRequest: (req: LeaveRequest) => void }> = ({ user, onViewRequest }) => {
    const today = new Date().toISOString().split('T')[0];
    const teamIds = useMemo(() => { if (user.role === Role.ADMIN) return store.users.map(u => u.id); const myDepts = store.departments.filter(d => d.supervisorIds.includes(user.id)).map(d => d.id); return store.users.filter(u => myDepts.includes(u.departmentId)).map(u => u.id); }, [user]);
    const absences = store.requests.filter(r => (r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING) && !store.isOvertimeRequest(r.typeId) && (r.endDate || r.startDate) >= today && teamIds.includes(r.userId) ).sort((a,b) => a.startDate.localeCompare(b.startDate));
    const handleAction = async (e: React.MouseEvent, req: LeaveRequest, status: RequestStatus) => { e.stopPropagation(); const message = status === RequestStatus.APPROVED ? 'Comentario:' : 'Motivo del rechazo:'; const comment = prompt(message); if (comment === null) return; if (status === RequestStatus.REJECTED && !comment.trim()) { alert("Obligatorio."); return; } await store.updateRequestStatus(req.id, status, user.id, comment || undefined); };
    return (
        <div className="space-y-6 animate-fade-in print:bg-white print:p-0 print:m-0 print:w-full"><div className="flex justify-between items-center print:hidden"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><CalendarClock className="text-blue-600"/> Próximas Ausencias</h2><button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg font-bold text-slate-600 shadow-sm"><Printer size={18}/> Imprimir</button></div>{absences.length === 0 ? ( <p className="text-slate-500 italic">No hay ausencias programadas.</p> ) : ( <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"><table className="w-full text-left text-sm print:text-xs"><thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs"><tr><th className="px-6 py-4">Empleado</th><th className="px-6 py-4">Tipo</th><th className="px-6 py-4">Fechas</th><th className="px-6 py-4">Días</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 print:hidden">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{absences.map(req => { const u = store.users.find(usr => usr.id === req.userId); const start = new Date(req.startDate); const end = new Date(req.endDate || req.startDate); const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1; return ( <tr key={req.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onViewRequest(req)}><td className="px-6 py-4"><div className="font-bold text-slate-700">{u?.name}</div></td><td className="px-6 py-4">{store.getTypeLabel(req.typeId)}</td><td className="px-6 py-4 text-slate-500">{start.toLocaleDateString()} - {end.toLocaleDateString()}</td><td className="px-6 py-4 font-mono font-bold text-blue-600">{diff}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{req.status}</span></td><td className="px-6 py-4 print:hidden" onClick={e => e.stopPropagation()}><div className="flex gap-2">{req.status === RequestStatus.PENDING && ( <button onClick={(e) => handleAction(e, req, RequestStatus.APPROVED)} className="p-1.5 bg-green-50 text-green-600 rounded border border-green-200"><Check size={16}/></button> )}<button onClick={(e) => handleAction(e, req, RequestStatus.REJECTED)} className="p-1.5 bg-red-50 text-red-600 rounded border border-red-200"><X size={16}/></button></div></td></tr> ) })}</tbody></table></div> )}</div>
    );
};

export const UserManagement: React.FC<{ currentUser: User, onViewRequest: (req: LeaveRequest) => void }> = ({ currentUser, onViewRequest }) => {
    const [viewMode, setViewMode] = useState<'list' | 'shifts'>('list');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [editingUser, setEditingUser] = useState<Partial<User>>({});
    const [newPass, setNewPass] = useState('');
    const [adjustmentDays, setAdjustmentDays] = useState<number>(0);
    const [adjustmentReasonDays, setAdjustmentReasonDays] = useState('');
    const [adjustmentHours, setAdjustmentHours] = useState<number>(0);
    const [adjustmentReasonHours, setAdjustmentReasonHours] = useState('');
    const [modalActionUser, setModalActionUser] = useState<User | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [refreshTick, setRefreshTick] = useState(0);
    const [loading, setLoading] = useState(false);
    const users = useMemo(() => { let filtered = store.users; if (currentUser.role !== Role.ADMIN) { const myDepts = store.departments.filter(d => d.supervisorIds.includes(currentUser.id)).map(d => d.id); filtered = filtered.filter(u => myDepts.includes(u.departmentId)); } if (filterDept) filtered = filtered.filter(u => u.departmentId === filterDept); if (searchTerm) filtered = filtered.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())); return filtered.sort((a, b) => a.name.localeCompare(b.name)); }, [currentUser, searchTerm, filterDept, refreshTick]);
    const handleSaveUser = async (e: React.FormEvent) => { e.preventDefault(); if (editingUser.id) { await store.updateUserAdmin(editingUser.id, editingUser); if(newPass) await store.updateUserProfile(editingUser.id, { ...editingUser as any, password: newPass }); if (adjustmentDays !== 0) { await store.createRequest({ typeId: RequestType.ADJUSTMENT_DAYS, label: 'Regularización Días', startDate: new Date().toISOString(), hours: adjustmentDays, reason: adjustmentReasonDays || 'Ajuste manual Admin' }, editingUser.id, RequestStatus.APPROVED); } if (adjustmentHours !== 0) { await store.createRequest({ typeId: RequestType.ADJUSTMENT_OVERTIME, label: 'Regularización Horas', startDate: new Date().toISOString(), hours: adjustmentHours, reason: adjustmentReasonHours || 'Ajuste manual Admin' }, editingUser.id, RequestStatus.APPROVED); } } else await store.createUser(editingUser, newPass); setIsUserModalOpen(false); setRefreshTick(t => t + 1); };
    const isAdmin = currentUser.role === Role.ADMIN;
    const resetModalState = (user?: User) => { setEditingUser(user || {}); setNewPass(''); setAdjustmentDays(0); setAdjustmentReasonDays(''); setAdjustmentHours(0); setAdjustmentReasonHours(''); setIsUserModalOpen(true); };
    return (
        <div className="space-y-6"><div className="flex flex-col md:flex-row justify-between items-center gap-4"><div className="flex bg-slate-100 p-1 rounded-xl"><button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Listado</button><button onClick={() => setViewMode('shifts')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'shifts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Planificación</button></div><div className="flex gap-2 w-full md:w-auto"><div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4"/><input className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>{isAdmin && <button onClick={() => resetModalState()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg whitespace-nowrap"><UserPlus size={18}/> Nuevo</button>}</div></div>
            {viewMode === 'shifts' ? <ShiftScheduler users={users} /> : ( <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs"><tr><th className="px-6 py-4">Empleado</th><th className="px-6 py-4">Departamento</th><th className="px-6 py-4">Rol</th><th className="px-6 py-4 text-center">Saldo Días</th><th className="px-6 py-4 text-center">Saldo Horas</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map(u => ( <tr key={u.id} className="hover:bg-slate-50"><td className="px-6 py-4 flex items-center gap-3"><img src={u.avatar} className="w-8 h-8 rounded-full bg-slate-200"/><div><div className="font-bold text-slate-800">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></div></td><td className="px-6 py-4">{store.departments.find(d => d.id === u.departmentId)?.name || '-'}</td><td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{u.role}</span></td><td className="px-6 py-4 text-center font-bold text-slate-700">{u.daysAvailable.toFixed(1)}</td><td className="px-6 py-4 text-center font-bold text-blue-600">{u.overtimeHours}h</td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2">{isAdmin ? ( <><button onClick={() => resetModalState(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded bg-blue-50/50"><Settings size={16}/></button><button onClick={() => { if(confirm('¿Eliminar?')) store.deleteUser(u.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button></> ) : ( <button onClick={() => { setModalActionUser(u); setIsActionModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded"><Settings size={16}/></button> )}</div></td></tr> ))}</tbody></table></div> )}
            {isUserModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm overflow-y-auto"><div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl animate-scale-in my-4 flex flex-col max-h-[90vh]"><div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0"><h3 className="text-xl font-bold text-slate-800">{editingUser.id ? `Ficha: ${editingUser.name}` : 'Nuevo Usuario'}</h3><button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={24}/></button></div><div className="p-8 overflow-y-auto flex-1 bg-slate-50/50"><form id="userForm" onSubmit={handleSaveUser} className="space-y-8"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label><input required className="w-full p-3 border border-slate-200 rounded-xl" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})}/></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label><input type="email" required className="w-full p-3 border border-slate-200 rounded-xl" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})}/></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Departamento</label><select className="w-full p-3 border border-slate-200 rounded-xl" value={editingUser.departmentId || ''} onChange={e => setEditingUser({...editingUser, departmentId: e.target.value})}>{store.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Nacimiento</label><input type="date" className="w-full p-3 border border-slate-200 rounded-xl" value={editingUser.birthdate || ''} onChange={e => setEditingUser({...editingUser, birthdate: e.target.value})}/></div><div className="flex gap-4"><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol</label><select className="w-full p-3 border border-slate-200 rounded-xl" value={editingUser.role || Role.WORKER} onChange={e => setEditingUser({...editingUser, role: e.target.value as Role})}><option value={Role.WORKER}>Trabajador</option><option value={Role.SUPERVISOR}>Supervisor</option><option value={Role.ADMIN}>Admin</option></select></div><div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pass {editingUser.id && '(Opcional)'}</label><input type="password" className="w-full p-3 border border-slate-200 rounded-xl" placeholder="******" value={newPass} onChange={e => setNewPass(e.target.value)}/></div></div></div>{editingUser.id && ( <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><FileText className="text-orange-500" size={18}/> Ajustes de Saldo</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100"><div className="flex justify-between items-center mb-4"><span className="text-xs font-bold uppercase">Días</span><span className="text-3xl font-black text-orange-600">{editingUser.daysAvailable}</span></div><div className="flex gap-2"><input type="number" step="0.5" className="w-20 p-2 text-center border rounded-lg" value={adjustmentDays} onChange={e => setAdjustmentDays(parseFloat(e.target.value))}/><input type="text" placeholder="Motivo..." className="flex-1 p-2 text-sm border rounded-lg" value={adjustmentReasonDays} onChange={e => setAdjustmentReasonDays(e.target.value)}/></div></div><div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100"><div className="flex justify-between items-center mb-4"><span className="text-xs font-bold uppercase">Horas</span><span className="text-3xl font-black text-blue-600">{editingUser.overtimeHours}h</span></div><div className="flex gap-2"><input type="number" step="0.5" className="w-20 p-2 text-center border rounded-lg" value={adjustmentHours} onChange={e => setAdjustmentHours(parseFloat(e.target.value))}/><input type="text" placeholder="Motivo..." className="flex-1 p-2 text-sm border rounded-lg" value={adjustmentReasonHours} onChange={e => setAdjustmentReasonHours(e.target.value)}/></div></div></div></div> )}</form></div><div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0"><button type="button" onClick={() => setIsUserModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all">Cancelar</button><button form="userForm" type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-all flex items-center gap-2">{editingUser.id ? 'Guardar' : 'Crear'}</button></div></div></div>
            )}
            {isActionModalOpen && modalActionUser && <RequestFormModal user={currentUser} targetUser={modalActionUser} onClose={() => { setIsActionModalOpen(false); setModalActionUser(null); setRefreshTick(t=>t+1); }} />}
        </div>
    );
};

export const AdminSettings: React.FC<{ onViewRequest: (req: LeaveRequest) => void }> = ({ onViewRequest }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'depts' | 'config' | 'epis' | 'comms'>('users');
    const adminUser: User = { id: 'admin_sys', name: 'Admin', email: '', role: Role.ADMIN, departmentId: '', daysAvailable: 0, overtimeHours: 0 };
    const totalEmployees = store.users.length;
    const today = new Date().toISOString().split('T')[0];
    const absentCount = store.users.filter(u => store.requests.some(req => req.userId === u.id && req.status === RequestStatus.APPROVED && !store.isOvertimeRequest(req.typeId) && today >= req.startDate.split('T')[0] && today <= (req.endDate ? req.endDate.split('T')[0] : req.startDate.split('T')[0]) )).length;
    const activePercent = totalEmployees > 0 ? Math.round(((totalEmployees - absentCount) / totalEmployees) * 100) : 0;
    return (
        <div className="space-y-6 animate-fade-in"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><Settings className="text-slate-400"/> Administración</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2"><div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24}/></div><div><p className="text-sm font-bold text-slate-500 uppercase">Total</p><p className="text-2xl font-black text-slate-800">{totalEmployees}</p></div></div><div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center gap-4 relative overflow-hidden"><div className="p-3 bg-green-50 text-green-600 rounded-lg"><UserCheck size={24}/></div><div><p className="text-sm font-bold text-slate-500 uppercase">Activos</p><p className="text-2xl font-black text-slate-800">{totalEmployees - absentCount}</p></div><div className="absolute bottom-0 left-0 h-1 bg-green-500" style={{ width: `${activePercent}%` }}></div></div><div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center gap-4 relative overflow-hidden"><div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><UserMinus size={24}/></div><div><p className="text-sm font-bold text-slate-500 uppercase">Ausentes</p><p className="text-2xl font-black text-slate-800">{absentCount}</p></div><div className="absolute bottom-0 left-0 h-1 bg-orange-500" style={{ width: `${100-activePercent}%` }}></div></div></div><div className="bg-white rounded-t-2xl border-b border-slate-200 px-6 pt-4 flex gap-6 overflow-x-auto">{[{id: 'users', label: 'Usuarios'},{id: 'depts', label: 'Dptos'},{id: 'config', label: 'RRHH'},{id: 'epis', label: 'EPIs'},{id: 'comms', label: 'Comunicaciones'}].map(tab => ( <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{tab.label}</button> ))}</div><div className="bg-transparent min-h-[500px]">{activeTab === 'users' && <UserManagement currentUser={adminUser} onViewRequest={onViewRequest} />}{activeTab === 'depts' && <DepartmentManager />}{activeTab === 'config' && <HRConfigManager />}{activeTab === 'epis' && <PPEConfigManager />}{activeTab === 'comms' && <CommunicationsManager />}</div></div>
    );
};

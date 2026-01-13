import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { 
    BarChart2, Activity, Target, Palmtree, Users, Settings, Plus, Trash2, Database, Download, Upload, Info, ShieldCheck, Mail, Megaphone, Server, Layout, Edit2, RotateCcw, Send, Lock, Loader2, Search, Save, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Role, RequestStatus, RequestType, EmailTemplate, Department, Holiday, ShiftType } from '../types';

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
    const [name, setName] = useState('');
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center"><h3 className="font-bold text-slate-800">Departamentos de la Empresa</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {store.departments.map(d => (
                    <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group">
                        <div><h4 className="font-bold text-slate-700">{d.name}</h4><p className="text-[10px] text-slate-400 font-bold uppercase">{store.users.filter(u => u.departmentId === d.id).length} Empleados</p></div>
                        <button className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Configuración RRHH (Tipos de Ausencia, Festivos, etc.)
export const HRConfigManager = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Tipos de Ausencia</h3>
                {store.config.leaveTypes.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                        <span className="font-bold text-sm text-slate-700">{t.label}</span>
                        <Settings size={14} className="text-slate-300"/>
                    </div>
                ))}
            </div>
            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Festivos Nacionales</h3>
                {store.config.holidays.slice(0,5).map(h => (
                    <div key={h.id} className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex justify-between items-center">
                        <div><p className="text-[10px] font-black text-red-600 uppercase">{new Date(h.date).toLocaleDateString()}</p><p className="font-bold text-xs">{h.name}</p></div>
                    </div>
                ))}
            </div>
            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Turnos de Trabajo</h3>
                {store.config.shiftTypes.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}}></div>
                        <span className="font-bold text-sm text-slate-700">{s.name}</span>
                    </div>
                ))}
            </div>
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

    useEffect(() => {
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

    return (
        <div className="max-w-2xl space-y-8 animate-fade-in">
            {/* Sección SMTP */}
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
            </div>

            {/* Listado de Plantillas */}
            <div className="space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 px-2"><Mail className="text-blue-500"/> Plantillas de Notificación</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.length === 0 ? (
                        <div className="col-span-2 p-8 text-center bg-slate-50 border border-dashed rounded-2xl text-slate-400 italic">No hay plantillas configuradas.</div>
                    ) : templates.map(t => (
                        <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start group hover:shadow-md transition-all">
                            <div>
                                <h4 className="font-bold text-slate-800">{t.label}</h4>
                                <p className="text-[10px] text-slate-400 italic font-medium line-clamp-1">"{t.subject}"</p>
                            </div>
                            <button onClick={() => setEditingTemplate(t)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors bg-slate-50 rounded-lg"><Edit2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Simple para Editar Plantilla */}
            {editingTemplate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[130] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Editar Plantilla</h3>
                            <button onClick={() => setEditingTemplate(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Etiqueta Identificativa</label>
                                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={editingTemplate.label} readOnly />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Asunto del Email</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={editingTemplate.subject} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Cuerpo del Mensaje (HTML compatible)</label>
                                <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm h-32" value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})} />
                                <p className="text-[9px] text-slate-400 mt-2 italic px-1">Usa variables como {'{empleado}'}, {'{tipo}'}, {'{fechas}'}</p>
                            </div>
                            <button 
                                onClick={handleUpdateTemplate}
                                disabled={isSavingTemplates}
                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all flex justify-center items-center gap-2"
                            >
                                {isSavingTemplates ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Actualizar Plantilla
                            </button>
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

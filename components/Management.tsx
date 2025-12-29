
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, 
  Calendar, 
  CalendarDays, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle, 
  CalendarClock, 
  Printer, 
  Check, 
  X, 
  Users, 
  Plus, 
  User as UserIcon, 
  PieChart, 
  Edit2, 
  Trash2, 
  Loader2, 
  Save, 
  UserPlus, 
  Search, 
  Settings, 
  Palmtree, 
  TrendingUp,
  History,
  CalendarCheck,
  Camera,
  Briefcase,
  Mail,
  Megaphone,
  BellRing,
  Info,
  Layers,
  Server,
  Layout,
  Type as TypeIcon,
  PlusCircle,
  ChevronRight,
  ChevronDown,
  Filter,
  Bold,
  Italic,
  Underline,
  Link,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Eye,
  Eraser,
  List,
  SearchCode
} from 'lucide-react';
import { store } from '../services/store';
import { User, Role, LeaveRequest, RequestStatus, RequestType, Department, Holiday, PPEType, ShiftType, EmailTemplate, DateRange, ShiftSegment } from '../types';
import RequestFormModal from './RequestFormModal';
import ShiftScheduler from './ShiftScheduler';

const LOGO_URL = "https://termosycalentadoresgranada.com/wp-content/uploads/2025/08/https___cdn.evbuc_.com_images_677236879_73808960223_1_original.png";

const HtmlEditor: React.FC<{ value: string, onChange: (val: string) => void }> = ({ value, onChange }) => {
    const [mode, setMode] = useState<'visual' | 'code'>('visual');
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mode === 'visual' && editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [mode, value]);

    const execCommand = (command: string, value: string = '') => {
        document.execCommand(command, false, value);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    const handleInput = () => {
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    const insertLogo = () => {
        const html = `<img src="${LOGO_URL}" alt="Logo" style="max-width: 150px; height: auto; display: block; margin: 10px 0;">`;
        execCommand('insertHTML', html);
    };

    const insertLink = () => {
        const url = prompt('Introduce la URL:');
        if (url) execCommand('createLink', url);
    };

    const ToolbarButton = ({ onClick, icon: Icon, title }: any) => (
        <button type="button" onClick={onClick} title={title} className="p-1.5 hover:bg-white hover:text-blue-600 rounded transition-colors text-slate-500">
            <Icon size={16} />
        </button>
    );

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 p-1 flex flex-wrap gap-1 items-center">
                <div className="flex gap-0.5 border-r border-slate-200 pr-1 mr-1">
                    <button 
                        type="button"
                        onClick={() => setMode('visual')}
                        className={`px-3 py-1 text-[10px] font-bold rounded flex items-center gap-1.5 ${mode === 'visual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        <Eye size={12}/> Visual
                    </button>
                    <button 
                        type="button"
                        onClick={() => setMode('code')}
                        className={`px-3 py-1 text-[10px] font-bold rounded flex items-center gap-1.5 ${mode === 'code' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        <Code size={12}/> Código
                    </button>
                </div>

                {mode === 'visual' && (
                    <>
                        <div className="flex gap-0.5 border-r border-slate-200 pr-1 mr-1">
                            <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} title="Negrita" />
                            <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} title="Cursiva" />
                            <ToolbarButton onClick={() => execCommand('underline')} icon={Underline} title="Subrayado" />
                        </div>
                        <div className="flex gap-0.5 border-r border-slate-200 pr-1 mr-1">
                            <ToolbarButton onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title="Izquierda" />
                            <ToolbarButton onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title="Centro" />
                            <ToolbarButton onClick={() => execCommand('justifyRight')} icon={AlignRight} title="Derecha" />
                        </div>
                        <div className="flex gap-0.5 border-r border-slate-200 pr-1 mr-1">
                            <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} title="Lista" />
                            <ToolbarButton onClick={insertLink} icon={Link} title="Enlace" />
                            <ToolbarButton onClick={insertLogo} icon={ImageIcon} title="Insertar Logo" />
                        </div>
                        <ToolbarButton onClick={() => execCommand('removeFormat')} icon={Eraser} title="Limpiar Formato" />
                    </>
                )}
            </div>

            <div className="relative">
                {mode === 'visual' ? (
                    <div 
                        ref={editorRef}
                        contentEditable
                        onInput={handleInput}
                        className="p-4 xl:p-3 min-h-[250px] xl:min-h-[200px] max-h-[500px] overflow-y-auto focus:outline-none text-sm leading-relaxed prose prose-sm max-w-none"
                    />
                ) : (
                    <textarea 
                        className="w-full p-4 xl:p-3 min-h-[250px] xl:min-h-[200px] font-mono text-[11px] focus:outline-none border-none resize-none bg-slate-900 text-blue-400"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    />
                )}
            </div>
            <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Usa {'{empleado}'}, {'{tipo}'}, {'{fechas}'} para autocompletar</span>
            </div>
        </div>
    );
};

const AbsenceQueryManager = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const userStats = useMemo(() => {
        if (!startDate || !endDate) return [];
        
        const summary: Record<string, { userId: string, totalDays: number, types: Set<string> }> = {};

        store.requests.forEach(r => {
            // Solo ausencias reales aprobadas.
            // Una ausencia física es cualquier LeaveType que no sea overtime, 
            // O el canje de horas (ya que el empleado no viene a trabajar), 
            // siempre que no sea un ajuste administrativo de saldo.
            const isCanje = r.typeId === RequestType.OVERTIME_SPEND_DAYS || store.getTypeLabel(r.typeId).toLowerCase().includes('canje');
            const isPhysicalAbsence = (!store.isOvertimeRequest(r.typeId) || isCanje) && r.typeId !== RequestType.ADJUSTMENT_DAYS && r.typeId !== RequestType.ADJUSTMENT_OVERTIME;
            
            if (!isPhysicalAbsence || r.status !== RequestStatus.APPROVED) return;

            const reqStartStr = r.startDate.split('T')[0];
            const reqEndStr = (r.endDate || r.startDate).split('T')[0];

            // Verificar solapamiento con el rango seleccionado
            if (reqStartStr <= endDate && reqEndStr >= startDate) {
                // Calcular días efectivos dentro del rango
                const effectiveStart = reqStartStr > startDate ? reqStartStr : startDate;
                const effectiveEnd = reqEndStr < endDate ? reqEndStr : endDate;
                
                const s = new Date(effectiveStart);
                const e = new Date(effectiveEnd);
                const diffTime = Math.max(0, e.getTime() - s.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                if (!summary[r.userId]) {
                    summary[r.userId] = { userId: r.userId, totalDays: 0, types: new Set() };
                }
                summary[r.userId].totalDays += diffDays;
                summary[r.userId].types.add(store.getTypeLabel(r.typeId));
            }
        });

        return Object.values(summary).sort((a, b) => b.totalDays - a.totalDays);
    }, [startDate, endDate, store.requests]);

    return (
        <div className="space-y-6 animate-fade-in xl:space-y-4">
            <div className="bg-slate-50 p-6 xl:p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-end shadow-sm">
                <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha Inicio Rango</label>
                    <input type="date" className="w-full p-2.5 xl:p-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha Fin Rango</label>
                    <input type="date" className="w-full p-2.5 xl:p-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                            <tr>
                                <th className="px-6 py-4 xl:py-3 border-b">Empleado</th>
                                <th className="px-6 py-4 xl:py-3 border-b">Tipos Detectados</th>
                                <th className="px-6 py-4 xl:py-3 text-center border-b">Total Días en Rango</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {userStats.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                                        {(!startDate || !endDate) ? 'Define un rango de fechas para realizar la consulta' : 'No se encontraron ausencias aprobadas en este periodo'}
                                    </td>
                                </tr>
                            ) : userStats.map(stat => {
                                const u = store.users.find(usr => usr.id === stat.userId);
                                return (
                                    <tr key={stat.userId} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 xl:py-3">
                                            <div className="font-bold text-slate-700">{u?.name || 'Desconocido'}</div>
                                            <div className="text-[10px] text-slate-400 uppercase">{store.departments.find(d => d.id === u?.departmentId)?.name || 'Sin Dpto.'}</div>
                                        </td>
                                        <td className="px-6 py-4 xl:py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {Array.from(stat.types).map(type => (
                                                    <span key={type} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">{type}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 xl:py-3 text-center">
                                            <span className="text-lg font-black text-blue-600">{stat.totalDays}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Días</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const DepartmentManager = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [name, setName] = useState('');
    const [supervisors, setSupervisors] = useState<string[]>([]);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        if (editingDept) {
            setName(editingDept.name);
            setSupervisors(editingDept.supervisorIds || []);
        } else {
            setName('');
            setSupervisors([]);
        }
    }, [editingDept, showModal]);

    const handleSave = async () => {
        if (!name.trim()) return;
        if (editingDept) await store.updateDepartment(editingDept.id, name, supervisors);
        else await store.createDepartment(name, supervisors);
        setShowModal(false); setRefresh(r => r + 1);
    };

    const toggleSupervisor = (userId: string) => {
        setSupervisors(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    return (
        <div className="space-y-6 animate-fade-in xl:space-y-4">
            <div className="flex justify-between items-center mb-6 xl:mb-4">
                <h3 className="text-xl xl:text-lg font-bold text-slate-800">Departamentos</h3>
                <button onClick={() => { setEditingDept(null); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 xl:py-1.5 rounded-lg font-bold text-sm xl:text-xs shadow-sm hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={18}/> Nuevo
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-4">
                {store.departments.map(d => (
                    <div key={d.id} className="bg-white border border-slate-100 p-6 xl:p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group flex justify-between items-start">
                        <div><h4 className="font-bold text-slate-800 text-lg xl:text-base">{d.name}</h4><p className="text-sm xl:text-xs text-slate-400 mt-1">{store.users.filter(u => u.departmentId === d.id).length} empleados</p></div>
                        <div className="flex gap-1">
                            <button onClick={() => { setEditingDept(d); setShowModal(true); }} className="p-2 xl:p-1.5 text-blue-400 hover:text-blue-600 transition-colors"><Settings size={18}/></button>
                            <button onClick={() => { if(confirm('¿Eliminar dpto?')) store.deleteDepartment(d.id); setRefresh(r=>r+1); }} className="p-2 xl:p-1.5 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 xl:p-6 animate-scale-in">
                        <h3 className="text-2xl xl:text-xl font-bold text-slate-800 mb-6 xl:mb-4">{editingDept ? 'Editar' : 'Nuevo'} Departamento</h3>
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre</label><input className="w-full p-3 xl:p-2.5 border rounded-xl bg-slate-50 text-sm" value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Logística" /></div>
                            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Responsables</label><div className="max-h-60 overflow-y-auto border rounded-xl p-2 space-y-1 bg-slate-50">
                                    {store.users.filter(u => u.role !== Role.WORKER).map(u => (
                                        <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"><input type="checkbox" checked={supervisors.includes(u.id)} onChange={()=>toggleSupervisor(u.id)} className="w-4 h-4 text-blue-600 rounded" /><span className="text-sm font-medium text-slate-700">{u.name}</span></label>
                                    ))}
                            </div></div>
                        </div>
                        <div className="flex gap-3 mt-8 xl:mt-6">
                            <button onClick={()=>setShowModal(false)} className="flex-1 py-3 xl:py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl text-sm">Cancelar</button>
                            <button onClick={handleSave} className="flex-1 py-3 xl:py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 text-sm">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const HRConfigManager = () => {
    const [refresh, setRefresh] = useState(0);
    const [editingType, setEditingType] = useState<any>(null);
    const [typeLabel, setTypeLabel] = useState('');
    const [typeSubtracts, setTypeSubtracts] = useState(false);
    const [typeRanges, setTypeRanges] = useState<DateRange[]>([]);
    const [showRangeForm, setShowRangeForm] = useState(false);
    const [newRangeLabel, setNewRangeLabel] = useState('');
    const [newRangeStart, setNewRangeStart] = useState('');
    const [newRangeEnd, setNewRangeEnd] = useState('');
    const [editingShift, setEditingShift] = useState<ShiftType | null>(null);
    const [shiftName, setShiftName] = useState('');
    const [shiftColor, setShiftColor] = useState('#3b82f6');
    const [shiftSegments, setShiftSegments] = useState<ShiftSegment[]>([]);
    const [newSegStart, setNewSegStart] = useState('');
    const [newSegEnd, setNewSegEnd] = useState('');
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [hDate, setHDate] = useState('');
    const [hName, setHName] = useState('');

    useEffect(() => {
        if (editingType) {
            setTypeLabel(editingType.label); setTypeSubtracts(editingType.subtractsDays); setTypeRanges(editingType.fixedRanges || []); setShowRangeForm(!!editingType.fixedRanges && editingType.fixedRanges.length > 0);
        } else { setTypeLabel(''); setTypeSubtracts(false); setTypeRanges([]); setShowRangeForm(false); }
    }, [editingType]);

    useEffect(() => {
        if (editingShift) { setShiftName(editingShift.name); setShiftColor(editingShift.color); setShiftSegments(editingShift.segments || []); } 
        else { setShiftName(''); setShiftColor('#3b82f6'); setShiftSegments([]); }
    }, [editingShift]);

    useEffect(() => {
        if (editingHoliday) { setHDate(editingHoliday.date); setHName(editingHoliday.name); } 
        else { setHDate(''); setHName(''); }
    }, [editingHoliday]);

    const handleSaveType = async () => {
        if (!typeLabel.trim()) return;
        if (editingType) await store.updateLeaveType(editingType.id, typeLabel, typeSubtracts, typeRanges.length > 0 ? typeRanges : null);
        else await store.createLeaveType(typeLabel, typeSubtracts, typeRanges.length > 0 ? typeRanges : null);
        setEditingType(null); setRefresh(r => r + 1);
    };

    const handleSaveShift = async () => {
        if (!shiftName.trim() || shiftSegments.length === 0) return;
        if (editingShift) await store.updateShiftType(editingShift.id, shiftName, shiftColor, shiftSegments[0].start, shiftSegments[0].end);
        else await store.createShiftType(shiftName, shiftColor, shiftSegments[0].start, shiftSegments[0].end);
        setEditingShift(null); setShiftName(''); setShiftSegments([]); setRefresh(r => r + 1);
    };

    const handleSaveHoliday = async () => {
        if (!hDate || !hName) return;
        if (editingHoliday) await store.updateHoliday(editingHoliday.id, hDate, hName);
        else await store.createHoliday(hDate, hName);
        setEditingHoliday(null); setHDate(''); setHName(''); setRefresh(r => r + 1);
    };

    const addRange = () => {
        if (!newRangeStart || !newRangeEnd) return;
        setTypeRanges([...typeRanges, { startDate: newRangeStart, endDate: newRangeEnd, label: newRangeLabel || `Rango ${typeRanges.length + 1}` }]);
        setNewRangeLabel(''); setNewRangeStart(''); setNewRangeEnd('');
    };

    const addShiftSegment = () => {
        if (!newSegStart || !newSegEnd) return;
        setShiftSegments([...shiftSegments, { start: newSegStart, end: newSegEnd }]);
        setNewSegStart(''); setNewSegEnd('');
    };

    const calculateDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const s = new Date(start); const e = new Date(end);
        return Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    const formatDate = (d: string) => {
        if (!d) return '-'; const date = new Date(d);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-5 animate-fade-in">
            <div className="space-y-6 xl:space-y-4">
                <h3 className="text-sm xl:text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Tipos de Ausencia</h3>
                <div className="space-y-2 xl:space-y-1.5">
                    {store.config.leaveTypes.map(t => (
                        <div key={t.id} className="bg-white border border-slate-200 p-4 xl:p-3 rounded-xl shadow-sm flex justify-between items-center group">
                            <div><p className="font-bold text-slate-800 text-sm xl:text-xs">{t.label}</p><p className="text-[10px] xl:text-[9px] text-slate-400 font-bold uppercase">{t.subtractsDays ? 'Resta Días' : 'No Resta'}{t.fixedRanges ? ` • ${t.fixedRanges.length} Rangos` : ''}</p></div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingType(t)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                                <button onClick={() => {if(confirm('¿Eliminar?')) store.deleteLeaveType(t.id); setRefresh(r=>r+1);}} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 xl:p-4 space-y-5 xl:space-y-4 shadow-sm">
                    <p className="text-xs xl:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{editingType ? 'EDITAR TIPO' : 'CREAR TIPO'}</p>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre</label><input className="w-full p-2.5 xl:p-2 border-2 border-slate-900 rounded-xl font-medium text-sm focus:ring-0" placeholder="Ej: Invierno 2026" value={typeLabel} onChange={e=>setTypeLabel(e.target.value)} /></div>
                    <div className="space-y-3 xl:space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" checked={typeSubtracts} onChange={e=>setTypeSubtracts(e.target.checked)} className="w-4 h-4 rounded text-blue-600 border-slate-300" /> Resta días</label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" checked={showRangeForm} onChange={e=>setShowRangeForm(e.target.checked)} className="w-4 h-4 rounded text-blue-600 border-slate-300" /> Fechas Fijas / Turnos</label>
                    </div>
                    {showRangeForm && (
                        <div className="pt-4 border-t border-slate-100 space-y-4 xl:space-y-3">
                             <p className="text-[11px] xl:text-[10px] font-bold text-slate-400 uppercase tracking-widest">FRANJAS VACACIONALES</p>
                             <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                                <table className="w-full text-[10px] xl:text-[9px] text-left">
                                    <thead className="bg-white text-slate-400 font-bold border-b border-slate-100"><tr className="uppercase"><th className="px-3 py-2">Nombre</th><th className="px-3 py-2 text-center">Rango</th><th className="px-3 py-2 text-right">Acciones</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {typeRanges.map((range, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-3 py-2"><p className="font-bold text-slate-800">{range.label}</p><p className="text-blue-600 font-bold">{calculateDays(range.startDate, range.endDate)} días</p></td>
                                                <td className="px-3 py-2 text-center text-slate-500 font-medium">{formatDate(range.startDate)} al<br/>{formatDate(range.endDate)}</td>
                                                <td className="px-3 py-2 text-right"><div className="flex justify-end gap-1"><button onClick={()=>{}} className="p-1 text-blue-400 border border-blue-100 rounded hover:bg-blue-50"><Edit2 size={10}/></button><button onClick={()=>setTypeRanges(typeRanges.filter((_,i)=>i!==idx))} className="p-1 text-red-400 border border-red-100 rounded hover:bg-red-50"><X size={10}/></button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                             <div className="bg-slate-50 p-4 xl:p-3 rounded-xl border border-slate-100 space-y-3 xl:space-y-2">
                                <p className="text-[9px] font-bold text-slate-400 uppercase">NUEVA FRANJA</p>
                                <input className="w-full p-2 text-xs border rounded-lg bg-white" placeholder="Ej: Turno A" value={newRangeLabel} onChange={e=>setNewRangeLabel(e.target.value)} />
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-[8px] font-bold text-slate-400 uppercase block">INICIO</label><input type="date" className="w-full p-1.5 text-xs border rounded-lg bg-white" value={newRangeStart} onChange={e=>setNewRangeStart(e.target.value)} /></div>
                                    <div><label className="text-[8px] font-bold text-slate-400 uppercase block">FIN</label><input type="date" className="w-full p-1.5 text-xs border rounded-lg bg-white" value={newRangeEnd} onChange={e=>setNewRangeEnd(e.target.value)} /></div>
                                </div>
                                <button onClick={addRange} className="w-full py-2 bg-slate-400 text-white font-bold rounded-lg text-[10px] hover:bg-slate-500">+ Añadir</button>
                             </div>
                        </div>
                    )}
                    <button onClick={handleSaveType} className="w-full py-3.5 xl:py-3 bg-slate-900 text-white font-bold rounded-xl text-sm xl:text-xs hover:bg-black shadow-lg shadow-slate-200 transition-all">{editingType ? 'Guardar' : 'Crear Tipo'}</button>
                </div>
            </div>

            <div className="space-y-6 xl:space-y-4">
                <h3 className="text-sm xl:text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Tipos de Turno</h3>
                <div className="space-y-2 xl:space-y-1.5">
                    {store.config.shiftTypes.map(s => (
                        <div key={s.id} className="bg-white border border-slate-200 p-4 xl:p-3 rounded-xl shadow-sm flex items-center gap-4 group">
                            <div className="w-1.5 h-8 rounded-full" style={{backgroundColor: s.color}}></div>
                            <div className="flex-1 min-w-0"><p className="font-bold text-slate-800 text-sm xl:text-xs truncate">{s.name}</p><p className="text-[10px] text-slate-400 font-mono truncate">{s.segments.map(seg => `${seg.start}-${seg.end}`).join(', ')}</p></div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingShift(s)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                                <button onClick={() => {if(confirm('¿Eliminar?')) store.deleteShiftType(s.id); setRefresh(r=>r+1);}} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 xl:p-4 space-y-5 xl:space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2"><p className="text-xs xl:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{editingShift ? 'EDITAR TURNO' : 'CREAR TURNO'}</p>{editingShift && <button onClick={() => setEditingShift(null)} className="text-[10px] text-blue-500 font-bold underline">Cancelar</button>}</div>
                    <div className="flex gap-2 items-end">
                        <div className="flex-1"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre</label><input className="w-full p-2.5 xl:p-2 border rounded-xl text-sm" value={shiftName} onChange={e=>setShiftName(e.target.value)} /></div>
                        <input type="color" className="w-10 h-10 xl:w-9 xl:h-9 border-2 border-slate-200 rounded-lg cursor-pointer p-1" value={shiftColor} onChange={e=>setShiftColor(e.target.value)} />
                    </div>
                    <div className="space-y-3 xl:space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">FRANJAS HORARIAS</p>
                        {shiftSegments.map((seg, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 xl:p-1.5 rounded-lg border border-slate-100"><span className="text-[11px] font-bold text-slate-700 font-mono">{seg.start}-{seg.end}</span><button onClick={()=>setShiftSegments(shiftSegments.filter((_,i)=>i!==idx))} className="text-red-400 hover:text-red-600"><Trash2 size={12}/></button></div>
                        ))}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 xl:p-2 rounded-xl border border-slate-100">
                            <div><label className="text-[8px] font-bold text-slate-400 uppercase block">INICIO</label><input type="time" className="w-full p-1.5 text-xs border rounded-lg" value={newSegStart} onChange={e=>setNewSegStart(e.target.value)} /></div>
                            <div><label className="text-[8px] font-bold text-slate-400 uppercase block">FIN</label><input type="time" className="w-full p-1.5 text-xs border rounded-lg" value={newSegEnd} onChange={e=>setNewSegEnd(e.target.value)} /></div>
                            <button onClick={addShiftSegment} className="col-span-2 mt-2 py-1.5 border-2 border-dashed border-slate-300 rounded-lg text-[9px] font-bold text-slate-500 hover:bg-white">+ Añadir Franja</button>
                        </div>
                    </div>
                    <button onClick={handleSaveShift} className="w-full py-3.5 xl:py-3 bg-slate-900 text-white font-bold rounded-xl text-sm xl:text-xs shadow-lg transition-all">{editingShift ? 'Actualizar' : 'Guardar'}</button>
                </div>
            </div>

            <div className="space-y-6 xl:space-y-4">
                <h3 className="text-sm xl:text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Días Festivos</h3>
                <div className="space-y-2 xl:space-y-1.5">
                    {store.config.holidays.sort((a,b)=>a.date.localeCompare(b.date)).map(h => (
                        <div key={h.id} className="bg-white border border-slate-200 p-4 xl:p-3 rounded-xl shadow-sm flex justify-between items-center group">
                            <div><p className="text-[10px] font-bold text-red-600 uppercase mb-0.5">{new Date(h.date).toLocaleDateString()}</p><p className="font-bold text-slate-800 text-xs">{h.name}</p></div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingHoliday(h)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                                <button onClick={()=>{if(confirm('¿Eliminar?')) store.deleteHoliday(h.id); setRefresh(r=>r+1);}} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 xl:p-4 space-y-5 xl:space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2"><p className="text-xs xl:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{editingHoliday ? 'EDITAR FESTIVO' : 'AÑADIR FESTIVO'}</p>{editingHoliday && <button onClick={() => setEditingHoliday(null)} className="text-[10px] text-blue-500 font-bold underline">Cancelar</button>}</div>
                    <input type="date" className="w-full p-2.5 xl:p-2 text-sm border rounded-xl" value={hDate} onChange={e=>setHDate(e.target.value)} />
                    <input className="w-full p-2.5 xl:p-2 text-sm border rounded-xl" placeholder="Nombre Festividad" value={hName} onChange={e=>setHName(e.target.value)} />
                    <button onClick={handleSaveHoliday} className="w-full py-3.5 xl:py-3 bg-red-600 text-white font-bold rounded-xl text-sm xl:text-xs shadow-lg transition-all">{editingHoliday ? 'Actualizar' : 'Añadir'}</button>
                </div>
            </div>
        </div>
    );
};

const PPEConfigManager = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<PPEType | null>(null);
    const [name, setName] = useState('');
    const [sizes, setSizes] = useState('');
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        if (editingItem) { setName(editingItem.name); setSizes(editingItem.sizes.join(', ')); } 
        else { setName(''); setSizes(''); }
    }, [editingItem, showModal]);

    const handleSave = async () => {
        if (!name.trim()) return;
        const sizeList = sizes.split(',').map(s => s.trim()).filter(Boolean);
        if (editingItem) await store.updatePPEType(editingItem.id, name, sizeList);
        else await store.createPPEType(name, sizeList);
        setShowModal(false); setRefresh(r=>r+1);
    };

    return (
        <div className="space-y-6 animate-fade-in xl:space-y-4">
            <div className="flex justify-between items-center mb-6 xl:mb-4">
                <h3 className="text-xl xl:text-lg font-bold text-slate-800">Equipos de Protección (EPI)</h3>
                <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 xl:py-1.5 rounded-lg font-bold text-sm xl:text-xs shadow-sm hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={18}/> Nuevo
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-4">
                {store.config.ppeTypes.map(p => (
                    <div key={p.id} className="bg-white border border-slate-100 p-6 xl:p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group flex justify-between items-start">
                        <div><h4 className="font-bold text-slate-800 text-base">{p.name}</h4><p className="text-xs text-slate-500 mt-2">Tallas: <span className="text-blue-600 font-bold">{p.sizes.join(', ')}</span></p></div>
                        <div className="flex gap-1">
                            <button onClick={()=>{setEditingItem(p); setShowModal(true);}} className="p-2 xl:p-1.5 text-slate-400 hover:text-blue-600"><Edit2 size={16}/></button>
                            <button onClick={()=>{if(confirm('¿Eliminar EPI?')) store.deletePPEType(p.id); setRefresh(r=>r+1);}} className="p-2 xl:p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 xl:p-6 animate-scale-in">
                        <h3 className="text-2xl xl:text-xl font-bold text-slate-800 mb-6 xl:mb-4">{editingItem ? 'Editar' : 'Nuevo'} EPI</h3>
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Material</label><input className="w-full p-3 xl:p-2.5 border rounded-xl bg-slate-50 text-sm" value={name} onChange={e=>setName(e.target.value)} /></div>
                            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tallas (Separadas por comas)</label><input className="w-full p-3 xl:p-2.5 border rounded-xl bg-slate-50 text-sm" value={sizes} onChange={e=>setSizes(e.target.value)} /></div>
                        </div>
                        <div className="flex gap-3 mt-8 xl:mt-6">
                            <button onClick={()=>setShowModal(false)} className="flex-1 py-3 xl:py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl text-sm">Cancelar</button>
                            <button onClick={handleSave} className="flex-1 py-3 xl:py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 text-sm">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CommunicationsManager = () => {
    const [tab, setTab] = useState<'news' | 'mass' | 'smtp' | 'templates'>('news');
    const [newsTitle, setNewsTitle] = useState('');
    const [newsContent, setNewsContent] = useState('');
    const [massMsg, setMassMsg] = useState('');
    const [refresh, setRefresh] = useState(0);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [editTpl, setEditTpl] = useState<EmailTemplate | null>(null);

    useEffect(() => {
        if (selectedTemplateId) { const found = store.config.emailTemplates.find(t => t.id === selectedTemplateId); if (found) setEditTpl({ ...found }); } 
        else { setEditTpl(null); }
    }, [selectedTemplateId]);

    const handleCreateNews = async () => {
        if (!newsTitle || !newsContent) return;
        await store.createNewsPost(newsTitle, newsContent, store.currentUser!.id);
        setNewsTitle(''); setNewsContent(''); setRefresh(r=>r+1); alert('Publicado.');
    };

    const handleSendMass = async () => {
        if (!massMsg.trim()) return;
        if (confirm(`¿Enviar a ${store.users.length} empleados?`)) { await store.sendMassNotification(store.users.map(u => u.id), massMsg); setMassMsg(''); alert('Enviado.'); }
    };

    const handleSaveTemplate = async () => {
        if (!editTpl) return;
        const updatedTemplates = store.config.emailTemplates.map(t => t.id === editTpl.id ? editTpl : t);
        await store.saveEmailTemplates(updatedTemplates); alert('Guardado.'); setSelectedTemplateId(null);
    };

    return (
        <div className="space-y-6 animate-fade-in xl:space-y-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                <button onClick={() => setTab('news')} className={`px-6 xl:px-4 py-2 xl:py-1.5 rounded-lg text-sm xl:text-xs font-bold transition-all ${tab === 'news' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Muro</button>
                <button onClick={() => setTab('mass')} className={`px-6 xl:px-4 py-2 xl:py-1.5 rounded-lg text-sm xl:text-xs font-bold transition-all ${tab === 'mass' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Notif. Masiva</button>
                <button onClick={() => setTab('smtp')} className={`px-6 xl:px-4 py-2 xl:py-1.5 rounded-lg text-sm xl:text-xs font-bold transition-all ${tab === 'smtp' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>SMTP</button>
                <button onClick={() => setTab('templates')} className={`px-6 xl:px-4 py-2 xl:py-1.5 rounded-lg text-sm xl:text-xs font-bold transition-all ${tab === 'templates' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Plantillas</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 xl:p-4 min-h-[400px] xl:min-h-[350px]">
                {tab === 'news' && (
                    <div className="space-y-6 xl:space-y-4">
                        <div className="bg-slate-50 p-6 xl:p-4 rounded-2xl border border-slate-100 space-y-4 xl:space-y-3">
                            <h4 className="font-bold text-slate-800 text-sm">Publicar noticia</h4>
                            <input className="w-full p-3 xl:p-2.5 border rounded-xl bg-white text-sm" placeholder="Título" value={newsTitle} onChange={e=>setNewsTitle(e.target.value)} />
                            <textarea className="w-full p-3 xl:p-2.5 border rounded-xl bg-white h-24 xl:h-20 text-sm" placeholder="Mensaje" value={newsContent} onChange={e=>setNewsContent(e.target.value)} />
                            <button onClick={handleCreateNews} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm">Publicar</button>
                        </div>
                        <div className="space-y-2 xl:space-y-1.5">
                            {store.config.news.map(n => (
                                <div key={n.id} className="flex justify-between items-center p-4 xl:p-3 border border-slate-50 rounded-xl group hover:bg-slate-50">
                                    <div><p className="font-bold text-slate-700 text-sm xl:text-xs">{n.title}</p><p className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</p></div>
                                    <button onClick={()=>{if(confirm('Eliminar?')) store.deleteNewsPost(n.id); setRefresh(r=>r+1);}} className="p-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {tab === 'mass' && (
                    <div className="max-w-xl space-y-4 xl:space-y-3">
                         <h4 className="font-bold text-slate-800 text-sm">Aviso General</h4>
                         <textarea className="w-full p-4 xl:p-3 border rounded-2xl h-40 xl:h-32 bg-slate-50 focus:bg-white text-sm" placeholder="Mensaje..." value={massMsg} onChange={e=>setMassMsg(e.target.value)} />
                         <button onClick={handleSendMass} className="w-full py-4 xl:py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black text-sm">Enviar Notificación Global</button>
                    </div>
                )}
                {tab === 'smtp' && (
                    <div className="max-w-lg space-y-4 xl:space-y-3">
                        <h4 className="font-bold text-slate-800 text-sm">Configuración SMTP</h4>
                        <div className="grid grid-cols-2 gap-4 xl:gap-3">
                            <div className="col-span-2"><label className="block text-[10px] font-bold text-slate-400 mb-1">Host</label><input className="w-full p-3 xl:p-2.5 border rounded-xl bg-slate-50 text-sm" value={store.config.smtpSettings.host} onChange={e=>store.saveSmtpSettings({...store.config.smtpSettings, host: e.target.value})} /></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Puerto</label><input type="number" className="w-full p-3 xl:p-2.5 border rounded-xl bg-slate-50 text-sm" value={store.config.smtpSettings.port} onChange={e=>store.saveSmtpSettings({...store.config.smtpSettings, port: parseInt(e.target.value)})} /></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Usuario</label><input className="w-full p-3 xl:p-2.5 border rounded-xl bg-slate-50 text-sm" value={store.config.smtpSettings.user} onChange={e=>store.saveSmtpSettings({...store.config.smtpSettings, user: e.target.value})} /></div>
                        </div>
                        <label className="flex items-center gap-3 p-4 xl:p-3 bg-slate-50 rounded-2xl cursor-pointer"><input type="checkbox" checked={store.config.smtpSettings.enabled} onChange={e=>store.saveSmtpSettings({...store.config.smtpSettings, enabled: e.target.checked})} className="w-5 h-5 text-blue-600" /><span className="font-bold text-slate-700 text-sm xl:text-xs">Habilitar envíos automáticos</span></label>
                    </div>
                )}
                {tab === 'templates' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-5">
                        <div className="lg:col-span-1 space-y-2 xl:space-y-1.5">
                            {store.config.emailTemplates.map(tmp => (
                                <button key={tmp.id} onClick={() => setSelectedTemplateId(tmp.id)} className={`w-full text-left p-4 xl:p-3 rounded-xl border transition-all ${selectedTemplateId === tmp.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-white'}`}><span className="text-[10px] font-bold uppercase">{tmp.label}</span></button>
                            ))}
                        </div>
                        <div className="lg:col-span-2">
                            {editTpl ? (
                                <div className="bg-slate-50 p-6 xl:p-4 rounded-2xl space-y-4 xl:space-y-3">
                                    <input className="w-full p-3 xl:p-2 border rounded-xl bg-white text-sm font-bold" value={editTpl.subject} onChange={e => setEditTpl({...editTpl, subject: e.target.value})} placeholder="Asunto" />
                                    
                                    <HtmlEditor 
                                        value={editTpl.body} 
                                        onChange={(newBody) => setEditTpl({...editTpl, body: newBody})} 
                                    />

                                    <div className="flex gap-4 xl:gap-3 p-2">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 cursor-pointer">
                                            <input type="checkbox" checked={editTpl.recipients.worker} onChange={e => setEditTpl({...editTpl, recipients: {...editTpl.recipients, worker: e.target.checked}})} className="rounded" /> EMPLEADO
                                        </label>
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 cursor-pointer">
                                            <input type="checkbox" checked={editTpl.recipients.supervisor} onChange={e => setEditTpl({...editTpl, recipients: {...editTpl.recipients, supervisor: e.target.checked}})} className="rounded" /> SUPERVISOR
                                        </label>
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 cursor-pointer">
                                            <input type="checkbox" checked={editTpl.recipients.admin} onChange={e => setEditTpl({...editTpl, recipients: {...editTpl.recipients, admin: e.target.checked}})} className="rounded" /> ADMIN
                                        </label>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveTemplate} className="flex-1 bg-blue-600 text-white py-3 xl:py-2.5 rounded-xl font-bold shadow-lg text-sm">Guardar</button>
                                        <button onClick={() => setSelectedTemplateId(null)} className="px-6 xl:px-5 py-3 xl:py-2.5 bg-white text-slate-500 rounded-xl font-bold text-sm">Cancelar</button>
                                    </div>
                                </div>
                            ) : <div className="h-full flex items-center justify-center border-2 border-dashed rounded-2xl text-slate-300 font-medium text-sm">Selecciona una plantilla</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

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
    if (status === RequestStatus.REJECTED && !comment.trim()) { alert("Indica un motivo."); return; } 
    await store.updateRequestStatus(req.id, status, user.id, comment || undefined); 
  };

  const renderRequestList = (list: LeaveRequest[]) => (
    <div className="grid gap-4 xl:gap-3">
        {list.map(req => { 
            const conflicts = store.getRequestConflicts(req); const hasConflict = conflicts.length > 0;
            const start = new Date(req.startDate); const end = new Date(req.endDate || req.startDate);
            const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return ( <div key={req.id} className={`bg-white p-6 xl:p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-6 xl:gap-4 items-start md:items-center transition-all ${hasConflict ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-100'}`}><div className="flex-1"><div className="flex items-center gap-2 mb-2"><span className="font-bold text-lg xl:text-base text-slate-800">{store.users.find(u => u.id === req.userId)?.name}</span><span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full uppercase">{store.departments.find(d => d.id === store.users.find(u => u.id === req.userId)?.departmentId)?.name}</span></div><div className="flex flex-wrap gap-4 xl:gap-3 text-sm xl:text-xs text-slate-600"><div className="flex items-center gap-1 font-medium"><FileText size={16}/> {store.getTypeLabel(req.typeId)}</div><div className="flex items-center gap-1"><Calendar size={16}/> {new Date(req.startDate).toLocaleDateString()} {req.endDate && `- ${new Date(req.endDate).toLocaleDateString()}`}</div>{!store.isOvertimeRequest(req.typeId) && <div className="flex items-center gap-1 font-bold text-blue-600"><CalendarDays size={16}/> {diffDays} {diffDays === 1 ? 'día' : 'días'}</div>}{req.hours && <div className="flex items-center gap-1 font-bold text-indigo-600"><Clock size={16}/> {req.hours}h</div>}</div>{hasConflict && ( 
                <div className="mt-3 bg-red-50 text-red-700 p-3 xl:p-2 rounded-xl text-[10px] space-y-1.5 border border-red-100 shadow-sm animate-pulse">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wider"><AlertTriangle size={14} className="shrink-0"/> Conflictos Detectados ({conflicts.length})</div>
                    <div className="space-y-1 pl-6">{conflicts.map(c => { const otherUser = store.users.find(u => u.id === c.userId); return (<div key={c.id} className="flex flex-col border-l-2 border-red-200 pl-2"><strong>{otherUser?.name}</strong><span className="opacity-80 italic">Solapa del {new Date(c.startDate).toLocaleDateString()} al {new Date(c.endDate || c.startDate).toLocaleDateString()}</span></div>); })}</div>
                </div> 
            )}</div><div className="flex gap-2.5 xl:gap-2"><button onClick={() => onViewRequest(req)} className="p-2 xl:p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><ExternalLink size={20}/></button><button onClick={() => handleAction(req, RequestStatus.REJECTED)} className="px-4 py-2 xl:px-3 xl:py-1.5 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors text-sm xl:text-xs">Rechazar</button><button onClick={() => handleAction(req, RequestStatus.APPROVED)} className="px-4 py-2 xl:px-3 xl:py-1.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg transition-colors text-sm xl:text-xs">Aprobar</button></div></div> ); 
        })}
    </div>
  );

  return (
    <div className="space-y-10 xl:space-y-6 animate-fade-in">
        <h2 className="text-2xl xl:text-xl font-bold text-slate-800 flex items-center gap-2"><ShieldCheck className="text-blue-600"/> Aprobaciones Pendientes</h2>
        {pending.length === 0 ? ( <div className="text-center py-12 xl:py-8 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400"><CheckCircle size={48} className="mx-auto mb-4 opacity-20"/><p className="text-sm">¡Todo al día!</p></div> 
        ) : ( <div className="space-y-12 xl:space-y-8">{absences.length > 0 && (<div className="space-y-4 xl:space-y-2.5"><h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1"><CalendarDays size={16} /> Ausencias ({absences.length})</h3>{renderRequestList(absences)}</div>)}{overtimes.length > 0 && (<div className="space-y-4 xl:space-y-2.5"><h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Clock size={16} /> Solicitudes de Horas ({overtimes.length})</h3>{renderRequestList(overtimes)}</div>)}</div> )}
    </div>
  );
};

export const UpcomingAbsences: React.FC<{ user: User, onViewRequest: (req: LeaveRequest) => void }> = ({ user, onViewRequest }) => {
    const today = new Date().toISOString().split('T')[0];
    const teamIds = useMemo(() => { if (user.role === Role.ADMIN) return store.users.map(u => u.id); const myDepts = store.departments.filter(d => d.supervisorIds.includes(user.id)).map(d => d.id); return store.users.filter(u => myDepts.includes(u.departmentId)).map(u => u.id); }, [user]);
    
    // Filtrar solicitudes que implican no asistir: Ausencias normales y Canjes de horas.
    const absences = store.requests.filter(r => {
        const isCanje = r.typeId === RequestType.OVERTIME_SPEND_DAYS || store.getTypeLabel(r.typeId).toLowerCase().includes('canje');
        const isPhysicalAbsence = !store.isOvertimeRequest(r.typeId) || isCanje;
        return (r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING) && 
               isPhysicalAbsence && 
               (r.endDate || r.startDate) >= today && 
               teamIds.includes(r.userId);
    }).sort((a,b) => a.startDate.localeCompare(b.startDate));

    const handleAction = async (e: React.MouseEvent, req: LeaveRequest, status: RequestStatus) => { e.stopPropagation(); const comment = prompt(status === RequestStatus.APPROVED ? 'Comentario:' : 'Motivo del rechazo:'); if (comment === null) return; if (status === RequestStatus.REJECTED && !comment.trim()) { alert("Obligatorio."); return; } await store.updateRequestStatus(req.id, status, user.id, comment || undefined); };
    return (
        <div className="space-y-6 xl:space-y-4 animate-fade-in print:bg-white print:p-0 print:m-0 print:w-full"><div className="flex justify-between items-center print:hidden"><h2 className="text-2xl xl:text-xl font-bold text-slate-800 flex items-center gap-2"><CalendarClock className="text-blue-600"/> Próximas Ausencias</h2><button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 xl:py-1.5 rounded-lg font-bold text-slate-600 shadow-sm text-sm xl:text-xs"><Printer size={18}/> Imprimir</button></div>{absences.length === 0 ? ( <p className="text-slate-500 italic text-sm">No hay ausencias programadas.</p> ) : ( <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"><table className="w-full text-left text-sm print:text-xs"><thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]"><tr><th className="px-6 py-4 xl:py-3">Empleado</th><th className="px-6 py-4 xl:py-3">Tipo</th><th className="px-6 py-4 xl:py-3">Fechas</th><th className="px-6 py-4 xl:py-3">Días</th><th className="px-6 py-4 xl:py-3">Estado</th><th className="px-6 py-4 xl:py-3 print:hidden text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{absences.map(req => { const u = store.users.find(usr => usr.id === req.userId); const start = new Date(req.startDate); const end = new Date(req.endDate || req.startDate); const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1; const conflicts = store.getRequestConflicts(req); return ( <tr key={req.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onViewRequest(req)}><td className="px-6 py-4 xl:py-3"><div className="font-bold text-slate-700 text-sm xl:text-xs">{u?.name}</div>{conflicts.length > 0 && (<div className="mt-1 flex flex-col animate-pulse"><div className="text-[9px] text-red-600 font-bold flex items-center gap-1 uppercase tracking-tight"><AlertTriangle size={10}/> Conflicto ({conflicts.length})</div></div>)}</td><td className="px-6 py-4 xl:py-3 text-sm xl:text-xs">{store.getTypeLabel(req.typeId)}</td><td className="px-6 py-4 xl:py-3 text-slate-500 text-xs">{start.toLocaleDateString()} - {end.toLocaleDateString()}</td><td className="px-6 py-4 xl:py-3 font-mono font-bold text-blue-600 text-sm xl:text-xs">{diff}</td><td className="px-6 py-4 xl:py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${req.status === RequestStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{req.status}</span></td><td className="px-6 py-4 xl:py-3 print:hidden text-right" onClick={e => e.stopPropagation()}><div className="flex justify-end gap-2">{req.status === RequestStatus.PENDING && ( <button onClick={(e) => handleAction(e, req, RequestStatus.APPROVED)} className="p-1.5 bg-green-50 text-green-600 rounded border border-green-200"><Check size={14}/></button> )}<button onClick={(e) => handleAction(e, req, RequestStatus.REJECTED)} className="p-1.5 bg-red-50 text-red-600 rounded border border-red-200"><X size={14}/></button></div></td></tr> ) })}</tbody></table></div> )}</div>
    );
};

const UserModal: React.FC<{ onClose: () => void, editingUser: User | null, onViewRequest: (req: LeaveRequest) => void }> = ({ onClose, editingUser, onViewRequest }) => {
    const [name, setName] = useState(editingUser?.name || '');
    const [email, setEmail] = useState(editingUser?.email || '');
    const [role, setRole] = useState<Role>(editingUser?.role || Role.WORKER);
    const [deptId, setDeptId] = useState(editingUser?.departmentId || '');
    const [days, setDays] = useState(editingUser?.daysAvailable || 0);
    const [hours, setHours] = useState(editingUser?.overtimeHours || 0);
    const [pass, setPass] = useState('');
    const [avatar, setAvatar] = useState(editingUser?.avatar || '');
    const [birthdate, setBirthdate] = useState(editingUser?.birthdate || '');
    const [isSaving, setIsSaving] = useState(false);
    const [adjDays, setAdjDays] = useState(0);
    const [adjDaysReason, setAdjDaysReason] = useState('');
    const [adjHours, setAdjHours] = useState(0);
    const [adjHoursReason, setAdjHoursReason] = useState('');
    const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
    const [editingRequestLocal, setEditingRequestLocal] = useState<LeaveRequest | null>(null);
    const [refresh, setRefresh] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const movements = useMemo(() => {
        if (!editingUser) return [];
        return store.requests.filter(r => r.userId === editingUser.id).sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }, [editingUser?.id, store.requests, refresh]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => setAvatar(reader.result as string); reader.readAsDataURL(file); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        if (editingUser) {
            await store.updateUserAdmin(editingUser.id, { name, email, departmentId: deptId, birthdate, avatar });
            if (editingUser.role !== role) await store.updateUserRole(editingUser.id, role);
            if (pass) await store.updateUserProfile(editingUser.id, { name, email, password: pass, avatar });
            if (adjDays !== 0) await store.createRequest({ typeId: RequestType.ADJUSTMENT_DAYS, startDate: new Date().toISOString(), hours: adjDays, reason: adjDaysReason || 'Ajuste', isJustified: true, reportedToAdmin: false }, editingUser.id, RequestStatus.APPROVED);
            if (adjHours !== 0) await store.createRequest({ typeId: RequestType.ADJUSTMENT_OVERTIME, startDate: new Date().toISOString(), hours: adjHours, reason: adjHoursReason || 'Ajuste', isJustified: true, reportedToAdmin: false }, editingUser.id, RequestStatus.APPROVED);
        } else { await store.createUser({ name, email, role, departmentId: deptId, daysAvailable: days, overtimeHours: hours, birthdate, avatar }, pass || '123456'); }
        setIsSaving(false); onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[95vh] xl:max-w-3xl">
                <div className="p-6 xl:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <div className="flex items-center gap-3"><div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><Users size={20}/></div><h3 className="text-xl xl:text-lg font-bold text-slate-800">{editingUser ? 'Ficha' : 'Nuevo Empleado'}</h3></div>
                    <div className="flex gap-2">
                        {editingUser && (<button type="button" onClick={() => { setEditingRequestLocal(null); setShowCreateRequestModal(true); }} className="px-4 py-2 xl:py-1.5 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 text-sm xl:text-xs flex items-center gap-2"><Plus size={18}/> Nueva Solicitud</button>)}
                        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={24}/></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 xl:p-5 space-y-10 xl:space-y-6">
                    <form id="userForm" onSubmit={handleSubmit} className="flex flex-col gap-10 xl:gap-6">
                        <div className="space-y-4 xl:space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Perfil Personal</h4>
                            <div className="flex flex-col items-center mb-6 xl:mb-4">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <img src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=random`} className="w-24 h-24 xl:w-20 xl:h-20 rounded-full border-4 border-white shadow-lg object-cover" />
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={20}/></div>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange}/><p className="text-[9px] text-slate-400 mt-2 font-bold uppercase">Cambiar foto</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-3">
                                <div className="col-span-2 md:col-span-1"><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre</label><input required className="w-full p-2.5 border rounded-xl bg-slate-50 text-sm" value={name} onChange={e=>setName(e.target.value)}/></div>
                                <div className="col-span-2 md:col-span-1"><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email</label><input type="email" required className="w-full p-2.5 border rounded-xl bg-slate-50 text-sm" value={email} onChange={e=>setEmail(e.target.value)}/></div>
                                <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rol</label><select className="w-full p-2.5 border rounded-xl bg-slate-50 text-sm" value={role} onChange={e=>setRole(e.target.value as Role)}><option value={Role.WORKER}>Trabajador</option><option value={Role.SUPERVISOR}>Supervisor</option><option value={Role.ADMIN}>Administrador</option></select></div>
                                <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dpto</label><select required className="w-full p-2.5 border rounded-xl bg-slate-50 text-sm" value={deptId} onChange={e=>setDeptId(e.target.value)}><option value="">Seleccionar...</option>{store.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                            </div>
                        </div>
                        <div className="space-y-4 xl:space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Saldo y Ajustes</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-3">
                                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 xl:p-3 flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-2"><span className="text-[9px] font-bold text-orange-400 uppercase">Días disponibles</span><span className="text-3xl xl:text-2xl font-black text-orange-600 leading-none">{editingUser ? editingUser.daysAvailable.toFixed(1) : days}</span></div>
                                    {editingUser && (<div className="flex gap-2"><input type="number" step="0.5" className="w-16 xl:w-14 p-2 border rounded-xl text-center font-bold text-sm" value={adjDays || ''} onChange={e=>setAdjDays(parseFloat(e.target.value) || 0)}/><input className="flex-1 p-2 border rounded-xl text-[10px]" placeholder="Motivo ajuste..." value={adjDaysReason} onChange={e=>setAdjDaysReason(e.target.value)}/></div>)}
                                </div>
                                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 xl:p-3 flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-2"><span className="text-[9px] font-bold text-blue-400 uppercase">Horas extra</span><span className="text-3xl xl:text-2xl font-black text-blue-600 leading-none">{editingUser ? editingUser.overtimeHours.toFixed(1) : hours}h</span></div>
                                    {editingUser && (<div className="flex gap-2"><input type="number" step="0.5" className="w-16 xl:w-14 p-2 border rounded-xl text-center font-bold text-sm" value={adjHours || ''} onChange={e=>setAdjHours(parseFloat(e.target.value) || 0)}/><input className="flex-1 p-2 border rounded-xl text-[10px]" placeholder="Motivo ajuste..." value={adjHoursReason} onChange={e=>setAdjHoursReason(e.target.value)}/></div>)}
                                </div>
                            </div>
                        </div>
                        {editingUser && (
                            <div className="space-y-4 xl:space-y-3">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Historial Reciente</h4>
                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm"><table className="w-full text-left text-xs xl:text-[11px]"><thead className="bg-slate-50 text-slate-500 font-bold uppercase"><tr className="border-b border-slate-100"><th className="px-4 py-3 xl:py-2">Tipo</th><th className="px-4 py-3 xl:py-2 text-center">Cant.</th><th className="px-4 py-3 xl:py-2">Estado</th><th className="px-4 py-3 xl:py-2 text-right">Acción</th></tr></thead><tbody className="divide-y divide-slate-50">
                                            {movements.slice(0, 10).map(m => {
                                                const isOvertime = store.isOvertimeRequest(m.typeId); let val = m.hours || 0; const tid = m.typeId.toLowerCase();
                                                const isConsum = tid.includes('canje') || tid.includes('abono') || tid.includes('vacac') || tid.includes('asuntos');
                                                if (isOvertime && isConsum) val = -Math.abs(val);
                                                if (!isOvertime && isConsum && !tid.includes('canje')) {
                                                    const s = new Date(m.startDate); const e = new Date(m.endDate || m.startDate);
                                                    val = -(Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                                                }
                                                return (<tr key={m.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => onViewRequest(m)}><td className="px-4 py-3 xl:py-2 font-bold text-slate-700">{store.getTypeLabel(m.typeId)}</td><td className="px-4 py-3 xl:py-2 text-center"><span className={`font-mono font-bold px-2 py-0.5 rounded ${val < 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>{val > 0 ? '+' : ''}{val.toFixed(1)}{(isOvertime && !tid.includes('vacac')) ? 'h' : 'd'}</span></td><td className="px-4 py-3 xl:py-2"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${m.status === RequestStatus.APPROVED ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{m.status}</span></td><td className="px-4 py-3 xl:py-2 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}><button type="button" onClick={() => onViewRequest(m)} className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded"><ExternalLink size={12}/></button><button type="button" onClick={() => { setEditingRequestLocal(m); setShowCreateRequestModal(true); }} className="p-1 text-blue-400 hover:bg-blue-50 rounded"><Edit2 size={12}/></button><button type="button" onClick={() => {if(confirm('Eliminar?')) store.deleteRequest(m.id); setRefresh(r=>r+1);}} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={12}/></button></div></td></tr>);
                                            })}
                                </tbody></table></div>
                            </div>
                        )}
                    </form>
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-sm xl:text-xs">Cancelar</button>
                    <button form="userForm" disabled={isSaving} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 text-sm xl:text-xs flex items-center gap-2">{isSaving && <Loader2 className="animate-spin" size={16}/>} {editingUser ? 'Actualizar' : 'Crear'}</button>
                </div>
            </div>
            {showCreateRequestModal && editingUser && (
                <RequestFormModal onClose={() => { setShowCreateRequestModal(false); setEditingRequestLocal(null); setRefresh(r=>r+1); }} user={store.currentUser!} targetUser={editingUser} initialTab="absence" editingRequest={editingRequestLocal} />
            )}
        </div>
    );
};

export const UserManagement: React.FC<{ currentUser: User, onViewRequest: (req: LeaveRequest) => void }> = ({ currentUser, onViewRequest }) => {
    const [viewMode, setViewMode] = useState<'list' | 'shifts'>('list');
    const [search, setSearch] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState<string>('');
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [refresh, setRefresh] = useState(0);
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    useEffect(() => { const unsub = store.subscribe(() => setRefresh(prev => prev + 1)); return unsub; }, []);

    const users = useMemo(() => {
        let list = store.users;
        if (currentUser.role === Role.SUPERVISOR) { const depts = store.departments.filter(d => d.supervisorIds.includes(currentUser.id)).map(d => d.id); list = list.filter(u => depts.includes(u.departmentId)); }
        if (selectedDeptId) list = list.filter(u => u.departmentId === selectedDeptId);
        if (search) list = list.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
        return [...list].sort((a,b) => a.name.localeCompare(b.name));
    }, [search, currentUser.id, selectedDeptId, refresh, store.users]);

    return (
        <div className="space-y-6 xl:space-y-4 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 xl:gap-3">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button onClick={() => setViewMode('list')} className={`px-6 xl:px-4 py-2 xl:py-1.5 rounded-lg font-bold text-sm xl:text-xs ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Listado</button>
                    <button onClick={() => setViewMode('shifts')} className={`px-6 xl:px-4 py-2 xl:py-1.5 rounded-lg font-bold text-sm xl:text-xs ${viewMode === 'shifts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Planificación</button>
                </div>
                <div className="flex items-center gap-3 xl:gap-2 w-full md:w-auto">
                    {currentUser.role === Role.ADMIN && (
                        <div className="relative shrink-0"><Filter className="absolute left-3 top-2.5 text-slate-400" size={16}/><select className="pl-9 pr-4 py-2 border rounded-lg text-sm xl:text-xs bg-white focus:ring-2 focus:ring-blue-200 outline-none appearance-none" value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)}><option value="">Dptos.</option>{store.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                    )}
                    {currentUser.role === Role.ADMIN && (
                        <div className="flex gap-2">
                            <button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="bg-blue-600 text-white px-4 py-2 xl:py-1.5 rounded-lg font-bold text-sm xl:text-xs shadow-lg flex items-center gap-2 hover:bg-blue-700"><UserPlus size={18}/> Nuevo</button>
                        </div>
                    )}
                </div>
            </div>
            {viewMode === 'list' ? (
                <div className="space-y-4 xl:space-y-3">
                    <div className="relative max-w-md"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input type="text" placeholder="Buscar empleado..." className="w-full pl-10 pr-4 py-2 xl:py-1.5 border rounded-xl shadow-sm text-sm xl:text-xs" value={search} onChange={e => setSearch(e.target.value)}/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-4">
                        {users.map(u => (
                            <div key={u.id} className="bg-white p-6 xl:p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 group hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 xl:gap-3">
                                    <img src={u.avatar} className="w-14 h-14 xl:w-11 xl:h-11 rounded-full border-2 border-slate-50 object-cover shadow-sm" />
                                    <div className="flex-1 min-w-0"><h4 className="font-bold text-slate-800 text-sm xl:text-xs truncate">{u.name}</h4><p className="text-xs xl:text-[10px] text-slate-500 truncate">{u.email}</p></div>
                                    {currentUser.role === Role.ADMIN && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                                            <button onClick={() => { if(confirm(`¿Eliminar permanentemente a ${u.name}?`)) store.deleteUser(u.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50 p-3 xl:p-2 rounded-xl border border-slate-100 text-center"><p className="text-[9px] font-bold text-slate-400 uppercase">Vacaciones</p><p className="text-lg xl:text-base font-bold text-orange-600">{u.daysAvailable.toFixed(1)} <span className="text-[10px] font-normal text-slate-400 uppercase tracking-tighter">d</span></p></div>
                                    <div className="bg-slate-50 p-3 xl:p-2 rounded-xl border border-slate-100 text-center"><p className="text-[9px] font-bold text-slate-400 uppercase">Horas Extra</p><p className="text-lg xl:text-base font-bold text-blue-600">{u.overtimeHours.toFixed(1)} <span className="text-[10px] font-normal text-slate-400 uppercase tracking-tighter">h</span></p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : <ShiftScheduler users={users} />}
            {showUserModal && <UserModal onClose={() => setShowUserModal(false)} editingUser={editingUser} onViewRequest={onViewRequest} />}
        </div>
    );
};

export const AdminSettings: React.FC<{ onViewRequest: (req: LeaveRequest) => void }> = ({ onViewRequest }) => {
    const [adminTab, setAdminTab] = useState<'users' | 'depts' | 'config' | 'ppe' | 'comm' | 'query'>('users');
    const [refresh, setRefresh] = useState(0);
    useEffect(() => { const unsub = store.subscribe(() => setRefresh(prev => prev + 1)); return unsub; }, []);
    
    const stats = useMemo(() => {
        const total = store.users.length; const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // Solo ausencias físicas reales aprobadas (Excluyendo ajustes manuales de días y horas)
        // Incluye canje de horas ya que representa tiempo libre solicitado.
        const absentUsers = store.users.filter(u => store.requests.some(r => {
            const isCanje = r.typeId === RequestType.OVERTIME_SPEND_DAYS || store.getTypeLabel(r.typeId).toLowerCase().includes('canje');
            const isPhysicalAbsence = (!store.isOvertimeRequest(r.typeId) || isCanje);
            
            return r.userId === u.id && 
                   r.status === RequestStatus.APPROVED && 
                   isPhysicalAbsence &&
                   r.typeId !== RequestType.ADJUSTMENT_DAYS &&
                   r.typeId !== RequestType.ADJUSTMENT_OVERTIME &&
                   todayStr >= r.startDate.split('T')[0] && 
                   todayStr <= (r.endDate || r.startDate).split('T')[0];
        }));
        
        return { total, absent: absentUsers.length, absentNames: absentUsers.map(u => u.name), percent: total > 0 ? ((absentUsers.length / total) * 100).toFixed(1) : "0" };
    }, [refresh, store.users, store.requests]);
    
    return (
        <div className="space-y-6 xl:space-y-4 animate-fade-in">
            <h2 className="text-2xl xl:text-xl font-bold text-slate-800 flex items-center gap-2"><Settings className="text-blue-600"/> Administración</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-4">
                <div className="bg-white p-6 xl:p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md"><div className="bg-blue-50 p-4 xl:p-3 rounded-xl text-blue-600"><Users size={28}/></div><div><p className="text-xs font-bold text-slate-400 uppercase">Total Plantilla</p><h4 className="text-3xl xl:text-2xl font-bold text-slate-800">{stats.total}</h4></div></div>
                <div className="group relative bg-white p-6 xl:p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md"><div className="bg-orange-50 p-4 xl:p-3 rounded-xl text-orange-600"><Palmtree size={28}/></div><div><p className="text-xs font-bold text-slate-400 uppercase">Ausencias Hoy</p><h4 className="text-3xl xl:text-2xl font-bold text-slate-800">{stats.absent}</h4></div>{stats.absentNames.length > 0 && (<div className="absolute top-full left-0 mt-2 w-full bg-white p-3 rounded-xl shadow-xl border border-slate-100 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Ausentes:</p><div className="flex flex-wrap gap-1">{stats.absentNames.map(name => (<span key={name} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[9px] rounded-full font-bold">{name}</span>))}</div></div>)}</div>
                <div className="bg-white p-6 xl:p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md"><div className="bg-purple-50 p-4 xl:p-3 rounded-xl text-purple-600"><TrendingUp size={28}/></div><div><p className="text-xs font-bold text-slate-400 uppercase">% Ausentismo</p><h4 className="text-3xl xl:text-2xl font-bold text-slate-800">{stats.percent}%</h4></div></div>
            </div>
            <div className="flex flex-wrap gap-2 xl:gap-1.5 border-b border-slate-200">
                <button onClick={() => setAdminTab('users')} className={`px-4 xl:px-3 py-3 xl:py-2.5 font-bold text-sm xl:text-xs transition-all border-b-2 ${adminTab === 'users' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Usuarios</button>
                <button onClick={() => setAdminTab('depts')} className={`px-4 xl:px-3 py-3 xl:py-2.5 font-bold text-sm xl:text-xs transition-all border-b-2 ${adminTab === 'depts' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Dptos</button>
                <button onClick={() => setAdminTab('config')} className={`px-4 xl:px-3 py-3 xl:py-2.5 font-bold text-sm xl:text-xs transition-all border-b-2 ${adminTab === 'config' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>RRHH</button>
                <button onClick={() => setAdminTab('ppe')} className={`px-4 xl:px-3 py-3 xl:py-2.5 font-bold text-sm xl:text-xs transition-all border-b-2 ${adminTab === 'ppe' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>EPIs</button>
                <button onClick={() => setAdminTab('comm')} className={`px-4 xl:px-3 py-3 xl:py-2.5 font-bold text-sm xl:text-xs transition-all border-b-2 ${adminTab === 'comm' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Comunicaciones</button>
                <button onClick={() => setAdminTab('query')} className={`px-4 xl:px-3 py-3 xl:py-2.5 font-bold text-sm xl:text-xs transition-all border-b-2 ${adminTab === 'query' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Consultas</button>
            </div>
            <div className="bg-white p-6 xl:p-4 rounded-2xl shadow-sm border border-slate-100 min-h-[500px] xl:min-h-[400px]">
                {adminTab === 'users' && <UserManagement currentUser={store.currentUser!} onViewRequest={onViewRequest} />}
                {adminTab === 'depts' && <DepartmentManager />}
                {adminTab === 'config' && <HRConfigManager />}
                {adminTab === 'ppe' && <PPEConfigManager />}
                {adminTab === 'comm' && <CommunicationsManager />}
                {adminTab === 'query' && <AbsenceQueryManager />}
            </div>
        </div>
    );
};

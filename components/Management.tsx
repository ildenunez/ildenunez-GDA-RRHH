import React, { useState, useEffect, useMemo } from 'react';
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
  CalendarCheck
} from 'lucide-react';
import { store } from '../services/store';
import { User, Role, LeaveRequest, RequestStatus, RequestType } from '../types';
import RequestFormModal from './RequestFormModal';
import ShiftScheduler from './ShiftScheduler';

// Componentes auxiliares para evitar errores de referencia
const DepartmentManager = () => <div className="p-8 text-center text-slate-500 italic">Gestión de Departamentos (En desarrollo)</div>;
const HRConfigManager = () => <div className="p-8 text-center text-slate-500 italic">Configuración de RRHH (En desarrollo)</div>;
const PPEConfigManager = () => <div className="p-8 text-center text-slate-500 italic">Configuración de EPIs (En desarrollo)</div>;
const CommunicationsManager = () => <div className="p-8 text-center text-slate-500 italic">Gestión de Comunicaciones (En desarrollo)</div>;

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
    const [days, setDays] = useState(editingUser?.daysAvailable || 0);
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
        e.preventDefault(); setIsSaving(true);
        if (editingUser) {
            await store.updateUserAdmin(editingUser.id, { name, email, departmentId: deptId, birthdate });
            if (editingUser.role !== role) await store.updateUserRole(editingUser.id, role);
            if (pass) await store.updateUserProfile(editingUser.id, { name, email, password: pass });
            if (adjDays !== 0) await store.createRequest({ typeId: RequestType.ADJUSTMENT_DAYS, startDate: new Date().toISOString(), hours: adjDays, reason: adjDaysReason || 'Ajuste manual', isJustified: true, reportedToAdmin: false }, editingUser.id, RequestStatus.APPROVED);
            if (adjHours !== 0) await store.createRequest({ typeId: RequestType.ADJUSTMENT_OVERTIME, startDate: new Date().toISOString(), hours: adjHours, reason: adjHoursReason || 'Ajuste manual', isJustified: true, reportedToAdmin: false }, editingUser.id, RequestStatus.APPROVED);
        } else {
            await store.createUser({ name, email, role, departmentId: deptId, daysAvailable: days, overtimeHours: hours, birthdate }, pass || '123456');
        }
        setIsSaving(false); onClose();
    };

    const handleDeleteMovement = async (id: string) => {
        if(confirm('¿Eliminar registro?')) { await store.deleteRequest(id); setRefresh(r => r+1); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[95vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><Users size={20}/></div>
                        <h3 className="text-xl font-bold text-slate-800">{editingUser ? 'Ficha del Empleado' : 'Nuevo Empleado'}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {editingUser && (
                            <button onClick={() => { setEditingRequestLocal(null); setShowCreateRequestModal(true); }} className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 flex items-center gap-2 transition-all">
                                <Plus size={18}/> Nueva Solicitud
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={24}/></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-10">
                    <form id="userForm" onSubmit={handleSubmit} className="flex flex-col gap-10">
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2"><UserIcon size={14}/> Perfil</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1"><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre</label><input required className="w-full p-2.5 border rounded-xl bg-slate-50" value={name} onChange={e=>setName(e.target.value)}/></div>
                                <div className="col-span-2 md:col-span-1"><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email</label><input type="email" required className="w-full p-2.5 border rounded-xl bg-slate-50" value={email} onChange={e=>setEmail(e.target.value)}/></div>
                                <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rol</label><select className="w-full p-2.5 border rounded-xl bg-slate-50" value={role} onChange={e=>setRole(e.target.value as Role)}><option value={Role.WORKER}>Trabajador</option><option value={Role.SUPERVISOR}>Supervisor</option><option value={Role.ADMIN}>Administrador</option></select></div>
                                <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dpto</label><select required className="w-full p-2.5 border rounded-xl bg-slate-50" value={deptId} onChange={e=>setDeptId(e.target.value)}><option value="">Seleccionar...</option>{store.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                                <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">F. Nacimiento</label><input type="date" className="w-full p-2.5 border rounded-xl bg-slate-50" value={birthdate} onChange={e=>setBirthdate(e.target.value)}/></div>
                                <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pass</label><input type="password" placeholder={editingUser ? 'Sin cambios' : '123456'} className="w-full p-2.5 border rounded-xl bg-slate-50" value={pass} onChange={e=>setPass(e.target.value)}/></div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2"><PieChart size={14}/> Saldo</h4>
                            {editingUser ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Días</span><span className="text-3xl font-black text-orange-600 leading-none">{editingUser.daysAvailable.toFixed(1)}</span></div>
                                            <div className="flex gap-2"><input type="number" step="0.5" className="w-20 p-2 border rounded-xl text-center font-bold" placeholder="0" value={adjDays || ''} onChange={e=>setAdjDays(parseFloat(e.target.value) || 0)}/><input className="flex-1 p-2 border rounded-xl text-xs" placeholder="Motivo..." value={adjDaysReason} onChange={e=>setAdjDaysReason(e.target.value)}/></div>
                                        </div>
                                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Horas</span><span className="text-3xl font-black text-blue-600 leading-none">{editingUser.overtimeHours.toFixed(1)}h</span></div>
                                            <div className="flex gap-2"><input type="number" step="0.5" className="w-20 p-2 border rounded-xl text-center font-bold" placeholder="0" value={adjHours || ''} onChange={e=>setAdjHours(parseFloat(e.target.value) || 0)}/><input className="flex-1 p-2 border rounded-xl text-xs" placeholder="Motivo..." value={adjHoursReason} onChange={e=>setAdjHoursReason(e.target.value)}/></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Días Iniciales</label><input type="number" className="w-full p-2.5 border rounded-xl bg-slate-50" value={days} onChange={e=>setDays(parseFloat(e.target.value))}/></div>
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Horas Iniciales</label><input type="number" className="w-full p-2.5 border rounded-xl bg-slate-50" value={hours} onChange={e=>setHours(parseFloat(e.target.value))}/></div>
                                </div>
                            )}
                        </div>

                        {editingUser && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2"><History size={14}/> Historial</h4>
                                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase"><tr><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Fechas</th><th className="px-4 py-3 text-center">Cant.</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {movements.map(m => {
                                                const tid = m.typeId.toLowerCase();
                                                const isOvertime = store.isOvertimeRequest(m.typeId);
                                                let val = m.hours || 0;
                                                const isConsumption = tid.includes('canje') || tid.includes('abono') || tid.includes('vacac') || tid.includes('asuntos') || tid.includes('justific');
                                                const isCanje = tid.includes('canje');

                                                if (isOvertime && isConsumption) val = -Math.abs(val);
                                                if (!isOvertime && isConsumption && !isCanje) {
                                                    const start = new Date(m.startDate);
                                                    const end = new Date(m.endDate || m.startDate);
                                                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                                        val = -(Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                                                    }
                                                }
                                                const displayVal = isCanje && !isOvertime ? 0 : val;
                                                const unit = (isOvertime && !tid.includes('vacac') && !tid.includes('asuntos')) ? 'h' : 'd';
                                                
                                                return (
                                                    <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-4 py-3 font-bold text-slate-700">{store.getTypeLabel(m.typeId)}</td>
                                                        <td className="px-4 py-3 text-slate-500">{new Date(m.startDate).toLocaleDateString()}{m.endDate && ` - ${new Date(m.endDate).toLocaleDateString()}`}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`font-mono font-bold px-2 py-0.5 rounded ${val < 0 ? 'text-red-600 bg-red-50' : val > 0 ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-50'}`}>
                                                                {val > 0 ? '+' : ''}{displayVal.toFixed(1)}{unit}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${m.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span></td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => { setEditingRequestLocal(m); setShowCreateRequestModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit2 size={14}/></button>
                                                                <button onClick={() => handleDeleteMovement(m.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
                    <button form="userForm" disabled={isSaving} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 flex items-center gap-2">
                        {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} {editingUser ? 'Actualizar' : 'Crear'}
                    </button>
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
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [refresh, setRefresh] = useState(0);
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    useEffect(() => { const unsub = store.subscribe(() => setRefresh(prev => prev + 1)); return unsub; }, []);

    const users = useMemo(() => {
        let list = store.users;
        if (currentUser.role === Role.SUPERVISOR) {
            const depts = store.departments.filter(d => d.supervisorIds.includes(currentUser.id)).map(d => d.id);
            list = list.filter(u => depts.includes(u.departmentId));
        }
        if (search) list = list.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
        return [...list].sort((a,b) => a.name.localeCompare(b.name));
    }, [search, currentUser.id, refresh, store.users]);

    const handleBulkVacation = async () => {
        const year = prompt('¿Para qué año desea cargar las vacaciones?', new Date().getFullYear().toString());
        if (!year) return;
        const days = prompt('¿Cuántos días corresponden por empleado?', '31');
        if (!days) return;
        const daysNum = parseFloat(days);
        if (isNaN(daysNum)) { alert('Número de días no válido.'); return; }

        if (confirm(`Se añadirán ${daysNum} días a TODOS los empleados para el año ${year}. ¿Desea continuar?`)) {
            setIsBulkLoading(true);
            try {
                for (const u of store.users) {
                    await store.createRequest({
                        typeId: RequestType.ADJUSTMENT_DAYS,
                        startDate: new Date().toISOString(),
                        hours: daysNum,
                        reason: `Vacaciones del Año ${year}`,
                        isJustified: true,
                        reportedToAdmin: false
                    }, u.id, RequestStatus.APPROVED);
                }
                alert('Carga masiva finalizada con éxito.');
                store.refresh();
            } catch (err) {
                console.error(err);
                alert('Ocurrió un error durante la carga.');
            } finally {
                setIsBulkLoading(false);
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button onClick={() => setViewMode('list')} className={`px-6 py-2 rounded-lg font-bold text-sm ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Listado</button>
                    <button onClick={() => setViewMode('shifts')} className={`px-6 py-2 rounded-lg font-bold text-sm ${viewMode === 'shifts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Planificación</button>
                </div>
                {currentUser.role === Role.ADMIN && (
                    <div className="flex gap-2">
                        <button 
                            onClick={handleBulkVacation} 
                            disabled={isBulkLoading}
                            className="bg-orange-50 text-orange-600 border border-orange-200 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-100 transition-all flex items-center gap-2"
                        >
                            {isBulkLoading ? <Loader2 className="animate-spin" size={18}/> : <CalendarCheck size={18}/>} 
                            Carga Vacaciones Anuales
                        </button>
                        <button 
                            onClick={() => { setEditingUser(null); setShowUserModal(true); }} 
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-blue-700"
                        >
                            <UserPlus size={18}/> Nuevo Empleado
                        </button>
                    </div>
                )}
            </div>
            {viewMode === 'list' ? (
                <div className="space-y-4">
                    <div className="relative max-w-md"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input type="text" placeholder="Buscar empleado..." className="w-full pl-10 pr-4 py-2 border rounded-xl shadow-sm" value={search} onChange={e => setSearch(e.target.value)}/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {users.map(u => (
                            <div key={u.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 group hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <img src={u.avatar} className="w-14 h-14 rounded-full border-2 border-slate-50 object-cover shadow-sm" />
                                    <div className="flex-1 min-w-0"><h4 className="font-bold text-slate-800 truncate">{u.name}</h4><p className="text-xs text-slate-500 truncate">{u.email}</p></div>
                                    {currentUser.role === Role.ADMIN && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                                            <button onClick={() => { if(confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${u.name}? Se borrarán todos sus registros asociados.`)) store.deleteUser(u.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase">Vacaciones</p><p className="text-lg font-bold text-orange-600">{u.daysAvailable.toFixed(1)} <span className="text-xs font-normal text-slate-400">días</span></p></div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase">Horas Extra</p><p className="text-lg font-bold text-blue-600">{u.overtimeHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">h</span></p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : <ShiftScheduler users={users} />}
            {showUserModal && <UserModal onClose={() => setShowUserModal(false)} editingUser={editingUser} />}
        </div>
    );
};

export const AdminSettings: React.FC<{ onViewRequest: (req: LeaveRequest) => void }> = ({ onViewRequest }) => {
    const [adminTab, setAdminTab] = useState<'users' | 'depts' | 'config' | 'ppe' | 'comm'>('users');
    const [refresh, setRefresh] = useState(0);
    useEffect(() => { const unsub = store.subscribe(() => setRefresh(prev => prev + 1)); return unsub; }, []);
    
    const stats = useMemo(() => {
        const total = store.users.length;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        const absentUsers = store.users.filter(u => store.requests.some(r => 
            r.userId === u.id && 
            r.status === RequestStatus.APPROVED && 
            !store.isOvertimeRequest(r.typeId) && 
            todayStr >= r.startDate.split('T')[0] && 
            todayStr <= (r.endDate || r.startDate).split('T')[0]
        ));
        
        return { total, absent: absentUsers.length, absentNames: absentUsers.map(u => u.name), percent: total > 0 ? ((absentUsers.length / total) * 100).toFixed(1) : "0" };
    }, [refresh, store.users, store.requests]);
    
    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Settings className="text-blue-600"/> Administración</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md"><div className="bg-blue-50 p-4 rounded-xl text-blue-600"><Users size={32}/></div><div><p className="text-sm font-bold text-slate-400 uppercase">Total Plantilla</p><h4 className="text-3xl font-black text-slate-800">{stats.total}</h4></div></div>
                <div className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="bg-orange-50 p-4 rounded-xl text-orange-600"><Palmtree size={32}/></div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase">Ausencias Hoy</p>
                        <h4 className="text-3xl font-black text-slate-800">{stats.absent}</h4>
                    </div>
                    {stats.absentNames.length > 0 && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white p-3 rounded-xl shadow-xl border border-slate-100 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Empleados Ausentes:</p>
                            <div className="flex flex-wrap gap-1">
                                {stats.absentNames.map(name => (
                                    <span key={name} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded-full font-bold">{name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md"><div className="bg-purple-50 p-4 rounded-xl text-purple-600"><TrendingUp size={32}/></div><div><p className="text-sm font-bold text-slate-400 uppercase">% Ausentismo</p><h4 className="text-3xl font-black text-slate-800">{stats.percent}%</h4></div></div>
            </div>
            <div className="flex flex-wrap gap-2 border-b border-slate-200">
                <button onClick={() => setAdminTab('users')} className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${adminTab === 'users' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Usuarios</button>
                <button onClick={() => setAdminTab('depts')} className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${adminTab === 'depts' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Dptos</button>
                <button onClick={() => setAdminTab('config')} className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${adminTab === 'config' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>RRHH</button>
                <button onClick={() => setAdminTab('ppe')} className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${adminTab === 'ppe' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>EPIs</button>
                <button onClick={() => setAdminTab('comm')} className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${adminTab === 'comm' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Comunicaciones</button>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[500px]">
                {adminTab === 'users' && <UserManagement currentUser={store.currentUser!} onViewRequest={onViewRequest} />}
                {adminTab === 'depts' && <DepartmentManager />}
                {adminTab === 'config' && <HRConfigManager />}
                {adminTab === 'ppe' && <PPEConfigManager />}
                {adminTab === 'comm' && <CommunicationsManager />}
            </div>
        </div>
    );
};

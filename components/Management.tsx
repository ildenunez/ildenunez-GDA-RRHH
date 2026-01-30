import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Plus, Search, Palmtree, TrendingUp, ChevronRight, Filter, RotateCcw, CalendarDays, Timer, AlertTriangle, CheckCircle, Clock, Info, UserCheck, Trash2
} from 'lucide-react';
import { store } from '../services/store';
import { User, Role, LeaveRequest, RequestStatus, RequestType } from '../types';
import UserDetailModal from './UserDetailModal';
import ShiftScheduler from './ShiftScheduler';

import { AdminStats, DepartmentManager, HRConfigManager, CommunicationsManager, AbsenceQueryManager, MaintenanceManager, EPIManager } from './AdminSubsections';

export const AdminSettings = ({ onViewRequest }: { onViewRequest: (req: LeaveRequest) => void }) => {
    const [activeTab, setActiveTab] = useState('users');

    const stats = useMemo(() => {
        const total = store.users.length;
        const today = new Date().toISOString().split('T')[0];
        const absentToday = store.requests.filter((r: LeaveRequest) => 
            r.status === RequestStatus.APPROVED && 
            !store.isOvertimeRequest(r.typeId) &&
            r.startDate <= today && (r.endDate || r.startDate) >= today
        ).length;
        const perc = total > 0 ? ((absentToday / total) * 100).toFixed(1) : "0";
        return { total, absentToday, perc };
    }, [store.requests, store.users]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Users size={24}/></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Plantilla</p><p className="text-3xl font-black text-slate-800">{stats.total}</p></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center"><Palmtree size={24}/></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ausencias Hoy</p><p className="text-3xl font-black text-slate-800">{stats.absentToday}</p></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><TrendingUp size={24}/></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">% Ausentismo</p><p className="text-3xl font-black text-slate-800">{stats.perc}%</p></div>
                </div>
            </div>

            <div className="flex gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar">
                {[{ id: 'users', label: 'Usuarios' }, { id: 'depts', label: 'Dptos' }, { id: 'hr', label: 'RRHH' }, { id: 'epis', label: 'EPIs' }, { id: 'comms', label: 'Comunicaciones' }, { id: 'queries', label: 'Consultas' }, { id: 'stats', label: 'Estadísticas' }, { id: 'maintenance', label: 'Mantenimiento' }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{tab.label}</button>
                ))}
            </div>

            <div className="pt-2">
                {activeTab === 'users' && <UserManagement currentUser={store.currentUser!} onViewRequest={onViewRequest} />}
                {activeTab === 'depts' && <DepartmentManager />}
                {activeTab === 'hr' && <HRConfigManager />}
                {activeTab === 'epis' && <EPIManager />}
                {activeTab === 'comms' && <CommunicationsManager />}
                {activeTab === 'queries' && <AbsenceQueryManager />}
                {activeTab === 'stats' && <AdminStats />}
                {activeTab === 'maintenance' && <MaintenanceManager />}
            </div>
        </div>
    );
};

export const UserManagement = ({ currentUser, onViewRequest }: { currentUser: User, onViewRequest: (req: LeaveRequest) => void }) => {
    const [view, setView] = useState<'list' | 'scheduler'>('list');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [search, setSearch] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        const unsubscribe = store.subscribe(() => setRefresh(prev => prev + 1));
        return unsubscribe;
    }, []);

    const filteredUsers = useMemo(() => {
        let list = store.users;
        if (currentUser.role === Role.SUPERVISOR) {
            const myDeptIds = store.departments.filter(d => (d.supervisorIds || []).includes(currentUser.id)).map(d => d.id);
            list = list.filter((u: User) => myDeptIds.includes(u.departmentId));
        }
        if (selectedDept) list = list.filter((u: User) => u.departmentId === selectedDept);
        if (search) list = list.filter((u: User) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
        return list.sort((a,b) => a.name.localeCompare(b.name));
    }, [search, selectedDept, currentUser, store.users, refresh]);

    const handleDeleteUser = async (e: React.MouseEvent, userToDelete: User) => {
        e.stopPropagation();
        if (userToDelete.id === currentUser.id) {
            alert("No puedes eliminar tu propia cuenta.");
            return;
        }
        if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${userToDelete.name}? Se borrarán también todos sus registros asociados.`)) {
            try {
                await store.deleteUser(userToDelete.id);
            } catch (error) {
                alert("Error al eliminar el usuario. Es posible que tenga dependencias en la base de datos.");
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button onClick={() => setView('list')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Listado</button>
                    <button onClick={() => setView('scheduler')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'scheduler' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Planificación</button>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative">
                        <Filter className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <select className="pl-9 pr-6 py-2 border border-slate-200 rounded-xl bg-white text-sm outline-none font-bold text-slate-600 appearance-none" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                            <option value="">Dptos.</option>
                            {store.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <button onClick={() => setSelectedUser({ id: 'new', name: '', email: '', role: Role.WORKER, departmentId: '', daysAvailable: 22, overtimeHours: 0 } as any)} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-blue-700 shadow-lg">
                        <Plus size={18}/> Nuevo
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20}/>
                <input type="text" placeholder="Buscar empleado..." className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {view === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((u: User) => (
                        <div key={u.id} onClick={() => setSelectedUser(u)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-6">
                                <img src={u.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover bg-slate-100" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 truncate">{u.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-tighter">{u.email}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={(e) => handleDeleteUser(e, u)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        title="Eliminar empleado"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                    <ChevronRight className="text-slate-200 group-hover:text-blue-500 transition-colors" size={20}/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100/50">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Saldos BBDD Vac.</p>
                                    <p className="text-xl font-black text-orange-600">{u.daysAvailable.toFixed(1)} <span className="text-[10px] font-bold text-slate-300 ml-0.5">D</span></p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100/50">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Saldos BBDD Horas</p>
                                    <p className="text-xl font-black text-blue-600">{u.overtimeHours.toFixed(1)} <span className="text-[10px] font-bold text-slate-300 ml-0.5">H</span></p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <ShiftScheduler users={filteredUsers} />
            )}

            {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onViewRequest={onViewRequest} />}
        </div>
    );
};

export const Approvals = ({ user, onViewRequest }: { user: User, onViewRequest: (req: LeaveRequest) => void }) => {
    const [selectedDeptId, setSelectedDeptId] = useState<string>('');
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        const unsubscribe = store.subscribe(() => setRefresh(prev => prev + 1));
        return unsubscribe;
    }, []);

    const allowedDepts = useMemo(() => {
        if (user.role === Role.ADMIN) return store.departments;
        if (user.role === Role.SUPERVISOR) return store.departments.filter(d => (d.supervisorIds || []).includes(user.id));
        return [];
    }, [user]);

    const filteredPending = useMemo(() => {
        let list = store.getPendingApprovalsForUser(user.id);
        if (selectedDeptId) {
            list = list.filter(r => {
                const u = store.users.find(usr => usr.id === r.userId);
                return u && u.departmentId === selectedDeptId;
            });
        }
        return list;
    }, [user.id, selectedDeptId, refresh]);

    const absenceRequests = filteredPending.filter((r: LeaveRequest) => !store.isOvertimeRequest(r.typeId));
    const overtimeRequests = filteredPending.filter((r: LeaveRequest) => store.isOvertimeRequest(r.typeId));

    const conflictsSummary = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const conflictList: { dateRange: string, users: string[], deptName: string }[] = [];
        const deptsToCheck = selectedDeptId 
            ? store.departments.filter(d => d.id === selectedDeptId)
            : allowedDepts;

        deptsToCheck.forEach(dept => {
            const deptUsers = store.users.filter(u => u.departmentId === dept.id).map(u => u.id);
            const deptReqs = store.requests.filter(r => 
                (r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING) && 
                (!store.isOvertimeRequest(r.typeId) || r.typeId === RequestType.OVERTIME_SPEND_DAYS || r.typeId === RequestType.OVERTIME_TO_DAYS) &&
                deptUsers.includes(r.userId) &&
                (r.endDate || r.startDate) >= today
            );

            for (let i = 0; i < deptReqs.length; i++) {
                for (let j = i + 1; j < deptReqs.length; j++) {
                    const r1 = deptReqs[i];
                    const r2 = deptReqs[j];
                    const s1 = r1.startDate.split('T')[0];
                    const e1 = (r1.endDate || r1.startDate).split('T')[0];
                    const s2 = r2.startDate.split('T')[0];
                    const e2 = (r2.endDate || r2.startDate).split('T')[0];

                    if (s1 <= e2 && e1 >= s2) {
                        const u1 = store.users.find(u => u.id === r1.userId)?.name || '?';
                        const u2 = store.users.find(u => u.id === r2.userId)?.name || '?';
                        const overlapStart = s1 > s2 ? s1 : s2;
                        const overlapEnd = e1 < e2 ? e1 : e2;
                        conflictList.push({
                            dateRange: overlapStart === overlapEnd 
                                ? new Date(overlapStart).toLocaleDateString()
                                : `${new Date(overlapStart).toLocaleDateString()} - ${new Date(overlapEnd).toLocaleDateString()}`,
                            users: [u1, u2],
                            deptName: dept.name
                        });
                    }
                }
            }
        });
        return conflictList;
    }, [store.requests, store.users, allowedDepts, selectedDeptId, refresh]);

    const handleAction = async (id: string, status: RequestStatus) => {
        const isRejection = status === RequestStatus.REJECTED;
        const promptMsg = isRejection ? 'Motivo del rechazo (obligatorio):' : 'Comentario / Observaciones (opcional):';
        
        // Bloqueamos la ejecución para esperar al prompt del navegador
        const comment = window.prompt(promptMsg);
        
        // Si el usuario cancela (null) o deja vacío en caso de rechazo, detenemos la acción
        if (isRejection && !comment) return;
        
        // Enviamos la actualización con el ID del usuario en sesión
        await store.updateRequestStatus(id, status, store.currentUser?.id || user.id, comment || '');
    };

    const Table = ({ requests, title, icon: Icon, color }: { requests: LeaveRequest[], title: string, icon: any, color: string }) => (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Icon className={color}/> {title}</h3>
                <span className="bg-white border px-3 py-1 rounded-full text-xs font-black uppercase text-slate-500">{requests.length} Pendientes</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                            <th className="px-6 py-4">Empleado / Dpto</th>
                            <th className="px-6 py-4">Tipo / Fechas</th>
                            <th className="px-6 py-4">Conflictos</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {requests.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No hay solicitudes pendientes.</td></tr>
                        ) : requests.map((req: LeaveRequest) => {
                            const u = store.users.find(usr => usr.id === req.userId);
                            const conflicts = store.getRequestConflicts(req);
                            
                            const calculateDays = (startStr: string, endStr?: string) => {
                                const start = new Date(startStr);
                                const end = new Date(endStr || startStr);
                                return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                            };

                            return (
                                <tr key={req.id} onClick={() => onViewRequest(req)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={u?.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                                            <div><div className="font-bold text-slate-800">{u?.name}</div><div className="text-[10px] text-slate-400 uppercase font-black">{store.departments.find(d => d.id === u?.departmentId)?.name}</div></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700 flex items-center gap-2">
                                            {store.getTypeLabel(req.typeId)}
                                            {req.typeId === RequestType.WORKED_HOLIDAY ? (
                                                <>
                                                    <span className="px-2 py-0.5 rounded-lg font-black text-[10px] bg-green-100 text-green-700">
                                                        +1d
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-lg font-black text-[10px] bg-green-100 text-green-700">
                                                        +4h
                                                    </span>
                                                </>
                                            ) : req.typeId === RequestType.OVERTIME_TO_DAYS ? (
                                                <>
                                                    <span className="px-2 py-0.5 rounded-lg font-black text-[10px] bg-green-100 text-green-700">
                                                        +{(Math.abs(req.hours || 0) / 8).toFixed(1)}d
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-lg font-black text-[10px] bg-red-100 text-red-700">
                                                        -{Math.abs(req.hours || 0)}h
                                                    </span>
                                                </>
                                            ) : store.isOvertimeRequest(req.typeId) ? (
                                                <span className={`px-2 py-0.5 rounded-lg font-black text-[10px] ${req.hours && req.hours > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {req.hours && req.hours > 0 ? '+' : ''}{req.hours}h
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-lg font-black text-[10px] bg-blue-50 text-blue-600">
                                                    -{calculateDays(req.startDate, req.endDate)}d
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">{new Date(req.startDate).toLocaleDateString()}{req.endDate ? ` - ${new Date(req.endDate).toLocaleDateString()}` : ''}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {conflicts.length > 0 ? (
                                            <div className="flex flex-col gap-1.5 max-w-[220px]">
                                                <span className="flex items-center gap-1 text-red-600 font-black text-[10px] uppercase bg-red-50 px-2 py-1 rounded-lg border border-red-100 w-fit">
                                                    <AlertTriangle size={12}/> {conflicts.length} Coincidencias
                                                </span>
                                                <div className="space-y-1">
                                                    {conflicts.map(other => {
                                                        const otherUser = store.users.find(usr => usr.id === other.userId);
                                                        // Cálculo de fechas de solapamiento
                                                        const s1 = req.startDate.split('T')[0];
                                                        const e1 = (req.endDate || req.startDate).split('T')[0];
                                                        const s2 = other.startDate.split('T')[0];
                                                        const e2 = (other.endDate || other.startDate).split('T')[0];
                                                        
                                                        const overlapStartStr = s1 > s2 ? s1 : s2;
                                                        const overlapEndStr = e1 < e2 ? e1 : e2;
                                                        
                                                        const rangeStr = overlapStartStr === overlapEndStr 
                                                            ? new Date(overlapStartStr).toLocaleDateString()
                                                            : `${new Date(overlapStartStr).toLocaleDateString()} al ${new Date(overlapEndStr).toLocaleDateString()}`;

                                                        return (
                                                            <div key={other.id} className="text-[9px] bg-red-50/40 p-1.5 rounded-lg border border-red-100/50 leading-tight">
                                                                <span className="font-black text-red-800 uppercase tracking-tighter">Coincide con: {otherUser?.name || 'Desconocido'}</span>
                                                                <div className="text-slate-500 font-medium italic mt-0.5">Días: {rangeStr}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-green-600 font-bold text-[10px] uppercase bg-green-50 px-2 py-1 rounded-lg">Sin conflictos</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleAction(req.id, RequestStatus.APPROVED)} className="bg-green-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-green-700 shadow-lg text-xs">Aprobar</button>
                                            <button onClick={() => handleAction(req.id, RequestStatus.REJECTED)} className="bg-white border border-red-200 text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-50 text-xs">Rechazar</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 animate-fade-in">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50 gap-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle className="text-blue-600"/> Gestión de Aprobaciones
                </h3>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Filter className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <select 
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-sm outline-none font-bold text-slate-600 appearance-none" 
                            value={selectedDeptId} 
                            onChange={e => setSelectedDeptId(e.target.value)}
                        >
                            <option value="">Filtrar por Departamento</option>
                            {allowedDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{filteredPending.length} Pendientes</div>
                </div>
            </div>

            <Table title="Solicitudes de Ausencia y Vacaciones" requests={absenceRequests} icon={CalendarDays} color="text-blue-600" />
            <Table title="Solicitudes de Gestión de Horas" requests={overtimeRequests} icon={Timer} color="text-indigo-600" />

            <div className={`p-6 rounded-3xl border transition-all ${conflictsSummary.length > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <h3 className={`font-bold flex items-center gap-2 mb-4 text-base ${conflictsSummary.length > 0 ? 'text-red-800' : 'text-green-800'}`}>
                    {conflictsSummary.length > 0 ? <AlertTriangle size={12} className="text-red-600" /> : <CheckCircle size={12} className="text-green-600" />}
                    {conflictsSummary.length > 0 ? `Conflictos Potenciales (${conflictsSummary.length})` : 'No hay conflictos detectados'}
                </h3>
                {conflictsSummary.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {conflictsSummary.slice(0, 12).map((conf, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm animate-scale-in">
                                <div className="text-sm font-bold text-red-600 mb-1">{conf.dateRange}</div>
                                <div className="text-[10px] font-semibold text-slate-500 uppercase mb-2">{conf.deptName}</div>
                                <div className="flex flex-wrap gap-1">
                                    {conf.users.map(u => <span key={u} className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full font-medium">{u}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-green-700 italic">No hay solapamientos de ausencias para el personal y criterios seleccionados.</p>
                )}
            </div>
        </div>
    );
};

export const UpcomingAbsences = ({ user, onViewRequest }: { user: User, onViewRequest: (req: LeaveRequest) => void }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDeptId, setSelectedDeptId] = useState<string>('');

    const allowedDepts = useMemo(() => {
        if (user.role === Role.ADMIN) return store.departments;
        if (user.role === Role.SUPERVISOR) return store.departments.filter(d => (d.supervisorIds || []).includes(user.id));
        return [];
    }, [user]);

    const upcoming = useMemo(() => {
        let list = store.requests.filter((r: LeaveRequest) => 
            r.status === RequestStatus.APPROVED && 
            (!store.isOvertimeRequest(r.typeId) || r.typeId === RequestType.OVERTIME_SPEND_DAYS || r.typeId === RequestType.OVERTIME_TO_DAYS) && 
            (r.endDate || r.startDate) >= today
        );

        if (user.role === Role.SUPERVISOR) {
            const myDeptIds = allowedDepts.map(d => d.id);
            list = list.filter((r: LeaveRequest) => {
                const u = store.users.find(usr => usr.id === r.userId);
                return u && myDeptIds.includes(u.departmentId);
            });
        }

        if (selectedDeptId) {
            list = list.filter((r: LeaveRequest) => {
                const u = store.users.find(usr => usr.id === r.userId);
                return u && u.departmentId === selectedDeptId;
            });
        }

        return list.sort((a,b) => (a.startDate || '').localeCompare(b.startDate || ''));
    }, [store.requests, user, selectedDeptId, allowedDepts, today]);

    const conflicts = useMemo(() => {
        const conflictList: { dateRange: string, users: string[], deptName: string }[] = [];
        const deptsToCheck = selectedDeptId 
            ? store.departments.filter(d => d.id === selectedDeptId)
            : allowedDepts;

        deptsToCheck.forEach(dept => {
            const deptUsers = store.users.filter(u => u.departmentId === dept.id).map(u => u.id);
            const deptReqs = store.requests.filter(r => 
                r.status === RequestStatus.APPROVED && 
                (!store.isOvertimeRequest(r.typeId) || r.typeId === RequestType.OVERTIME_SPEND_DAYS || r.typeId === RequestType.OVERTIME_TO_DAYS) &&
                deptUsers.includes(r.userId) &&
                (r.endDate || r.startDate) >= today
            );

            for (let i = 0; i < deptReqs.length; i++) {
                for (let j = i + 1; j < deptReqs.length; j++) {
                    const r1 = deptReqs[i];
                    const r2 = deptReqs[j];
                    const s1 = r1.startDate.split('T')[0];
                    const e1 = (r1.endDate || r1.startDate).split('T')[0];
                    const s2 = r2.startDate.split('T')[0];
                    const e2 = (r2.endDate || r2.startDate).split('T')[0];

                    if (s1 <= e2 && e1 >= s2) {
                        const u1 = store.users.find(u => u.id === r1.userId)?.name || '?';
                        const u2 = store.users.find(u => u.id === r2.userId)?.name || '?';
                        
                        const overlapStart = s1 > s2 ? s1 : s2;
                        const overlapEnd = e1 < e2 ? e1 : e2;
                        
                        conflictList.push({
                            dateRange: overlapStart === overlapEnd 
                                ? new Date(overlapStart).toLocaleDateString()
                                : `${new Date(overlapStart).toLocaleDateString()} - ${new Date(overlapEnd).toLocaleDateString()}`,
                            users: [u1, u2],
                            deptName: dept.name
                        });
                    }
                }
            }
        });
        return conflictList;
    }, [store.requests, store.users, allowedDepts, selectedDeptId, today]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50 gap-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><CheckCircle size={20} className="text-blue-600"/> Próximas Ausencias Confirmadas</h3>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Filter className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                            <select 
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-sm outline-none font-bold text-slate-600 appearance-none" 
                                value={selectedDeptId} 
                                onChange={e => setSelectedDeptId(e.target.value)}
                            >
                                <option value="">Todos los Dptos.</option>
                                {allowedDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{upcoming.length} Registros</div>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcoming.length === 0 ? <div className="col-span-full py-12 text-center text-slate-400 italic">No hay ausencias programadas {selectedDeptId ? 'para este departamento' : ''}.</div> : upcoming.map((req: LeaveRequest) => {
                        const u = store.users.find(usr => usr.id === req.userId);
                        const approverName = req.resolvedBy ? store.users.find(usr => usr.id === req.resolvedBy)?.name : null;
                        
                        return (
                            <div key={req.id} onClick={() => onViewRequest(req)} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer bg-white group relative overflow-hidden flex flex-col justify-between h-full">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                                <div>
                                    <div className="flex items-center gap-3 mb-4"><img src={u?.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" /><div><div className="font-bold text-slate-800 text-sm">{u?.name}</div><div className="text-[10px] text-slate-400 uppercase font-bold">{store.departments.find(d => d.id === u?.departmentId)?.name}</div></div></div>
                                    <div className="space-y-2 mb-4"><div className="flex justify-between items-center"><span className="text-xs font-black text-blue-600 uppercase">{store.getTypeLabel(req.typeId)}</span><span className="text-[10px] font-bold text-slate-400">{new Date(req.startDate).toLocaleDateString()}</span></div></div>
                                </div>
                                {approverName && (
                                    <div className="mt-auto pt-3 border-t border-slate-50 flex items-center gap-2">
                                        <div className="p-1 bg-green-50 text-green-600 rounded">
                                            <UserCheck size={12}/>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Validado por: <span className="text-green-700">{approverName}</span></p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={`p-6 rounded-3xl border transition-all ${conflicts.length > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <h3 className={`font-bold flex items-center gap-2 mb-4 text-base ${conflicts.length > 0 ? 'text-red-800' : 'text-green-800'}`}>
                    {conflicts.length > 0 ? <AlertTriangle size={12} className="text-red-600" /> : <CheckCircle size={12} className="text-green-600" />}
                    {conflicts.length > 0 ? `Conflictos Detectados en el Equipo (${conflicts.length})` : 'No hay conflictos detectados'}
                </h3>
                {conflicts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {conflicts.map((conf, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm animate-scale-in">
                                <div className="text-sm font-bold text-red-600 mb-1">{conf.dateRange}</div>
                                <div className="text-[10px] font-semibold text-slate-500 uppercase mb-2">{conf.deptName}</div>
                                <div className="flex flex-wrap gap-1">
                                    {conf.users.map(u => <span key={u} className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full font-medium">{u}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-green-700 italic">No hay solapamientos de ausencias aprobadas para el personal y criterios seleccionados.</p>
                )}
            </div>
        </div>
    );
};
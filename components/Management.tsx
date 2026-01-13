import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Plus, Search, Palmtree, TrendingUp, ChevronRight, Filter, RotateCcw, CalendarDays, Timer, AlertTriangle, CheckCircle, Clock, Info
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
                                <ChevronRight className="text-slate-200 group-hover:text-blue-500 transition-colors" size={20}/>
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
    const pendingRequests = store.getPendingApprovalsForUser(user.id);
    const absenceRequests = pendingRequests.filter((r: LeaveRequest) => !store.isOvertimeRequest(r.typeId));
    const overtimeRequests = pendingRequests.filter((r: LeaveRequest) => store.isOvertimeRequest(r.typeId));

    const handleAction = async (id: string, status: RequestStatus) => {
        const comment = status === RequestStatus.REJECTED ? prompt('Motivo del rechazo:') || '' : '';
        if (status === RequestStatus.REJECTED && !comment) return;
        await store.updateRequestStatus(id, status, user.id, comment);
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
                            
                            // Cálculo de días para ausencias
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
                                            <span className="flex items-center gap-1 text-red-600 font-black text-[10px] uppercase bg-red-50 px-2 py-1 rounded-lg border border-red-100 w-fit"><AlertTriangle size={12}/> {conflicts.length} Coincidencias</span>
                                        ) : <span className="text-green-600 font-bold text-[10px] uppercase bg-green-50 px-2 py-1 rounded-lg">Sin conflictos</span>}
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
            <Table title="Solicitudes de Ausencia y Vacaciones" requests={absenceRequests} icon={CalendarDays} color="text-blue-600" />
            <Table title="Solicitudes de Gestión de Horas" requests={overtimeRequests} icon={Timer} color="text-indigo-600" />
        </div>
    );
};

export const UpcomingAbsences = ({ user, onViewRequest }: { user: User, onViewRequest: (req: LeaveRequest) => void }) => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = useMemo(() => {
        let list = store.requests.filter((r: LeaveRequest) => r.status === RequestStatus.APPROVED && !store.isOvertimeRequest(r.typeId) && (r.endDate || r.startDate) >= today);
        if (user.role === Role.SUPERVISOR) {
            const myDeptIds = store.departments.filter(d => (d.supervisorIds || []).includes(user.id)).map(d => d.id);
            list = list.filter((r: LeaveRequest) => {
                const u = store.users.find(usr => usr.id === r.userId);
                return u && myDeptIds.includes(u.departmentId);
            });
        }
        return list.sort((a,b) => (a.startDate || '').localeCompare(b.startDate || ''));
    }, [store.requests, user]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><CheckCircle className="text-blue-600"/> Próximas Ausencias Confirmadas</h3>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{upcoming.length} Registros</div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcoming.length === 0 ? <div className="col-span-full py-12 text-center text-slate-400 italic">No hay ausencias programadas.</div> : upcoming.map((req: LeaveRequest) => {
                        const u = store.users.find(usr => usr.id === req.userId);
                        return (
                            <div key={req.id} onClick={() => onViewRequest(req)} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer bg-white group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                                <div className="flex items-center gap-3 mb-4"><img src={u?.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" /><div><div className="font-bold text-slate-800 text-sm">{u?.name}</div><div className="text-[10px] text-slate-400 uppercase font-bold">{store.departments.find(d => d.id === u?.departmentId)?.name}</div></div></div>
                                <div className="space-y-2"><div className="flex justify-between items-center"><span className="text-xs font-black text-blue-600 uppercase">{store.getTypeLabel(req.typeId)}</span><span className="text-[10px] font-bold text-slate-400">{new Date(req.startDate).toLocaleDateString()}</span></div></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
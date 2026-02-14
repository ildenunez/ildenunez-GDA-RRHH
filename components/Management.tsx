import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Plus, Search, Palmtree, TrendingUp, ChevronRight, Filter, RotateCcw, CalendarDays, Timer, AlertTriangle, CheckCircle, Clock, Info, UserCheck, Trash2, LayoutGrid, Calendar as CalendarIcon, Printer, ChevronLeft, Star, X
} from 'lucide-react';
import { store } from '../services/store';
import { User, Role, LeaveRequest, RequestStatus, RequestType, ShiftType } from '../types';
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
                                    {/* Fixed missing opening bracket for h4 tag which caused cascading name resolution errors */}
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
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Saldos Vac.</p>
                                    <p className="text-xl font-black text-orange-600">{(u.daysAvailable ?? 0).toFixed(1)} <span className="text-[10px] font-bold text-slate-300 ml-0.5">D</span></p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100/50">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Saldos Horas</p>
                                    <p className="text-xl font-black text-blue-600">{(u.overtimeHours ?? 0).toFixed(1)} <span className="text-[10px] font-bold text-slate-300 ml-0.5">H</span></p>
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
        return list.sort((a,b) => a.startDate.localeCompare(b.startDate));
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
        const comment = window.prompt(promptMsg);
        if (isRejection && !comment) return;
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
                                                <><span className="px-2 py-0.5 rounded-lg font-black text-[10px] bg-green-100 text-green-700">+1d</span><span className="px-2 py-0.5 rounded-lg font-black text-[10px] bg-green-100 text-green-700">+4h</span></>
                                            ) : req.typeId === RequestType.OVERTIME_TO_DAYS ? (
                                                <><span className="px-2 py-0.5 rounded-lg font-black text-[10px] bg-green-100 text-green-700">+{(Math.abs(req.hours || 0) / 8).toFixed(1)}d</span><span className="px-2 py-0.5 rounded-lg font-black text-[10px] bg-red-100 text-red-700">-{Math.abs(req.hours || 0)}h</span></>
                                            ) : store.isOvertimeRequest(req.typeId) ? (
                                                <span className={`px-2 py-0.5 rounded-lg font-black text-[10px] ${req.hours && req.hours > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{req.hours && req.hours > 0 ? '+' : ''}{req.hours}h</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-lg font-black text-[10px] bg-blue-50 text-blue-600">-{calculateDays(req.startDate, req.endDate)}d</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">{new Date(req.startDate).toLocaleDateString()}{req.endDate ? ` - ${new Date(req.endDate).toLocaleDateString()}` : ''}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {conflicts.length > 0 ? (
                                            <div className="flex flex-col gap-1.5 max-w-[220px]">
                                                <span className="flex items-center gap-1 text-red-600 font-black text-[10px] uppercase bg-red-50 px-2 py-1 rounded-lg border border-red-100 w-fit"><AlertTriangle size={12}/> {conflicts.length} Coincidencias</span>
                                            </div>
                                        ) : <span className="text-green-600 font-bold text-[10px] uppercase bg-green-50 px-2 py-1 rounded-lg">Sin conflictos</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleAction(req.id, RequestStatus.APPROVED)} className="bg-green-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-green-700 text-xs">Aprobar</button>
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
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><CheckCircle className="text-blue-600"/> Gestión de Aprobaciones</h3>
                <div className="relative md:w-64">
                    <Filter className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <select className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-sm outline-none font-bold text-slate-600 appearance-none" value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)}>
                        <option value="">Todos los Departamentos</option>
                        {allowedDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
            </div>
            <Table title="Ausencias y Vacaciones" requests={absenceRequests} icon={CalendarDays} color="text-blue-600" />
            <Table title="Gestión de Horas" requests={overtimeRequests} icon={Timer} color="text-indigo-600" />
        </div>
    );
};

interface PrintMonthProps { date: Date; requests: LeaveRequest[]; deptId: string; }
const PrintMonth: React.FC<PrintMonthProps> = ({ date, requests, deptId }) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInM = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInM }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return {
            dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
            day: i + 1,
            weekday: d.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase(),
            isWeekend: [0, 6].includes(d.getDay())
        };
    });

    const groupedUsers = useMemo(() => {
        let list = store.users;
        if (deptId) list = list.filter(u => u.departmentId === deptId);
        
        const depts = store.departments.filter(d => list.some(u => u.departmentId === d.id))
                        .sort((a,b) => a.name.localeCompare(b.name));
        
        return depts.map(d => ({
            dept: d,
            users: list.filter(u => u.departmentId === d.id).sort((a,b) => a.name.localeCompare(b.name))
        }));
    }, [store.users, store.departments, deptId]);

    return (
        <div className="break-after-page mb-10">
            <h4 className="text-xl font-black uppercase text-slate-800 border-b-4 border-slate-900 mb-6 pb-2">{date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h4>
            <div className="inline-block min-w-full">
                <div className="grid" style={{ gridTemplateColumns: `150px repeat(${daysInM}, 25px)` }}>
                    <div className="bg-slate-100 border-b-2 border-r border-slate-200 p-1 text-[8px] font-black uppercase flex items-center">Empleado</div>
                    {days.map(d => {
                        const holiday = store.config.holidays.find(h => h.date === d.dateStr);
                        return (
                            <div key={d.day} className={`border-b-2 border-r border-slate-200 flex flex-col items-center justify-center p-0.5 ${holiday ? 'bg-red-50 text-red-600' : d.isWeekend ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-500'}`}>
                                <span className="text-[8px] font-black leading-none">{d.day}</span>
                                <span className="text-[6px] font-bold leading-none">{d.weekday}</span>
                            </div>
                        );
                    })}

                    {groupedUsers.map(deptGroup => (
                        <React.Fragment key={deptGroup.dept.id}>
                            <div className="bg-slate-50/80 border-b border-r border-slate-200 p-1 h-6 flex items-center" style={{ gridColumn: '1 / -1' }}>
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{deptGroup.dept.name}</span>
                            </div>
                            {deptGroup.users.map(user => (
                                <React.Fragment key={user.id}>
                                    <div className="border-b border-r border-slate-200 p-1 flex items-center h-7">
                                        <span className="text-[8px] font-black text-slate-800 truncate uppercase">{user.name}</span>
                                    </div>
                                    {days.map(d => {
                                        const absence = requests.find(r => {
                                            const s = r.startDate.split('T')[0];
                                            const e = (r.endDate || r.startDate).split('T')[0];
                                            return r.userId === user.id && d.dateStr >= s && d.dateStr <= e;
                                        });
                                        const holiday = store.config.holidays.find(h => h.date === d.dateStr);
                                        
                                        let bgColor = 'transparent';
                                        let cellContent = null;
                                        if (holiday) {
                                            bgColor = '#fee2e2';
                                        } else if (absence) {
                                            const typeId = String(absence.typeId);
                                            const isBaja = typeId === RequestType.SICKNESS || typeId.includes('baja');
                                            const isDL = typeId === RequestType.OVERTIME_SPEND_DAYS;

                                            if (isBaja) {
                                                bgColor = '#ef4444';
                                                cellContent = 'B';
                                            } else if (isDL) {
                                                bgColor = '#3b82f6';
                                                cellContent = 'DL';
                                            } else {
                                                bgColor = '#dcfce7';
                                                cellContent = 'VAC';
                                            }
                                        } else if (d.isWeekend) {
                                            bgColor = '#f8fafc';
                                        }

                                        return (
                                            <div key={d.day} className="border-b border-r border-slate-100 flex items-center justify-center h-7" style={{ backgroundColor: bgColor }}>
                                                <span className={`text-[7px] font-black ${cellContent === 'B' || cellContent === 'DL' ? 'text-white' : 'text-green-700'}`}>
                                                    {cellContent}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            <div className="mt-4 flex gap-4 text-[8px] font-bold text-slate-500 uppercase border-t border-slate-100 pt-2">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[#ef4444] rounded-sm"></div> Baja (B)</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[#dcfce7] border border-green-200 rounded-sm"></div> Vacaciones (VAC)</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[#3b82f6] rounded-sm"></div> Canje (DL)</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[#fee2e2] rounded-sm"></div> Festivo</span>
            </div>
        </div>
    );
};

export const UpcomingAbsences = ({ user, onViewRequest }: { user: User, onViewRequest: (req: LeaveRequest) => void }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDeptId, setSelectedDeptId] = useState<string>('');
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printMonths, setPrintMonths] = useState(3);
    const [currentCalDate, setCurrentCalDate] = useState(new Date());

    const allowedDepts = useMemo(() => {
        if (user.role === Role.ADMIN) return store.departments;
        if (user.role === Role.SUPERVISOR) return store.departments.filter(d => (d.supervisorIds || []).includes(user.id));
        return [];
    }, [user]);

    const upcoming = useMemo(() => {
        const currentYear = currentCalDate.getFullYear();
        const yearStart = `${currentYear}-01-01`;
        const yearEnd = `${currentYear}-12-31`;

        let list = store.requests.filter((r: LeaveRequest) => 
            r.status === RequestStatus.APPROVED && 
            (!store.isOvertimeRequest(r.typeId) || r.typeId === RequestType.OVERTIME_SPEND_DAYS) && 
            (r.startDate <= yearEnd && (r.endDate || r.startDate) >= yearStart)
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
    }, [store.requests, user, selectedDeptId, allowedDepts, currentCalDate.getFullYear()]);

    const usersByDept = useMemo(() => {
        let list = store.users;
        if (user.role === Role.SUPERVISOR) {
            const myDeptIds = allowedDepts.map(d => d.id);
            list = list.filter(u => myDeptIds.includes(u.departmentId));
        }
        if (selectedDeptId) {
            list = list.filter(u => u.departmentId === selectedDeptId);
        }
        
        const activeDepts = store.departments.filter(d => list.some(u => u.departmentId === d.id))
                        .sort((a,b) => a.name.localeCompare(b.name));
        
        return activeDepts.map(d => ({
            dept: d,
            users: list.filter(u => u.departmentId === d.id).sort((a,b) => a.name.localeCompare(b.name))
        }));
    }, [store.users, store.departments, user, selectedDeptId, allowedDepts]);

    const monthsData = useMemo(() => {
        const year = currentCalDate.getFullYear();
        return Array.from({ length: 12 }).map((_, monthIdx) => {
            const first = new Date(year, monthIdx, 1);
            const mIdx = first.getMonth();
            const mYear = first.getFullYear();
            const daysInM = new Date(mYear, mIdx + 1, 0).getDate();
            const days = [];
            for (let d = 1; d <= daysInM; d++) {
                const dObj = new Date(mYear, mIdx, d);
                days.push({
                    dateStr: `${mYear}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                    day: d,
                    isWeekend: [0, 6].includes(dObj.getDay()),
                    weekday: dObj.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase()
                });
            }
            return { 
                monthName: first.toLocaleString('es-ES', { month: 'long', year: 'numeric' }), 
                monthKey: `${mYear}-${String(mIdx + 1).padStart(2, '0')}`, 
                days 
            };
        });
    }, [currentCalDate]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50 gap-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><CheckCircle size={20} className="text-blue-600"/> Próximas Ausencias</h3>
                        <div className="flex p-1 bg-slate-200/50 rounded-xl">
                            <button onClick={() => setView('list')} className={`p-2 rounded-lg ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><LayoutGrid size={18}/></button>
                            <button onClick={() => setView('calendar')} className={`p-2 rounded-lg ${view === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><CalendarIcon size={18}/></button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select className="pl-4 pr-10 py-2 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-600 appearance-none" value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)}>
                            <option value="">Todos los Dptos.</option>
                            {allowedDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <button onClick={() => setShowPrintModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-black transition-all"><Printer size={16}/> Imprimir</button>
                    </div>
                </div>

                {view === 'list' ? (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcoming.filter(r => (r.endDate || r.startDate) >= today).length === 0 ? <div className="col-span-full py-12 text-center text-slate-400 italic">No hay ausencias programadas.</div> : upcoming.filter(r => (r.endDate || r.startDate) >= today).map((req: LeaveRequest) => {
                            const u = store.users.find(usr => usr.id === req.userId);
                            return (
                                <div key={req.id} onClick={() => onViewRequest(req)} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer bg-white group relative overflow-hidden flex flex-col justify-between h-full">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                                    <div className="flex items-center gap-3 mb-4"><img src={u?.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" /><div><div className="font-bold text-slate-800 text-sm">{u?.name}</div><div className="text-[10px] text-slate-400 uppercase font-bold">{store.departments.find(d => d.id === u?.departmentId)?.name}</div></div></div>
                                    <div className="flex justify-between items-center mt-auto"><span className="text-xs font-black text-blue-600 uppercase">{store.getTypeLabel(req.typeId)}</span><span className="text-[10px] font-bold text-slate-400">{new Date(req.startDate).toLocaleDateString()}</span></div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col h-[700px] relative overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between z-40">
                            <div className="flex items-center gap-4">
                                <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                                    <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear() - 1, 0, 1))} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600"><ChevronLeft size={20}/></button>
                                    <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear() + 1, 0, 1))} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600"><ChevronRight size={20}/></button>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Año {currentCalDate.getFullYear()}</h4>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-12 bg-slate-100/50">
                            {monthsData.map(m => (
                                <div key={m.monthKey} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="bg-slate-900 text-white px-6 py-3">
                                        <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                            <CalendarIcon size={14} className="text-blue-400"/> {m.monthName}
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto no-scrollbar">
                                        <div className="inline-block min-w-full">
                                            <div className="grid" style={{ gridTemplateColumns: `180px repeat(${m.days.length}, 36px)` }}>
                                                <div className="sticky left-0 z-30 bg-slate-50 border-b border-r border-slate-200 p-2 h-12 flex items-center text-[10px] font-black text-slate-500 uppercase">Empleado</div>
                                                {m.days.map(d => {
                                                    const holiday = store.config.holidays.find(h => h.date === d.dateStr);
                                                    return (
                                                        <div key={d.dateStr} className={`border-b border-r border-slate-200 flex flex-col items-center justify-center h-12 ${holiday ? 'bg-red-50 text-red-600' : d.isWeekend ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-500'}`}>
                                                            <span className="text-[11px] font-black">{d.day}</span>
                                                            <span className="text-[8px] font-bold uppercase opacity-50">{d.weekday}</span>
                                                        </div>
                                                    );
                                                })}

                                                {usersByDept.map(deptGroup => (
                                                    <React.Fragment key={deptGroup.dept.id}>
                                                        {/* Fila Cabecera Dpto */}
                                                        <div className="bg-slate-100/80 px-4 py-1.5 flex items-center border-b border-r border-slate-200" style={{ gridColumn: '1 / -1' }}>
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">{deptGroup.dept.name}</span>
                                                        </div>
                                                        {deptGroup.users.map(userItem => (
                                                            <React.Fragment key={userItem.id}>
                                                                <div className="sticky left-0 z-20 bg-white border-b border-r border-slate-200 px-4 flex items-center gap-3 h-10 shadow-sm">
                                                                    <img src={userItem.avatar} className="w-6 h-6 rounded-full border border-slate-100 object-cover" />
                                                                    <span className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tighter">{userItem.name}</span>
                                                                </div>
                                                                {m.days.map(d => {
                                                                    const absence = upcoming.find(r => {
                                                                        const s = r.startDate.split('T')[0];
                                                                        const e = (r.endDate || r.startDate).split('T')[0];
                                                                        return r.userId === userItem.id && d.dateStr >= s && d.dateStr <= e;
                                                                    });
                                                                    const holiday = store.config.holidays.find(h => h.date === d.dateStr);
                                                                    
                                                                    let bgColor = 'transparent';
                                                                    let cellContent = null;
                                                                    
                                                                    if (holiday) {
                                                                        bgColor = '#fee2e2';
                                                                    } else if (absence) {
                                                                        const typeId = String(absence.typeId);
                                                                        const isBaja = typeId === RequestType.SICKNESS || typeId.includes('baja');
                                                                        const isDL = typeId === RequestType.OVERTIME_SPEND_DAYS;

                                                                        if (isBaja) {
                                                                            bgColor = '#ef4444';
                                                                            cellContent = <span className="text-[8px] font-black text-white">B</span>;
                                                                        } else if (isDL) {
                                                                            bgColor = '#3b82f6';
                                                                            cellContent = <span className="text-[8px] font-black text-white">DL</span>;
                                                                        } else {
                                                                            bgColor = '#dcfce7';
                                                                            cellContent = <span className="text-[8px] font-black text-green-700">VAC</span>;
                                                                        }
                                                                    } else if (d.isWeekend) {
                                                                        bgColor = '#f8fafc';
                                                                    }

                                                                    return (
                                                                        <div 
                                                                            key={d.dateStr} 
                                                                            className={`border-b border-r border-slate-100 h-10 flex items-center justify-center transition-all ${absence ? 'cursor-pointer hover:opacity-80' : ''}`}
                                                                            style={{ backgroundColor: bgColor }}
                                                                            onClick={() => absence && onViewRequest(absence)}
                                                                        >
                                                                            {cellContent}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </React.Fragment>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white border-t border-slate-200 p-3 flex justify-center gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Baja Médica (B)</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm"></div> Vacaciones (VAC)</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Canje Días (DL)</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-50 rounded-sm border border-red-100"></div> Festivo</div>
                        </div>
                    </div>
                )}
            </div>

            {showPrintModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-4 backdrop-blur-sm print-hidden">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8">
                        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Reporte de Ausencias</h3><button onClick={() => setShowPrintModal(false)}><X size={24}/></button></div>
                        <div className="space-y-6">
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rango de Meses</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 3, 12].map(m => (
                                    <button 
                                        key={m} 
                                        onClick={() => setPrintMonths(m)} 
                                        className={`py-3 rounded-xl text-sm font-bold border transition-all ${printMonths === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                                    >
                                        {m === 1 ? '1 Mes' : m === 3 ? '3 Meses' : 'Anual'}
                                    </button>
                                ))}
                            </div></div>
                            <button onClick={() => { window.print(); setShowPrintModal(false); }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><Printer size={20}/> Generar Informe</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="hidden print:block bg-white min-h-screen p-8">
                <div className="flex items-center gap-6 mb-12 border-b-4 border-slate-900 pb-6"><img src="https://termosycalentadoresgranada.com/wp-content/uploads/2025/08/https___cdn.evbuc_.com_images_677236879_73808960223_1_original.png" alt="GdA" className="w-24 h-24 object-contain" /><div><h1 className="text-4xl font-black uppercase tracking-tighter">Planificación de Ausencias</h1><p className="text-sm text-slate-400">Generado el {new Date().toLocaleDateString()} - Portal RRHH GdA</p></div></div>
                {Array.from({ length: printMonths }).map((_, i) => { 
                    const startYear = currentCalDate.getFullYear();
                    const startMonth = printMonths === 12 ? 0 : currentCalDate.getMonth();
                    const d = new Date(startYear, startMonth + i, 1); 
                    return <PrintMonth key={i} date={d} requests={upcoming} deptId={selectedDeptId} />; 
                })}
            </div>
        </div>
    );
};
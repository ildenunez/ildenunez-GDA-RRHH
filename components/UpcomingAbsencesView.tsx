import React, { useState, useMemo, useEffect } from 'react';
import { User, RequestStatus, Role, RequestType, LeaveRequest } from '../types';
import { store } from '../services/store';
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Calendar as CalendarIcon, 
  RefreshCcw, 
  Palmtree,
  Thermometer,
  User as UserIcon,
  Star,
  Users,
  Search,
  ShieldCheck,
  Info,
  Loader2,
  ChevronDown
} from 'lucide-react';

interface UpcomingAbsencesViewProps {
  currentUser: User;
  onViewRequest: (req: LeaveRequest) => void;
}

const UpcomingAbsencesView: React.FC<UpcomingAbsencesViewProps> = ({ currentUser, onViewRequest }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => setTick(t => t + 1));
    return unsubscribe;
  }, []);

  const allowedDepts = useMemo(() => {
    if (currentUser.role === Role.ADMIN) return store.departments;
    if (currentUser.role === Role.SUPERVISOR) return store.departments.filter(d => (d.supervisorIds || []).includes(currentUser.id));
    return [];
  }, [currentUser]);

  const filteredUsers = useMemo(() => {
    let list = store.users;
    
    // Scoping
    if (currentUser.role === Role.SUPERVISOR) {
        const myDeptIds = allowedDepts.map(d => d.id);
        list = list.filter(u => myDeptIds.includes(u.departmentId));
    } else if (currentUser.role !== Role.ADMIN) {
        return []; // Workers shouldn't see this view based on requirements
    }

    if (selectedDept) list = list.filter(u => u.departmentId === selectedDept);
    if (search) list = list.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
    
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [currentUser, selectedDept, search, allowedDepts, tick]);

  const monthsData = useMemo(() => {
    const year = currentDate.getFullYear();
    
    return Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(year, i, 1);
      const mIdx = d.getMonth();
      const mYear = d.getFullYear();
      const daysInM = new Date(mYear, mIdx + 1, 0).getDate();
      const days = [];
      for (let day = 1; day <= daysInM; day++) {
        const dObj = new Date(mYear, mIdx, day);
        days.push({
          dateStr: `${mYear}-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          day,
          isWeekend: [0, 6].includes(dObj.getDay()),
          weekday: dObj.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase()
        });
      }
      return { 
        monthName: d.toLocaleString('es-ES', { month: 'long', year: 'numeric' }), 
        monthKey: `${mYear}-${String(mIdx + 1).padStart(2, '0')}`, 
        monthShort: d.toLocaleString('es-ES', { month: 'short' }).charAt(0).toUpperCase(),
        days 
      };
    });
  }, [currentDate]);

  const scrollToMonth = (monthKey: string) => {
    const el = document.getElementById(`month-${monthKey}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getAbsence = (userId: string, dateStr: string) => {
    return store.requests.find(r => {
        const start = r.startDate.split(/[ T]/)[0];
        const end = (r.endDate || r.startDate).split(/[ T]/)[0];
        return r.userId === userId && 
               (r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING) && 
               !store.isOvertimeRequest(r.typeId) && 
               dateStr >= start && dateStr <= end;
    });
  };

  const getAbsenceStyle = (typeId: string) => {
      const label = store.getTypeLabel(typeId).toLowerCase();
      if (label.includes('baja') || label.includes('medica')) return { bg: 'bg-red-100', text: 'text-red-700', label: 'BAJA', icon: Thermometer };
      if (label.includes('asunto') || label.includes('person')) return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'AP', icon: UserIcon };
      if (label.includes('canje') || label.includes('extra')) return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'DL', icon: ShieldCheck };
      return { bg: 'bg-green-100', text: 'text-green-700', label: 'VAC', icon: Palmtree };
  };

  const monthTotals = useMemo(() => {
    const totals: Record<string, { vac: number, dl_ap: number, baja: number }> = {};
    monthsData.forEach(m => {
      let vac = 0;
      let dl_ap = 0;
      let baja = 0;
      
      filteredUsers.forEach(user => {
        m.days.forEach(d => {
          if (!d.isWeekend) {
            const abs = getAbsence(user.id, d.dateStr);
            if (abs && abs.status === RequestStatus.APPROVED) {
              // Excluir ajustes de admin para vacaciones
              if (abs.typeId === RequestType.ADJUSTMENT_DAYS || abs.typeId === RequestType.ADJUSTMENT_OVERTIME) return;

              const style = getAbsenceStyle(abs.typeId);
              if (style.label === 'VAC') {
                vac++;
              } else if (style.label === 'DL' || style.label === 'AP') {
                dl_ap++;
              } else if (style.label === 'BAJA') {
                baja++;
              }
            }
          }
        });
      });
      totals[m.monthKey] = { vac, dl_ap, baja };
    });
    return totals;
  }, [monthsData, filteredUsers, tick]);

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Header & Filters */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <CalendarIcon size={24}/>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Próximas Ausencias</h2>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Vista de Equipo</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex bg-slate-100 rounded-xl p-1">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1))} className="p-2 hover:bg-white rounded-lg text-slate-600 transition-all shadow-sm" title="Año Anterior"><ChevronLeft size={18}/></button>
                    <div className="px-3 flex items-center text-sm font-black text-slate-700">{currentDate.getFullYear()}</div>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1))} className="p-2 hover:bg-white rounded-lg text-slate-600 transition-all shadow-sm" title="Año Siguiente"><ChevronRight size={18}/></button>
                </div>

                <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <select 
                        className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer" 
                        onChange={e => scrollToMonth(e.target.value)}
                        value=""
                    >
                        <option value="" disabled>Ir al mes...</option>
                        {monthsData.map(m => <option key={m.monthKey} value={m.monthKey}>{m.monthName}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16}/>
                </div>

                <div className="relative flex-1 md:w-48">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Buscar empleado..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <select 
                        className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer" 
                        value={selectedDept} 
                        onChange={e => setSelectedDept(e.target.value)}
                    >
                        <option value="">Todos los Dptos.</option>
                        {allowedDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16}/>
                </div>
                <button 
                    disabled={isRefreshing}
                    onClick={async () => { setIsRefreshing(true); await store.refresh(); setIsRefreshing(false); }} 
                    className="p-2.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-xl transition-all shadow-sm"
                >
                    {isRefreshing ? <Loader2 className="animate-spin" size={18}/> : <RefreshCcw size={18}/>}
                </button>
            </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative">
            {/* QUICK NAV SIDEBAR */}
            <div className="hidden lg:flex absolute right-4 top-24 flex-col gap-1 z-30 bg-white/60 backdrop-blur-sm p-1 rounded-full border border-slate-200 shadow-sm">
                {monthsData.map(m => (
                    <button 
                        key={m.monthKey}
                        onClick={() => scrollToMonth(m.monthKey)}
                        title={m.monthName}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black hover:bg-blue-600 hover:text-white transition-all text-slate-400"
                    >
                        {m.monthShort}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto no-scrollbar">
                <div className="inline-block min-w-full">
                    {monthsData.map((m, mIdx) => (
                        <div key={m.monthKey} id={`month-${m.monthKey}`} className={`${mIdx > 0 ? 'border-t-4 border-slate-50' : ''} scroll-mt-4`}>
                            <div className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center sticky left-0">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                        <CalendarIcon size={14} className="text-blue-400"/> {m.monthName}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-lg text-[9px] border border-green-500/30 font-bold">
                                            {monthTotals[m.monthKey]?.vac || 0} VAC
                                        </span>
                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-lg text-[9px] border border-blue-500/30 font-bold">
                                            {monthTotals[m.monthKey]?.dl_ap || 0} DL/AP
                                        </span>
                                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-lg text-[9px] border border-red-500/30 font-bold">
                                            {monthTotals[m.monthKey]?.baja || 0} BAJA
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{filteredUsers.length} Empleados en vista</span>
                            </div>
                            
                            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${m.days.length}, 36px)` }}>
                                {/* Header Row */}
                                <div className="sticky left-0 z-20 bg-slate-50 border-b border-r border-slate-200 p-2 h-12 flex items-center text-[10px] font-black text-slate-500 uppercase tracking-tighter shadow-sm">Empleado</div>
                                {m.days.map(d => {
                                    const holiday = store.config.holidays.find(h => h.date === d.dateStr);
                                    const isToday = new Date().toISOString().split('T')[0] === d.dateStr;
                                    return (
                                        <div key={d.dateStr} className={`border-b border-r border-slate-200 flex flex-col items-center justify-center h-12 ${holiday ? 'bg-red-50 text-red-600 font-black' : d.isWeekend ? 'bg-slate-100 text-slate-400 font-bold' : 'bg-white text-slate-500 font-bold'} ${isToday ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}`}>
                                            <span className="text-[11px] leading-none">{d.day}</span>
                                            <span className="text-[7px] uppercase opacity-50 mt-1 leading-none">{d.weekday}</span>
                                            {holiday && <Star size={8} fill="currentColor" className="mt-0.5"/>}
                                        </div>
                                    );
                                })}

                                {/* User Rows */}
                                {filteredUsers.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-slate-400 italic bg-slate-50/50">
                                        No se han encontrado empleados que coincidan con los filtros.
                                    </div>
                                ) : filteredUsers.map(user => (
                                    <React.Fragment key={user.id}>
                                        <div className="sticky left-0 z-10 bg-white border-b border-r border-slate-200 px-4 flex items-center gap-3 h-10 shadow-sm">
                                            <img src={user.avatar} className="w-6 h-6 rounded-full border border-slate-100 object-cover" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-slate-700 truncate uppercase tracking-tighter leading-tight">{user.name}</p>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase truncate">{store.departments.find(d => d.id === user.departmentId)?.name}</p>
                                            </div>
                                        </div>
                                        {m.days.map(d => {
                                            const absence = getAbsence(user.id, d.dateStr);
                                            const style = absence ? getAbsenceStyle(absence.typeId) : null;
                                            const holiday = store.config.holidays.find(h => h.date === d.dateStr);

                                            return (
                                                <div 
                                                    key={d.dateStr} 
                                                    onClick={() => absence && onViewRequest(absence)}
                                                    className={`border-b border-r border-slate-100 h-10 flex items-center justify-center relative transition-all text-[9px] font-black
                                                        ${absence ? (absence.status === RequestStatus.PENDING ? 'bg-slate-100 text-slate-400' : `${style?.bg} ${style?.text}`) + ' cursor-pointer hover:brightness-95' : holiday ? 'bg-red-50/30' : d.isWeekend ? 'bg-slate-50/50' : 'hover:bg-slate-50'}
                                                    `}
                                                >
                                                    {absence && style && (
                                                        <div className="flex flex-col items-center leading-none" title={`${store.getTypeLabel(absence.typeId)}: ${new Date(absence.startDate).toLocaleDateString()} (${absence.status})`}>
                                                            <style.icon size={12} className="mb-0.5 opacity-70"/>
                                                            <span className="text-[7px] font-black">
                                                                {absence.status === RequestStatus.PENDING ? 'PEND' : style.label}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Legend */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-200 rounded flex items-center justify-center"><Palmtree size={10} className="text-green-600"/></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vacaciones</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-200 rounded flex items-center justify-center"><Thermometer size={10} className="text-red-600"/></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Baja Médica</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded flex items-center justify-center"><UserIcon size={10} className="text-amber-600"/></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asuntos Propios</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded flex items-center justify-center"><ShieldCheck size={10} className="text-blue-600"/></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Días Libres (Canje)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[7px] font-black text-slate-400">PEND</div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pendiente de Aprobación</span>
                </div>
            </div>
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                <Info size={14}/>
                <span className="text-[10px] font-bold uppercase">Haz clic en una ausencia para ver los detalles</span>
            </div>
        </div>
    </div>
  );
};

export default UpcomingAbsencesView;

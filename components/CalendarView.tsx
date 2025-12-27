
import React, { useState, useMemo } from 'react';
import { User, RequestStatus, Role, ShiftType, RequestType } from '../types';
import { store } from '../services/store';
import { ChevronLeft, ChevronRight, Filter, AlertTriangle, Palmtree, Thermometer, Briefcase, User as UserIcon, Clock, Star, Check, Info } from 'lucide-react';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface CalendarViewProps {
  user: User;
}

const CalendarView: React.FC<CalendarViewProps> = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const startingDay = (firstDayOfMonth.getDay() + 6) % 7; 
  const daysInMonth = lastDayOfMonth.getDate();

  const isSupervisorOrAdmin = user.role === Role.SUPERVISOR || user.role === Role.ADMIN;
  
  const allowedDepts = useMemo(() => {
      if (user.role === Role.ADMIN) return store.departments;
      if (user.role === Role.SUPERVISOR) return store.departments.filter(d => d.supervisorIds.includes(user.id));
      return [];
  }, [user]);

  const usersInScope = useMemo(() => {
      if (!isSupervisorOrAdmin) return [user];
      let relevantUsers = store.users;
      if (user.role === Role.SUPERVISOR) {
          const myDepts = store.departments.filter(d => d.supervisorIds.includes(user.id)).map(d => d.id);
          relevantUsers = relevantUsers.filter(u => myDepts.includes(u.departmentId));
      }
      if (selectedDeptId) {
          relevantUsers = relevantUsers.filter(u => u.departmentId === selectedDeptId);
      }
      return relevantUsers.sort((a,b) => a.name.localeCompare(b.name));
  }, [user, isSupervisorOrAdmin, selectedDeptId]);

  const requests = useMemo(() => {
      let filteredReqs = store.requests;
      filteredReqs = filteredReqs.filter(r => {
           if (r.typeId === RequestType.WORKED_HOLIDAY) return true;
           if (r.typeId === RequestType.OVERTIME_SPEND_DAYS) return true;
           if (store.isOvertimeRequest(r.typeId)) return false;
           return true;
      });
      if (user.role === Role.WORKER) return filteredReqs.filter(r => r.userId === user.id);
      if (user.role === Role.SUPERVISOR) {
          const myDeptIds = store.departments.filter(d => d.supervisorIds.includes(user.id)).map(d => d.id);
          return filteredReqs.filter(r => {
               if (r.userId === user.id) return true;
               const reqUser = store.users.find(u => u.id === r.userId);
               if (!reqUser) return false;
               if (selectedDeptId && reqUser.departmentId !== selectedDeptId) return false;
               return myDeptIds.includes(reqUser.departmentId);
          });
      }
      if (selectedDeptId) return filteredReqs.filter(r => store.users.find(u => u.id === r.userId)?.departmentId === selectedDeptId);
      return filteredReqs;
  }, [user, store.requests, selectedDeptId]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventIcon = (label: string) => {
      const lower = label.toLowerCase();
      if (lower.includes('vacaci')) return <Palmtree size={18} className="opacity-80"/>;
      if (lower.includes('baja') || lower.includes('medica')) return <Thermometer size={18} className="opacity-80"/>;
      if (lower.includes('asuntos')) return <UserIcon size={18} className="opacity-80"/>;
      if (lower.includes('justifi') || lower.includes('unjustified')) return <AlertTriangle size={18} className="opacity-80"/>;
      return <Star size={18} className="opacity-80"/>;
  };

  const formatLabel = (req: { typeId: string, label: string }) => store.getTypeLabel(req.typeId);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const absenceEvents = requests.filter(req => {
       const start = req.startDate.split('T')[0];
       const end = req.endDate ? req.endDate.split('T')[0] : start;
       return dateStr >= start && dateStr <= end;
    });
    const holiday = store.config.holidays.find(h => h.date === dateStr);
    let myShift: ShiftType | undefined = undefined;
    let teamShifts: { userName: string, shift: ShiftType }[] = [];

    if (!isSupervisorOrAdmin) {
        myShift = store.getShiftForUserDate(user.id, dateStr);
        const approvedAbsence = absenceEvents.find(r => r.userId === user.id && r.status === RequestStatus.APPROVED);
        if (approvedAbsence) myShift = undefined; 
    } else {
        teamShifts = usersInScope.map(u => {
            const hasAbsence = requests.some(r => {
                const start = r.startDate.split('T')[0];
                const end = r.endDate ? r.endDate.split('T')[0] : start;
                return r.userId === u.id && r.status === RequestStatus.APPROVED && dateStr >= start && dateStr <= end;
            });
            if (hasAbsence) return null;
            const s = store.getShiftForUserDate(u.id, dateStr);
            return s ? { userName: u.name.split(' ')[0], shift: s } : null;
        }).filter(Boolean) as { userName: string, shift: ShiftType }[];
    }
    return { absences: absenceEvents, shift: myShift, teamShifts, holiday };
  };

  const getUserName = (id: string) => store.users.find(u => u.id === id)?.name.split(' ')[0] || 'User';

  const conflicts = useMemo(() => {
      if (!isSupervisorOrAdmin) return [];
      const conflictList: {date: string, users: string[], deptName: string}[] = [];
      for(let i = 1; i <= daysInMonth; i++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const activeRequests = requests.filter(req => {
              if ((req.status !== RequestStatus.APPROVED && req.status !== RequestStatus.PENDING)) return false;
              const start = req.startDate.split('T')[0];
              const end = req.endDate ? req.endDate.split('T')[0] : start;
              return dateStr >= start && dateStr <= end;
          });
          const deptMap: Record<string, string[]> = {}; 
          activeRequests.forEach(req => {
              const u = store.users.find(user => user.id === req.userId);
              if (u && u.departmentId) {
                  if (!deptMap[u.departmentId]) deptMap[u.departmentId] = [];
                  if (!deptMap[u.departmentId].includes(u.name)) {
                      deptMap[u.departmentId].push(`${u.name} (${req.status === RequestStatus.PENDING ? '?' : 'OK'})`);
                  }
              }
          });
          Object.keys(deptMap).forEach(deptId => {
              if (deptMap[deptId].length > 1) {
                  const dName = store.departments.find(d => d.id === deptId)?.name || 'Dept';
                  conflictList.push({ date: dateStr, users: deptMap[deptId], deptName: dName });
              }
          });
      }
      return conflictList;
  }, [year, month, isSupervisorOrAdmin, selectedDeptId, requests, daysInMonth]);

  return (
    <div className="space-y-6 xl:space-y-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 xl:p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <h2 className="text-xl xl:text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="capitalize">{MONTHS[month]}</span> <span className="text-slate-400 font-normal">{year}</span>
            </h2>
            <div className="flex items-center gap-4 w-full md:w-auto">
                {isSupervisorOrAdmin && (
                    <div className="relative flex items-center w-full md:w-64">
                        <Filter className="absolute left-3 text-slate-400 w-4 h-4" />
                        <select className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors appearance-none" value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)}>
                            <option value="">Todos mis departamentos</option>
                            {allowedDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                )}
                <div className="flex gap-2 bg-slate-100 rounded-full p-1">
                    <button onClick={prevMonth} className="p-2 xl:p-1.5 hover:bg-white rounded-full transition-all shadow-sm hover:shadow text-slate-600"><ChevronLeft size={16}/></button>
                    <button onClick={nextMonth} className="p-2 xl:p-1.5 hover:bg-white rounded-full transition-all shadow-sm hover:shadow text-slate-600"><ChevronRight size={16}/></button>
                </div>
            </div>
        </div>

        <div className="p-6 xl:p-4">
            <div className="grid grid-cols-7 mb-4 xl:mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-sm xl:text-xs font-semibold text-slate-400 uppercase tracking-wider">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-3 xl:gap-2">
            {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[120px] xl:min-h-[100px] bg-slate-50/30 rounded-xl"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const { absences, shift, teamShifts, holiday } = getEventsForDay(day);
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                const approvedAbsence = absences.find(a => a.status === RequestStatus.APPROVED);
                const pendingAbsence = absences.find(a => a.status === RequestStatus.PENDING);
                return (
                <div key={day} className={`min-h-[120px] xl:min-h-[100px] border rounded-xl p-2 xl:p-1.5 transition-all hover:shadow-lg flex flex-col relative overflow-hidden group ${holiday ? 'bg-red-50 border-red-200' : isToday ? 'bg-white ring-2 ring-blue-400 border-blue-200 shadow-md transform scale-[1.02]' : 'bg-white border-slate-100'}`}>
                    <div className={`text-sm xl:text-xs font-bold mb-1 z-10 ${holiday ? 'text-red-600' : isToday ? 'text-blue-600' : 'text-slate-400'}`}>{day}</div>
                    <div className="flex-1 flex flex-col justify-start z-10 gap-1 w-full overflow-hidden">
                        {isSupervisorOrAdmin ? (
                            <div className="overflow-y-auto no-scrollbar space-y-1 w-full h-full">
                                {holiday && <div className="text-[10px] font-bold text-red-600 uppercase mb-1 flex items-center gap-1 justify-center bg-red-100/50 rounded p-1"><Star size={10} fill="currentColor"/> {holiday.name}</div>}
                                {absences.map((ev, idx) => (
                                    <div key={ev.id + idx} className={`text-[9px] px-1.5 py-0.5 rounded border-l-2 truncate font-medium flex items-center gap-1 ${ev.status === RequestStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-500' : ev.status === RequestStatus.PENDING ? 'bg-yellow-50 text-yellow-700 border-yellow-500' : 'bg-red-50 text-red-700 border-red-500 line-through opacity-60'}`} title={`${getUserName(ev.userId)}: ${formatLabel(ev)}`}><span className="truncate"><strong>{getUserName(ev.userId)}</strong>: {formatLabel(ev)}</span></div>
                                ))}
                                {teamShifts.length > 0 && (
                                    <div className="border-t border-slate-100 pt-1 mt-1">
                                        {teamShifts.map((ts, idx) => (
                                            <div key={idx} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded mb-0.5" style={{ backgroundColor: ts.shift.color + '20', color: ts.shift.color }}><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: ts.shift.color}}></div><span className="font-bold truncate max-w-[50px]">{ts.userName}</span><span className="opacity-80 ml-auto">{ts.shift.name}</span></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col justify-center items-center w-full relative">
                                {holiday && (
                                    <div className="text-center w-full">
                                        <Star className="mx-auto text-red-400 mb-1" size={24} fill="currentColor" fillOpacity={0.2} />
                                        <span className="text-[10px] font-bold text-red-600 uppercase leading-tight block truncate">{holiday.name}</span>
                                    </div>
                                )}
                                {!holiday && approvedAbsence && (
                                    <div className="w-full h-full bg-green-50 rounded-lg border border-green-100 flex flex-col items-center justify-center p-1 text-center animate-fade-in relative overflow-hidden">
                                        <div className="text-green-500 mb-0.5">{getEventIcon(formatLabel(approvedAbsence))}</div>
                                        <span className="text-[9px] font-bold text-green-700 leading-tight line-clamp-2">{formatLabel(approvedAbsence)}</span>
                                    </div>
                                )}
                                {!holiday && !approvedAbsence && shift && (
                                    <div className="w-full h-full rounded-lg flex flex-col items-center justify-center p-1 text-white shadow-sm animate-fade-in relative overflow-hidden" style={{ backgroundColor: shift.color }}>
                                        <Briefcase size={18} className="mb-0.5 opacity-90 drop-shadow-md"/>
                                        <span className="text-[9px] font-bold uppercase tracking-wide opacity-100 drop-shadow-md">{shift.name}</span>
                                        <div className="bg-black/30 rounded px-1.5 py-0.5 mt-0.5 text-[8px] font-mono flex items-center gap-1"><Clock size={8}/>{shift.segments[0].start}-{shift.segments[0].end}</div>
                                        {pendingAbsence && <div className="absolute top-0 right-0 w-full h-1 bg-yellow-400 animate-pulse" title={`Pendiente: ${formatLabel(pendingAbsence)}`}></div>}
                                    </div>
                                )}
                                {!holiday && !approvedAbsence && !shift && absences.length > 0 && (
                                     <div className="w-full h-full space-y-1 flex flex-col justify-center">
                                        {absences.map((ev, idx) => (
                                            <div key={ev.id + idx} className={`text-[9px] px-2 py-1.5 rounded-lg border flex flex-col items-center justify-center text-center gap-1 h-full ${ev.status === RequestStatus.PENDING ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200 opacity-60'}`} title={formatLabel(ev)}>{ev.status === RequestStatus.PENDING && <Clock size={14} className="text-yellow-600"/>}{ev.status === RequestStatus.REJECTED && <AlertTriangle size={14} className="text-red-600"/>}<span className="font-bold leading-tight line-clamp-2">{formatLabel(ev)}</span></div>
                                        ))}
                                     </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                );
            })}
            </div>
        </div>
        <div className="px-6 pb-6 xl:px-4 xl:pb-4 flex gap-6 xl:gap-4 text-xs xl:text-[10px] text-slate-500 border-t border-slate-100 pt-4 xl:pt-3 mx-6 xl:mx-4 flex-wrap">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 border border-green-200 rounded flex items-center justify-center"><Check size={10} className="text-green-600"/></div> Ausencia</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded flex items-center justify-center"><Clock size={10} className="text-yellow-600"/></div> Pendiente</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-100 border border-red-200 rounded flex items-center justify-center"><Star size={10} className="text-red-600"/></div> Festivo</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded"></div> Turno</div>
        </div>
        </div>
        {conflicts.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl xl:rounded-xl p-6 xl:p-4">
                <h3 className="text-red-800 font-bold flex items-center gap-2 mb-4 xl:mb-2 text-base xl:text-sm"><AlertTriangle className="w-5 h-5 xl:w-4 xl:h-4"/> Conflictos de Equipo ({conflicts.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-2">
                    {conflicts.map((conf, idx) => (
                        <div key={idx} className="bg-white p-4 xl:p-3 rounded-xl border border-red-100 shadow-sm">
                            <div className="text-sm xl:text-xs font-bold text-red-600 mb-1">{new Date(conf.date).toLocaleDateString()}</div>
                            <div className="text-xs xl:text-[10px] font-semibold text-slate-500 uppercase mb-2">{conf.deptName}</div>
                            <div className="flex flex-wrap gap-1">
                                {conf.users.map(u => <span key={u} className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full font-medium">{u}</span>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default CalendarView;

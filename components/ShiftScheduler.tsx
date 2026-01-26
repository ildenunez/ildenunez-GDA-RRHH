import React, { useState, useMemo, useEffect } from 'react';
import { User, ShiftType, RequestStatus, ShiftAssignment } from '../types';
import { store } from '../services/store';
import { ChevronLeft, ChevronRight, Check, Filter, Loader2, Calendar } from 'lucide-react';

interface ShiftSchedulerProps {
  users: User[];
}

const ShiftScheduler: React.FC<ShiftSchedulerProps> = ({ users: allUsers }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShiftId, setSelectedShiftId] = useState<string | 'eraser'>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refresh, setRefresh] = useState(0);
  
  // Mapa para guardar cambios locales mientras se sincronizan con la BBDD
  // Clave: "userId-dateStr", Valor: shiftTypeId
  const [optimisticChanges, setOptimisticChanges] = useState<Map<string, string>>(new Map());

  useEffect(() => {
      const unsubscribe = store.subscribe(() => setRefresh(v => v + 1));
      return unsubscribe;
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthsData = useMemo(() => {
      return [0, 1, 2].map(offset => {
          const firstOfM = new Date(year, month + offset, 1);
          const monthIdx = firstOfM.getMonth();
          const mYear = firstOfM.getFullYear();
          const daysInM = new Date(mYear, monthIdx + 1, 0).getDate();
          const monthName = firstOfM.toLocaleString('es-ES', { month: 'long' });
          
          const days = [];
          for (let d = 1; d <= daysInM; d++) {
              const dObj = new Date(mYear, monthIdx, d);
              days.push({
                  dateStr: dObj.toISOString().split('T')[0],
                  day: d,
                  isWeekend: [0, 6].includes(dObj.getDay()),
                  weekdayShort: ['D','L','M','X','J','V','S'][dObj.getDay()]
              });
          }
          return { monthName, mYear, days };
      });
  }, [year, month]);

  const shifts = store.config.shiftTypes;
  const departments = store.departments;

  const filteredUsers = useMemo(() => {
      let list = allUsers;
      if (selectedDept) list = list.filter(u => u.departmentId === selectedDept);
      return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers, selectedDept]);

  const handleCellClick = async (userId: string, dateStr: string) => {
      if (!selectedShiftId || isProcessing) return;
      
      const typeId = selectedShiftId === 'eraser' ? '' : selectedShiftId;
      const key = `${userId}-${dateStr}`;

      // Actualización inmediata en el estado local del componente
      setOptimisticChanges(prev => {
          const next = new Map(prev);
          next.set(key, typeId);
          return next;
      });

      setIsProcessing(true);
      try {
          await store.assignShift(userId, dateStr, typeId);
      } catch (err) {
          console.error(err);
          alert("Error al guardar el turno. Inténtelo de nuevo.");
          // Si falla, revertimos el cambio local
          setOptimisticChanges(prev => {
              const next = new Map(prev);
              next.delete(key);
              return next;
          });
      } finally {
          setIsProcessing(false);
          // Opcional: No limpiar inmediatamente para dejar que el refresh del store se complete
          setTimeout(() => {
              setOptimisticChanges(prev => {
                  const next = new Map(prev);
                  next.delete(key);
                  return next;
              });
          }, 1000);
      }
  };

  const nextQuarter = () => setCurrentDate(new Date(year, month + 3, 1));
  const prevQuarter = () => setCurrentDate(new Date(year, month - 3, 1));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[750px]">
        {/* Herramientas */}
        <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row justify-start items-start xl:items-center bg-slate-50 gap-4 shrink-0">
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={prevQuarter} className="p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"><ChevronLeft size={20}/></button>
                <div className="flex flex-col items-center min-w-[140px]">
                    <h2 className="text-xs font-black uppercase text-slate-800 tracking-tight">Planificación</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Trimestre Actual</p>
                </div>
                <button onClick={nextQuarter} className="p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"><ChevronRight size={20}/></button>
            </div>
            
            <div className="relative shrink-0">
                <Filter className="absolute left-3 top-2.5 text-slate-400 w-3.5 h-3.5"/>
                <select 
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-200 outline-none font-bold text-slate-600 appearance-none"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                >
                    <option value="">Filtrar Departamento</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto px-2 pb-2 xl:pb-0 scrollbar-hide">
                <button 
                    onClick={() => setSelectedShiftId('eraser')} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black transition-all whitespace-nowrap ${selectedShiftId === 'eraser' ? 'bg-slate-800 text-white border-slate-800 shadow-md scale-105' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                    Borrador
                </button>
                {shifts.map(shift => (
                    <button 
                        key={shift.id} 
                        onClick={() => setSelectedShiftId(shift.id)} 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black transition-all whitespace-nowrap ${selectedShiftId === shift.id ? 'ring-2 ring-offset-1 shadow-md scale-105' : 'hover:opacity-80'}`} 
                        style={{ 
                            backgroundColor: selectedShiftId === shift.id ? shift.color : 'white', 
                            color: selectedShiftId === shift.id ? 'white' : shift.color, 
                            borderColor: shift.color
                        }}
                    >
                       {selectedShiftId === shift.id && <Check size={12}/>} {shift.name}
                    </button>
                ))}
            </div>
            {isProcessing && <div className="ml-auto flex items-center gap-2 text-blue-600 animate-pulse"><Loader2 className="animate-spin" size={14}/><span className="text-[9px] font-black uppercase">Sincronizando...</span></div>}
        </div>

        {/* Vista Vertical de Meses */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-12">
            {monthsData.map((m) => (
                <div key={`${m.monthName}-${m.mYear}`} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center gap-3 sticky top-0 z-40">
                        <Calendar size={16} className="text-slate-500"/>
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">{m.monthName} {m.mYear}</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full align-middle">
                            <div className="grid" style={{ gridTemplateColumns: `160px repeat(${m.days.length}, minmax(32px, 1fr))` }}>
                                {/* Cabecera Días */}
                                <div className="sticky left-0 z-30 bg-slate-50 border-b border-r border-slate-200 p-2 h-10 flex items-center text-[9px] font-black text-slate-400 uppercase tracking-tighter">Empleado</div>
                                {m.days.map((d) => {
                                    const holiday = store.config.holidays.find(h => h.date === d.dateStr);
                                    return (
                                        <div key={d.dateStr} className={`border-b border-r border-slate-100 p-1 flex flex-col items-center justify-center h-10 ${holiday ? 'bg-red-100 text-red-700' : d.isWeekend ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-500'}`}>
                                            <span className="text-[10px] font-black leading-none">{d.day}</span>
                                            <span className="text-[7px] font-bold uppercase opacity-50 mt-0.5">{d.weekdayShort}</span>
                                        </div>
                                    );
                                })}

                                {/* Usuarios */}
                                {filteredUsers.map(user => (
                                    <React.Fragment key={`${m.monthName}-${user.id}`}>
                                        <div className="sticky left-0 z-20 bg-white border-b border-r border-slate-200 p-2 flex items-center gap-2 h-11 shadow-sm">
                                            <img src={user.avatar} className="w-6 h-6 rounded-full border border-slate-100 object-cover shrink-0"/>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-black text-slate-700 truncate">{user.name}</span>
                                                <span className="text-[7px] text-slate-400 font-bold uppercase truncate tracking-tighter">{store.departments.find(d => d.id === user.departmentId)?.name}</span>
                                            </div>
                                        </div>
                                        {m.days.map((d) => {
                                            const key = `${user.id}-${d.dateStr}`;
                                            const holiday = store.config.holidays.find(h => h.date === d.dateStr);
                                            const activeRequest = store.requests.find(r => { 
                                                const s = r.startDate.split('T')[0]; 
                                                const e = (r.endDate || r.startDate).split('T')[0]; 
                                                return r.userId === user.id && d.dateStr >= s && d.dateStr <= e && !store.isOvertimeRequest(r.typeId) && (r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING); 
                                            });

                                            // Prioridad 1: Cambios optimistas (locales)
                                            let currentShiftId = '';
                                            if (optimisticChanges.has(key)) {
                                                currentShiftId = optimisticChanges.get(key) || '';
                                            } else {
                                                // Prioridad 2: Asignación real del store
                                                const assignment = store.config.shiftAssignments.find(a => a.userId === user.id && a.date === d.dateStr);
                                                currentShiftId = assignment?.shiftTypeId || '';
                                            }

                                            const shift = shifts.find(s => s.id === currentShiftId);

                                            let bgColor = '';
                                            let content = null;
                                            let style = {};

                                            if (holiday) bgColor = 'bg-red-50/50';
                                            else if (activeRequest) {
                                                const isAppr = activeRequest.status === RequestStatus.APPROVED;
                                                bgColor = isAppr ? 'bg-green-100 hover:bg-green-200' : 'bg-yellow-50 hover:bg-yellow-100';
                                                content = <span className={`text-[8px] font-black ${isAppr ? 'text-green-700' : 'text-yellow-700'}`}>{activeRequest.label.charAt(0).toUpperCase()}</span>;
                                            } else if (shift) {
                                                style = { backgroundColor: shift.color };
                                            } else if (d.isWeekend) {
                                                bgColor = 'bg-slate-50/30';
                                            }

                                            return (
                                                <div 
                                                    key={`${user.id}-${d.dateStr}`}
                                                    onClick={() => handleCellClick(user.id, d.dateStr)}
                                                    className={`border-b border-r border-slate-100 h-11 cursor-pointer transition-all hover:ring-1 hover:ring-blue-300 flex items-center justify-center ${bgColor} ${optimisticChanges.has(key) ? 'opacity-50' : ''}`}
                                                    style={style}
                                                    title={d.dateStr}
                                                >
                                                    {content}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-green-100 border border-green-200 rounded"></div> Vacaciones</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-yellow-50 border border-yellow-200 rounded"></div> Pendiente</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-100 rounded"></div> Festivo</div>
            <div className="flex items-center gap-1.5 italic font-medium"><Check size={10}/> Seleccione un turno y pinche en las casillas</div>
        </div>
    </div>
  );
};

export default ShiftScheduler;
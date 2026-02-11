import React, { useState, useMemo, useEffect } from 'react';
import { User, ShiftType, RequestStatus, ShiftAssignment, RequestType } from '../types';
import { store } from '../services/store';
import { ChevronLeft, ChevronRight, Check, Filter, Loader2, Calendar, RefreshCcw, Save, Info } from 'lucide-react';

interface ShiftSchedulerProps {
  users: User[];
}

const ShiftScheduler: React.FC<ShiftSchedulerProps> = ({ users: allUsers }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShiftId, setSelectedShiftId] = useState<string | 'eraser'>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setRefreshCount] = useState(0);
  
  // Estado para cambios pendientes de guardar (Staging)
  // Usamos el separador "|" para no entrar en conflicto con los guiones de los UUIDs
  const [stagedChanges, setStagedChanges] = useState<Record<string, string>>({});
  
  // Seguimiento de qué mes se está guardando
  const [savingMonth, setSavingMonth] = useState<string | null>(null);

  useEffect(() => {
      const unsubscribe = store.subscribe(() => setRefreshCount(v => v + 1));
      return unsubscribe;
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Estructura de 3 meses verticales
  const monthsData = useMemo(() => {
      return [0, 1, 2].map(offset => {
          const firstOfM = new Date(year, month + offset, 1);
          const mIdx = firstOfM.getMonth();
          const mYear = firstOfM.getFullYear();
          const daysInM = new Date(mYear, mIdx + 1, 0).getDate();
          const monthName = firstOfM.toLocaleString('es-ES', { month: 'long' });
          const monthKey = `${mYear}-${String(mIdx + 1).padStart(2, '0')}`;
          
          const days = [];
          for (let d = 1; d <= daysInM; d++) {
              const dObj = new Date(mYear, mIdx, d);
              const localDateStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
              days.push({
                  dateStr: localDateStr,
                  day: d,
                  isWeekend: [0, 6].includes(dObj.getDay()),
                  weekdayShort: ['D','L','M','X','J','V','S'][dObj.getDay()]
              });
          }
          return { monthName, mYear, monthKey, days };
      });
  }, [year, month]);

  const shifts = store.config.shiftTypes;
  const departments = store.departments;

  const filteredUsers = useMemo(() => {
      let list = allUsers;
      if (selectedDept) list = list.filter(u => u.departmentId === selectedDept);
      return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers, selectedDept]);

  // Obtenemos el turno considerando primero el estado local (stagedChanges)
  const getEffectiveShiftId = (userId: string, dateStr: string) => {
      const key = `${userId}|${dateStr}`;
      if (stagedChanges.hasOwnProperty(key)) {
          return stagedChanges[key];
      }
      const assignment = store.config.shiftAssignments.find(a => 
          String(a.userId).toLowerCase() === String(userId).toLowerCase() && a.date === dateStr
      );
      return assignment?.shiftTypeId || '';
  };

  const handleManualRefresh = async () => {
      setIsRefreshing(true);
      await store.refresh();
      setStagedChanges({}); 
      setIsRefreshing(false);
  };

  const handleCellClick = (userId: string, dateStr: string) => {
      if (!selectedShiftId) return;
      
      const typeId = selectedShiftId === 'eraser' ? '' : selectedShiftId;
      const key = `${userId}|${dateStr}`;

      setStagedChanges(prev => ({
          ...prev,
          [key]: typeId
      }));
  };

  const handleSaveMonth = async (monthKey: string, days: { dateStr: string }[]) => {
      const monthChanges: { userId: string, date: string, shiftTypeId: string }[] = [];
      const dayStrings = days.map(d => d.dateStr);

      (Object.entries(stagedChanges) as [string, string][]).forEach(([key, shiftId]) => {
          const [uId, dStr] = key.split('|');
          
          if (dayStrings.includes(dStr)) {
              monthChanges.push({
                  userId: uId,
                  date: dStr,
                  shiftTypeId: shiftId
              });
          }
      });

      if (monthChanges.length === 0) return;

      setSavingMonth(monthKey);
      try {
          await store.assignShiftsBatch(monthChanges);
          
          // Limpiar del staging solo los que acabamos de guardar satisfactoriamente
          setStagedChanges(prev => {
              const next = { ...prev };
              monthChanges.forEach(c => {
                  delete next[`${c.userId}|${c.date}`];
              });
              return next;
          });
      } catch (err) {
          console.error("Error al guardar lote:", err);
          alert("Error de conexión con la base de datos. Por favor, intenta de nuevo.");
      } finally {
          setSavingMonth(null);
      }
  };

  const nextQuarter = () => setCurrentDate(new Date(year, month + 3, 1));
  const prevQuarter = () => setCurrentDate(new Date(year, month - 3, 1));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[800px]">
        {/* Herramientas superiores */}
        <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row justify-start items-start xl:items-center bg-white gap-4 shrink-0 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={prevQuarter} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"><ChevronLeft size={20}/></button>
                <div className="flex flex-col items-center min-w-[140px]">
                    <h2 className="text-xs font-black uppercase text-slate-800 tracking-tight">Planificación</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Trimestre Actual</p>
                </div>
                <button onClick={nextQuarter} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"><ChevronRight size={20}/></button>
            </div>
            
            <button 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                title="Sincronizar con base de datos"
            >
                <RefreshCcw size={14} className={`${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Refrescar'}
            </button>

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
            {Object.keys(stagedChanges).length > 0 && (
                <div className="ml-auto flex items-center gap-2 text-orange-600 animate-pulse">
                    <Info size={14}/>
                    <span className="text-[9px] font-black uppercase">Cambios pendientes de guardado</span>
                </div>
            )}
        </div>

        {/* Listado vertical de meses */}
        <div className="flex-1 overflow-y-auto bg-white p-4 space-y-12">
            {monthsData.map((m) => {
                const isMonthSaving = savingMonth === m.monthKey;
                const monthDayStrings = m.days.map(d => d.dateStr);
                // Ajustamos la lógica de detección de cambios pendientes para este mes usando el nuevo separador
                const hasPendingInMonth = Object.keys(stagedChanges).some(key => {
                    const [, dStr] = key.split('|');
                    return monthDayStrings.includes(dStr);
                });

                return (
                    <div key={`${m.monthName}-${m.mYear}`} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-white p-3 border-b border-slate-100 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-blue-500"/>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{m.monthName} {m.mYear}</h3>
                            </div>
                            
                            {hasPendingInMonth && (
                                <button 
                                    onClick={() => handleSaveMonth(m.monthKey, m.days)}
                                    disabled={isMonthSaving}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-md disabled:bg-slate-300"
                                >
                                    {isMonthSaving ? (
                                        <><Loader2 size={12} className="animate-spin"/> Guardando...</>
                                    ) : (
                                        <><Save size={12}/> Guardar Cambios</>
                                    )}
                                </button>
                            )}
                        </div>
                        
                        <div className="overflow-x-auto overflow-y-hidden">
                            <div className="inline-block min-w-full align-middle">
                                <div className="grid" style={{ gridTemplateColumns: `140px repeat(${m.days.length}, 1fr)` }}>
                                    {/* Cabecera Días */}
                                    <div className="sticky left-0 z-30 bg-slate-50 border-b border-r border-slate-200 p-2 h-8 flex items-center text-[9px] font-black text-slate-400 uppercase">Empleado</div>
                                    {m.days.map((d) => {
                                        const holiday = store.config.holidays.find(h => h.date === d.dateStr);
                                        return (
                                            <div key={d.dateStr} className={`border-b border-r border-slate-100 p-0.5 flex flex-col items-center justify-center h-8 ${holiday ? 'bg-red-100 text-red-700' : d.isWeekend ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-500'}`}>
                                                <span className="text-[9px] font-black leading-none">{d.day}</span>
                                                <span className="text-[6px] font-bold uppercase opacity-50 mt-0.5">{d.weekdayShort}</span>
                                            </div>
                                        );
                                    })}

                                    {/* Filas Usuarios */}
                                    {filteredUsers.map(user => (
                                        <React.Fragment key={`${m.monthName}-${user.id}`}>
                                            <div className="sticky left-0 z-20 bg-white border-b border-r border-slate-200 px-2 flex items-center gap-2 h-9 shadow-sm">
                                                <img src={user.avatar} className="w-5 h-5 rounded-full border border-slate-100 object-cover shrink-0"/>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-[11px] font-black text-slate-800 truncate leading-tight">{user.name}</span>
                                                </div>
                                            </div>
                                            {m.days.map((d) => {
                                                const key = `${user.id}|${d.dateStr}`;
                                                const shiftId = getEffectiveShiftId(user.id, d.dateStr);
                                                const shift = shifts.find(s => s.id === shiftId);
                                                const holiday = store.config.holidays.find(h => h.date === d.dateStr);
                                                const activeRequest = store.requests.find(r => { 
                                                    const s = r.startDate.split('T')[0]; 
                                                    const e = (r.endDate || r.startDate).split('T')[0]; 
                                                    return r.userId === user.id && d.dateStr >= s && d.dateStr <= e && !store.isOvertimeRequest(r.typeId) && (r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING); 
                                                });

                                                let style = {};
                                                let content = null;

                                                if (holiday) {
                                                    style = { backgroundColor: '#fee2e2' }; 
                                                } else if (activeRequest) {
                                                    const isAppr = activeRequest.status === RequestStatus.APPROVED;
                                                    if (activeRequest.typeId === RequestType.SICKNESS && isAppr) {
                                                        style = { backgroundColor: '#ef4444' }; 
                                                        content = <span className="text-[8px] font-black text-white">B</span>;
                                                    } else {
                                                        style = { backgroundColor: isAppr ? '#dcfce7' : '#fefce8' }; 
                                                        content = <span className={`text-[8px] font-black ${isAppr ? 'text-green-700' : 'text-yellow-700'}`}>{activeRequest.label.charAt(0).toUpperCase()}</span>;
                                                    }
                                                } else if (shift) {
                                                    style = { backgroundColor: shift.color };
                                                } else if (d.isWeekend) {
                                                    style = { backgroundColor: '#f8fafc' }; 
                                                }

                                                // Indicador visual de cambio sin guardar
                                                const isStaged = stagedChanges.hasOwnProperty(key);

                                                return (
                                                    <div 
                                                        key={`${user.id}|${d.dateStr}`}
                                                        onClick={() => handleCellClick(user.id, d.dateStr)}
                                                        className={`border-b border-r border-slate-100 h-9 cursor-pointer transition-all hover:ring-1 hover:ring-blue-300 flex items-center justify-center relative ${isStaged ? 'ring-2 ring-inset ring-orange-400' : ''}`}
                                                        style={style}
                                                    >
                                                        {content}
                                                        {isStaged && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-500 rounded-bl-sm shadow-sm"></div>}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        <div className="p-3 bg-white border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 border border-green-200 rounded" style={{ backgroundColor: '#dcfce7' }}></div> Vacaciones</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#ef4444' }}></div> Baja Médica</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 border border-yellow-200 rounded" style={{ backgroundColor: '#fefce8' }}></div> Pendiente</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#fee2e2' }}></div> Festivo</div>
            <div className="flex items-center gap-1.5 text-orange-500"><div className="w-2.5 h-2.5 border-2 border-orange-400 rounded shadow-sm"></div> Sin Guardar</div>
            <div className="flex items-center gap-1.5 italic font-medium text-blue-500"><RefreshCcw size={10}/> Selecciona el turno, marca los días y pulsa "Guardar Cambios" en la cabecera del mes.</div>
        </div>
    </div>
  );
};

export default ShiftScheduler;
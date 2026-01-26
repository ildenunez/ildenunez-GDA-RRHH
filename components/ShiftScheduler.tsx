import React, { useState, useMemo, useEffect } from 'react';
import { User, ShiftType, RequestStatus, ShiftAssignment } from '../types';
import { store } from '../services/store';
import { ChevronLeft, ChevronRight, Check, Filter, Loader2, Calendar, RefreshCcw } from 'lucide-react';

interface ShiftSchedulerProps {
  users: User[];
}

const ShiftScheduler: React.FC<ShiftSchedulerProps> = ({ users: allUsers }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShiftId, setSelectedShiftId] = useState<string | 'eraser'>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setRefreshCount] = useState(0);
  
  // Buffer local para cambios que aún se están enviando a la base de datos
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());
  // Seguimiento de celdas actualmente en comunicación con Supabase
  const [inFlightKeys, setInFlightKeys] = useState<Set<string>>(new Set());

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
          
          const days = [];
          for (let d = 1; d <= daysInM; d++) {
              const dObj = new Date(mYear, mIdx, d);
              // Corregido: Generar dateStr local para evitar desfase de zona horaria
              const localDateStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
              days.push({
                  dateStr: localDateStr,
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

  // Merge de datos del Store + Cambios Pendientes locales
  const getEffectiveShiftId = (userId: string, dateStr: string) => {
      const key = `${userId}-${dateStr}`;
      // Si hay un cambio pendiente en local (pintado manual), ese manda sobre lo que diga la BBDD
      if (pendingChanges.has(key)) return pendingChanges.get(key);
      const assignment = store.config.shiftAssignments.find(a => a.userId === userId && a.date === dateStr);
      return assignment?.shiftTypeId || '';
  };

  const handleManualRefresh = async () => {
      setIsRefreshing(true);
      await store.refresh();
      setIsRefreshing(false);
  };

  const handleCellClick = async (userId: string, dateStr: string) => {
      if (!selectedShiftId) return;
      
      const typeId = selectedShiftId === 'eraser' ? '' : selectedShiftId;
      const key = `${userId}-${dateStr}`;

      // 1. Actualizar UI instantáneamente (Pintado visual optimista)
      setPendingChanges(prev => {
          const next = new Map(prev);
          next.set(key, typeId);
          return next;
      });

      // 2. Marcar celda como en proceso (Spinner local)
      setInFlightKeys(prev => new Set(prev).add(key));

      try {
          // 3. Enviar a Supabase y actualizar Store quirúrgicamente
          await store.assignShift(userId, dateStr, typeId);
      } catch (err) {
          console.error("Error al asignar turno:", err);
          alert("Error de conexión al guardar el turno. Reinténtalo.");
          // Si falla, borramos el pintado optimista
          setPendingChanges(prev => {
              const next = new Map(prev);
              next.delete(key);
              return next;
          });
      } finally {
          // 4. Quitar spinner de la celda inmediatamente
          setInFlightKeys(prev => {
              const next = new Set(prev);
              next.delete(key);
              return next;
          });
          
          // 5. El buffer de "pendingChanges" se mantiene unos milisegundos más por seguridad
          // pero el Store ya tiene el dato correcto así que no debería haber parpadeo.
          setTimeout(() => {
              setPendingChanges(prev => {
                  const next = new Map(prev);
                  next.delete(key);
                  return next;
              });
          }, 300);
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
            {inFlightKeys.size > 0 && <div className="ml-auto flex items-center gap-2 text-blue-600 animate-pulse"><Loader2 className="animate-spin" size={14}/><span className="text-[9px] font-black uppercase">Sincronizando...</span></div>}
        </div>

        {/* Listado vertical de meses - AHORA CON FONDO BLANCO */}
        <div className="flex-1 overflow-y-auto bg-white p-4 space-y-12">
            {monthsData.map((m) => (
                <div key={`${m.monthName}-${m.mYear}`} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-white p-3 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-40">
                        <Calendar size={16} className="text-blue-500"/>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{m.monthName} {m.mYear}</h3>
                    </div>
                    
                    <div className="overflow-x-auto overflow-y-hidden">
                        <div className="inline-block min-w-full align-middle">
                            <div className="grid" style={{ gridTemplateColumns: `140px repeat(${m.days.length}, 1fr)` }}>
                                {/* Cabecera Días - Altura reducida */}
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

                                {/* Filas Usuarios - Altura reducida y nombre más grande */}
                                {filteredUsers.map(user => (
                                    <React.Fragment key={`${m.monthName}-${user.id}`}>
                                        <div className="sticky left-0 z-20 bg-white border-b border-r border-slate-200 px-2 flex items-center gap-2 h-9 shadow-sm">
                                            <img src={user.avatar} className="w-5 h-5 rounded-full border border-slate-100 object-cover shrink-0"/>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[11px] font-black text-slate-800 truncate leading-tight">{user.name}</span>
                                            </div>
                                        </div>
                                        {m.days.map((d) => {
                                            const key = `${user.id}-${d.dateStr}`;
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

                                            // Lógica de coloreado prioritario según leyenda
                                            if (holiday) {
                                                style = { backgroundColor: '#fee2e2' }; // Color Festivo (Red 100)
                                            } else if (activeRequest) {
                                                const isAppr = activeRequest.status === RequestStatus.APPROVED;
                                                // Verde para aprobadas, Amarillo para pendientes (Igual que leyenda inferior)
                                                style = { backgroundColor: isAppr ? '#dcfce7' : '#fefce8' }; 
                                                content = <span className={`text-[8px] font-black ${isAppr ? 'text-green-700' : 'text-yellow-700'}`}>{activeRequest.label.charAt(0).toUpperCase()}</span>;
                                            } else if (shift) {
                                                style = { backgroundColor: shift.color };
                                            } else if (d.isWeekend) {
                                                style = { backgroundColor: '#f8fafc' }; // Fin de semana suave
                                            }

                                            const isPending = pendingChanges.has(key);
                                            const isInFlight = inFlightKeys.has(key);

                                            return (
                                                <div 
                                                    key={`${user.id}-${d.dateStr}`}
                                                    onClick={() => handleCellClick(user.id, d.dateStr)}
                                                    className={`border-b border-r border-slate-100 h-9 cursor-pointer transition-all hover:ring-1 hover:ring-blue-300 flex items-center justify-center relative ${isPending ? 'opacity-70 ring-1 ring-blue-400' : ''}`}
                                                    style={style}
                                                >
                                                    {content}
                                                    {isInFlight && <Loader2 size={10} className="absolute text-white animate-spin drop-shadow-md z-10" />}
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

        <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-center gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 border border-green-200 rounded" style={{ backgroundColor: '#dcfce7' }}></div> Vacaciones</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 border border-yellow-200 rounded" style={{ backgroundColor: '#fefce8' }}></div> Pendiente</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#fee2e2' }}></div> Festivo</div>
            <div className="flex items-center gap-1.5 italic font-medium text-blue-500"><RefreshCcw size={10}/> Puedes marcar todos los días que quieras seguidos.</div>
        </div>
    </div>
  );
};

export default ShiftScheduler;
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, RequestStatus, Role, ShiftType, RequestType } from '../types';
import { store } from '../services/store';
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Loader2, 
  Calendar as CalendarIcon, 
  RefreshCcw, 
  Save, 
  Eraser,
  AlertCircle,
  ShieldCheck,
  X,
  Palmtree,
  Thermometer,
  User as UserIcon,
  Star,
  Check,
  Edit,
  Users
} from 'lucide-react';

interface ShiftSchedulerProps {
  users: User[];
}

const ShiftScheduler: React.FC<ShiftSchedulerProps> = ({ users: allUsers }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShiftId, setSelectedShiftId] = useState<string | 'eraser'>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [showSmartPlanner, setShowSmartPlanner] = useState(false);
  const [plannerPattern, setPlannerPattern] = useState('');
  const [plannerStartDate, setPlannerStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [plannerEndDate, setPlannerEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  
  const [draftChanges, setDraftChanges] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => setTick(t => t + 1));
    return unsubscribe;
  }, []);

  // Manejo de Drag and Drop global
  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const monthsData = useMemo(() => {
    const year = currentDate.getFullYear();
    return Array.from({ length: 12 }).map((_, mIdx) => {
      const first = new Date(year, mIdx, 1);
      const daysInM = new Date(year, mIdx + 1, 0).getDate();
      const days = [];
      for (let d = 1; d <= daysInM; d++) {
        const dObj = new Date(year, mIdx, d);
        days.push({
          dateStr: `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          day: d,
          isWeekend: [0, 6].includes(dObj.getDay()),
          weekday: dObj.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase()
        });
      }
      return { 
        monthName: first.toLocaleString('es-ES', { month: 'long', year: 'numeric' }), 
        monthKey: `${year}-${String(mIdx + 1).padStart(2, '0')}`, 
        monthShort: first.toLocaleString('es-ES', { month: 'short' }).charAt(0).toUpperCase(),
        days 
      };
    });
  }, [currentDate]);

  const filteredUsers = useMemo(() => {
    let list = allUsers;
    if (selectedDept) list = list.filter(u => u.departmentId === selectedDept);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers, selectedDept, tick]);

  const getAbsence = (userId: string, dateStr: string) => {
    const cleanUid = String(userId).trim().toLowerCase();
    return store.requests.find(r => {
        const start = r.startDate.split(/[ T]/)[0];
        const end = (r.endDate || r.startDate).split(/[ T]/)[0];
        return String(r.userId).trim().toLowerCase() === cleanUid && 
               (r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING) && 
               (!store.isOvertimeRequest(r.typeId) || r.typeId === RequestType.OVERTIME_SPEND_DAYS) && 
               r.typeId !== RequestType.ADJUSTMENT_DAYS &&
               dateStr >= start && dateStr <= end;
    });
  };

  const getActiveShiftId = (userId: string, dateStr: string): string => {
    const cleanUid = String(userId).trim().toLowerCase();
    const key = `${cleanUid}:${dateStr}`;
    if (key in draftChanges) return draftChanges[key];
    const found = store.config.shiftAssignments.find(a => 
        String(a.userId).trim().toLowerCase() === cleanUid && 
        String(a.date).trim() === dateStr
    );
    return found?.shiftTypeId || '';
  };

  const applyAction = (userId: string, dateStr: string) => {
    if (!selectedShiftId || isSaving) return;
    if (getAbsence(userId, dateStr)) return;

    const targetShiftId = selectedShiftId === 'eraser' ? '' : selectedShiftId;
    const cleanUid = String(userId).trim().toLowerCase();
    const key = `${cleanUid}:${dateStr}`;
    
    const currentDbValue = getActiveShiftId(userId, dateStr);
    
    if (targetShiftId === currentDbValue) {
        const next = { ...draftChanges };
        delete next[key];
        setDraftChanges(next);
    } else {
        setDraftChanges(prev => ({ ...prev, [key]: targetShiftId }));
    }
  };

  const handleCellInteraction = (userId: string, dateStr: string, isInitialClick: boolean = false) => {
    if (isInitialClick) {
        setIsDragging(true);
        applyAction(userId, dateStr);
    } else if (isDragging) {
        applyAction(userId, dateStr);
    }
  };

  const scrollToMonth = (monthKey: string) => {
    const el = document.getElementById(`month-${monthKey}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSave = async () => {
    const changes = Object.entries(draftChanges).map(([key, shiftId]) => {
        const [userId, date] = key.split(':');
        return { userId, date, shiftTypeId: shiftId as string };
    });

    if (changes.length === 0) return;

    setIsSaving(true);
    try {
        await store.assignShiftsBatch(changes);
        setDraftChanges({}); 
        alert("¡Planificación sincronizada con éxito!");
    } catch (err) {
        console.error("Error al guardar planificación:", err);
        alert("Fallo crítico al guardar.");
    } finally {
        setIsSaving(false);
    }
  };

  const applySmartPattern = () => {
    if (!plannerPattern || !plannerStartDate || !plannerEndDate) {
        alert("Por favor, completa todos los campos del planificador.");
        return;
    }
    
    const patternItems = plannerPattern.split(',').map(p => p.trim());
    const patternIds = patternItems.map(p => {
      const shift = store.config.shiftTypes.find(s => s.name.toLowerCase() === p.toLowerCase() || s.id === p);
      if (shift) return shift.id;
      if (['descanso', 'd', 'off', 'vacio', 'borrar'].includes(p.toLowerCase())) return '';
      return null;
    }).filter(p => p !== null) as string[];

    if (patternIds.length === 0) {
        alert("No se han reconocido turnos válidos en el patrón. Usa nombres de turnos (ej: Mañana) o 'D' para descanso.");
        return;
    }

    const start = new Date(plannerStartDate);
    const end = new Date(plannerEndDate);
    const newDraft = { ...draftChanges };

    filteredUsers.forEach(user => {
      let current = new Date(start);
      let patternIdx = 0;
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        // Solo aplicar si no hay ausencia aprobada/pendiente
        if (!getAbsence(user.id, dateStr)) {
          const shiftId = patternIds[patternIdx % patternIds.length];
          const key = `${String(user.id).trim().toLowerCase()}:${dateStr}`;
          
          // Solo añadir si es diferente al valor actual en DB
          const currentDbValue = getActiveShiftId(user.id, dateStr);
          if (shiftId !== currentDbValue) {
              newDraft[key] = shiftId;
          } else {
              delete newDraft[key];
          }
        }
        current.setDate(current.getDate() + 1);
        patternIdx++;
      }
    });

    setDraftChanges(newDraft);
    setShowSmartPlanner(false);
    alert(`Se han propuesto cambios para ${filteredUsers.length} empleados. Revisa el calendario y pulsa 'Guardar' para confirmar.`);
  };

  const getAbsenceStyle = (typeId: string) => {
      const label = store.getTypeLabel(typeId).toLowerCase();
      const id = String(typeId).toLowerCase();
      const isBaja = label.includes('baja') || label.includes('medica') || id.includes('baja') || id.includes('medica') || id === RequestType.SICKNESS;
      const isAsuntos = label.includes('asunto') || label.includes('person') || id.includes('asunto') || id.includes('person') || id === RequestType.PERSONAL;
      const isExtra = label.includes('canje') || label.includes('extra') || id.includes('canje') || id.includes('extra') || id === RequestType.OVERTIME_SPEND_DAYS;
      if (isBaja) return { bg: 'bg-red-100', text: 'text-red-700', label: 'BAJA', icon: Thermometer };
      if (isAsuntos) return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'AP', icon: UserIcon };
      if (isExtra) return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'DL', icon: ShieldCheck };
      return { bg: 'bg-green-100', text: 'text-green-700', label: 'VAC', icon: Palmtree };
  };

  const hasChanges = Object.keys(draftChanges).length > 0;

  return (
    <div className="flex flex-col h-full min-h-[750px] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
      
      {/* QUICK NAV SIDEBAR */}
      <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-1.5 z-[60] bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-slate-200 shadow-xl">
        {monthsData.map(m => (
            <button 
                key={m.monthKey}
                onClick={() => scrollToMonth(m.monthKey)}
                title={m.monthName}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all text-slate-400"
            >
                {m.monthShort}
            </button>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1))} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1))} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"><ChevronRight size={20}/></button>
          </div>
          <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">Gestor de Planificación Anual</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1.5">
                  <CalendarIcon size={10}/> Año {currentDate.getFullYear()} 
                  <span className="text-blue-500">• Modo Pintar Activo</span>
              </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <select 
                className="pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-100 appearance-none shadow-sm" 
                value={selectedDept} 
                onChange={e => setSelectedDept(e.target.value)}
            >
                <option value="">Filtrar Equipo...</option>
                {store.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button 
                disabled={isRefreshing}
                onClick={async () => { setIsRefreshing(true); await store.refresh(); setIsRefreshing(false); }} 
                className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-xl transition-all shadow-sm"
            >
                {isRefreshing ? <Loader2 size={18} className="animate-spin"/> : <RefreshCcw size={18}/>}
            </button>
            <button 
                onClick={() => setShowSmartPlanner(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-md"
            >
                <Star size={14} fill="currentColor"/> Planificador
            </button>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <button 
            onClick={() => setSelectedShiftId('eraser')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedShiftId === 'eraser' ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-400'}`}
          >
            <Eraser size={14}/> Borrador
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1"></div>
          {store.config.shiftTypes.map(s => (
            <button 
                key={s.id} 
                onClick={() => setSelectedShiftId(s.id)} 
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${selectedShiftId === s.id ? 'ring-2 ring-offset-1' : 'hover:opacity-80'}`} 
                style={{ 
                    backgroundColor: selectedShiftId === s.id ? s.color : 'white', 
                    color: selectedShiftId === s.id ? 'white' : s.color, 
                    borderColor: s.color 
                }}
            >
                {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-12 bg-slate-100/40 relative select-none">
        {isSaving && (
            <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-md flex items-center justify-center">
                <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-blue-100 animate-scale-in">
                    <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                    <p className="font-black uppercase text-blue-600 tracking-widest text-xs">Guardando cambios...</p>
                </div>
            </div>
        )}

        {showSmartPlanner && (
            <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 animate-scale-in overflow-hidden">
                    <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tighter">Planificador Inteligente</h3>
                            <p className="text-[10px] font-bold opacity-80 uppercase">Generación automática de turnos</p>
                        </div>
                        <button onClick={() => setShowSmartPlanner(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Fecha Inicio</label>
                                <input 
                                    type="date" 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white"
                                    value={plannerStartDate}
                                    onChange={e => setPlannerStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Fecha Fin</label>
                                <input 
                                    type="date" 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white"
                                    value={plannerEndDate}
                                    onChange={e => setPlannerEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Patrón de Turnos (Separado por comas)</label>
                            <input 
                                type="text" 
                                placeholder="Ej: Mañana, Mañana, Tarde, Tarde, D, D"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white"
                                value={plannerPattern}
                                onChange={e => setPlannerPattern(e.target.value)}
                            />
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: '6-2 Rotativo', pattern: 'Mañana, Mañana, Tarde, Tarde, Noche, Noche, D, D' },
                                    { label: '5-2 Mañana', pattern: 'Mañana, Mañana, Mañana, Mañana, Mañana, D, D' },
                                    { label: '5-2 Tarde', pattern: 'Tarde, Tarde, Tarde, Tarde, Tarde, D, D' },
                                    { label: 'Limpiar', pattern: 'D' }
                                ].map(p => (
                                    <button 
                                        key={p.label}
                                        type="button"
                                        onClick={() => setPlannerPattern(p.pattern)}
                                        className="px-2 py-1 bg-slate-100 hover:bg-blue-100 text-[9px] font-black text-slate-500 hover:text-blue-600 rounded-lg transition-colors border border-slate-200"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[9px] text-slate-400 mt-2 font-medium italic">Usa nombres de turnos o 'D' para descanso. El patrón se repetirá cíclicamente.</p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <h4 className="text-[10px] font-black text-blue-600 uppercase mb-2 flex items-center gap-2">
                                <AlertCircle size={12}/> Resumen de Aplicación
                            </h4>
                            <ul className="text-[10px] text-blue-700 font-bold space-y-1">
                                <li>• Se aplicará a {filteredUsers.length} empleados</li>
                                <li>• Respeta vacaciones y ausencias aprobadas</li>
                                <li>• Los cambios aparecerán como "Borrador"</li>
                            </ul>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={() => setShowSmartPlanner(false)}
                                className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={applySmartPattern}
                                className="flex-1 py-3 bg-blue-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                            >
                                Aplicar Patrón
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {monthsData.map(m => (
            <div key={m.monthKey} id={`month-${m.monthKey}`} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-6">
                <div className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <CalendarIcon size={14} className="text-blue-400"/> {m.monthName}
                    </h3>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <div className="inline-block min-w-full">
                        <div className="grid" style={{ gridTemplateColumns: `180px repeat(${m.days.length}, 34px)` }}>
                            <div className="sticky left-0 z-30 bg-slate-50 border-b border-r border-slate-200 p-2 h-12 flex items-center text-[9px] font-black text-slate-500 uppercase tracking-tighter shadow-sm">Empleado</div>
                            {m.days.map(d => {
                                const holiday = store.config.holidays.find(h => h.date === d.dateStr);
                                return (
                                    <div key={d.dateStr} className={`border-b border-r border-slate-200 flex flex-col items-center justify-center h-12 ${holiday ? 'bg-red-50 text-red-600 font-black' : d.isWeekend ? 'bg-slate-100 text-slate-400 font-bold' : 'bg-white text-slate-500 font-bold'}`}>
                                        <span className="text-[11px] leading-none">{d.day}</span>
                                        <span className="text-[7px] uppercase opacity-50 mt-1 leading-none">{d.weekday}</span>
                                        {holiday && <Star size={8} fill="currentColor" className="mt-0.5"/>}
                                    </div>
                                );
                            })}

                            {filteredUsers.map(user => (
                                <React.Fragment key={user.id}>
                                    <div className="sticky left-0 z-20 bg-white border-b border-r border-slate-200 px-4 flex items-center gap-3 h-9 shadow-sm">
                                        <img src={user.avatar} className="w-5 h-5 rounded-full border border-slate-100 object-cover" />
                                        <span className="text-[10px] font-black text-slate-700 truncate uppercase tracking-tighter">{user.name}</span>
                                    </div>
                                    {m.days.map(d => {
                                        const shiftId = getActiveShiftId(user.id, d.dateStr);
                                        const shift = store.config.shiftTypes.find(s => s.id === shiftId);
                                        const isDraft = `${String(user.id).trim().toLowerCase()}:${d.dateStr}` in draftChanges;
                                        const absence = getAbsence(user.id, d.dateStr);
                                        const isPending = absence?.status === RequestStatus.PENDING;
                                        const isApproved = absence?.status === RequestStatus.APPROVED;
                                        const style = absence ? getAbsenceStyle(absence.typeId) : null;

                                        return (
                                            <div 
                                                key={d.dateStr} 
                                                onMouseDown={() => handleCellInteraction(user.id, d.dateStr, true)}
                                                onMouseEnter={() => handleCellInteraction(user.id, d.dateStr)}
                                                className={`border-b border-r border-slate-100 h-9 flex items-center justify-center relative transition-all text-[9px] font-black
                                                    ${absence ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-black/5'}
                                                    ${isDraft ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}
                                                `}
                                                style={{ backgroundColor: shift?.color || 'transparent' }}
                                            >
                                                {shift && <span className="text-white drop-shadow-sm">{shift.name.charAt(0)}</span>}
                                                
                                                {absence && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                        <span 
                                                            className={`text-[6px] font-black px-0.5 rounded border shadow-sm ${isPending ? 'text-slate-800 bg-white/90 border-slate-200' : `${style?.text} ${style?.bg} border-current opacity-95`}`} 
                                                            title={`${isPending ? 'Pendiente' : 'Aprobado'}: ${store.getTypeLabel(absence.typeId)}`}
                                                        >
                                                            {isPending ? 'PEND' : style?.label}
                                                        </span>
                                                    </div>
                                                )}

                                                {isDraft && (
                                                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 flex items-center justify-center rounded-bl shadow-sm z-20">
                                                        <Edit size={6} className="text-white"/>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}

                            {/* FILA DE MÍNIMOS DE SERVICIO (DISPONIBILIDAD) */}
                            <div className="sticky left-0 z-30 bg-blue-50 border-b border-r border-blue-100 px-4 h-9 flex items-center shadow-sm">
                                <Users size={12} className="text-blue-600 mr-2"/>
                                <span className="text-[9px] font-black text-blue-700 uppercase tracking-tighter">Disponibilidad</span>
                            </div>
                            {m.days.map(d => {
                                const availableCount = filteredUsers.filter(u => !getAbsence(u.id, d.dateStr)).length;
                                const isLowService = availableCount < 2;
                                return (
                                    <div key={`service-${d.dateStr}`} className={`border-b border-r border-blue-100 h-9 flex items-center justify-center text-[10px] font-black ${isLowService ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50/30 text-blue-600'}`}>
                                        {availableCount}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>

      <div className="bg-white border-t border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-2.5 h-2.5 bg-green-100 border border-green-200 rounded-sm flex items-center justify-center"><Check size={8} className="text-green-600"/></div> VAC / Ausencia
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-2.5 h-2.5 bg-red-100 border border-red-200 rounded-sm flex items-center justify-center"><Star size={8} className="text-red-600"/></div> Festivos
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-2.5 h-2.5 bg-blue-100 border border-blue-200 rounded-sm"></div> Disp. Equipo
            </div>
        </div>

        {hasChanges ? (
            <div className="flex items-center gap-4 animate-fade-in-up">
                <div className="text-right">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Cambios pendientes: {Object.keys(draftChanges).length}</p>
                </div>
                <button 
                    onClick={() => { if(confirm('¿Descartar cambios?')) setDraftChanges({}); }} 
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                    <X size={20}/>
                </button>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs shadow-lg flex items-center gap-2 transition-all"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} 
                    Guardar Cambios
                </button>
            </div>
        ) : (
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest italic bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                <Check size={14} className="text-green-500"/> Sincronizado
            </div>
        )}
      </div>
    </div>
  );
};

export default ShiftScheduler;
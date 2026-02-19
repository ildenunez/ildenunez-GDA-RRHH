import React, { useState, useMemo, useEffect } from 'react';
import { User, RequestStatus, Role, ShiftType } from '../types';
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
  Edit
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
  
  // Mapa de cambios locales: "userId:dateStr" -> shiftTypeId
  const [draftChanges, setDraftChanges] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => setTick(t => t + 1));
    return unsubscribe;
  }, []);

  const monthsData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return [0, 1].map(offset => {
      const first = new Date(year, month + offset, 1);
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
  }, [currentDate]);

  const filteredUsers = useMemo(() => {
    let list = allUsers;
    if (selectedDept) list = list.filter(u => u.departmentId === selectedDept);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers, selectedDept, tick]);

  const getAbsence = (userId: string, dateStr: string) => {
    return store.requests.find(r => {
        const start = r.startDate.split('T')[0];
        const end = (r.endDate || r.startDate).split('T')[0];
        return String(r.userId) === String(userId) && 
               r.status === RequestStatus.APPROVED && 
               !store.isOvertimeRequest(r.typeId) && 
               dateStr >= start && dateStr <= end;
    });
  };

  const getActiveShiftId = (userId: string, dateStr: string): string => {
    const key = `${userId}:${dateStr}`;
    // El borrador tiene prioridad visual
    if (key in draftChanges) return draftChanges[key];
    // Si no hay borrador, mostrar lo del store
    return store.config.shiftAssignments.find(a => String(a.userId) === String(userId) && a.date === dateStr)?.shiftTypeId || '';
  };

  const handleCellClick = (userId: string, dateStr: string) => {
    if (!selectedShiftId || isSaving) return;
    if (getAbsence(userId, dateStr)) return;

    const targetShiftId = selectedShiftId === 'eraser' ? '' : selectedShiftId;
    const key = `${userId}:${dateStr}`;
    
    // Si el valor seleccionado es igual al que ya está en el store, simplemente eliminamos el cambio del borrador
    const currentDbValue = store.config.shiftAssignments.find(a => String(a.userId) === String(userId) && a.date === dateStr)?.shiftTypeId || '';
    
    if (targetShiftId === currentDbValue) {
        const next = { ...draftChanges };
        delete next[key];
        setDraftChanges(next);
    } else {
        setDraftChanges(prev => ({ ...prev, [key]: targetShiftId }));
    }
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
        setDraftChanges({}); // Limpiar borrador local tras éxito real
        alert("¡Planificación sincronizada con éxito!");
    } catch (err) {
        console.error("Error al guardar planificación:", err);
        alert("Fallo crítico al guardar. Se mantienen tus cambios en local por ahora.");
    } finally {
        setIsSaving(false);
    }
  };

  const getAbsenceStyle = (typeId: string) => {
      const type = String(typeId).toLowerCase();
      if (type.includes('vacaci')) return { bg: 'bg-green-100', text: 'text-green-700', label: 'VAC', icon: Palmtree };
      if (type.includes('baja') || type.includes('medica')) return { bg: 'bg-red-100', text: 'text-red-700', label: 'BAJA', icon: Thermometer };
      if (type.includes('asunto') || type.includes('person')) return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'AP', icon: UserIcon };
      if (type.includes('canje') || type.includes('extra')) return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'DL', icon: ShieldCheck };
      return { bg: 'bg-slate-100', text: 'text-slate-700', label: 'ABS', icon: AlertCircle };
  };

  const hasChanges = Object.keys(draftChanges).length > 0;

  return (
    <div className="flex flex-col h-full min-h-[750px] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
      
      {/* TOOLBAR */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"><ChevronRight size={20}/></button>
          </div>
          <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">Gestor de Planificación</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sincronización por Upsert (Clave Única)</p>
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
                title="Sincronizar manual"
            >
                {isRefreshing ? <Loader2 size={18} className="animate-spin"/> : <RefreshCcw size={18}/>}
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

      {/* PLANNER GRID */}
      <div className="flex-1 overflow-y-auto p-4 space-y-12 bg-slate-100/40 relative">
        {isSaving && (
            <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-md flex items-center justify-center">
                <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-blue-100 animate-scale-in">
                    <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                    <p className="font-black uppercase text-blue-600 tracking-widest text-xs">Transmitiendo a Base de Datos...</p>
                </div>
            </div>
        )}

        {monthsData.map(m => (
            <div key={m.monthKey} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <CalendarIcon size={14} className="text-blue-400"/> {m.monthName}
                    </h3>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <div className="inline-block min-w-full">
                        <div className="grid" style={{ gridTemplateColumns: `180px repeat(${m.days.length}, 34px)` }}>
                            {/* Días Header */}
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

                            {/* Filas de Empleados */}
                            {filteredUsers.map(user => (
                                <React.Fragment key={user.id}>
                                    <div className="sticky left-0 z-20 bg-white border-b border-r border-slate-200 px-4 flex items-center gap-3 h-9 shadow-sm">
                                        <img src={user.avatar} className="w-5 h-5 rounded-full border border-slate-100 object-cover" />
                                        <span className="text-[10px] font-black text-slate-700 truncate uppercase tracking-tighter">{user.name}</span>
                                    </div>
                                    {m.days.map(d => {
                                        const shiftId = getActiveShiftId(user.id, d.dateStr);
                                        const shift = store.config.shiftTypes.find(s => s.id === shiftId);
                                        const isDraft = `${user.id}:${d.dateStr}` in draftChanges;
                                        const absence = getAbsence(user.id, d.dateStr);
                                        const style = absence ? getAbsenceStyle(absence.typeId) : null;

                                        return (
                                            <div 
                                                key={d.dateStr} 
                                                onClick={() => handleCellClick(user.id, d.dateStr)} 
                                                className={`border-b border-r border-slate-100 h-9 flex items-center justify-center relative transition-all text-[9px] font-black
                                                    ${absence ? `${style?.bg} ${style?.text} cursor-not-allowed` : 'cursor-pointer hover:bg-black/5'}
                                                    ${isDraft ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}
                                                `}
                                                style={{ backgroundColor: !absence ? (shift?.color || 'transparent') : undefined }}
                                            >
                                                {!absence && shift && <span className="text-white drop-shadow-sm">{shift.name.charAt(0)}</span>}
                                                {absence && style && (
                                                    <div className="flex flex-col items-center leading-none" title={store.getTypeLabel(absence.typeId)}>
                                                        <style.icon size={10} className="mb-0.5 opacity-60"/>
                                                        <span className="text-[7px]">{style.label}</span>
                                                    </div>
                                                )}
                                                {isDraft && !absence && (
                                                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 flex items-center justify-center rounded-bl shadow-sm z-20">
                                                        <Edit size={6} className="text-white"/>
                                                    </div>
                                                )}
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

      {/* FOOTER ACCIONES */}
      <div className="bg-white border-t border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-2.5 h-2.5 bg-green-100 border border-green-200 rounded-sm flex items-center justify-center"><Check size={8} className="text-green-600"/></div> Ausencias Aprobadas
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-2.5 h-2.5 bg-red-100 border border-red-200 rounded-sm flex items-center justify-center"><Star size={8} className="text-red-600"/></div> Festivos
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <div className="w-2.5 h-2.5 border-2 border-blue-500 rounded-sm bg-blue-50 flex items-center justify-center"><Edit size={8} className="text-blue-500"/></div> Modificación en Borrador
            </div>
        </div>

        {hasChanges ? (
            <div className="flex items-center gap-4 animate-fade-in-up">
                <div className="text-right">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Cambios pendientes: {Object.keys(draftChanges).length}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase italic">Listo para persistir</p>
                </div>
                <button 
                    onClick={() => { if(confirm('¿Descartar todos los cambios no guardados?')) setDraftChanges({}); }} 
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Descartar borrador"
                >
                    <X size={20}/>
                </button>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} 
                    Persistir Planificación
                </button>
            </div>
        ) : (
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest italic bg-slate-50 px-4 py-2 rounded-full border border-slate-100 shadow-inner">
                <Check size={14} className="text-green-500"/> Estado sincronizado con servidor
            </div>
        )}
      </div>
    </div>
  );
};

export default ShiftScheduler;
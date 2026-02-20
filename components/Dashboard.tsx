import React, { useState, useEffect, useMemo } from 'react';
import { User, RequestStatus, LeaveRequest, RequestType, NewsPost } from '../types';
import { store } from '../services/store';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Legend, YAxis, CartesianGrid } from 'recharts';
import { Calendar, Clock, AlertCircle, Sun, PlusCircle, Timer, ChevronRight, ArrowLeft, History, Edit2, Trash2, Briefcase, ShieldCheck, HardHat, FileText, CheckCircle2, Megaphone, Cake, Quote, Star, Truck, Info, CalendarDays, CalendarClock } from 'lucide-react';
import PPERequestModal from './PPERequestModal';

interface DashboardProps {
  user: User;
  onNewRequest: (type: 'absence' | 'overtime') => void;
  onEditRequest: (req: LeaveRequest) => void;
  onViewRequest: (req: LeaveRequest) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user: initialUser, onNewRequest, onEditRequest, onViewRequest }) => {
  const [detailView, setDetailView] = useState<'none' | 'days' | 'hours'>('none');
  const [showPPEModal, setShowPPEModal] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => { setRefresh(prev => prev + 1); });
    return unsubscribe;
  }, []);

  const currentUser = store.users.find(u => u.id === initialUser.id) || initialUser;
  const requests = store.getMyRequests();
  const news = store.config.news;

  const upcomingAbsences = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return requests
      .filter(r => 
        r.status === RequestStatus.APPROVED && 
        !store.isOvertimeRequest(r.typeId) && 
        (r.endDate || r.startDate) >= today
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 4);
  }, [requests]);
  const isRepartidor = store.departments.find(d => d.id === currentUser.departmentId)?.name === 'Repartidores';

  const scheduleData = useMemo(() => {
      const today = new Date();
      const currentDay = today.getDay(); 
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      monday.setHours(0,0,0,0);

      const days = [];
      for (let i = 0; i < 14; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const assignment = store.config.shiftAssignments.find(a => a.userId === currentUser.id && a.date === dateStr);
          const shift = assignment ? store.config.shiftTypes.find(s => s.id === assignment.shiftTypeId) : null;
          const holiday = store.config.holidays.find(h => h.date === dateStr);
          const activeRequest = store.requests.find(r => { 
                const s = r.startDate.split('T')[0]; 
                const e = (r.endDate || r.startDate).split('T')[0]; 
                return r.userId === currentUser.id && dateStr >= s && dateStr <= e && !store.isOvertimeRequest(r.typeId) && r.status === RequestStatus.APPROVED;
          });

          days.push({
              dateStr,
              dayLabel: d.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase(),
              dayNumber: d.getDate(),
              isToday: d.toDateString() === today.toDateString(),
              shift,
              holiday,
              activeRequest
          });
      }
      return days;
  }, [currentUser.id, refresh]);

  const activeShiftsInPeriod = useMemo(() => {
    const shifts = new Map();
    scheduleData.forEach(d => {
        if (d.shift) shifts.set(d.shift.id, d.shift);
    });
    return Array.from(shifts.values());
  }, [scheduleData]);

  const handleDelete = async (reqId: string) => {
      if(confirm('¿Seguro que deseas eliminar esta solicitud?')) await store.deleteRequest(reqId);
  };

  const getRequestLabel = (req: LeaveRequest) => {
      const label = req.label || store.getTypeLabel(req.typeId);
      if (req.typeId === RequestType.ADJUSTMENT_DAYS || req.typeId === RequestType.ADJUSTMENT_OVERTIME) {
          return ( <span className="flex items-center gap-1.5 text-blue-700 font-bold"><ShieldCheck size={16} className="text-blue-600" />{label}</span> );
      }
      return <span className="font-medium text-slate-800">{label}</span>;
  };

  // Lógica de Libro de Mayor para las vistas de detalle
  const auditTrail = useMemo(() => {
      if (detailView === 'none') return [];
      const isOvertime = detailView === 'hours';
      
      // Filtrar solicitudes relevantes aprobadas
      const relevant = requests
        .filter(r => r.status === RequestStatus.APPROVED && (isOvertime ? store.isOvertimeRequest(r.typeId) : !store.isOvertimeRequest(r.typeId)))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)); // Orden cronológico para calcular acumulado

      let runningBalance = 0;
      return relevant.map(req => {
          let impact = 0;
          if (isOvertime) {
              impact = req.hours || 0;
          } else {
              if (req.typeId === RequestType.ADJUSTMENT_DAYS) {
                  impact = req.hours || 0;
              } else {
                  const start = new Date(req.startDate);
                  const end = new Date(req.endDate || req.startDate);
                  impact = -(Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
              }
          }
          runningBalance += impact;
          return { ...req, impact, runningBalance };
      }).reverse(); // Mostramos lo más reciente primero en la tabla
  }, [detailView, requests, refresh]);

  const stats = [
    { id: 'days', label: 'Vacaciones', value: (currentUser.daysAvailable ?? 0).toFixed(1), icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50', clickable: true, visible: !isRepartidor },
    { id: 'hours', label: 'Horas Extra', value: `${(currentUser.overtimeHours ?? 0).toFixed(1)}h`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', clickable: true, visible: !isRepartidor },
    { id: 'truck', label: 'Camión Asignado', value: currentUser.truckNumber || 'N/A', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', clickable: false, visible: isRepartidor },
    { id: 'pending', label: 'Solicitudes EPI', value: String(store.config.ppeRequests.filter(r => r.userId === currentUser.id && r.status !== 'ENTREGADO').length), icon: HardHat, color: 'text-orange-500', bg: 'bg-orange-50', clickable: false, visible: isRepartidor },
    { id: 'pending_abs', label: 'En Revisión', value: String(requests.filter(r => r.status === RequestStatus.PENDING).length), icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50', clickable: false, visible: !isRepartidor },
  ];

  if (detailView !== 'none') {
    const isOvertimeView = detailView === 'hours';
    const title = isOvertimeView ? 'Libro de Mayor: Horas Extra' : 'Libro de Mayor: Ausencias';
    const pendingReqs = requests.filter(r => r.status === RequestStatus.PENDING && (isOvertimeView ? store.isOvertimeRequest(r.typeId) : !store.isOvertimeRequest(r.typeId)));
    
    return (
        <div className="space-y-6 animate-fade-in xl:space-y-4">
            <div className="flex items-center gap-4">
                <button onClick={() => setDetailView('none')} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><ArrowLeft /></button>
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            </div>
            
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">Saldo Actual Consolidado</p>
                    <p className={`text-3xl font-black ${isOvertimeView ? 'text-blue-600' : 'text-orange-600'}`}>
                        {isOvertimeView ? `${(currentUser.overtimeHours ?? 0).toFixed(1)}h` : (currentUser.daysAvailable ?? 0).toFixed(1)}
                    </p>
                </div>
                <button 
                  disabled={store.isBusy}
                  onClick={() => onNewRequest(isOvertimeView ? 'overtime' : 'absence')} 
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    <PlusCircle size={18} /> Nueva Solicitud
                </button>
            </div>

            {/* Pendientes de Aprobación */}
            {pendingReqs.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
                    <h3 className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-2"><Clock size={16}/> Solicitudes en Revisión (No afectan al saldo aún)</h3>
                    <div className="space-y-2">
                        {pendingReqs.map(req => (
                            <div key={req.id} className="bg-white/80 p-3 rounded-xl border border-yellow-200 flex justify-between items-center text-sm">
                                <div>
                                    <span className="font-bold">{store.getTypeLabel(req.typeId)}</span>
                                    <span className="ml-2 text-slate-500">{new Date(req.startDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-mono font-bold text-yellow-600">{isOvertimeView ? `${req.hours}h` : 'Pendiente'}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => onEditRequest(req)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={14}/></button>
                                        <button onClick={() => handleDelete(req.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 xl:p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><History size={18} className="text-slate-400"/> Historial de Movimientos (Audit Trail)</h3>
                    <div className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded border tracking-widest">Orden Cronológico Inverso</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Concepto / Motivo</th>
                                <th className="px-6 py-4 text-center">Movimiento</th>
                                <th className="px-6 py-4 text-center">Saldo Resultante</th>
                                <th className="px-6 py-4 text-right print:hidden">Info</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {auditTrail.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No hay movimientos registrados en el sistema.</td></tr>
                            ) : auditTrail.map((move: any) => (
                                <tr key={move.id} onClick={() => onViewRequest(move)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                                    <td className="px-6 py-4 text-slate-500 font-medium">{new Date(move.startDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{store.getTypeLabel(move.typeId)}</div>
                                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{move.reason || '-'}</div>
                                    </td>
                                    <td className={`px-6 py-4 text-center font-black ${move.impact < 0 ? 'text-red-600 bg-red-50/30' : 'text-green-600 bg-green-50/30'}`}>
                                        {move.impact > 0 ? '+' : ''}{move.impact}{isOvertimeView ? 'h' : 'd'}
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                                        {move.runningBalance.toFixed(1)}{isOvertimeView ? 'h' : 'd'}
                                    </td>
                                    <td className="px-6 py-4 text-right print:hidden">
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors ml-auto"/>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                <Info size={20} className="text-blue-500 shrink-0"/>
                <p className="text-xs text-blue-700 leading-relaxed">
                    Este reporte muestra la trazabilidad completa de sus saldos. Los movimientos se registran automáticamente en el momento que un administrador aprueba su solicitud. 
                    Si detecta alguna discrepancia, contacte con el departamento de RRHH.
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6 xl:space-y-5 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
         <div><h2 className="text-2xl xl:text-xl font-bold text-slate-800">Hola, {currentUser.name}</h2><p className="text-slate-500 xl:text-sm">Panel de control personal.</p></div>
         <div className="flex gap-2.5 w-full md:w-auto">
            {!isRepartidor && (
              <><button disabled={store.isBusy} onClick={() => onNewRequest('absence')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl shadow-lg font-medium text-sm disabled:opacity-50"><PlusCircle size={18}/> Ausencia</button><button disabled={store.isBusy} onClick={() => onNewRequest('overtime')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 px-5 py-3 rounded-xl font-medium text-sm disabled:opacity-50"><Timer size={18}/> Horas</button></>
            )}
            <button disabled={store.isBusy} onClick={() => setShowPPEModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 px-5 py-3 rounded-xl font-medium text-sm disabled:opacity-50"><HardHat size={18}/> EPI</button>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 xl:gap-4">
        <div onClick={() => { const btn = Array.from(document.querySelectorAll('aside nav button')).find(b => b.textContent?.includes('Calendario')) as HTMLButtonElement; if(btn) btn.click(); }} className="md:col-span-2 bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden group cursor-pointer border border-slate-800 hover:border-blue-500 transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><CalendarDays size={120}/></div>
             <div className="flex justify-between items-center mb-4 relative z-10"><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Mi Planificación (2 Semanas)</p><ChevronRight size={16} className="text-slate-500 group-hover:text-blue-400"/></div>
             <div className="grid grid-cols-7 gap-1 relative z-10">{scheduleData.map((d, idx) => (<div key={idx} className="flex flex-col items-center"><span className="text-[8px] font-black text-slate-500 mb-1">{d.dayLabel}</span><div title={d.holiday?.name || d.shift?.name || 'Libre'} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all border ${d.isToday ? 'ring-2 ring-blue-500 border-transparent shadow-lg scale-110 z-20' : 'border-slate-800'} ${d.holiday ? 'bg-red-500/20 text-red-500 border-red-500/30' : d.activeRequest ? 'bg-green-500/20 text-green-500 border-green-500/30' : d.shift ? 'shadow-inner' : 'bg-slate-800/50 text-slate-600'}`} style={d.shift && !d.holiday && !d.activeRequest ? { backgroundColor: d.shift.color + '40', color: d.shift.color, borderColor: d.shift.color + '60' } : {}}>{d.dayNumber}</div></div>))}</div>
             <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 relative z-10 py-3 border-t border-slate-800/50">{activeShiftsInPeriod.map(s => (<div key={s.id} className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }}></div><span className="text-[9px] font-bold text-slate-300 uppercase">{s.name}</span></div>))}</div>
        </div>
        {stats.filter(s => s.visible).map((stat) => (
          <div key={stat.id} onClick={() => stat.clickable && setDetailView(stat.id as any)} className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group transition-all ${stat.clickable ? 'cursor-pointer hover:shadow-md' : ''}`}><div className="flex items-center space-x-4"><div className={`p-4 rounded-2xl ${stat.bg}`}><stat.icon className={`w-8 h-8 ${stat.color}`} /></div><div><p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</p><h3 className="text-2xl font-black text-slate-800">{stat.value}</h3></div></div>{stat.clickable && <ChevronRight className="text-slate-200 group-hover:text-blue-500" size={20}/>}</div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-4">
        <div className={`${isRepartidor ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
          {upcomingAbsences.length > 0 && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
                <CalendarClock className="text-orange-500" size={20}/> Próximas Ausencias
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingAbsences.map(abs => (
                  <div key={abs.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 bg-white border border-orange-100 text-orange-600 text-[10px] font-black rounded-lg uppercase">
                          {store.getTypeLabel(abs.typeId)}
                        </span>
                        <Calendar size={14} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {new Date(abs.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        {abs.endDate && abs.endDate !== abs.startDate && ` - ${new Date(abs.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        {abs.endDate ? `${Math.ceil(Math.abs(new Date(abs.endDate).getTime() - new Date(abs.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} días` : '1 día'}
                      </p>
                    </div>
                    <button onClick={() => onViewRequest(abs)} className="mt-3 text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:gap-2 transition-all">
                      Detalles <ChevronRight size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
              <Megaphone className="text-blue-600" size={20}/> Muro de Anuncios
            </h3>
            <div className="space-y-4">
              {news.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed text-slate-400 italic">No hay anuncios publicados.</div>
              ) : (
                news.map(post => (
                  <div key={post.id} className="relative p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-slate-800 text-lg tracking-tight">{post.title}</h4>
                      <span className="text-[10px] font-black text-slate-400 uppercase bg-white px-2 py-0.5 rounded-full border">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{post.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {showPPEModal && <PPERequestModal userId={currentUser.id} onClose={() => setShowPPEModal(false)} />}
    </div>
  );
};

export default Dashboard;
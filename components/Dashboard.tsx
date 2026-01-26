import React, { useState, useEffect, useMemo } from 'react';
import { User, RequestStatus, LeaveRequest, RequestType, NewsPost } from '../types';
import { store } from '../services/store';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Legend, YAxis, CartesianGrid } from 'recharts';
import { Calendar, Clock, AlertCircle, Sun, PlusCircle, Timer, ChevronRight, ArrowLeft, History, Edit2, Trash2, Briefcase, ShieldCheck, HardHat, FileText, CheckCircle2, Megaphone, Cake, Quote, Star, Truck, Info, CalendarDays } from 'lucide-react';
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
  const isRepartidor = store.departments.find(d => d.id === currentUser.departmentId)?.name === 'Repartidores';

  // Lógica para obtener el horario de la semana actual y la siguiente
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
          const dateStr = d.toISOString().split('T')[0];
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

  // Obtener turnos únicos presentes en el periodo para la leyenda
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

  const stats = [
    { id: 'days', label: 'Días de Vacaciones', value: currentUser.daysAvailable.toFixed(1), icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50', clickable: true, visible: !isRepartidor },
    { id: 'hours', label: 'Saldo Horas Extra', value: `${currentUser.overtimeHours.toFixed(1)}h`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', clickable: true, visible: !isRepartidor },
    { id: 'truck', label: 'Camión Asignado', value: currentUser.truckNumber || 'N/A', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', clickable: false, visible: isRepartidor },
    { id: 'pending', label: 'Solicitudes EPI', value: String(store.config.ppeRequests.filter(r => r.userId === currentUser.id && r.status !== 'ENTREGADO').length), icon: HardHat, color: 'text-orange-500', bg: 'bg-orange-50', clickable: false, visible: isRepartidor },
    { id: 'pending_abs', label: 'En Revisión', value: String(requests.filter(r => r.status === RequestStatus.PENDING).length), icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50', clickable: false, visible: !isRepartidor },
  ];

  const upcomingBirthdays = store.users.filter(u => {
      if (!u.birthdate) return false;
      const b = new Date(u.birthdate);
      const today = new Date();
      return (b.getMonth() === today.getMonth() && Math.abs(b.getDate() - today.getDate()) <= 7);
  });

  const goToCalendar = () => {
      const calendarBtn = document.querySelector('button[onClick*="calendar"]') as HTMLButtonElement;
      if (calendarBtn) calendarBtn.click();
  };

  if (detailView !== 'none') {
    const isOvertimeView = detailView === 'hours';
    const title = isOvertimeView ? 'Historial de Horas Extra' : 'Historial de Ausencias';
    const filteredRequests = requests.filter(r => isOvertimeView ? store.isOvertimeRequest(r.typeId) : !store.isOvertimeRequest(r.typeId));
    return (
        <div className="space-y-6 animate-fade-in xl:space-y-4">
            <div className="flex items-center gap-4">
                <button onClick={() => setDetailView('none')} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><ArrowLeft /></button>
                <h2 className="text-2xl xl:text-xl font-bold text-slate-800">{title}</h2>
            </div>
            <div className="flex justify-between items-center bg-white p-6 xl:p-5 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <p className="text-sm text-slate-500 uppercase font-semibold">Saldo Actual BBDD</p>
                    <p className="text-4xl xl:text-3xl font-bold text-slate-800">{isOvertimeView ? `${currentUser.overtimeHours.toFixed(1)}h` : currentUser.daysAvailable.toFixed(1)}</p>
                </div>
                <button onClick={() => onNewRequest(isOvertimeView ? 'overtime' : 'absence')} className="flex items-center gap-2 bg-blue-600 text-white px-6 xl:px-5 py-3 xl:py-2.5 rounded-xl hover:bg-blue-700 shadow-lg font-bold transition-all"><PlusCircle size={20} /> Nuevo</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 xl:p-4 border-b border-slate-100"><h3 className="font-bold text-slate-700 flex items-center gap-2"><History size={18} className="text-slate-400"/> Historial</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 xl:py-3 font-semibold">Tipo</th>
                                <th className="px-6 py-4 xl:py-3 font-semibold">Fecha(s)</th>
                                {isOvertimeView && <th className="px-6 py-4 xl:py-3 font-semibold">Horas</th>}
                                <th className="px-6 py-4 xl:py-3 font-semibold">Estado</th>
                                <th className="px-6 py-4 xl:py-3 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRequests.map(req => (
                                <tr key={req.id} onClick={() => onViewRequest(req)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                                    <td className="px-6 py-4 xl:py-3">{getRequestLabel(req)}</td>
                                    <td className="px-6 py-4 xl:py-3 text-slate-600">{(req.typeId as string).includes('ajuste') ? 'Manual' : `${new Date(req.startDate).toLocaleDateString()}`}</td>
                                    {isOvertimeView && <td className={`px-6 py-4 xl:py-3 font-bold ${(req.hours||0) < 0 ? 'text-red-600' : 'text-green-600'}`}>{(req.hours||0) > 0 ? '+' : ''}{req.hours}h</td>}
                                    <td className="px-6 py-4 xl:py-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${req.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' : req.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{req.status}</span></td>
                                    <td className="px-6 py-4 xl:py-3 text-right" onClick={e => e.stopPropagation()}>{req.status === RequestStatus.PENDING && (<div className="flex justify-end gap-2"><button onClick={() => onEditRequest(req)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg"><Edit2 size={16}/></button><button onClick={() => handleDelete(req.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={16}/></button></div>)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
              <>
                <button onClick={() => onNewRequest('absence')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 xl:px-4 py-3 xl:py-2.5 rounded-xl shadow-lg font-medium text-sm"><PlusCircle size={18}/> Ausencia</button>
                <button onClick={() => onNewRequest('overtime')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 px-5 xl:px-4 py-3 xl:py-2.5 rounded-xl font-medium text-sm"><Timer size={18}/> Horas</button>
              </>
            )}
            <button onClick={() => setShowPPEModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 px-5 xl:px-4 py-3 xl:py-2.5 rounded-xl font-medium text-sm"><HardHat size={18}/> EPI</button>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 xl:gap-4">
        {/* NUEVA TARJETA DE HORARIO SEMANAL */}
        <div 
            onClick={goToCalendar}
            className="md:col-span-2 bg-slate-900 text-white p-6 xl:p-5 rounded-3xl shadow-xl relative overflow-hidden group cursor-pointer border border-slate-800 hover:border-blue-500 transition-all"
        >
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><CalendarDays size={120}/></div>
             <div className="flex justify-between items-center mb-4 relative z-10">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Mi Planificación de Turnos</p>
                <ChevronRight size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors"/>
             </div>

             <div className="grid grid-cols-7 gap-1 xl:gap-0.5 relative z-10">
                 {scheduleData.map((d, idx) => (
                     <div key={idx} className="flex flex-col items-center">
                         <span className="text-[8px] font-black text-slate-500 mb-1">{d.dayLabel}</span>
                         <div 
                            title={d.holiday ? `Festivo: ${d.holiday.name}` : d.shift ? d.shift.name : 'Libre'}
                            className={`w-7 h-7 xl:w-6 xl:h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all border
                                ${d.isToday ? 'ring-2 ring-blue-500 border-transparent shadow-lg scale-110 z-20' : 'border-slate-800'}
                                ${d.holiday ? 'bg-red-500/20 text-red-500 border-red-500/30' : 
                                  d.activeRequest ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                                  d.shift ? 'shadow-inner' : 'bg-slate-800/50 text-slate-600'}
                            `}
                            style={d.shift && !d.holiday && !d.activeRequest ? { backgroundColor: d.shift.color + '40', color: d.shift.color, borderColor: d.shift.color + '60' } : {}}
                         >
                             {d.dayNumber}
                         </div>
                         {idx === 6 && <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-800 pointer-events-none mt-4"></div>}
                     </div>
                 ))}
             </div>

             {/* LEYENDA DINÁMICA DE TURNOS */}
             <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 relative z-10 py-2 border-t border-slate-800/50">
                 {activeShiftsInPeriod.length === 0 && <span className="text-[9px] text-slate-500 italic">No hay turnos específicos asignados estas 2 semanas</span>}
                 {activeShiftsInPeriod.map(s => (
                     <div key={s.id} className="flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                         <span className="text-[9px] font-bold text-slate-300 uppercase">{s.name}</span>
                     </div>
                 ))}
             </div>

             <div className="mt-2 flex justify-between items-center relative z-10 border-t border-slate-800 pt-3">
                 <div className="flex gap-3 text-[8px] font-black uppercase tracking-tighter text-slate-400">
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Hoy</span>
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Festivo</span>
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Vacaciones</span>
                 </div>
                 <span className="text-[9px] font-bold text-blue-400 group-hover:underline">Ver calendario completo</span>
             </div>
        </div>

        {stats.filter(s => s.visible).map((stat) => (
          <div key={stat.id} onClick={() => stat.clickable && setDetailView(stat.id as any)} className={`bg-white p-6 xl:p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group transition-all ${stat.clickable ? 'cursor-pointer hover:shadow-md' : ''}`}>
            <div className="flex items-center space-x-4 xl:space-x-3">
                <div className={`p-4 xl:p-3 rounded-2xl ${stat.bg}`}><stat.icon className={`w-8 h-8 xl:w-7 xl:h-7 ${stat.color}`} /></div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</p>
                    <h3 className="text-2xl xl:text-xl font-black text-slate-800">{stat.value}</h3>
                </div>
            </div>
            {stat.clickable && <ChevronRight className="text-slate-200 group-hover:text-blue-500 transition-colors" size={20}/>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-4">
        <div className={`${isRepartidor ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white p-6 xl:p-5 rounded-3xl shadow-sm border border-slate-100 h-fit`}>
            <h3 className="text-lg xl:text-base font-bold text-slate-800 mb-6 xl:mb-4 flex items-center gap-2 uppercase tracking-tighter"><Megaphone className="text-blue-600" size={20}/> Muro de Anuncios</h3>
            <div className="space-y-4">
                {news.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 italic">No hay anuncios publicados.</div>
                ) : news.map(post => (
                    <div key={post.id} className="relative p-6 xl:p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black text-slate-800 text-lg xl:text-base tracking-tight">{post.title}</h4>
                            <span className="text-[10px] font-black text-slate-400 uppercase bg-white px-2 py-0.5 rounded-full border border-slate-200">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-600 text-sm xl:text-xs leading-relaxed whitespace-pre-line">{post.content}</p>
                    </div>
                ))}
            </div>
        </div>

        {!isRepartidor && (
          <div className="space-y-6 xl:space-y-4">
               <div className="bg-white p-6 xl:p-5 rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
                   <div className="absolute -top-4 -right-4 text-orange-100 opacity-30 transform rotate-12"><Cake size={120}/></div>
                   <h3 className="text-lg xl:text-base font-black text-slate-800 mb-4 flex items-center gap-2 relative z-10 uppercase tracking-tighter"><Cake className="text-orange-500" size={20}/> Cumpleaños</h3>
                   <div className="space-y-3 relative z-10">
                       {upcomingBirthdays.length === 0 ? (
                           <p className="text-xs text-slate-400 italic py-4">Sin cumpleaños próximos.</p>
                       ) : upcomingBirthdays.map(u => {
                           const bd = new Date(u.birthdate!);
                           const today = new Date();
                           const isToday = bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
                           return (
                               <div key={u.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isToday ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                                   <img src={u.avatar} className="w-10 h-10 xl:w-9 xl:h-9 rounded-full border-2 border-white shadow-sm object-cover"/>
                                   <div className="flex-1 min-w-0">
                                       <p className="text-xs font-black text-slate-800 truncate">{u.name}</p>
                                       <p className={`text-[10px] font-bold uppercase tracking-tight ${isToday ? 'text-orange-600' : 'text-slate-500'}`}>
                                           {isToday ? '¡Hoy es su día! 🎉' : `${bd.getDate()} de ${['Enero','Feb.','Marzo','Abril','Mayo','Junio','Julio','Agosto','Sept.','Oct.','Nov.','Dic.'][bd.getMonth()]}`}
                                       </p>
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               </div>

               <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
                   <div className="absolute bottom-0 right-0 p-4 opacity-10 transform translate-y-4 translate-x-4"><Quote size={80}/></div>
                   <Quote className="text-white/30 mb-3 w-8 h-8 xl:w-6 xl:h-6" size={32} />
                   <p className="italic font-bold leading-relaxed text-sm xl:text-xs relative z-10">"El único modo de hacer un gran trabajo es amar lo que haces."</p>
                   <p className="text-right text-[10px] font-black mt-4 text-blue-200 uppercase tracking-widest relative z-10">— Steve Jobs</p>
               </div>
          </div>
        )}
      </div>

      {!isRepartidor && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-4">
          <div className="bg-white p-6 xl:p-5 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg xl:text-base font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter"><Calendar className="text-slate-600" size={20} /> Solicitudes Recientes</h3>
            <div className="space-y-2">
              {requests.length === 0 ? <p className="text-slate-400 text-sm italic py-4">No has realizado solicitudes.</p> : requests.slice(0, 4).map((req) => (
                <div key={req.id} onClick={() => onViewRequest(req)} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 group transition-all">
                  <div>
                    <div className="flex items-center gap-2 text-sm xl:text-xs">{getRequestLabel(req)}</div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{(req.typeId as string).includes('ajuste') ? 'Automático' : `${new Date(req.startDate).toLocaleDateString()}`}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${
                        req.status === RequestStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-100' : 
                        req.status === RequestStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-100' : 
                        'bg-yellow-50 text-yellow-700 border-yellow-100'
                    }`}>
                        {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 xl:p-5 rounded-3xl shadow-sm border border-slate-100">
               <h3 className="text-lg xl:text-base font-black text-slate-800 mb-6 uppercase tracking-tighter">Estadísticas de Ausencia</h3>
               <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[]} /* Datos simulados o reales según store */>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                          <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                          <Bar dataKey="approved" name="Aprobados" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
               </div>
          </div>
        </div>
      )}
      {showPPEModal && <PPERequestModal userId={currentUser.id} onClose={() => setShowPPEModal(false)} />}
    </div>
  );
};

export default Dashboard;
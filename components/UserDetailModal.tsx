import React, { useState, useEffect, useMemo } from 'react';
import { User, Role, RequestStatus, LeaveRequest, RequestType } from '../types';
import { store } from '../services/store';
import { X, Save, HardHat, Plus, Camera, ChevronRight, Loader2, Users, Clock, Sun, Trash2, Info, MessageSquare, AlertCircle } from 'lucide-react';
import RequestFormModal from './RequestFormModal';
import PPERequestModal from './PPERequestModal';

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onViewRequest: (req: LeaveRequest) => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user: initialUser, onClose, onViewRequest }) => {
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => setRefresh(prev => prev + 1));
    return unsubscribe;
  }, []);

  const user = store.users.find(u => u.id === initialUser.id) || initialUser;

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [deptId, setDeptId] = useState(user.departmentId);
  const [birthdate, setBirthdate] = useState(user.birthdate || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [daysAdjust, setDaysAdjust] = useState('');
  const [hoursAdjust, setHoursAdjust] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showPPEModal, setShowPPEModal] = useState(false);

  const isNew = user.id === 'new';
  const requests = store.requests.filter(r => r.userId === user.id).sort((a,b) => b.createdAt.localeCompare(a.startDate));

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
        if (isNew) {
            const data = { name, email, role, departmentId: deptId, birthdate, avatar, daysAvailable: 22, overtimeHours: 0 };
            await store.createUser(data, 'pass123');
        } else {
            if (daysAdjust && !isNaN(parseFloat(daysAdjust))) {
                await store.createRequest({ typeId: RequestType.ADJUSTMENT_DAYS, startDate: new Date().toISOString(), hours: parseFloat(daysAdjust), reason: adjustReason || 'Ajuste manual de días (Admin)' }, user.id, RequestStatus.APPROVED);
            }
            if (hoursAdjust && !isNaN(parseFloat(hoursAdjust))) {
                await store.createRequest({ typeId: RequestType.ADJUSTMENT_OVERTIME, startDate: new Date().toISOString(), hours: parseFloat(hoursAdjust), reason: adjustReason || 'Ajuste manual de horas (Admin)' }, user.id, RequestStatus.APPROVED);
            }
            const updatedUser = store.users.find(u => u.id === user.id) || user;
            await store.updateUserAdmin(user.id, { name, email, role, departmentId: deptId, birthdate, avatar, daysAvailable: updatedUser.daysAvailable, overtimeHours: updatedUser.overtimeHours });
        }
        onClose();
    } catch (error) { console.error("Error al actualizar:", error); } finally { setIsSaving(false); }
  };

  const calculateAmountStr = (req: LeaveRequest) => {
    if (store.isOvertimeRequest(req.typeId)) {
        const h = req.hours || 0; return h > 0 ? `+${h}h` : `${h}h`;
    } else {
        if (req.typeId === RequestType.ADJUSTMENT_DAYS) { const h = req.hours || 0; return h > 0 ? `+${h}d` : `${h}d`; }
        const start = new Date(req.startDate); const end = new Date(req.endDate || req.startDate);
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return `-${diffDays}d`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in max-h-[95vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl text-white"><Users size={24}/></div>
                <h2 className="text-2xl font-black text-slate-800">Ficha Empleado</h2>
            </div>
            <div className="flex gap-2">
                {!isNew && (<><button onClick={() => setShowPPEModal(true)} className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-orange-100 border border-orange-100"><HardHat size={16}/> Solicitar EPI</button><button onClick={() => setShowRequestForm(true)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-100 border border-blue-100"><Plus size={16}/> Nueva Solicitud</button></>)}
                <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full ml-2"><X/></button>
            </div>
        </div>
        <div className="p-8 space-y-10">
            <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 pb-2 border-b border-slate-100">Perfil Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex justify-center md:justify-start items-center">
                        <div className="relative group">
                            <img src={avatar || `https://ui-avatars.com/api/?name=${name}`} className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover" />
                            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[10px] font-bold">
                                <Camera size={20} className="mb-1"/>CAMBIAR<input type="file" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setAvatar(reader.result as string); reader.readAsDataURL(file); } }} />
                            </label>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nombre Completo</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:bg-white outline-none" value={name} onChange={e=>setName(e.target.value)} /></div>
                        <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Email Corporativo</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:bg-white outline-none" value={email} onChange={e=>setEmail(e.target.value)} /></div>
                    </div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Rol</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none" value={role} onChange={e=>setRole(e.target.value as Role)}><option value={Role.WORKER}>Trabajador</option><option value={Role.SUPERVISOR}>Supervisor</option><option value={Role.ADMIN}>Administrador</option></select></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Departamento</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none" value={deptId} onChange={e=>setDeptId(e.target.value)}>{store.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                </div>
            </section>
            {!isNew && (
                <section>
                    <div className="flex justify-between items-end mb-6 pb-2 border-b border-slate-100"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldos Reales (Sincronizados)</h3><div className="flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-full"><Info size={10} className="text-blue-600"/><span className="text-[9px] font-black text-blue-600 uppercase">Datos directos de BBDD</span></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-5 bg-white border border-orange-100 rounded-2xl shadow-sm relative overflow-hidden">
                            <Sun size={40} className="absolute top-0 right-0 text-orange-50 opacity-20"/>
                            <div className="flex justify-between items-start mb-4"><span className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Vacaciones</span><span className="text-3xl font-black text-orange-500">{user.daysAvailable.toFixed(1)}</span></div>
                            <input className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs placeholder:text-slate-400 outline-none focus:bg-white font-bold" placeholder="Ajustar días..." value={daysAdjust} onChange={e=>setDaysAdjust(e.target.value)} />
                        </div>
                        <div className="p-5 bg-white border border-blue-100 rounded-2xl shadow-sm relative overflow-hidden">
                            <Clock size={40} className="absolute top-0 right-0 text-blue-50 opacity-20"/>
                            <div className="flex justify-between items-start mb-4"><span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Horas Extra</span><span className="text-3xl font-black text-blue-600">{user.overtimeHours.toFixed(1)}h</span></div>
                            <input className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs placeholder:text-slate-400 outline-none focus:bg-white font-bold" placeholder="Ajustar horas..." value={hoursAdjust} onChange={e=>setHoursAdjust(e.target.value)} />
                        </div>
                        {(daysAdjust || hoursAdjust) && (<div className="md:col-span-2 animate-fade-in"><div className="bg-slate-50 p-4 rounded-2xl border border-slate-200"><label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase mb-2"><MessageSquare size={12}/> Comentario del ajuste</label><textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none italic" placeholder="Motivo del ajuste..." value={adjustReason} onChange={e => setAdjustReason(e.target.value)} rows={2} /></div></div>)}
                    </div>
                </section>
            )}
            {!isNew && (
                <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 pb-2 border-b border-slate-100">Historial Reciente</h3>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase"><tr><th className="px-6 py-4">Tipo</th><th className="px-6 py-4">Cant.</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{requests.slice(0, 10).map(req => (<tr key={req.id} onClick={() => onViewRequest(req)} className="hover:bg-slate-50 cursor-pointer transition-colors group"><td className="px-6 py-4"><div className="font-bold text-slate-700">{store.getTypeLabel(req.typeId)}</div><div className="text-[9px] text-slate-400">{new Date(req.startDate).toLocaleDateString()}</div></td><td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-lg font-black text-[10px] ${calculateAmountStr(req).startsWith('+') ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'}`}>{calculateAmountStr(req)}</span></td><td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-lg font-black text-[9px] uppercase border ${req.status === RequestStatus.APPROVED ? 'bg-green-50 text-green-700' : req.status === RequestStatus.PENDING ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-700'}`}>{req.status}</span></td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-3"><button onClick={(e) => { e.stopPropagation(); if(confirm('¿Eliminar registro?')) store.deleteRequest(req.id); }} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button><ChevronRight className="text-slate-200" size={16}/></div></td></tr>))}</tbody></table></div>
                </section>
            )}
            <div className="flex gap-4 pt-8 border-t border-slate-100">
                <button onClick={onClose} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] hover:bg-slate-50 rounded-2xl">Cerrar</button>
                <button onClick={handleUpdate} disabled={isSaving} className="flex-1 py-4 bg-blue-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-xl hover:bg-blue-700 flex justify-center items-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={16}/> : 'Guardar Cambios'}</button>
            </div>
        </div>
      </div>
      {showRequestForm && <RequestFormModal onClose={() => setShowRequestForm(false)} user={store.currentUser!} targetUser={user} />}
      {showPPEModal && <PPERequestModal userId={user.id} onClose={() => setShowPPEModal(false)} />}
    </div>
  );
};

export default UserDetailModal;

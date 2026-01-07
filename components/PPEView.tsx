
import React, { useState } from 'react';
import { User, Role } from '../types';
import { store } from '../services/store';
import { HardHat, Check, Clock, Package, Plus, FileText, Trash2, ShoppingCart, Filter } from 'lucide-react';
import PPERequestModal from './PPERequestModal';
import PPEReportModal from './PPEReportModal';

interface PPEViewProps {
  user: User;
}

const PPEView: React.FC<PPEViewProps> = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFilter, setReportFilter] = useState<'PENDIENTE' | 'SOLICITADO'>('PENDIENTE');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  // Logic: Admin sees all, Supervisor sees team + own, Worker sees own
  const requests = store.config.ppeRequests.filter(req => {
      const reqUser = store.users.find(u => u.id === req.userId);
      
      // Primero, determinar si la solicitud está en el alcance del usuario actual
      let inScope = false;
      if (user.role === Role.ADMIN) {
          inScope = true;
      } else if (user.role === Role.SUPERVISOR) {
          const myDepts = store.departments.filter(d => d.supervisorIds.includes(user.id)).map(d => d.id);
          const isMyTeam = reqUser && myDepts.includes(reqUser.departmentId);
          const isMe = req.userId === user.id;
          inScope = isMyTeam || isMe;
      } else {
          inScope = req.userId === user.id;
      }

      if (!inScope) return false;

      // Segundo, aplicar el filtro de departamento si está seleccionado (solo para admins)
      if (user.role === Role.ADMIN && selectedDeptId) {
          return reqUser?.departmentId === selectedDeptId;
      }

      return true;
  });

  const handleMarkRequested = async (reqId: string) => {
      if(confirm('¿Marcar este EPI como pedido al proveedor? Pasará a estado "SOLICITADO".')) {
          await store.markPPEAsRequested(reqId);
      }
  };

  const handleDeliver = async (reqId: string) => {
      if(confirm('¿Confirmar entrega de EPI al empleado?')) {
          await store.deliverPPERequest(reqId);
      }
  };

  const handleDelete = async (reqId: string) => {
      if(confirm('¿Seguro que deseas eliminar esta solicitud de EPI?')) {
          await store.deletePPERequest(reqId);
      }
  };

  const getTypeName = (id: string) => store.config.ppeTypes.find(t => t.id === id)?.name || id;
  const getUserName = (id: string) => store.users.find(u => u.id === id)?.name || 'Usuario desconocido';
  
  const isManager = user.role === Role.ADMIN || user.role === Role.SUPERVISOR;

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
           <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
               <div className="flex items-center gap-3">
                   <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                       <HardHat size={24}/>
                   </div>
                   <div>
                       <h2 className="text-xl font-bold text-slate-800">Gestión de EPIS</h2>
                       <p className="text-sm text-slate-500">Solicitudes y entregas de material</p>
                   </div>
               </div>
               <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                   {/* Filtro de Departamento para Admins */}
                   {user.role === Role.ADMIN && (
                       <div className="relative flex items-center mr-2">
                           <Filter className="absolute left-3 text-slate-400 w-4 h-4" />
                           <select 
                               className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none appearance-none font-bold text-slate-700 min-w-[180px]"
                               value={selectedDeptId}
                               onChange={(e) => setSelectedDeptId(e.target.value)}
                           >
                               <option value="">Todos los Dptos.</option>
                               {store.departments.map(d => (
                                   <option key={d.id} value={d.id}>{d.name}</option>
                               ))}
                           </select>
                       </div>
                   )}

                   {isManager && (
                       <>
                           <button 
                              onClick={() => { setReportFilter('PENDIENTE'); setShowReportModal(true); }}
                              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
                           >
                               <FileText size={16}/> Inf. Pendientes
                           </button>
                           <button 
                              onClick={() => { setReportFilter('SOLICITADO'); setShowReportModal(true); }}
                              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
                           >
                               <ShoppingCart size={16}/> Inf. Solicitados
                           </button>
                       </>
                   )}
                   <button 
                      onClick={() => setShowModal(true)}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
                   >
                       <Plus size={16}/> Nueva Solicitud
                   </button>
               </div>
           </div>

           <div className="p-6 flex-1 overflow-auto">
               {requests.length === 0 ? (
                   <div className="text-center py-12 text-slate-400">
                       <Package size={48} className="mx-auto mb-4 opacity-50"/>
                       <p>No hay solicitudes de EPI registradas {selectedDeptId ? 'en este departamento' : ''}.</p>
                   </div>
               ) : (
                   <div className="overflow-x-auto">
                       <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                               <tr>
                                   <th className="px-6 py-4">Empleado</th>
                                   <th className="px-6 py-4">Material</th>
                                   <th className="px-6 py-4">Talla</th>
                                   <th className="px-6 py-4">Fecha Solicitud</th>
                                   <th className="px-6 py-4">Estado</th>
                                   {isManager && <th className="px-6 py-4 text-right">Acción</th>}
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                               {requests.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(req => (
                                   <tr key={req.id} className="hover:bg-slate-50">
                                       <td className="px-6 py-4 font-medium text-slate-800">{getUserName(req.userId)}</td>
                                       <td className="px-6 py-4">{getTypeName(req.typeId)}</td>
                                       <td className="px-6 py-4">
                                           <span className="bg-slate-100 px-2 py-1 rounded font-mono font-bold">{req.size}</span>
                                       </td>
                                       <td className="px-6 py-4 text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                                       <td className="px-6 py-4">
                                           {req.status === 'ENTREGADO' ? (
                                               <div className="flex flex-col">
                                                   <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-full w-fit">
                                                       <Check size={12}/> ENTREGADO
                                                   </span>
                                                   <span className="text-[10px] text-slate-400 mt-1">
                                                       {req.deliveryDate ? new Date(req.deliveryDate).toLocaleDateString() : '-'}
                                                   </span>
                                               </div>
                                           ) : req.status === 'SOLICITADO' ? (
                                               <span className="flex items-center gap-1 text-blue-600 font-bold text-xs bg-blue-50 px-2 py-1 rounded-full w-fit">
                                                   <ShoppingCart size={12}/> SOLICITADO
                                               </span>
                                           ) : (
                                               <span className="flex items-center gap-1 text-orange-600 font-bold text-xs bg-orange-50 px-2 py-1 rounded-full w-fit">
                                                   <Clock size={12}/> PENDIENTE
                                               </span>
                                           )}
                                       </td>
                                       {isManager && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {req.status === 'PENDIENTE' && (
                                                        <button 
                                                            onClick={() => handleMarkRequested(req.id)}
                                                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                                        >
                                                            Solicitar
                                                        </button>
                                                    )}
                                                    {req.status !== 'ENTREGADO' && (
                                                        <button 
                                                            onClick={() => handleDeliver(req.id)}
                                                            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                                                        >
                                                            Entregar
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleDelete(req.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                                        title="Eliminar solicitud"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </td>
                                       )}
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               )}
           </div>
       </div>

       {showModal && (
           <PPERequestModal userId={user.id} onClose={() => setShowModal(false)} />
       )}
       
       {showReportModal && (
           <PPEReportModal 
                filterType={reportFilter}
                requests={requests.filter(r => r.status === reportFilter)} 
                onClose={() => setShowReportModal(false)} 
           />
       )}
    </div>
  );
};

export default PPEView;

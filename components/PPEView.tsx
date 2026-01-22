import React, { useState, useMemo } from 'react';
import { User, Role, PPERequest } from '../types';
import { store } from '../services/store';
import { 
  HardHat, 
  Check, 
  Clock, 
  Package, 
  Plus, 
  FileText, 
  Trash2, 
  ShoppingCart, 
  Filter, 
  BarChart3, 
  Printer, 
  X,
  ChevronRight
} from 'lucide-react';
import PPERequestModal from './PPERequestModal';
import PPEReportModal from './PPEReportModal';

interface PPEViewProps {
  user: User;
}

const PPEQuantityReportModal: React.FC<{ onClose: () => void, ppeRequests: PPERequest[], getPpeTypeName: (id: string) => string }> = ({ onClose, ppeRequests, getPpeTypeName }) => {
    const handlePrint = () => window.print();

    const summaryData = useMemo(() => {
        const filtered = ppeRequests.filter(p => p.status !== 'ENTREGADO');
        const groups: Record<string, Record<string, number>> = {};
        
        filtered.forEach(p => {
            const typeName = getPpeTypeName(p.typeId);
            if (!groups[typeName]) groups[typeName] = {};
            if (!groups[typeName][p.size]) groups[typeName][p.size] = 0;
            groups[typeName][p.size]++;
        });

        return groups;
    }, [ppeRequests, getPpeTypeName]);

    const totalCount = ppeRequests.filter(p => p.status !== 'ENTREGADO').length;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-4 backdrop-blur-sm print:p-0 print:bg-white print:items-start">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in-up overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none h-fit max-h-[90vh] flex flex-col print:h-auto">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden shrink-0">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2"><BarChart3 size={20}/> Resumen de Cantidades a Pedir</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg">
                            <Printer size={16}/> Imprimir
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                            <X size={24}/>
                        </button>
                    </div>
                </div>

                <div className="p-10 overflow-y-auto print:overflow-visible print:p-0 flex-1">
                    <div className="flex items-center gap-4 mb-10 pb-6 border-b-2 border-slate-100">
                        <div className="w-16 h-16">
                            <img src="https://termosycalentadoresgranada.com/wp-content/uploads/2025/08/https___cdn.evbuc_.com_images_677236879_73808960223_1_original.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 uppercase">Pedido EPI - Personal Interno</h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Resumen consolidado - {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    {Object.keys(summaryData).length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic">No hay pedidos pendientes de consolidar para el personal seleccionado.</div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 gap-4">
                                {Object.entries(summaryData).map(([typeName, sizes]) => (
                                    <div key={typeName} className="border border-slate-200 rounded-xl overflow-hidden break-inside-avoid">
                                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                            <h3 className="font-black text-slate-700 uppercase text-xs">{typeName}</h3>
                                            <span className="bg-white text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200">
                                                {Object.values(sizes).reduce((a, b) => a + b, 0)} Unidades
                                            </span>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Talla / Medida</th>
                                                    <th className="px-4 py-2 text-right">Cantidad Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {Object.entries(sizes).sort((a,b) => a[0].localeCompare(b[0])).map(([size, count]) => (
                                                    <tr key={size}>
                                                        <td className="px-4 py-3 font-bold text-slate-600">{size}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-black text-sm">
                                                                x {count}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest">Total Material por Tramitar:</span>
                                <span className="text-xl font-black">{totalCount} Unidades</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PPEView: React.FC<PPEViewProps> = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showQtyReport, setShowQtyReport] = useState(false);
  const [reportFilter, setReportFilter] = useState<'PENDIENTE' | 'SOLICITADO'>('PENDIENTE');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  const requests = store.config.ppeRequests.filter(req => {
      const reqUser = store.users.find(u => u.id === req.userId);
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
      if (user.role === Role.ADMIN && selectedDeptId) {
          return reqUser?.departmentId === selectedDeptId;
      }
      return true;
  });

  // Agrupación por empleado para el modo árbol
  const groupedByEmployee = useMemo(() => {
    const groups: Record<string, PPERequest[]> = {};
    requests.forEach(req => {
      if (!groups[req.userId]) groups[req.userId] = [];
      groups[req.userId].push(req);
    });
    
    return Object.entries(groups).map(([userId, userRequests]) => {
      const u = store.users.find(u => u.id === userId);
      return {
        userId,
        userName: u?.name || 'Desconocido',
        userAvatar: u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || 'U')}`,
        deptName: store.departments.find(d => d.id === u?.departmentId)?.name || 'Sin Dpto.',
        userRequests: userRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      };
    }).sort((a, b) => a.userName.localeCompare(b.userName));
  }, [requests]);

  const handleMarkRequested = async (reqId: string) => {
      if(confirm('¿Marcar este EPI como pedido al proveedor? Pasará a estado "SOLICITADO".')) {
          await store.markPPEAsRequested(reqId);
      }
  };

  const handleDeliver = async (reqId: string) => {
      const qtyStr = window.prompt('Indique la cantidad de unidades que se entregan al empleado:', '1');
      if (qtyStr === null) return;
      const qty = parseInt(qtyStr);
      if (isNaN(qty) || qty <= 0) {
          alert('Cantidad no válida.');
          return;
      }
      await store.deliverPPERequest(reqId, qty);
  };

  const handleDelete = async (reqId: string) => {
      if(confirm('¿Seguro que deseas eliminar esta solicitud de EPI?')) {
          await store.deletePPERequest(reqId);
      }
  };

  const getTypeName = (id: string) => store.config.ppeTypes.find(t => t.id === id)?.name || id;
  
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
                              onClick={() => setShowQtyReport(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
                           >
                               <BarChart3 size={16}/> Resumen Cant.
                           </button>
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
                                   <th className="px-6 py-4">Empleado / Material</th>
                                   <th className="px-6 py-4">Talla</th>
                                   <th className="px-6 py-4">Fecha Solicitud</th>
                                   <th className="px-6 py-4">Estado</th>
                                   {isManager && <th className="px-6 py-4 text-right">Acción</th>}
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                               {groupedByEmployee.map(group => (
                                   <React.Fragment key={group.userId}>
                                       {/* Fila del Empleado (Nodo Padre) */}
                                       <tr className="bg-slate-50/50">
                                           <td colSpan={isManager ? 5 : 4} className="px-6 py-3 border-y border-slate-100">
                                               <div className="flex items-center gap-3">
                                                   <img src={group.userAvatar} className="w-8 h-8 rounded-full border border-white shadow-sm object-cover" />
                                                   <div>
                                                       <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{group.userName}</span>
                                                       <span className="ml-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.deptName}</span>
                                                   </div>
                                                   <span className="ml-auto bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-black text-slate-500">
                                                       {group.userRequests.length} Solicitud{group.userRequests.length !== 1 ? 'es' : ''}
                                                   </span>
                                               </div>
                                           </td>
                                       </tr>
                                       {/* Solicitudes del Empleado (Desglose) */}
                                       {group.userRequests.map(req => (
                                           <tr key={req.id} className="hover:bg-slate-50/30 transition-colors">
                                               <td className="px-6 py-4 pl-12">
                                                   <div className="flex items-center gap-2">
                                                       <ChevronRight size={14} className="text-slate-300" />
                                                       <span className="font-medium text-slate-700">{getTypeName(req.typeId)}</span>
                                                   </div>
                                               </td>
                                               <td className="px-6 py-4">
                                                   <span className="bg-slate-100 px-2 py-1 rounded font-mono font-bold text-xs">{req.size}</span>
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
                                   </React.Fragment>
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

       {showQtyReport && (
            <PPEQuantityReportModal 
                onClose={() => setShowQtyReport(false)} 
                ppeRequests={requests} 
                getPpeTypeName={getTypeName} 
            />
       )}
    </div>
  );
};

export default PPEView;
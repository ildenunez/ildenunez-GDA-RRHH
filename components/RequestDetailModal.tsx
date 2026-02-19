import React from 'react';
import { LeaveRequest, RequestStatus } from '../types';
import { store } from '../services/store';
import { X, Printer, Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle, User as UserIcon, MessageSquare, UserCheck, Eye, Download, MessageSquare as WhatsAppIcon } from 'lucide-react';

interface RequestDetailModalProps {
  request: LeaveRequest;
  onClose: () => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, onClose }) => {
  const user = store.users.find(u => u.id === request.userId);
  const dept = user ? store.departments.find(d => d.id === user.departmentId) : null;
  const approver = request.resolvedBy ? store.users.find(u => u.id === request.resolvedBy) : null;

  const usageDetails = request.overtimeUsage?.map(usage => {
      const sourceReq = store.requests.find(r => r.id === usage.requestId);
      return {
          ...usage,
          sourceDate: sourceReq?.startDate,
          sourceReason: sourceReq?.reason
      };
  }) || [];

  const totalTracedHours = usageDetails.reduce((sum, u) => sum + u.hoursUsed, 0);
  const untracedHours = Math.max(0, Math.abs(request.hours || 0) - totalTracedHours);

  const handlePrint = () => window.print();

  const handleNotifyWhatsApp = () => {
    if (!user || !user.phone) {
        alert("Este usuario no tiene un número de teléfono configurado en su perfil.");
        return;
    }
    const statusMsg = request.status === RequestStatus.APPROVED ? "APROBADA ✅" : "RECHAZADA ❌";
    const msg = `Hola ${user.name}, te informamos que tu solicitud de ${store.getTypeLabel(request.typeId)} para las fechas ${new Date(request.startDate).toLocaleDateString()} ha sido ${statusMsg}. Saludos de RRHH.`;
    store.openWhatsApp(user.phone, msg);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-start z-[150] p-4 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:items-start print:static print:block">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in-up my-8 print:my-0 print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
            <h2 className="font-bold text-slate-700">Detalle de Solicitud</h2>
            <div className="flex gap-2">
                {request.status !== RequestStatus.PENDING && user?.phone && (
                    <button onClick={handleNotifyWhatsApp} className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors shadow-sm font-bold">
                        <WhatsAppIcon size={16}/> Enviar WhatsApp
                    </button>
                )}
                <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm text-slate-700">
                    <Printer size={16}/> Imprimir
                </button>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500">
                    <X size={20}/>
                </button>
            </div>
        </div>

        <div className="p-8 print:p-0">
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white border border-slate-200 flex items-center justify-center rounded-xl p-2 print:border-none print:p-0">
                         <img src="https://termosycalentadoresgranada.com/wp-content/uploads/2025/08/https___cdn.evbuc_.com_images_677236879_73808960223_1_original.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Informe de Solicitud</h1>
                        <p className="text-slate-500 text-sm">Portal de RRHH - GdA</p>
                        <p className="text-slate-400 text-[10px] mt-1 font-mono uppercase tracking-tighter">ID: {request.id}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border
                        ${request.status === RequestStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-200' : 
                          request.status === RequestStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}
                    `}>
                        {request.status === RequestStatus.APPROVED && <CheckCircle size={14}/>}
                        {request.status === RequestStatus.REJECTED && <XCircle size={14}/>}
                        {request.status === RequestStatus.PENDING && <AlertCircle size={14}/>}
                        {request.status}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Creado: {new Date(request.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Datos del Empleado</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <span className="block text-xs text-slate-500">Nombre Completo</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-2"><UserIcon size={14}/> {user?.name}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-slate-500">Departamento</span>
                        <span className="font-semibold text-slate-800">{dept?.name || '-'}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-slate-500">Email</span>
                        <span className="font-semibold text-slate-800">{user?.email}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-slate-500">Teléfono WhatsApp</span>
                        <span className="font-semibold text-slate-800">{user?.phone || 'No registrado'}</span>
                    </div>
                </div>
            </div>

            <div className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100 print:bg-white print:border-black">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{store.getTypeLabel(request.typeId)}</h3>
                
                <div className="grid grid-cols-2 gap-y-4">
                    <div>
                        <span className="flex items-center gap-2 text-sm text-slate-500 mb-1"><Calendar size={14}/> Fecha Inicio</span>
                        <span className="font-medium text-slate-900">{new Date(request.startDate).toLocaleDateString()}</span>
                    </div>
                    {request.endDate && (
                        <div>
                            <span className="flex items-center gap-2 text-sm text-slate-500 mb-1"><Calendar size={14}/> Fecha Fin</span>
                            <span className="font-medium text-slate-900">{new Date(request.endDate).toLocaleDateString()}</span>
                        </div>
                    )}
                    {request.hours !== undefined && (
                        <div>
                            <span className="flex items-center gap-2 text-sm text-slate-500 mb-1"><Clock size={14}/> {request.hours < 0 ? 'Horas Consumidas' : 'Total Horas'}</span>
                            <span className={`font-mono font-bold ${request.hours < 0 ? 'text-red-600' : 'text-slate-900'}`}>{request.hours}h</span>
                        </div>
                    )}
                </div>

                {request.reason && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <span className="flex items-center gap-2 text-sm text-slate-500 mb-1"><FileText size={14}/> Motivo / Comentario Empleado</span>
                        <p className="text-slate-700 italic">"{request.reason}"</p>
                    </div>
                )}
            </div>

            {request.documentUrl && (
                <div className="mb-8 bg-slate-900 text-white p-6 rounded-3xl overflow-hidden relative group print:hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><FileText size={80}/></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-600 rounded-xl">
                                <CheckCircle size={20}/>
                            </div>
                            <h3 className="font-black uppercase tracking-widest text-xs">Documento Justificante Adjunto</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {request.documentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white/20 bg-black/20">
                                    <img src={request.documentUrl} alt="Vista previa" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-24 h-24 rounded-xl flex items-center justify-center bg-white/10 border-2 border-white/20">
                                    <FileText size={32} className="text-blue-400"/>
                                </div>
                            )}
                            <div className="flex-1 text-center sm:text-left">
                                <p className="text-slate-400 text-[10px] font-bold uppercase mb-2">Archivo digital validado</p>
                                <div className="flex gap-2 justify-center sm:justify-start">
                                    <a 
                                        href={request.documentUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl font-black uppercase text-[10px] hover:bg-slate-100 transition-all"
                                    >
                                        <Eye size={14}/> Ver Original
                                    </a>
                                    <a 
                                        href={request.documentUrl} 
                                        download 
                                        className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] hover:bg-white/20 transition-all"
                                    >
                                        <Download size={14}/> Descargar
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(request.status !== RequestStatus.PENDING) && (
                <div className="mb-8 bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 border-b border-blue-100 pb-2">Información de Validación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <span className="block text-xs text-blue-500 mb-1">Responsable de la acción</span>
                            <div className="flex items-center gap-2 font-bold text-slate-800">
                                <div className="p-1 bg-blue-100 text-blue-600 rounded">
                                    <UserCheck size={14}/>
                                </div>
                                {approver ? approver.name : 'Administración / Sistema'}
                            </div>
                        </div>
                        {request.adminComment && (
                            <div className="col-span-2 mt-2">
                                <span className="flex items-center gap-2 text-xs font-bold text-blue-500 mb-2">
                                    <MessageSquare size={14}/> Observaciones de la validación:
                                </span>
                                <p className="text-slate-700 font-medium italic bg-white p-3 rounded-lg border border-blue-100">
                                    "{request.adminComment}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;
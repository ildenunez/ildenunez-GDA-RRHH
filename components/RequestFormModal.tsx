import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, LeaveRequest, OvertimeUsage, RequestStatus, Role, RequestType } from '../types';
import { store } from '../services/store';
import { X, Clock, Loader2, User as UserIcon, CalendarDays, Gift, Archive, FileWarning, Upload, FileText, CheckCircle2 } from 'lucide-react';

interface RequestFormModalProps {
  onClose: () => void;
  user: User;
  targetUser?: User;
  initialTab?: 'absence' | 'overtime';
  editingRequest?: LeaveRequest | null;
}

const RequestFormModal: React.FC<RequestFormModalProps> = ({ onClose, user, targetUser, initialTab = 'absence', editingRequest }) => {
  const [activeTab, setActiveTab] = useState<'absence' | 'overtime'>(initialTab);
  const [typeId, setTypeId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hours, setHours] = useState(0);
  const [reason, setReason] = useState('');
  const [isDatesLocked, setIsDatesLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminStatus, setAdminStatus] = useState<RequestStatus>(RequestStatus.PENDING);
  const [availableOvertime, setAvailableOvertime] = useState<LeaveRequest[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});
  const [selectedRangeIndex, setSelectedRangeIndex] = useState<string>('');
  
  // Justificantes
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveTargetUser = targetUser || user;
  const isManagerMode = (user.role === Role.ADMIN || user.role === Role.SUPERVISOR);
  const isAdminCreatingForOther = !!targetUser && targetUser.id !== user.id;

  const absenceTypes = store.config.leaveTypes;

  useEffect(() => {
      if (editingRequest) {
          const isOvertime = store.isOvertimeRequest(editingRequest.typeId);
          setActiveTab(isOvertime ? 'overtime' : 'absence');
          setTypeId(editingRequest.typeId);
          setStartDate(editingRequest.startDate.split('T')[0]);
          setEndDate(editingRequest.endDate ? editingRequest.endDate.split('T')[0] : '');
          setHours(Math.abs(editingRequest.hours || 0));
          setReason(editingRequest.reason || '');
      }
  }, [editingRequest]);

  useEffect(() => {
      if (!editingRequest) {
        if (activeTab === 'absence' && absenceTypes.length > 0 && !typeId) {
            setTypeId(absenceTypes[0].id);
        } else if (activeTab === 'overtime') {
            if (!typeId) setTypeId(RequestType.OVERTIME_EARN);
        }
      }
      if (activeTab === 'overtime') {
          const realRecords = store.getAvailableOvertimeRecords(effectiveTargetUser.id);
          const totalTraceable = realRecords.reduce((sum, r) => sum + ((r.hours || 0) - (r.consumedHours || 0)), 0);
          const totalBalance = effectiveTargetUser.overtimeHours;
          const untracedBalance = Math.max(0, totalBalance - totalTraceable);

          let recordsToShow = [...realRecords];
          if (untracedBalance > 0.01) { 
              recordsToShow.push({
                  id: 'historical_balance',
                  userId: effectiveTargetUser.id,
                  typeId: 'historico',
                  label: 'Saldo Histórico / Ajustes',
                  startDate: new Date().toISOString(),
                  hours: untracedBalance,
                  consumedHours: 0,
                  status: RequestStatus.APPROVED,
                  createdAt: new Date().toISOString(),
                  reason: 'Saldo acumulado anterior o ajustes manuales',
                  isConsumed: false
              } as LeaveRequest);
          }
          setAvailableOvertime(recordsToShow);
      }
  }, [activeTab, editingRequest, effectiveTargetUser]);

  useEffect(() => {
    const selectedType = absenceTypes.find(t => t.id === typeId);
    const ranges = selectedType?.fixedRanges;
    if (activeTab === 'absence' && ranges && ranges.length > 0) {
        setIsDatesLocked(true);
        if (!editingRequest && selectedRangeIndex === '') {
             setStartDate('');
             setEndDate('');
        }
    } else {
        setIsDatesLocked(false);
    }
  }, [typeId, activeTab, absenceTypes]);

  const handleRangeSelect = (indexStr: string) => {
      setSelectedRangeIndex(indexStr);
      const selectedType = absenceTypes.find(t => t.id === typeId);
      if (selectedType && selectedType.fixedRanges && indexStr !== '') {
          const idx = parseInt(indexStr);
          const range = selectedType.fixedRanges[idx];
          if (range) {
              setStartDate(range.startDate);
              setEndDate(range.endDate);
          }
      } else {
          setStartDate('');
          setEndDate('');
      }
  };

  const handleUsageChange = (req: LeaveRequest, isChecked: boolean, customAmount?: number) => {
      const remaining = (req.hours || 0) - (req.consumedHours || 0);
      const newMap: Record<string, number> = { ...usageMap };
      if (!isChecked) delete newMap[req.id];
      else newMap[req.id] = customAmount !== undefined ? customAmount : remaining;
      setUsageMap(newMap);
      const total = Object.values(newMap).reduce((sum: number, val: number) => sum + val, 0);
      setHours(total);
  };

  const dayCount = useMemo(() => {
      if (activeTab !== 'absence' || !startDate) return 0;
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : start;
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      if (end < start) return 0;
      return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let documentUrl = editingRequest?.documentUrl || null;
    if (selectedFile) {
        setIsUploading(true);
        documentUrl = await store.uploadJustificante(selectedFile) || null;
        setIsUploading(false);
    }

    let finalOvertimeUsage: OvertimeUsage[] | undefined = undefined;
    if (activeTab === 'overtime' && ![RequestType.OVERTIME_EARN, RequestType.WORKED_HOLIDAY].includes(typeId as RequestType)) {
        finalOvertimeUsage = Object.entries(usageMap)
            .filter(([id]) => id !== 'historical_balance')
            .map(([id, hoursUsed]) => ({ requestId: id, hoursUsed: hoursUsed as number }));
    }

    const isConsumption = [RequestType.OVERTIME_SPEND_DAYS, RequestType.OVERTIME_PAY, RequestType.OVERTIME_TO_DAYS].includes(typeId as RequestType);
    const finalHoursValue = isConsumption ? -Math.abs(hours) : hours;

    const reqData = { 
        typeId, 
        startDate, 
        endDate, 
        hours: finalHoursValue, 
        reason, 
        overtimeUsage: finalOvertimeUsage, 
        isJustified: false, 
        reportedToAdmin: false,
        documentUrl: documentUrl 
    };

    if (editingRequest) await store.updateRequest(editingRequest.id, reqData);
    else await store.createRequest(reqData, effectiveTargetUser.id, isManagerMode && typeId === RequestType.UNJUSTIFIED ? RequestStatus.APPROVED : (isManagerMode && isAdminCreatingForOther ? adminStatus : RequestStatus.PENDING));
    
    setIsSubmitting(false);
    onClose();
  };

  const isConsumptionType = activeTab === 'overtime' && ![RequestType.OVERTIME_EARN, RequestType.WORKED_HOLIDAY].includes(typeId as RequestType);
  const isWorkedHoliday = typeId === RequestType.WORKED_HOLIDAY;
  const isUnjustified = typeId === RequestType.UNJUSTIFIED;
  const isSickness = typeId === RequestType.SICKNESS;
  const currentLeaveType = absenceTypes.find(t => t.id === typeId);
  const hasFixedRanges = activeTab === 'absence' && currentLeaveType?.fixedRanges && currentLeaveType.fixedRanges.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
              <h2 className="text-xl font-bold text-slate-800">{editingRequest ? 'Editar Registro' : 'Nueva Solicitud / Registro'}</h2>
              {isManagerMode && effectiveTargetUser.id !== user.id && (
                  <p className="text-xs text-blue-600 font-bold flex items-center gap-1 mt-1"><UserIcon size={12}/> Empleado: {effectiveTargetUser.name}</p>
              )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
        </div>
        
        <div className="flex mb-6 bg-slate-100 p-1 rounded-xl">
            <button disabled={!!editingRequest} onClick={() => { setActiveTab('absence'); if(absenceTypes[0]) setTypeId(absenceTypes[0].id); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'absence' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Ausencia</button>
            <button disabled={!!editingRequest} onClick={() => { setActiveTab('overtime'); setTypeId(RequestType.OVERTIME_EARN); setUsageMap({}); setHours(0); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overtime' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Gestión Horas</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           {activeTab === 'absence' && (
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Registro</label>
                <select className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl" value={typeId} onChange={e => setTypeId(e.target.value)}>
                    {absenceTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    {isManagerMode && <option value={RequestType.UNJUSTIFIED} className="text-orange-600 font-bold">⚠️ Ausencia Justificable</option>}
                </select>
               </div>
           )}

           {activeTab === 'overtime' && (
                <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Acción</label>
                 <select className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl" value={typeId} onChange={e => { setTypeId(e.target.value); setUsageMap({}); setHours(0); }}>
                     <option value={RequestType.OVERTIME_EARN}>Registrar Horas Realizadas</option>
                     <option value={RequestType.WORKED_HOLIDAY}>Festivo Trabajado (+1 día / +4h)</option>
                     <option value={RequestType.OVERTIME_SPEND_DAYS}>Canjear por Días Libres</option>
                     <option value={RequestType.OVERTIME_TO_DAYS}>Pasar horas a días (8h = 1 día)</option>
                     <option value={RequestType.OVERTIME_PAY}>Abono en Nómina</option>
                 </select>
                </div>
           )}

           {hasFixedRanges && (
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                   <label className="block text-sm font-bold text-blue-800 mb-2">Selecciona un turno / fecha disponible:</label>
                   <select 
                       required 
                       className="w-full p-3 border border-blue-200 rounded-xl bg-white"
                       value={selectedRangeIndex}
                       onChange={(e) => handleRangeSelect(e.target.value)}
                   >
                       <option value="">-- Seleccionar --</option>
                       {currentLeaveType?.fixedRanges?.map((range, idx) => (
                           <option key={idx} value={idx}>
                               {range.label ? `${range.label}: ` : ''} 
                               {new Date(range.startDate).toLocaleDateString()} - {new Date(range.endDate).toLocaleDateString()}
                           </option>
                       ))}
                   </select>
               </div>
           )}
           
           <div className="grid grid-cols-2 gap-4">
             <div className={`${(isWorkedHoliday || isUnjustified) ? 'col-span-2' : ''}`}>
               <label className="block text-sm font-medium text-slate-700 mb-1">Fecha {isUnjustified ? 'de la Falta' : 'Inicio'}</label>
               <input 
                    type="date" 
                    required 
                    disabled={isDatesLocked} 
                    className={`w-full p-3 border border-slate-200 rounded-xl ${isDatesLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
               />
             </div>
             {activeTab === 'absence' && !isUnjustified && (
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Fin</label>
                   <input 
                        type="date" 
                        disabled={isDatesLocked} 
                        className={`w-full p-3 border border-slate-200 rounded-xl ${isDatesLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)} 
                    />
               </div>
             )}
             {activeTab === 'overtime' && !isWorkedHoliday && (
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Total Horas</label><input type="number" step="0.5" required disabled={isConsumptionType} className="w-full p-3 border border-slate-200 rounded-xl font-bold" value={hours} onChange={e => setHours(parseFloat(e.target.value))} /></div>
             )}
           </div>

           {(isSickness || isUnjustified) && (
               <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                   <div className="flex items-center gap-3 mb-2">
                       <Upload size={18} className="text-blue-500"/>
                       <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Subir Justificante / Parte de Baja</h4>
                   </div>
                   
                   <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-2
                        ${selectedFile ? 'bg-blue-50 border-blue-400' : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'}
                      `}
                   >
                       <input 
                          type="file" 
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                       />
                       {selectedFile ? (
                           <div className="flex flex-col items-center gap-2 text-blue-700">
                               <CheckCircle2 size={32}/>
                               <span className="text-xs font-bold truncate max-w-[200px]">{selectedFile.name}</span>
                               <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="text-[10px] text-red-500 underline uppercase font-black">Quitar archivo</button>
                           </div>
                       ) : (
                           <>
                               <div className="p-3 bg-slate-100 rounded-full text-slate-400 group-hover:text-blue-500">
                                   <FileText size={24}/>
                               </div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Click para subir foto o PDF</p>
                           </>
                       )}
                   </div>
                   {isUnjustified && (
                       <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-start gap-3">
                           <FileWarning size={16} className="text-orange-500 shrink-0 mt-0.5" />
                           <p className="text-[9px] font-medium text-orange-800 leading-tight">Este registro se crea como <strong>Ausencia Justificable</strong>. Es obligatorio adjuntar el documento soporte para su validación.</p>
                       </div>
                   )}
               </div>
           )}

           {activeTab === 'absence' && !isUnjustified && dayCount > 0 && (
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-center gap-3"><CalendarDays size={20} className="text-blue-600"/><div><p className="text-xs text-blue-600 font-bold uppercase">Duración</p><p className="text-lg font-bold text-slate-800">{dayCount} {dayCount === 1 ? 'día' : 'días'}</p></div></div>
           )}

           {isConsumptionType && !editingRequest && (
               <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                   <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Clock size={16} className="text-blue-500"/> Consumir horas de:</h4>
                   <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                       {availableOvertime.map(req => {
                           const remaining = (req.hours || 0) - (req.consumedHours || 0);
                           const isSelected = !!usageMap[req.id];
                           return (
                               <div key={req.id} className={`p-3 bg-white rounded-lg border ${isSelected ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200'}`}><div className="flex items-center gap-3"><input type="checkbox" checked={isSelected} onChange={(e) => handleUsageChange(req, e.target.checked)} className="w-4 h-4 text-blue-600" /><div className="flex-1 text-xs"><div className="flex justify-between font-bold text-slate-700"><span>{req.id === 'historical_balance' ? 'Saldo Histórico' : new Date(req.startDate).toLocaleDateString()}</span><span>Disp: {remaining.toFixed(1)}h</span></div><div className="italic text-slate-500 truncate">{req.reason || 'Sin motivo'}</div></div></div>{isSelected && (<div className="mt-2 flex items-center gap-2"><label className="text-xs text-slate-500">Horas:</label><input type="number" min="0.5" max={remaining} step="0.5" value={usageMap[req.id]} onChange={(e) => handleUsageChange(req, true, parseFloat(e.target.value))} className="w-16 p-1 border rounded" /></div>)}</div>
                           );
                       })}
                   </div>
               </div>
           )}

           <div><label className="block text-sm font-medium text-slate-700 mb-1">Motivo / Notas</label><textarea className="w-full p-3 border border-slate-200 rounded-xl h-24" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej: No se presenta a su turno, comunica indisposición por teléfono..." /></div>

           {isManagerMode && !editingRequest && !isUnjustified && (
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                   <label className="block text-sm font-bold text-blue-800 mb-2">Estado Inicial</label>
                   <div className="flex gap-4">
                       <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="radio" name="status" checked={adminStatus === RequestStatus.PENDING} onChange={() => setAdminStatus(RequestStatus.PENDING)} /> Pendiente</label>
                       <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="radio" name="status" checked={adminStatus === RequestStatus.APPROVED} onChange={() => setAdminStatus(RequestStatus.APPROVED)} /> <span className="font-bold text-green-600">Aprobar Directo</span></label>
                   </div>
               </div>
           )}

           <button type="submit" disabled={(isConsumptionType && hours === 0) || isSubmitting || isUploading} className="w-full py-4 bg-blue-600 text-white font-black uppercase text-xs rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 flex justify-center items-center gap-2 disabled:opacity-50">
             {(isSubmitting || isUploading) ? <Loader2 className="animate-spin"/> : null} 
             {editingRequest ? 'Guardar Cambios' : 'Registrar Solicitud'}
           </button>
        </form>
      </div>
    </div>
  );
};

export default RequestFormModal;
import React, { useState, useMemo } from 'react';
import { store } from '../services/store';
import { User, Truck as TruckIcon, Driver, DriverPPE, Role, Truck as TruckType } from '../types';
import { 
  Truck, 
  Users, 
  HardHat, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Package, 
  Check, 
  Clock, 
  ShoppingCart, 
  Ruler, 
  FileText,
  Search,
  LayoutGrid,
  List,
  Printer,
  X,
  BarChart3
} from 'lucide-react';

interface RepartidoresViewProps {
  user: User;
}

interface DriverRowProps {
    driver: Driver;
    driverPPE: DriverPPE[];
    getPpeTypeName: (id: string) => string;
    onAddPPE: (driverId: string) => void;
    onDelete: (driverId: string) => void;
    onDeliver: (reqId: string) => void;
}

const DriverRow: React.FC<DriverRowProps> = ({ driver, driverPPE, getPpeTypeName, onAddPPE, onDelete, onDeliver }) => {
    const pendingCount = driverPPE.filter(p => p.status !== 'ENTREGADO').length;

    return (
        <div className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md transition-all group">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <Users size={18}/>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">{driver.name}</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Personal de Reparto</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {pendingCount > 0 && (
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                            <Clock size={10}/> {pendingCount} PEND.
                        </span>
                    )}
                    <button 
                        onClick={() => onAddPPE(driver.id)}
                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                        title="Asignar EPI"
                    >
                        <HardHat size={18}/>
                    </button>
                    <button 
                        onClick={() => onDelete(driver.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 size={18}/>
                    </button>
                </div>
            </div>
            
            {driverPPE.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-50 space-y-1">
                    {driverPPE.slice(0, 5).map(ppe => (
                        <div key={ppe.id} className="flex justify-between items-center text-[10px] bg-slate-50 px-2 py-1 rounded">
                            <span className="text-slate-600 font-medium">{getPpeTypeName(ppe.typeId)} ({ppe.size})</span>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${ppe.status === 'ENTREGADO' ? 'text-green-600' : 'text-orange-600'}`}>{ppe.status}</span>
                                {ppe.status !== 'ENTREGADO' && (
                                    <button 
                                        onClick={() => onDeliver(ppe.id)}
                                        className="bg-slate-800 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase hover:bg-black transition-colors"
                                    >
                                        Entregar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const DriverPPEReportModal: React.FC<{ onClose: () => void, trucks: TruckType[], drivers: Driver[], ppeRequests: DriverPPE[], getPpeTypeName: (id: string) => string }> = ({ onClose, trucks, drivers, ppeRequests, getPpeTypeName }) => {
    const handlePrint = () => window.print();

    const reportData = useMemo(() => {
        return trucks.map(truck => {
            const truckDrivers = drivers.filter(d => d.truckId === truck.id);
            const pendingItems = ppeRequests.filter(p => 
                p.status !== 'ENTREGADO' && 
                truckDrivers.some(d => d.id === p.driverId)
            ).map(p => ({
                ...p,
                driverName: truckDrivers.find(d => d.id === p.driverId)?.name || 'Desconocido'
            }));
            return { truck, items: pendingItems };
        }).filter(group => group.items.length > 0);
    }, [trucks, drivers, ppeRequests]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-4 backdrop-blur-sm print:p-0 print:bg-white print:items-start">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl animate-fade-in-up overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none h-[90vh] flex flex-col print:h-auto">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden shrink-0">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2"><Printer size={20}/> Informe de EPIs Pendientes por Camión</h2>
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
                        <div className="w-20 h-20">
                            <img src="https://termosycalentadoresgranada.com/wp-content/uploads/2025/08/https___cdn.evbuc_.com_images_677236879_73808960223_1_original.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase">EPIs Pendientes - Reparto</h1>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    {reportData.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 italic">No hay EPIs pendientes de entrega en la flota de reparto.</div>
                    ) : reportData.map(group => (
                        <div key={group.truck.id} className="mb-10 break-inside-avoid">
                            <div className="bg-slate-900 text-white px-6 py-3 rounded-t-xl flex justify-between items-center">
                                <h3 className="font-black uppercase tracking-tight flex items-center gap-2">
                                    <Truck size={20} className="text-blue-400"/> {group.truck.name}
                                </h3>
                                <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full uppercase">{group.items.length} Pendientes</span>
                            </div>
                            <table className="w-full text-sm text-left border-x border-b border-slate-200 rounded-b-xl overflow-hidden">
                                <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">Repartidor</th>
                                        <th className="px-6 py-3">Material / Talla</th>
                                        <th className="px-6 py-3">Cronología</th>
                                        <th className="px-6 py-3">Estado Actual</th>
                                        <th className="px-6 py-3 border-l border-slate-200 text-center w-24">Firma</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {group.items.map(item => (
                                        <tr key={item.id} className="print:bg-transparent">
                                            <td className="px-6 py-4 font-bold text-slate-800">{item.driverName}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-600">{getPpeTypeName(item.typeId)}</div>
                                                <div className="font-black font-mono text-blue-600 text-[10px]">TALLA: {item.size}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[9px] text-slate-400 font-bold uppercase">Registro: {new Date(item.createdAt).toLocaleDateString()}</div>
                                                {item.requestedDate && <div className="text-[9px] text-blue-500 font-bold uppercase">Pedido: {new Date(item.requestedDate).toLocaleDateString()}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${item.status === 'SOLICITADO' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 border-l border-slate-200"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}

                    <div className="mt-20 pt-10 border-t border-slate-200 print:flex hidden justify-between">
                        <div className="text-center">
                            <div className="h-1 bg-slate-300 w-48 mb-2"></div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Firma Responsable Logística</p>
                        </div>
                        <div className="text-center">
                            <div className="h-1 bg-slate-300 w-48 mb-2"></div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Firma Administrador</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DriverPPEQuantityReportModal: React.FC<{ onClose: () => void, ppeRequests: DriverPPE[], getPpeTypeName: (id: string) => string }> = ({ onClose, ppeRequests, getPpeTypeName }) => {
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
                    <h2 className="font-bold text-slate-700 flex items-center gap-2"><BarChart3 size={20}/> Resumen de Cantidades Pendientes</h2>
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
                            <h1 className="text-xl font-black text-slate-900 uppercase">Resumen de Pedido EPI</h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Consolidado para proveedores - {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    {Object.keys(summaryData).length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic">No hay pedidos pendientes de consolidar.</div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 gap-4">
                                {Object.entries(summaryData).map(([typeName, sizes]) => (
                                    <div key={typeName} className="border border-slate-200 rounded-xl overflow-hidden break-inside-avoid">
                                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                            <h3 className="font-black text-slate-700 uppercase text-xs">{typeName}</h3>
                                            <span className="bg-white text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200">
                                                {Object.values(sizes).reduce((a, b) => a + b, 0)} Uds. Totales
                                            </span>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Talla / Medida</th>
                                                    <th className="px-4 py-2 text-right">Cantidad Necesaria</th>
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
                                <span className="text-xs font-bold uppercase tracking-widest">Total Material Pendiente de Suministro:</span>
                                <span className="text-xl font-black">{totalCount} Unidades</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const RepartidoresView: React.FC<RepartidoresViewProps> = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState<'flota' | 'epis'>('flota');
  const [expandedTruck, setExpandedTruck] = useState<string | null>(null);
  const [showAddTruck, setShowAddTruck] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState<string | null>(null);
  const [showAddPPE, setShowAddPPE] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showQtyReport, setShowQtyReport] = useState(false);
  const [newTruckName, setNewTruckName] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [search, setSearch] = useState('');

  const [selectedPpeType, setSelectedPpeType] = useState('');
  const [selectedPpeSize, setSelectedPpeSize] = useState('');

  const trucks = store.config.trucks;
  const drivers = store.config.drivers;
  const ppeRequests = store.config.driversPpe;

  // Estructura de árbol: Camión > Repartidor > EPIs
  const treeData = useMemo(() => {
    const truckGroups: Record<string, { 
        truckName: string, 
        drivers: Record<string, { driverName: string, requests: DriverPPE[] }> 
    }> = {};

    ppeRequests.forEach(req => {
        const d = drivers.find(drv => drv.id === req.driverId);
        const t = trucks.find(trk => trk.id === d?.truckId);
        const truckId = t?.id || 'no-truck';
        const truckName = t?.name || 'Sin camión asignado';
        const driverId = req.driverId;
        const driverName = d?.name || 'Eliminado';

        if (!truckGroups[truckId]) {
            truckGroups[truckId] = { truckName, drivers: {} };
        }
        if (!truckGroups[truckId].drivers[driverId]) {
            truckGroups[truckId].drivers[driverId] = { driverName, requests: [] };
        }
        truckGroups[truckId].drivers[driverId].requests.push(req);
    });

    const result = Object.entries(truckGroups).map(([truckId, data]) => ({
        truckId,
        truckName: data.truckName,
        drivers: Object.entries(data.drivers).map(([dId, dData]) => ({
            driverId: dId,
            driverName: dData.driverName,
            requests: dData.requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        })).sort((a, b) => a.driverName.localeCompare(b.driverName))
    })).sort((a, b) => a.truckName.localeCompare(b.truckName));

    if (search) {
        return result.filter(t => 
            t.truckName.toLowerCase().includes(search.toLowerCase()) ||
            t.drivers.some(d => d.driverName.toLowerCase().includes(search.toLowerCase()))
        ).map(t => ({
            ...t,
            drivers: t.drivers.filter(d => 
                t.truckName.toLowerCase().includes(search.toLowerCase()) || 
                d.driverName.toLowerCase().includes(search.toLowerCase())
            )
        }));
    }
    return result;
  }, [ppeRequests, drivers, trucks, search]);

  const filteredTrucksForFlota = useMemo(() => {
      if (!search) return trucks;
      return trucks.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || 
          drivers.some(d => d.truckId === t.id && d.name.toLowerCase().includes(search.toLowerCase())));
  }, [trucks, drivers, search]);

  const handleCreateTruck = async () => {
      if (!newTruckName.trim()) return;
      await store.createTruck(newTruckName);
      setNewTruckName('');
      setShowAddTruck(false);
  };

  const handleCreateDriver = async (truckId: string) => {
      if (!newDriverName.trim()) return;
      await store.createDriver(newDriverName, truckId);
      setNewDriverName('');
      setShowAddDriver(null);
  };

  const handleAddPPE = async (driverId: string) => {
      if (!selectedPpeType || !selectedPpeSize) return;
      await store.createDriverPPE(driverId, selectedPpeType, selectedPpeSize);
      setSelectedPpeType('');
      setSelectedPpeSize('');
      setShowAddPPE(null);
      alert('EPI registrado correctamente.');
  };

  const handleDeliver = async (reqId: string) => {
      const qtyStr = window.prompt('Indique la cantidad de unidades entregadas al repartidor:', '1');
      if (qtyStr === null) return;
      const qty = parseInt(qtyStr);
      if (isNaN(qty) || qty <= 0) {
          alert('Cantidad no válida.');
          return;
      }
      await store.updateDriverPPEStatus(reqId, 'ENTREGADO', qty);
  };

  const handleMarkRequested = async (reqId: string) => {
      if(confirm('¿Marcar este EPI como pedido al proveedor? Pasará a estado "SOLICITADO".')) {
          await store.updateDriverPPEStatus(reqId, 'SOLICITADO');
      }
  };

  const getPpeTypeName = (id: string) => store.config.ppeTypes.find(t => t.id === id)?.name || id;

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button 
                    onClick={() => setActiveSubTab('flota')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'flota' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                    <Truck size={18}/> Flota y Personal
                </button>
                <button 
                    onClick={() => setActiveSubTab('epis')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'epis' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                    <HardHat size={18}/> Gestión de EPIs
                </button>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder={activeSubTab === 'flota' ? "Buscar camión o repartidor..." : "Filtrar por camión..."} 
                        className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-100"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {activeSubTab === 'flota' ? (
                    <button 
                        onClick={() => setShowAddTruck(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg"
                    >
                        <Plus size={18}/> Nuevo Camión
                    </button>
                ) : (
                    <div className="flex gap-2 w-full md:w-auto">
                        <button 
                            onClick={() => setShowQtyReport(true)}
                            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                            <BarChart3 size={18}/> Resumen Cantidades
                        </button>
                        <button 
                            onClick={() => setShowReport(true)}
                            className="flex-1 md:flex-none bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                            <FileText size={18}/> Informe Camión
                        </button>
                    </div>
                )}
            </div>
        </div>

        <div className="min-h-[500px]">
            {activeSubTab === 'flota' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredTrucksForFlota.length === 0 ? (
                        <div className="lg:col-span-2 py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed">
                            <Truck size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>No se han encontrado camiones.</p>
                        </div>
                    ) : filteredTrucksForFlota.map(truck => (
                        <div key={truck.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-xl shadow-sm text-slate-700 border border-slate-100">
                                        <Truck size={24}/>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 uppercase tracking-tight">{truck.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{drivers.filter(d => d.truckId === truck.id).length} Repartidores asignados</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setShowAddDriver(truck.id)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Añadir repartidor"
                                    >
                                        <Plus size={20}/>
                                    </button>
                                    <button 
                                        onClick={() => { if(confirm('¿Eliminar camión y todos sus repartidores?')) store.deleteTruck(truck.id); }}
                                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 grid grid-cols-1 gap-3 bg-white flex-1">
                                {drivers.filter(d => d.truckId === truck.id).length === 0 ? (
                                    <p className="text-center text-slate-300 text-xs italic py-4">Sin repartidores en este camión.</p>
                                ) : drivers.filter(d => d.truckId === truck.id).map(driver => (
                                    <DriverRow 
                                        key={driver.id} 
                                        driver={driver} 
                                        driverPPE={ppeRequests.filter(p => p.driverId === driver.id)}
                                        getPpeTypeName={getPpeTypeName}
                                        onAddPPE={setShowAddPPE}
                                        onDeliver={handleDeliver}
                                        onDelete={(id) => { if(confirm('¿Eliminar repartidor?')) store.deleteDriver(id); }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeSubTab === 'epis' && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                <tr>
                                    <th className="px-6 py-4">Estructura / Material</th>
                                    <th className="px-6 py-4">Talla</th>
                                    <th className="px-6 py-4">Cronología</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {treeData.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-20 text-slate-400">No hay solicitudes registradas que coincidan con la búsqueda.</td></tr>
                                ) : treeData.map(truck => (
                                    <React.Fragment key={truck.truckId}>
                                        {/* NIVEL 1: Camión */}
                                        <tr className="bg-slate-900 text-white">
                                            <td colSpan={5} className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Truck size={18} className="text-blue-400"/>
                                                    <span className="font-black uppercase tracking-tight text-sm">{truck.truckName}</span>
                                                    <span className="ml-auto bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                        {truck.drivers.length} Empleados
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {truck.drivers.map(driver => (
                                            <React.Fragment key={driver.driverId}>
                                                {/* NIVEL 2: Empleado */}
                                                <tr className="bg-slate-100">
                                                    <td colSpan={5} className="px-6 py-2.5 pl-12 border-b border-slate-200">
                                                        <div className="flex items-center gap-3">
                                                            <Users size={16} className="text-slate-500"/>
                                                            <span className="font-bold text-slate-700 text-xs uppercase">{driver.driverName}</span>
                                                            <span className="bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[9px] font-black text-slate-500 uppercase">
                                                                {driver.requests.length} Materiales
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* NIVEL 3: EPIs */}
                                                {driver.requests.map(req => (
                                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 pl-20">
                                                            <div className="flex items-center gap-2">
                                                                <ChevronRight size={14} className="text-slate-300" />
                                                                <span className="font-medium text-slate-700">{getPpeTypeName(req.typeId)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="bg-slate-100 px-2 py-1 rounded font-mono font-bold text-xs">{req.size}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">REG: {new Date(req.createdAt).toLocaleDateString()}</span>
                                                                {req.requestedDate && <span className="text-[9px] text-blue-400 font-bold uppercase tracking-tighter">PED: {new Date(req.requestedDate).toLocaleDateString()}</span>}
                                                            </div>
                                                        </td>
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
                                                                        className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-black transition-colors"
                                                                    >
                                                                        Entregar
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    onClick={() => { if(confirm('¿Eliminar?')) store.deleteDriverPPE(req.id); }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                                                >
                                                                    <Trash2 size={16}/>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        {showAddTruck && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Truck className="text-blue-600"/> Nuevo Camión
                    </h3>
                    <input 
                        className="w-full p-3 border border-slate-200 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-blue-100 font-bold"
                        placeholder="Identificación / Matrícula..."
                        value={newTruckName}
                        onChange={e => setNewTruckName(e.target.value)}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setShowAddTruck(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                        <button onClick={handleCreateTruck} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700">Crear</button>
                    </div>
                </div>
            </div>
        )}

        {showAddDriver && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Users className="text-blue-600"/> Nuevo Repartidor
                    </h3>
                    <input 
                        className="w-full p-3 border border-slate-200 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-blue-100 font-bold"
                        placeholder="Nombre Completo..."
                        value={newDriverName}
                        onChange={e => setNewDriverName(e.target.value)}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setShowAddDriver(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                        <button onClick={() => handleCreateDriver(showAddDriver)} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700">Añadir</button>
                    </div>
                </div>
            </div>
        )}

        {showAddPPE && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <HardHat className="text-orange-500"/> Asignar Material
                    </h3>
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Elemento</label>
                            <select 
                                className="w-full p-3 border rounded-xl bg-slate-50 outline-none"
                                value={selectedPpeType}
                                onChange={e => { setSelectedPpeType(e.target.value); setSelectedPpeSize(''); }}
                            >
                                <option value="">Seleccionar...</option>
                                {store.config.ppeTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        {selectedPpeType && (
                            <div className="animate-fade-in">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Talla</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {store.config.ppeTypes.find(t => t.id === selectedPpeType)?.sizes.map(size => (
                                        <button 
                                            key={size}
                                            onClick={() => setSelectedPpeSize(size)}
                                            className={`p-2 rounded-lg text-xs font-bold border transition-all ${selectedPpeSize === size ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowAddPPE(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                        <button 
                            disabled={!selectedPpeType || !selectedPpeSize}
                            onClick={() => handleAddPPE(showAddPPE)} 
                            className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            Registrar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showReport && (
            <DriverPPEReportModal 
                onClose={() => setShowReport(false)} 
                trucks={trucks} 
                drivers={drivers} 
                ppeRequests={ppeRequests} 
                getPpeTypeName={getPpeTypeName} 
            />
        )}

        {showQtyReport && (
            <DriverPPEQuantityReportModal 
                onClose={() => setShowQtyReport(false)} 
                ppeRequests={ppeRequests} 
                getPpeTypeName={getPpeTypeName} 
            />
        )}
    </div>
  );
};

export default RepartidoresView;
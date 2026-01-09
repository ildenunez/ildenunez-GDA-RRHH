
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
  X
} from 'lucide-react';

interface RepartidoresViewProps {
  user: User;
}

// Fixed DriverRow to handle React props properly and avoid the 'key' error
interface DriverRowProps {
    driver: Driver;
    driverPPE: DriverPPE[];
    getPpeTypeName: (id: string) => string;
    onAddPPE: (driverId: string) => void;
    onDelete: (driverId: string) => void;
}

const DriverRow: React.FC<DriverRowProps> = ({ driver, driverPPE, getPpeTypeName, onAddPPE, onDelete }) => {
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
            
            {/* Mini Listado de EPIs recientes del repartidor */}
            {driverPPE.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-50 space-y-1">
                    {driverPPE.slice(0, 2).map(ppe => (
                        <div key={ppe.id} className="flex justify-between items-center text-[10px] bg-slate-50 px-2 py-1 rounded">
                            <span className="text-slate-600 font-medium">{getPpeTypeName(ppe.typeId)} ({ppe.size})</span>
                            <span className={`font-bold ${ppe.status === 'ENTREGADO' ? 'text-green-600' : 'text-orange-600'}`}>{ppe.status}</span>
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
                                        <th className="px-6 py-3">Material</th>
                                        <th className="px-6 py-3">Talla</th>
                                        <th className="px-6 py-3">Estado Actual</th>
                                        <th className="px-6 py-3 border-l border-slate-200 text-center w-24">Recibido</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {group.items.map(item => (
                                        <tr key={item.id} className="print:bg-transparent">
                                            <td className="px-6 py-4 font-bold text-slate-800">{item.driverName}</td>
                                            <td className="px-6 py-4 font-medium text-slate-600">{getPpeTypeName(item.typeId)}</td>
                                            <td className="px-6 py-4 font-black font-mono text-blue-600">{item.size}</td>
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

const RepartidoresView: React.FC<RepartidoresViewProps> = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState<'flota' | 'epis'>('flota');
  const [expandedTruck, setExpandedTruck] = useState<string | null>(null);
  const [showAddTruck, setShowAddTruck] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState<string | null>(null); // truckId
  const [showAddPPE, setShowAddPPE] = useState<string | null>(null); // driverId
  const [showReport, setShowReport] = useState(false);
  const [newTruckName, setNewTruckName] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [search, setSearch] = useState('');

  const [selectedPpeType, setSelectedPpeType] = useState('');
  const [selectedPpeSize, setSelectedPpeSize] = useState('');

  const trucks = store.config.trucks;
  const drivers = store.config.drivers;
  const ppeRequests = store.config.driversPpe;

  const filteredTrucks = useMemo(() => {
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

  const getPpeTypeName = (id: string) => store.config.ppeTypes.find(t => t.id === id)?.name || id;

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Cabecera y Tabs */}
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
                {activeSubTab === 'flota' ? (
                    <>
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                            <input 
                                type="text" 
                                placeholder="Buscar camión o repartidor..." 
                                className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-100"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setShowAddTruck(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg"
                        >
                            <Plus size={18}/> Nuevo Camión
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => setShowReport(true)}
                        className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
                    >
                        <FileText size={18}/> Informe Pendientes (Camión)
                    </button>
                )}
            </div>
        </div>

        {/* Contenido Principal */}
        <div className="min-h-[500px]">
            {activeSubTab === 'flota' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredTrucks.length === 0 ? (
                        <div className="lg:col-span-2 py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed">
                            <Truck size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>No se han configurado camiones aún.</p>
                        </div>
                    ) : filteredTrucks.map(truck => (
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
                                    <th className="px-6 py-4">Repartidor / Camión</th>
                                    <th className="px-6 py-4">Material</th>
                                    <th className="px-6 py-4">Talla</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ppeRequests.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-20 text-slate-400">No hay solicitudes registradas para el equipo de reparto.</td></tr>
                                ) : ppeRequests.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(req => {
                                    const driver = drivers.find(d => d.id === req.driverId);
                                    const truck = trucks.find(t => t.id === driver?.truckId);
                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{driver?.name || 'Eliminado'}</div>
                                                <div className="text-[10px] text-blue-600 font-black uppercase flex items-center gap-1">
                                                    <Truck size={10}/> {truck?.name || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-700">{getPpeTypeName(req.typeId)}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-slate-100 px-2 py-1 rounded font-mono font-bold text-xs">{req.size}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.status === 'ENTREGADO' ? (
                                                    <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-full w-fit">
                                                        <Check size={12}/> ENTREGADO
                                                    </span>
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
                                                            onClick={() => store.updateDriverPPEStatus(req.id, 'SOLICITADO')}
                                                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700"
                                                        >
                                                            Solicitar
                                                        </button>
                                                    )}
                                                    {req.status !== 'ENTREGADO' && (
                                                        <button 
                                                            onClick={() => store.updateDriverPPEStatus(req.id, 'ENTREGADO')}
                                                            className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-black"
                                                        >
                                                            Entregar
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => { if(confirm('¿Eliminar?')) store.deleteDriverPPE(req.id); }}
                                                        className="p-1.5 text-slate-400 hover:text-red-600"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        {/* Modal Añadir Camión */}
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

        {/* Modal Añadir Repartidor */}
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

        {/* Modal Añadir EPI a Repartidor */}
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

        {/* Modal de Informe de EPIs Pendientes */}
        {showReport && (
            <DriverPPEReportModal 
                onClose={() => setShowReport(false)} 
                trucks={trucks} 
                drivers={drivers} 
                ppeRequests={ppeRequests} 
                getPpeTypeName={getPpeTypeName} 
            />
        )}
    </div>
  );
};

export default RepartidoresView;

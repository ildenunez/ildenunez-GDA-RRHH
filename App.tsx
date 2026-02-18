import React, { Component, useState, useEffect, ReactNode, ErrorInfo } from 'react';
import { store } from './services/store';
import { User, Role, LeaveRequest, Notification } from './types';
import Dashboard from './components/Dashboard';
import { Approvals, UserManagement, UpcomingAbsences, AdminSettings } from './components/Management';
import CalendarView from './components/CalendarView';
import NotificationsView from './components/NotificationsView';
import ProfileView from './components/ProfileView';
import RequestDetailModal from './components/RequestDetailModal';
import RequestFormModal from './components/RequestFormModal';
import HelpView from './components/HelpView';
import PPEView from './components/PPEView';
import RepartidoresView from './components/RepartidoresView';
import UnreadNotificationsModal from './components/UnreadNotificationsModal';
import { 
  LayoutDashboard, 
  CalendarDays, 
  ShieldCheck, 
  Users as UsersIcon, 
  Settings, 
  LogOut, 
  Menu, 
  Bell,
  Plus,
  Info,
  Loader2,
  ArrowRight,
  HelpCircle,
  HardHat,
  CalendarClock,
  AlertTriangle,
  Truck,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

const LOGO_URL = "https://termosycalentadoresgranada.com/wp-content/uploads/2025/08/https___cdn.evbuc_.com_images_677236879_73808960223_1_original.png";

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-red-100">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32}/>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Algo salió mal</h2>
                <p className="text-slate-500 mb-6 text-sm">Ha ocurrido un error inesperado al cargar esta sección. Por favor, intenta recargar la página.</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/30">
                    Recargar Página
                </button>
            </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Login = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
        await store.init();
        const user = await store.login(email, pass);
        if (user) onLogin(user); else setError('Credenciales inválidas.');
    } catch (e) { 
        console.error(e);
        setError('Error de conexión.'); 
    } finally { 
        setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1950&q=80")' }} />
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/80 via-slate-900/80 to-purple-900/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-lg mx-auto mb-6 flex items-center justify-center p-4">
             <img src={LOGO_URL} alt="GdA RRHH" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">GdA <span className="text-blue-600">RRHH</span></h1>
          <p className="text-slate-500 font-medium">Portal del Empleado by Ilde Núñez</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <input type="email" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl" placeholder="Email corporativo" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} />
          </div>
          {error && <div className="text-red-600 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100"><Info size={16} className="shrink-0"/> {error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex justify-center items-center gap-2 hover:bg-blue-700 transition-colors">
            {loading ? <Loader2 className="animate-spin"/> : <>Entrar <ArrowRight size={18}/></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isBusy, setIsBusy] = useState(false); // Reflejo del store.isBusy
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'absence' | 'overtime'>('absence');
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [unreadToModal, setUnreadToModal] = useState<Notification | null>(null);
  const [showSupervisorReminder, setShowSupervisorReminder] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  useEffect(() => {
    const initApp = async () => {
        try {
          await store.init();
          if (store.currentUser) {
              setUser({ ...store.currentUser });
              // Solicitar permisos de notificación push si están disponibles
              if ("Notification" in window && Notification.permission === "default") {
                  await Notification.requestPermission();
              }
          }
        } catch(e) { console.error("App Init Error:", e); }
        finally { setInitializing(false); }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = store.subscribe(() => {
        setIsBusy(store.isBusy);
        if (store.currentUser) {
            setUser({ ...store.currentUser });
        }
    });
    return unsubscribe;
  }, [user?.id]);

  useEffect(() => {
    if (user && !unreadToModal) {
      const allNotifs = store.getNotificationsForUser(user.id);
      const firstAdminUnread = allNotifs.find(n => !n.read && n.type === 'admin');
      if (firstAdminUnread) {
        setUnreadToModal(firstAdminUnread);
      }
    }
  }, [user, user?.id, store.notifications]);

  useEffect(() => {
    if (user && !initializing && !reminderDismissed) {
      const isSupervisor = user.role === Role.SUPERVISOR || user.role === Role.ADMIN;
      if (isSupervisor) {
        const pendingCount = store.getPendingApprovalsForUser(user.id).length;
        if (pendingCount > 0) {
          setShowSupervisorReminder(true);
        }
      }
    }
  }, [user, initializing, reminderDismissed]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    store.refresh();
  };

  if (initializing) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
    </div>
  );

  if (!user) return <Login onLogin={setUser} />;

  const handleLogout = () => {
      store.logout();
      setUser(null);
      setReminderDismissed(false); // Reset para el próximo login
  };

  const isSupervisor = user.role === Role.SUPERVISOR || user.role === Role.ADMIN;
  const isAdmin = user.role === Role.ADMIN;
  
  const pendingCount = isSupervisor ? store.getPendingApprovalsForUser(user.id).length : 0;
  const unreadCount = store.getNotificationsForUser(user.id).filter(n => !n.read).length;

  const NavItem = ({ id, icon: Icon, label, badgeCount }: any) => (
    <button onClick={() => handleTabChange(id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <div className="flex items-center space-x-2.5"><Icon size={18} /><span className="text-[13px] font-medium">{label}</span></div>
      {badgeCount > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{badgeCount}</span>}
    </button>
  );

  return (
    <div className="flex h-screen h-[100dvh] bg-slate-50 overflow-hidden relative">
      {/* Indicador de Carga Global */}
      {isBusy && (
        <div className="absolute top-0 left-0 right-0 h-1 z-[200] bg-blue-100 overflow-hidden">
          <div className="h-full bg-blue-600 animate-[loading_1.5s_infinite_linear]" style={{ width: '30%' }}></div>
        </div>
      )}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(333%); }
        }
      `}</style>

      <aside className={`fixed top-0 bottom-0 h-[100dvh] left-0 z-40 w-52 xl:w-48 bg-slate-900 text-white transform transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-2xl print:hidden`}>
        <div className="p-4 xl:p-3 flex flex-col items-center border-b border-slate-800 shrink-0">
            <div className="w-14 h-14 xl:w-12 xl:h-12 bg-white rounded-xl p-2 mb-2 flex items-center justify-center"><img src={LOGO_URL} className="w-full h-full object-contain" /></div>
            <h1 className="text-lg xl:text-base font-extrabold tracking-tight">GdA <span className="text-blue-500">RRHH</span></h1>
        </div>
        
        <nav className="p-3 xl:p-2.5 space-y-1 flex-1 overflow-y-auto min-h-0 scrollbar-hide">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="calendar" icon={CalendarDays} label="Calendario" />
          <NavItem id="notifications" icon={Bell} label="Notificaciones" badgeCount={unreadCount} />
          <NavItem id="epis" icon={HardHat} label="EPIS" />
          
          {isSupervisor && (
            <>
              <div className="pt-3 pb-1 px-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">Reparto</div>
              <NavItem id="repartidores" icon={Truck} label="Repartidores" />
              
              <div className="pt-3 pb-1 px-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">Gestión</div>
              <NavItem id="approvals" icon={ShieldCheck} label="Aprobaciones" badgeCount={pendingCount} />
              <NavItem id="team" icon={UsersIcon} label="Mi Equipo" />
              <NavItem id="upcoming" icon={CalendarClock} label="Próximas" />
            </>
          )}
          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">Admin</div>
              <NavItem id="settings" icon={Settings} label="Ajustes" />
            </>
          )}
          <div className="pt-3 border-t border-slate-800 mt-3"><NavItem id="help" icon={HelpCircle} label="Ayuda" /></div>
        </nav>

        <div className="p-3 xl:p-2.5 border-t border-slate-800 shrink-0 bg-slate-900 z-50">
          <div className="flex items-center gap-2 mb-3 p-1.5 cursor-pointer hover:bg-slate-800 rounded-lg" onClick={() => handleTabChange('profile')}>
            <img src={user.avatar} className="w-8 h-8 rounded-full border-2 border-slate-700 object-cover" />
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate leading-tight">{user.name}</p>
                <p className="text-[9px] text-slate-500 truncate uppercase font-black">Activo</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold transition-colors text-slate-400"><LogOut size={14} /> Salir</button>
        </div>
      </aside>

      <main className="flex-1 md:ml-52 xl:ml-48 flex flex-col h-screen h-[100dvh]">
        <header className="h-14 xl:h-12 bg-white border-b flex items-center justify-between px-5 xl:px-4 z-30 shrink-0 print:hidden">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-600"><Menu/></button>
          <h2 className="text-base xl:text-sm font-bold text-slate-800 capitalize tracking-tight">{activeTab.replace(/_/g, ' ')}</h2>
          <button onClick={() => {setModalInitialTab('absence'); setEditingRequest(null); setShowRequestModal(true);}} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Plus size={14} /> Nueva Solicitud</button>
        </header>
        <div className={`flex-1 overflow-auto p-4 md:p-6 xl:p-5 ${viewingRequest ? 'print:hidden' : ''}`}>
           <ErrorBoundary>
             {activeTab === 'dashboard' && <Dashboard user={user} onNewRequest={t => {setModalInitialTab(t); setShowRequestModal(true);}} onEditRequest={r => {setEditingRequest(r); setShowRequestModal(true);}} onViewRequest={setViewingRequest} />}
             {activeTab === 'calendar' && <CalendarView user={user} />}
             {activeTab === 'notifications' && <NotificationsView user={user} />}
             {activeTab === 'profile' && <ProfileView user={user} onProfileUpdate={() => setUser({...store.currentUser!})} />}
             {activeTab === 'approvals' && <Approvals user={user} onViewRequest={setViewingRequest} />}
             {activeTab === 'team' && <UserManagement currentUser={user} onViewRequest={setViewingRequest} />}
             {activeTab === 'upcoming' && <UpcomingAbsences user={user} onViewRequest={setViewingRequest} />}
             {activeTab === 'epis' && <PPEView user={user} />}
             {activeTab === 'repartidores' && <RepartidoresView user={user} />}
             {activeTab === 'settings' && isAdmin && <AdminSettings onViewRequest={setViewingRequest} />}
             {activeTab === 'help' && <HelpView />}
           </ErrorBoundary>
        </div>
        {showRequestModal && <RequestFormModal onClose={() => { setShowRequestModal(false); store.refresh(); }} user={user} initialTab={modalInitialTab} editingRequest={editingRequest} />}
        {viewingRequest && <RequestDetailModal request={viewingRequest} onClose={() => setViewingRequest(null)} />}
        {unreadToModal && <UnreadNotificationsModal notification={unreadToModal} onClose={() => setUnreadToModal(null)} />}
        
        {/* Modal Recordatorio para Supervisores */}
        {showSupervisorReminder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in border border-blue-100">
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <ShieldAlert size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Tareas Pendientes</h3>
                <p className="text-slate-500 mb-8">
                  Hola <span className="font-bold text-slate-700">{user.name}</span>, tienes <span className="text-blue-600 font-black text-lg">{pendingCount}</span> solicitudes de tu equipo esperando ser revisadas.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => { setShowSupervisorReminder(false); setReminderDismissed(true); handleTabChange('approvals'); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 group"
                  >
                    Ir a Aprobaciones
                    <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => { setShowSupervisorReminder(false); setReminderDismissed(true); }}
                    className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                  >
                    Revisar más tarde
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

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
  AlertTriangle
} from 'lucide-react';

const LOGO_URL = "https://termosycalentadoresgranada.com/wp-content/uploads/2025/08/https___cdn.evbuc_.com_images_677236879_73808960223_1_original.png";

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch rendering errors in its child components and display a fallback UI.
 * Standard implementation using React.Component to ensure props and state are correctly typed and accessible.
 */
// Fix: Use explicitly imported Component and generic parameters to resolve Property 'state' and 'props' errors
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Explicitly define the state and props properties on the class for improved type checking
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
    // Fix: Access this.state safely now that it is recognized on the class instance
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
                {(import.meta as any).env.DEV && (
                    <pre className="mt-6 p-4 bg-slate-900 text-slate-200 rounded-lg text-left text-[10px] overflow-auto max-h-40">
                        {this.state.error?.toString()}
                    </pre>
                )}
            </div>
        </div>
      );
    }
    
    // Fix: Access this.props safely now that it is recognized on the class instance
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
        setError('Error de conexión con la base de datos. Verifica tu configuración.'); 
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'absence' | 'overtime'>('absence');
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [unreadToModal, setUnreadToModal] = useState<Notification | null>(null);

  useEffect(() => {
    const initApp = async () => {
        try {
          await store.init();
          if (store.currentUser) {
              setUser({ ...store.currentUser });
          }
        } catch(e) { console.error("App Init Error:", e); }
        finally { setInitializing(false); }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = store.subscribe(() => {
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

  /**
   * Cambia la pestaña y sincroniza con la DB de forma silenciosa
   */
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    // Sincronización silenciosa cada vez que el usuario navega
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
  };

  const isSupervisor = user.role === Role.SUPERVISOR || user.role === Role.ADMIN;
  const isAdmin = user.role === Role.ADMIN;
  
  const pendingCount = isSupervisor ? store.getPendingApprovalsForUser(user.id).length : 0;
  const unreadCount = store.getNotificationsForUser(user.id).filter(n => !n.read).length;

  const NavItem = ({ id, icon: Icon, label, badgeCount }: any) => (
    <button onClick={() => handleTabChange(id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <div className="flex items-center space-x-3"><Icon size={20} /><span className="font-medium">{label}</span></div>
      {badgeCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badgeCount}</span>}
    </button>
  );

  const deptName = store.departments.find(d => d.id === user.departmentId)?.name;

  return (
    <div className="flex h-screen h-[100dvh] bg-slate-50 overflow-hidden">
      <aside className={`fixed top-0 bottom-0 h-[100dvh] left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-2xl`}>
        <div className="p-6 flex flex-col items-center border-b border-slate-800 shrink-0">
            <div className="w-20 h-20 bg-white rounded-xl p-2 mb-3 flex items-center justify-center"><img src={LOGO_URL} className="w-full h-full object-contain" /></div>
            <h1 className="text-xl font-extrabold">GdA <span className="text-blue-500">RRHH</span></h1>
        </div>
        
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto min-h-0">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="calendar" icon={CalendarDays} label="Calendario" />
          <NavItem id="notifications" icon={Bell} label="Notificaciones" badgeCount={unreadCount} />
          <NavItem id="epis" icon={HardHat} label="EPIS" />
          {isSupervisor && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase">Gestión</div>
              <NavItem id="approvals" icon={ShieldCheck} label="Aprobaciones" badgeCount={pendingCount} />
              <NavItem id="team" icon={UsersIcon} label="Mi Equipo" />
              <NavItem id="upcoming" icon={CalendarClock} label="Próximas Ausencias" />
            </>
          )}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase">Admin</div>
              <NavItem id="settings" icon={Settings} label="Administración" />
            </>
          )}
          <div className="pt-4 border-t border-slate-800 mt-4"><NavItem id="help" icon={HelpCircle} label="Ayuda" /></div>
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-900 z-50">
          <div className="flex items-center gap-3 mb-4 p-2 cursor-pointer hover:bg-slate-800 rounded-lg" onClick={() => handleTabChange('profile')}>
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase">{deptName || 'Sin Dpto.'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition-colors text-slate-300"><LogOut size={16} /> Salir</button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 flex flex-col h-screen h-[100dvh]">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 z-30 shrink-0">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-600"><Menu/></button>
          <h2 className="text-lg font-semibold text-slate-800 capitalize">{activeTab}</h2>
          <button onClick={() => {setModalInitialTab('absence'); setEditingRequest(null); setShowRequestModal(true);}} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg"><Plus size={16} /> Nueva Solicitud</button>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
           <ErrorBoundary>
             {activeTab === 'dashboard' && <Dashboard user={user} onNewRequest={t => {setModalInitialTab(t); setShowRequestModal(true);}} onEditRequest={r => {setEditingRequest(r); setShowRequestModal(true);}} onViewRequest={setViewingRequest} />}
             {activeTab === 'calendar' && <CalendarView user={user} />}
             {activeTab === 'notifications' && <NotificationsView user={user} />}
             {activeTab === 'profile' && <ProfileView user={user} onProfileUpdate={() => setUser({...store.currentUser!})} />}
             {activeTab === 'approvals' && <Approvals user={user} onViewRequest={setViewingRequest} />}
             {activeTab === 'team' && <UserManagement currentUser={user} onViewRequest={setViewingRequest} />}
             {activeTab === 'upcoming' && <UpcomingAbsences user={user} onViewRequest={setViewingRequest} />}
             {activeTab === 'epis' && <PPEView user={user} />}
             {activeTab === 'settings' && isAdmin && <AdminSettings onViewRequest={setViewingRequest} />}
             {activeTab === 'help' && <HelpView />}
           </ErrorBoundary>
        </div>
        {showRequestModal && <RequestFormModal onClose={() => { setShowRequestModal(false); store.refresh(); }} user={user} initialTab={modalInitialTab} editingRequest={editingRequest} />}
        {viewingRequest && <RequestDetailModal request={viewingRequest} onClose={() => setViewingRequest(null)} />}
        
        {unreadToModal && (
          <UnreadNotificationsModal 
            notification={unreadToModal} 
            onClose={() => setUnreadToModal(null)} 
          />
        )}
      </main>
    </div>
  );
}

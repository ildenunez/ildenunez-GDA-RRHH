import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { store } from '../services/store';
import { Camera, Mail, User as UserIcon, Lock, Save, Loader2, Bell, BellOff, Briefcase, ShieldCheck, Phone } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  onProfileUpdate?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onProfileUpdate }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [loading, setLoading] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dept = store.departments.find(d => d.id === user.departmentId);
  const supervisorNames = dept?.supervisorIds
    .map(id => store.users.find(u => u.id === id)?.name)
    .filter(Boolean)
    .join(', ') || 'No asignado';

  const requestPermission = async () => {
    if (!("Notification" in window)) {
        alert("Tu navegador no soporta notificaciones push.");
        return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
        new Notification("¡Notificaciones activadas!", {
            body: "Recibirás avisos sobre tus solicitudes y mensajes de la empresa.",
            icon: "https://termosycalentadoresgranada.com/wp-content/uploads/2025/08/https___cdn.evbuc_.com_images_677236879_73808960223_1_original.png"
        });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setAvatar(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          await store.updateUserProfile(user.id, {
              name,
              email,
              phone: phone.trim() || null,
              password: password.trim() || undefined,
              avatar
          });
          alert('Perfil actualizado correctamente');
          if (onProfileUpdate) onProfileUpdate();
      } catch (error) {
          alert('Error al actualizar el perfil');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden max-w-2xl mx-auto">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <UserIcon className="text-blue-600"/>
                    <h2 className="text-xl font-bold text-slate-800">Mi Perfil</h2>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border">
                    ID: {user.id.slice(0,8)}...
                </div>
            </div>
            
            <div className="p-8">
                {/* Notificaciones Card */}
                <div className="mb-10 bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${notifPermission === 'granted' ? 'bg-green-50 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {notifPermission === 'granted' ? <Bell size={32} /> : <BellOff size={32} />}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="font-black text-slate-800 uppercase tracking-tighter text-lg">Alertas al Móvil</h4>
                        <p className="text-xs text-slate-500 font-medium">Recibe avisos push cuando se aprueben tus vacaciones o te envíen un mensaje.</p>
                    </div>
                    {notifPermission !== 'granted' ? (
                        <button 
                            type="button"
                            onClick={requestPermission}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-500/30 transition-all"
                        >
                            Activar Ahora
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100">
                            <ShieldCheck size={16}/>
                            <span className="text-[10px] font-black uppercase">Activadas</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-slate-50">
                                <img src={avatar || `https://ui-avatars.com/api/?name=${name}`} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white w-8 h-8"/>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toca para cambiar foto</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Nombre Completo</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3.5 text-slate-400 w-5 h-5"/>
                                <input 
                                    type="text" 
                                    required 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Email Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 text-slate-400 w-5 h-5"/>
                                <input 
                                    type="email" 
                                    required 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Teléfono / WhatsApp</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 text-slate-400 w-5 h-5"/>
                                <input 
                                    type="tel" 
                                    placeholder="Ej: +34 600000000"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                />
                            </div>
                            <p className="text-[9px] text-slate-400 mt-2 px-1">Se usará para recibir notificaciones directas si el administrador lo activa.</p>
                        </div>

                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Superior Directo</label>
                             <div className="relative">
                                 <Briefcase className="absolute left-3 top-3.5 text-slate-400 w-5 h-5"/>
                                 <div className="w-full pl-10 p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm">
                                     {supervisorNames}
                                 </div>
                             </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Actualizar Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-slate-400 w-5 h-5"/>
                                <input 
                                    type="password" 
                                    placeholder="Dejar en blanco para no cambiar"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-slate-900 text-white font-black uppercase text-xs py-4 rounded-2xl hover:bg-black shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                            Guardar Cambios
                        </button>
                    </div>

                </form>
            </div>
        </div>
    </div>
  );
};

export default ProfileView;
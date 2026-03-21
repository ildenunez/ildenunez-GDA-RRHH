import React, { useState } from 'react';
import { User } from '../types';
import { store } from '../services/store';
import { Bell, CheckCircle, XCircle, Info, Trash2, Check, Inbox, MessageSquare, Send, Loader2 } from 'lucide-react';

interface NotificationsViewProps {
  user: User;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ user }) => {
  const [refresh, setRefresh] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const notifications = store.getNotificationsForUser(user.id);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await store.markNotificationAsRead(id);
    setRefresh(prev => prev + 1);
  };

  const handleMarkAllRead = async () => {
    await store.markAllNotificationsAsRead(user.id);
    setRefresh(prev => prev + 1);
  };

  const handleDelete = async (id: string) => {
    await store.deleteNotification(id);
    setRefresh(prev => prev + 1);
  };

  const handleSendReply = async (notif: any) => {
      if (!replyMessage.trim()) return;
      setIsSendingReply(true);
      try {
          // Extraer el ID del remitente del mensaje [CHAT][ID] ...
          const match = notif.message.match(/\[CHAT\]\[(.*?)\]/);
          const senderId = match ? match[1] : undefined;
          
          await store.sendChatMessage(user.id, replyMessage, senderId);
          await store.markNotificationAsRead(notif.id);
          setReplyMessage('');
          setReplyingTo(null);
          setRefresh(prev => prev + 1);
          alert("Respuesta enviada.");
      } catch (error) {
          console.error("Error sending reply:", error);
          alert("Error al enviar respuesta.");
      } finally {
          setIsSendingReply(false);
      }
  };

  const getIcon = (notif: any) => {
      if (notif.type === 'chat') return <MessageSquare className="text-blue-600" size={24}/>;
      const msg = notif.message.toLowerCase();
      if (msg.includes('aprobada') || msg.includes('aprobado')) return <CheckCircle className="text-green-500" size={24}/>;
      if (msg.includes('rechazada') || msg.includes('rechazado')) return <XCircle className="text-red-500" size={24}/>;
      return <Info className="text-blue-500" size={24}/>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Bell className="text-slate-600"/> Mis Notificaciones
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Tienes {unreadCount} mensajes sin leer.</p>
                </div>
                {notifications.length > 0 && (
                    <button 
                        onClick={handleMarkAllRead}
                        className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Check size={16}/> Marcar todas leídas
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
                {notifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Inbox size={64} className="mb-4 text-slate-200"/>
                        <p className="text-lg font-medium">No tienes notificaciones</p>
                        <p className="text-sm">Te avisaremos cuando haya novedades en tus solicitudes.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map(notif => {
                            const isChat = notif.type === 'chat';
                            const displayMessage = isChat ? notif.message.replace(/\[CHAT\]\[.*?\]/, '').trim() : notif.message;
                            
                            return (
                                <div 
                                    key={notif.id} 
                                    className={`p-4 rounded-xl border transition-all flex flex-col gap-3 group
                                        ${notif.read ? 'bg-white border-slate-100' : 'bg-blue-50/50 border-blue-100 shadow-sm'}
                                    `}
                                >
                                    <div className="flex gap-4 items-start">
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notif)}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm ${notif.read ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
                                                {displayMessage}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(notif.date).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notif.read && (
                                                <button 
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg" 
                                                    title="Marcar como leída"
                                                >
                                                    <Check size={16}/>
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(notif.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" 
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </div>

                                    {isChat && !notif.read && replyingTo !== notif.id && (
                                        <button 
                                            onClick={() => setReplyingTo(notif.id)}
                                            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 ml-10"
                                        >
                                            <MessageSquare size={12}/> Responder
                                        </button>
                                    )}

                                    {replyingTo === notif.id && (
                                        <div className="ml-10 mt-2 space-y-2 animate-fade-in">
                                            <textarea 
                                                className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                                                placeholder="Escribe tu respuesta..."
                                                value={replyMessage}
                                                onChange={e => setReplyMessage(e.target.value)}
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => { setReplyingTo(null); setReplyMessage(''); }}
                                                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    onClick={() => handleSendReply(notif)}
                                                    disabled={isSendingReply || !replyMessage.trim()}
                                                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {isSendingReply ? <Loader2 className="animate-spin" size={12}/> : <Send size={12}/>}
                                                    Enviar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default NotificationsView;
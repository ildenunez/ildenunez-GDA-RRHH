
import React from 'react';
import { Notification } from '../types';
import { store } from '../services/store';
import { Bell, Check, X, MessageSquareQuote } from 'lucide-react';

interface UnreadNotificationsModalProps {
  notification: Notification;
  onClose: () => void;
}

const UnreadNotificationsModal: React.FC<UnreadNotificationsModalProps> = ({ notification, onClose }) => {
  const handleMarkAsRead = async () => {
    await store.markNotificationAsRead(notification.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in border border-blue-100">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Bell size={28} className="animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Mensaje de Administración</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                {new Date(notification.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 relative">
            <MessageSquareQuote size={40} className="absolute -top-4 -right-2 text-slate-200" />
            <p className="text-slate-700 leading-relaxed font-medium italic relative z-10">
              "{notification.message}"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleMarkAsRead}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 group"
            >
              <Check size={20} className="group-hover:scale-110 transition-transform" />
              Marcar como leído
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <X size={20} />
              Cerrar
            </button>
          </div>
        </div>
        <div className="bg-slate-50 px-8 py-3 border-t border-slate-100 flex justify-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">GdA RRHH - Sistema de Comunicaciones Internas</p>
        </div>
      </div>
    </div>
  );
};

export default UnreadNotificationsModal;

import React, { useState } from 'react';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { store } from '../services/store';
import { User } from '../types';

interface ChatFloatingButtonProps {
  user: User;
}

const ChatFloatingButton: React.FC<ChatFloatingButtonProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const userDept = store.departments.find(d => d.id === user.departmentId);
  const supervisors = store.users.filter(u => userDept?.supervisorIds.includes(u.id));

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      await store.sendChatMessage(user.id, message);
      setMessage('');
      setIsOpen(false);
      alert("Mensaje enviado al supervisor.");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error al enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 z-[100] group"
        title="Mensaje a Supervisor"
      >
        <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in border border-blue-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Mensaje a Supervisor</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Consulta Directa</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-xs text-blue-700 leading-relaxed">
                Este mensaje será enviado a tu <strong>Supervisor</strong>. Recibirás una notificación cuando alguien responda.
              </div>

              {supervisors.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1">Tus Supervisores</label>
                  <div className="flex flex-wrap gap-3">
                    {supervisors.map(sup => (
                      <div key={sup.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 pr-4">
                        <img src={sup.avatar} className="w-8 h-8 rounded-full object-cover border border-white shadow-sm" alt={sup.name} />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-700 truncate uppercase tracking-tighter leading-tight">{sup.name}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase truncate">Supervisor</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Tu Mensaje</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-32 outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  placeholder="Escribe aquí tu consulta o mensaje..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  autoFocus
                />
              </div>

              <button 
                onClick={handleSend}
                disabled={isSending || !message.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2"
              >
                {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                Enviar Mensaje
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatFloatingButton;

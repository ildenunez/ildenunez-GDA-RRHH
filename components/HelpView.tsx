import React from 'react';
import { 
  Book, User, Briefcase, Shield, CheckCircle, AlertTriangle, 
  Calendar, Clock, Paintbrush, Mail, Settings, Printer, 
  Download, HardHat, FileText, LayoutDashboard, Database, 
  Lock, Share2, Info, PlusCircle, Timer, Star, Check, X,
  ChevronRight, Users, Truck, MessageSquare, History,
  TrendingUp, MousePointer2,
  CalendarClock
} from 'lucide-react';

const HelpView = () => {
  const handlePrintManual = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Botón de Generación de PDF (Solo visible en pantalla) */}
      <div className="flex justify-end gap-3 print:hidden">
        <button 
          onClick={handlePrintManual}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-lg transition-all"
        >
          <Printer size={20} />
          Imprimir Manual del Empleado (PDF)
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none">
        
        {/* --- PORTADA DEL MANUAL --- */}
        <header className="p-12 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white text-center border-b-8 border-blue-600 print:min-h-screen print:flex print:flex-col print:justify-center print:break-after-page">
            <div className="w-32 h-32 bg-white rounded-3xl p-4 mx-auto mb-8 shadow-2xl flex items-center justify-center animate-bounce-slow">
               <img src="https://termosycalentadoresgranada.com/wp-content/uploads/2025/08/https___cdn.evbuc_.com_images_677236879_73808960223_1_original.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-5xl font-black mb-4 tracking-tighter">GdA RRHH</h1>
            <p className="text-2xl text-blue-300 font-medium mb-8">Manual Integral del Portal del Empleado</p>
            <div className="flex justify-center gap-8 text-sm text-slate-400 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2 text-white/60"><Calendar size={16}/> Año 2024-2025</span>
                <span className="flex items-center gap-2 text-white/60"><Shield size={16}/> Acceso Restringido</span>
            </div>
        </header>

        {/* --- SECCIÓN 1: CONCEPTOS BÁSICOS Y ACCESO --- */}
        <section className="p-12 border-b border-slate-100 print:break-after-page">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg"><Lock size={24}/></div>
                1. Acceso y Panel Principal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">1.1 Inicio de Sesión</h3>
                    <p className="text-slate-600 leading-relaxed mb-4">
                        Para acceder a su portal, utilice su <strong>email corporativo</strong> y la contraseña proporcionada por el departamento de RRHH.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 italic">
                        Nota: Puede cambiar su foto de perfil y contraseña en cualquier momento desde la sección <strong>"Mi Perfil"</strong> en el menú lateral inferior.
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">1.2 Entendiendo el Dashboard</h3>
                    <p className="text-slate-600 mb-4">En su pantalla de inicio verá tres contadores clave:</p>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-500 rounded-full"></div> <strong>Días Disponibles:</strong> Saldo actual de vacaciones.</li>
                        <li className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> <strong>Saldo Horas Extra:</strong> Horas acumuladas listas para canje o cobro.</li>
                        <li className="flex items-center gap-2"><div className="w-2 h-2 bg-slate-900 rounded-full"></div> <strong>Próximo Turno:</strong> Información sobre su entrada y horario.</li>
                    </ul>
                </div>
            </div>
        </section>

        {/* --- SECCIÓN 2: SOLICITUD DE AUSENCIAS --- */}
        <section className="p-12 border-b border-slate-100 print:break-after-page">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-orange-500 text-white rounded-lg"><Calendar size={24}/></div>
                2. Gestión de Ausencias
            </h2>
            <p className="text-slate-600 mb-8 text-lg">El sistema permite gestionar sus descansos de forma digital sin necesidad de formularios en papel.</p>
            
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <MousePointer2 className="text-orange-500"/> Pasos para realizar una solicitud:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black shadow-sm mx-auto mb-3 border border-slate-200">1</div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Botón Azul</p>
                        <p className="text-sm font-medium">Click en "Nueva Solicitud"</p>
                    </div>
                    <div className="text-center">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black shadow-sm mx-auto mb-3 border border-slate-200">2</div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Tipo</p>
                        <p className="text-sm font-medium">Elija Vacaciones, Baja o Asuntos Propios</p>
                    </div>
                    <div className="text-center">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black shadow-sm mx-auto mb-3 border border-slate-200">3</div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Fechas</p>
                        <p className="text-sm font-medium">Marque el día de inicio y de fin</p>
                    </div>
                    <div className="text-center">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black shadow-sm mx-auto mb-3 border border-slate-200">4</div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Enviar</p>
                        <p className="text-sm font-medium">RRHH y su supervisor recibirán un aviso</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border border-green-100 bg-green-50/30 p-6 rounded-2xl">
                    <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2"><CheckCircle size={18}/> Estados de Solicitud</h4>
                    <ul className="space-y-2 text-sm text-green-800">
                        <li>• <span className="font-bold">PENDIENTE (Amarillo):</span> Esperando revisión.</li>
                        <li>• <span className="font-bold">APROBADO (Verde):</span> Confirmado. Se descontará del saldo.</li>
                        <li>• <span className="font-bold">RECHAZADO (Rojo):</span> No aceptada. Ver comentario del supervisor.</li>
                    </ul>
                </div>
                <div className="border border-blue-100 bg-blue-50/30 p-6 rounded-2xl">
                    <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2"><Info size={18}/> Tipos Especiales</h4>
                    <p className="text-sm text-blue-800">
                        Si selecciona <strong>Baja Médica</strong>, el sistema no restará días de sus vacaciones, pero deberá presentar el parte oficial de baja en administración.
                    </p>
                </div>
            </div>
        </section>

        {/* --- SECCIÓN 3: HORAS EXTRA --- */}
        <section className="p-12 border-b border-slate-100 print:break-after-page">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg"><Timer size={24}/></div>
                3. Gestión de Horas Extra
            </h2>
            <p className="text-slate-600 mb-8">Usted tiene control total sobre cómo quiere gestionar el tiempo extra trabajado.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border-2 border-slate-100 rounded-3xl hover:border-blue-500 transition-colors group">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><PlusCircle size={24}/></div>
                    <h4 className="font-black text-slate-800 mb-2">1. Registrar Horas</h4>
                    <p className="text-sm text-slate-500">Utilice esta opción para anotar horas trabajadas fuera de jornada. Estas se sumarán a su saldo de "Horas Extra" tras ser aprobadas.</p>
                </div>
                <div className="p-6 border-2 border-slate-100 rounded-3xl hover:border-red-500 transition-colors group">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Star size={24}/></div>
                    <h4 className="font-black text-slate-800 mb-2">2. Festivo Trabajado</h4>
                    <p className="text-sm text-slate-500">Si trabaja un día festivo oficial, esta opción le asignará automáticamente 1 día de descanso extra y/o horas adicionales según convenio.</p>
                </div>
                <div className="p-6 border-2 border-slate-100 rounded-3xl hover:border-emerald-500 transition-colors group">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><History size={24}/></div>
                    <h4 className="font-black text-slate-800 mb-2">3. Canjear por Días Libres</h4>
                    <p className="text-sm text-slate-500">¿Quiere un día libre usando sus horas extra? Seleccione "Canjear". Deberá elegir de qué registros de horas previos quiere descontar el tiempo.</p>
                </div>
                <div className="p-6 border-2 border-slate-100 rounded-3xl hover:border-purple-500 transition-colors group">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Mail size={24}/></div>
                    <h4 className="font-black text-slate-800 mb-2">4. Abono en Nómina</h4>
                    <p className="text-sm text-slate-500">Si prefiere cobrar las horas acumuladas en su próxima nómina, utilice esta opción para solicitar el pago al departamento financiero.</p>
                </div>
            </div>
        </section>

        {/* --- SECCIÓN 4: EQUIPOS DE PROTECCIÓN (EPI) --- */}
        <section className="p-12 border-b border-slate-100 print:break-after-page">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><HardHat size={24}/></div>
                4. Gestión de EPIs (Ropa y Protección)
            </h2>
            <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1">
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        Desde la pestaña <strong>"EPIs"</strong> del menú lateral, puede solicitar reposición de su equipo de trabajo (camisetas, pantalones, calzado de seguridad, guantes, etc.).
                    </p>
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold">1</div>
                            <p className="text-sm">Seleccione el material que necesita.</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold">2</div>
                            <p className="text-sm">Elija su <strong>talla exacta</strong> de la lista desplegable.</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold">3</div>
                            <p className="text-sm">Vigile el estado: cuando pase a <span className="text-blue-600 font-bold">SOLICITADO</span> significa que ya se ha pedido al proveedor. Cuando esté en <span className="text-green-600 font-bold">ENTREGADO</span> podrá recogerlo en almacén.</p>
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-64 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-widest mb-4">Ejemplo de Tallas</h5>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-white border rounded text-center text-xs font-bold">XL</div>
                        <div className="p-2 bg-white border rounded text-center text-xs font-bold">L</div>
                        <div className="p-2 bg-white border rounded text-center text-xs font-bold">42</div>
                        <div className="p-2 bg-white border rounded text-center text-xs font-bold">44</div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- SECCIÓN 5: GUÍA PARA SUPERVISORES --- */}
        <section className="p-12 bg-slate-50 print:bg-white print:break-after-page">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-700 text-white rounded-lg"><Users size={24}/></div>
                5. Herramientas del Supervisor
            </h2>
            <p className="text-slate-600 mb-8">Esta sección es exclusiva para mandos intermedios y responsables de equipo.</p>
            
            <div className="space-y-12">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle className="text-green-600"/> 5.1 Aprobaciones y Conflictos</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        En la sección <strong>"Aprobaciones"</strong>, usted verá las peticiones de su equipo. El sistema le mostrará un aviso de <strong>ALERTA DE CONFLICTO</strong> en rojo si dos o más personas de su mismo departamento han solicitado las mismas fechas.
                    </p>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><CalendarClock className="text-blue-600"/> 5.2 Planificación de Turnos</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        Desde el menú <strong>{"Mi Equipo > Planificación"}</strong>, podrá asignar turnos horariossus empleados. 
                    </p>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <ul className="space-y-3 text-xs">
                            <li className="flex gap-3"><div className="w-4 h-4 bg-blue-600 rounded"></div> 1. Seleccione el tipo de turno en la leyenda superior.</li>
                            <li className="flex gap-3"><div className="w-4 h-4 bg-slate-900 rounded"></div> 2. Use el "Borrador" si se equivoca de celda.</li>
                            <li className="flex gap-3"><div className="w-4 h-4 bg-green-200 rounded"></div> 3. Las celdas en verde indican que el empleado tiene una ausencia aprobada (Vacaciones), el sistema no le dejará asignar turno esos días para evitar errores.</li>
                        </ul>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><MessageSquare className="text-blue-600"/> 5.3 Notificaciones Masivas</h3>
                    <p className="text-sm text-slate-600">
                        Como supervisor, puede enviar mensajes directos a toda su plantilla que aparecerán como una alerta emergente cuando el empleado inicie sesión. Úselo para avisos urgentes o recordatorios de reuniones.
                    </p>
                </div>
            </div>
        </section>

        {/* --- SECCIÓN 6: REPARTIDORES --- */}
        <section className="p-12 border-b border-slate-100 print:break-after-page">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Truck size={24}/></div>
                6. Sección Especial: Repartidores
            </h2>
            <div className="bg-blue-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Truck size={120} /></div>
                <h3 className="text-xl font-bold mb-4">Control Logístico de Reparto</h3>
                <div className="space-y-4 text-blue-100 text-sm">
                    <p>Los empleados del departamento de Reparto disponen de funciones específicas:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Identificación de Camión:</strong> En su dashboard aparecerá el número de camión asignado (Ej: C-12, Scania 440).</li>
                        <li><strong>Gestión de EPIS simplificada:</strong> Acceso rápido a pedidos de ropa de trabajo desde el panel principal.</li>
                        <li><strong>Informe de Camión:</strong> Los supervisores pueden imprimir informes de qué material falta por entregar desglosado por cada vehículo de la flota.</li>
                    </ul>
                </div>
            </div>
        </section>

        {/* --- CONTRAPORTADA --- */}
        <footer className="p-12 text-center text-slate-400 border-t border-slate-100 bg-white">
            <p className="text-sm font-bold text-slate-500">© 2024 GdA RRHH Software Solution.</p>
            <p className="text-[10px] mt-2 italic uppercase tracking-widest font-black">Este documento es para uso interno exclusivo de los empleados de la organización.</p>
            <div className="mt-8 pt-8 border-t border-slate-50 flex justify-center gap-12">
                <div className="text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-300"><Shield size={24}/></div>
                    <p className="text-[9px] font-bold uppercase">Datos Seguros</p>
                </div>
                <div className="text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-300"><Database size={24}/></div>
                    <p className="text-[9px] font-bold uppercase">Nube Privada</p>
                </div>
                <div className="text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-300"><Share2 size={24}/></div>
                    <p className="text-[9px] font-bold uppercase">Conexión SSL</p>
                </div>
            </div>
        </footer>

      </div>
    </div>
  );
};

export default HelpView;

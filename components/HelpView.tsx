
import React from 'react';
import { 
  Book, User, Briefcase, Shield, CheckCircle, AlertTriangle, 
  Calendar, Clock, Paintbrush, Mail, Settings, Printer, 
  Download, HardHat, FileText, LayoutDashboard, Database, 
  Lock, Share2, Info
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
          Descargar Manual Completo (PDF)
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none">
        
        {/* --- PORTADA DEL MANUAL --- */}
        <header className="p-12 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white text-center border-b-8 border-blue-600 print:min-h-screen print:flex print:flex-col print:justify-center print:break-after-page">
            <div className="w-32 h-32 bg-white rounded-3xl p-4 mx-auto mb-8 shadow-2xl flex items-center justify-center animate-bounce-slow">
               <img src="https://termosycalentadoresgranada.com/wp-content/uploads/2025/08/https___cdn.evbuc_.com_images_677236879_73808960223_1_original.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-5xl font-black mb-4 tracking-tighter">GdA RRHH</h1>
            <p className="text-2xl text-blue-300 font-medium mb-8">Manual Oficial de Usuario y Administración</p>
            <div className="flex justify-center gap-8 text-sm text-slate-400">
                <span className="flex items-center gap-2"><Calendar size={16}/> Versión 2.5 (2024)</span>
                <span className="flex items-center gap-2"><Shield size={16}/> Acceso Seguro</span>
            </div>
        </header>

        {/* --- ÍNDICE --- */}
        <section className="p-12 border-b border-slate-100 print:break-after-page">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 border-b-2 border-slate-100 pb-2">Índice de Contenidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                <div className="flex justify-between items-center group">
                    <span className="text-slate-600 font-medium">1. Introducción al Sistema</span>
                    <span className="border-b border-dotted border-slate-300 flex-1 mx-4"></span>
                    <span className="font-bold text-slate-400">01</span>
                </div>
                <div className="flex justify-between items-center group">
                    <span className="text-slate-600 font-medium">2. Guía para el Empleado</span>
                    <span className="border-b border-dotted border-slate-300 flex-1 mx-4"></span>
                    <span className="font-bold text-slate-400">03</span>
                </div>
                <div className="flex justify-between items-center group">
                    <span className="text-slate-600 font-medium">3. Guía para Supervisores</span>
                    <span className="border-b border-dotted border-slate-300 flex-1 mx-4"></span>
                    <span className="font-bold text-slate-400">06</span>
                </div>
                <div className="flex justify-between items-center group">
                    <span className="text-slate-600 font-medium">4. Administración y Configuración</span>
                    <span className="border-b border-dotted border-slate-300 flex-1 mx-4"></span>
                    <span className="font-bold text-slate-400">09</span>
                </div>
                <div className="flex justify-between items-center group">
                    <span className="text-slate-600 font-medium">5. Especificaciones Técnicas</span>
                    <span className="border-b border-dotted border-slate-300 flex-1 mx-4"></span>
                    <span className="font-bold text-slate-400">12</span>
                </div>
            </div>
        </section>

        {/* --- SECCIÓN 1: INTRODUCCIÓN --- */}
        <section className="p-12 bg-slate-50/50 print:bg-white print:break-after-page">
            <div className="max-w-3xl">
                <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-lg"><Info size={24}/></div>
                    1. Introducción al Sistema
                </h2>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                    GdA RRHH es la solución integral para la gestión de capital humano, diseñada para centralizar ausencias, 
                    planificación de turnos y cumplimiento normativo en materia de equipos de protección individual (EPI).
                </p>
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3"><LayoutDashboard size={24}/></div>
                        <h4 className="font-bold text-sm">Dashboard</h4>
                        <p className="text-[10px] text-slate-400">Control de saldos en tiempo real.</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3"><Calendar size={24}/></div>
                        <h4 className="font-bold text-sm">Calendario</h4>
                        <p className="text-[10px] text-slate-400">Visualización de turnos y equipo.</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3"><HardHat size={24}/></div>
                        <h4 className="font-bold text-sm">EPIs</h4>
                        <p className="text-[10px] text-slate-400">Gestión de entregas y tallas.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- SECCIÓN 2: EMPLEADO --- */}
        <section className="p-12 print:break-after-page">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg"><User size={24}/></div>
                2. Guía para el Empleado
            </h2>
            
            <div className="space-y-12">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">2.1 Gestión de Ausencias</h3>
                    <p className="text-slate-600 mb-4">Como trabajador, puede solicitar diferentes tipos de ausencia desde su panel principal:</p>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-6 print:bg-white">
                        <div className="flex-1">
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0"/>
                                    <span><strong>Vacaciones:</strong> Se descuentan de su saldo anual.</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0"/>
                                    <span><strong>Asuntos Propios:</strong> Días libres por motivos personales.</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0"/>
                                    <span><strong>Baja Médica:</strong> Requiere justificante oficial.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">2.2 Registro de Horas Extra</h3>
                    <p className="text-slate-600 mb-4">Existen tres modalidades para gestionar las horas realizadas fuera de jornada:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="border border-slate-200 p-5 rounded-2xl">
                            <div className="font-bold text-blue-600 mb-2">Registro</div>
                            <p className="text-xs text-slate-500">Añade horas a su saldo para uso posterior.</p>
                        </div>
                        <div className="border border-slate-200 p-5 rounded-2xl">
                            <div className="font-bold text-green-600 mb-2">Canje</div>
                            <p className="text-xs text-slate-500">Convierte horas en días de descanso.</p>
                        </div>
                        <div className="border border-slate-200 p-5 rounded-2xl">
                            <div className="font-bold text-purple-600 mb-2">Cobro</div>
                            <p className="text-xs text-slate-500">Solicita el abono en la nómina mensual.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- SECCIÓN 3: SUPERVISOR --- */}
        <section className="p-12 bg-slate-900 text-white print:bg-white print:text-slate-900 print:border print:border-slate-200 print:break-after-page">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white"><Briefcase size={24}/></div>
                3. Guía para Supervisores
            </h2>
            
            <div className="space-y-12">
                <div>
                    <h3 className="text-xl font-bold text-blue-400 print:text-blue-700 mb-4">3.1 Control de Aprobaciones</h3>
                    <p className="text-slate-300 print:text-slate-600 mb-6 leading-relaxed">
                        Como supervisor, su responsabilidad es asegurar la operatividad del departamento mientras se respetan los derechos de los trabajadores.
                    </p>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl print:bg-slate-50 print:border-slate-200">
                        <h4 className="font-bold mb-4 text-sm uppercase text-slate-400 tracking-widest">Protocolo de Revisión</h4>
                        <ol className="space-y-4">
                            <li className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs shrink-0 text-white">1</div>
                                <div><strong>Comprobar Conflictos:</strong> El sistema avisará si la solicitud coincide con otros miembros.</div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs shrink-0 text-white">2</div>
                                <div><strong>Revisar Saldo:</strong> Verifique que el empleado dispone de días suficientes.</div>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </section>

        {/* --- SECCIÓN 4: ADMINISTRADOR --- */}
        <section className="p-12 print:break-after-page">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg"><Shield size={24}/></div>
                4. Administración del Sistema
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings size={18} className="text-slate-400"/> Parámetros Globales</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li>• <strong>Tipos de Ausencia:</strong> Configure reglas de saldo.</li>
                        <li>• <strong>Festivos:</strong> Añada el calendario laboral anual.</li>
                        <li>• <strong>Departamentos:</strong> Asigne supervisores responsables.</li>
                    </ul>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 print:bg-white">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Mail size={18} className="text-blue-600"/> Comunicaciones</h4>
                    <div className="bg-slate-900 p-4 rounded-xl font-mono text-[10px] text-blue-400">
                        Hola <span className="text-white">{"{empleado}"}</span>,<br/>
                        Tu solicitud ha sido <span className="text-green-400 font-bold">APROBADA</span>.
                    </div>
                </div>
            </div>
        </section>

        {/* --- SECCIÓN 5: ESPECIFICACIONES TÉCNICAS --- */}
        <section className="p-12 bg-slate-50 print:bg-white print:break-after-page">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-white rounded-lg"><Database size={24}/></div>
                5. Especificaciones Técnicas
            </h2>

            <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Lock size={18} className="text-blue-600"/> Seguridad y Datos</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Encriptado SSL</div>
                        <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Backup diario</div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- CONTRAPORTADA --- */}
        <footer className="p-12 text-center text-slate-400 border-t border-slate-100 bg-white">
            <p className="text-sm">© 2024 GdA RRHH Software Solution.</p>
            <p className="text-[10px] mt-2 italic">Este documento es confidencial y para uso exclusivo de empleados.</p>
        </footer>

      </div>
    </div>
  );
};

export default HelpView;

import { User, Role, Department, LeaveRequest, RequestStatus, AppConfig, Notification, LeaveTypeConfig, EmailTemplate, ShiftType, ShiftAssignment, Holiday, PPEType, PPERequest, RequestType, OvertimeUsage, DateRange, NewsPost, Truck, Driver, DriverPPE } from '../types';
import { supabase } from './supabase';

class Store {
  users: User[] = [];
  departments: Department[] = [];
  requests: LeaveRequest[] = [];
  notifications: Notification[] = [];
  config: AppConfig = {
    leaveTypes: [],
    emailTemplates: [],
    shifts: [],
    shiftTypes: [],
    shiftAssignments: [],
    holidays: [],
    ppeTypes: [],
    ppeRequests: [],
    news: [],
    smtpSettings: { host: 'smtp.gmail.com', port: 587, user: 'admin@empresa.com', password: '', enabled: false },
    trucks: [],
    drivers: [],
    driversPpe: []
  };

  currentUser: User | null = null;
  initialized = false;
  private listeners: (() => void)[] = [];

  subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  getTypeLabel(typeId: string): string {
      if (!typeId) return 'Tipo desconocido';
      const map: Record<string, string> = {
          [RequestType.VACATION]: 'Vacaciones',
          [RequestType.SICKNESS]: 'Baja Médica',
          [RequestType.PERSONAL]: 'Asuntos Propios',
          [RequestType.OVERTIME_EARN]: 'Registro Horas Extra',
          [RequestType.OVERTIME_SPEND_DAYS]: 'Canje por Días Libres',
          [RequestType.OVERTIME_PAY]: 'Abono en Nómina',
          [RequestType.WORKED_HOLIDAY]: 'Festivo Trabajado',
          [RequestType.UNJUSTIFIED]: 'Ausencia Justificada',
          [RequestType.ADJUSTMENT_DAYS]: 'Regularización Días (Admin)',
          [RequestType.ADJUSTMENT_OVERTIME]: 'Regularización Horas (Admin)',
      };
      const dynamic = this.config.leaveTypes.find(t => t.id === typeId);
      if (dynamic) return dynamic.label;
      return map[typeId] || typeId;
  }

  async refresh() {
    try {
        const [
            usersRes, deptsRes, reqsRes, leaveTypesRes, ppeTypesRes, 
            ppeReqsRes, newsRes, holidaysRes, shiftTypesRes, shiftAssignmentsRes,
            trucksRes, driversRes, driversPpeRes, settingsRes
        ] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('departments').select('*'),
            supabase.from('requests').select('*'),
            supabase.from('leave_types').select('*'),
            supabase.from('ppe_types').select('*'),
            supabase.from('ppe_requests').select('*'),
            supabase.from('news').select('*').order('created_at', { ascending: false }),
            supabase.from('holidays').select('*'),
            supabase.from('shift_types').select('*'),
            supabase.from('shift_assignments').select('*'),
            supabase.from('trucks').select('*'),
            supabase.from('drivers').select('*'),
            supabase.from('drivers_ppe').select('*'),
            supabase.from('settings').select('*')
        ]);

        if (usersRes.data) this.users = this.mapUsersFromDB(usersRes.data);
        if (deptsRes.data) this.departments = deptsRes.data.map((d: any) => ({ 
            id: String(d.id), name: String(d.name || ''), supervisorIds: (d.supervisor_ids || []).map((id: any) => String(id))
        }));
        if (reqsRes.data) this.requests = this.mapRequestsFromDB(reqsRes.data);
        if (newsRes.data) this.config.news = newsRes.data;
        if (leaveTypesRes.data) this.config.leaveTypes = leaveTypesRes.data.map((t: any) => ({ 
            id: String(t.id), label: t.label, subtractsDays: !!t.subtracts_days, fixedRanges: t.fixed_range || [] 
        }));
        if (ppeTypesRes.data) this.config.ppeTypes = ppeTypesRes.data.map((p: any) => ({ 
            id: String(p.id), name: p.name, sizes: p.sizes || [], stock: p.stock || {} 
        }));
        if (ppeReqsRes.data) this.config.ppeRequests = ppeReqsRes.data.map((p: any) => ({ id: String(p.id), userId: String(p.user_id), type_id: String(p.type_id), typeId: String(p.type_id), size: p.size, status: p.status, createdAt: p.created_at, deliveryDate: p.delivery_date }));
        if (holidaysRes.data) this.config.holidays = holidaysRes.data.map((h: any) => ({ id: String(h.id), date: h.date, name: h.name }));
        if (shiftTypesRes.data) this.config.shiftTypes = shiftTypesRes.data.map((s: any) => ({ ...s, id: String(s.id) }));
        
        // CORRECCIÓN CRÍTICA: Normalizar datos de turnos al cargar para que coincidan con los formatos de la UI (YYYY-MM-DD y Strings)
        if (shiftAssignmentsRes.data) this.config.shiftAssignments = shiftAssignmentsRes.data.map((a: any) => ({ 
            id: String(a.id), 
            userId: String(a.user_id), 
            date: a.date ? a.date.split('T')[0] : a.date, 
            shiftTypeId: String(a.shift_type_id || '') 
        }));

        if (trucksRes.data) this.config.trucks = trucksRes.data.map((t: any) => ({ id: String(t.id), name: t.name }));
        if (driversRes.data) this.config.drivers = driversRes.data.map((d: any) => ({ id: String(d.id), name: d.name, truckId: String(d.truck_id) }));
        if (driversPpeRes.data) this.config.driversPpe = driversPpeRes.data.map((p: any) => ({ 
            id: String(p.id), driverId: String(p.driver_id), typeId: String(p.type_id), size: p.size, status: p.status, createdAt: p.created_at, requestedDate: p.requested_date, deliveryDate: p.delivery_date 
        }));

        if (settingsRes.data) {
            const smtpRow = settingsRes.data.find(r => r.key === 'smtp');
            const templatesRow = settingsRes.data.find(r => r.key === 'email_templates');

            if (smtpRow && smtpRow.value) {
                this.config.smtpSettings = {
                    host: smtpRow.value.host || 'smtp.gmail.com',
                    port: smtpRow.value.port || 587,
                    user: smtpRow.value.user || '',
                    password: smtpRow.value.password || '',
                    enabled: !!smtpRow.value.enabled
                };
            }

            if (templatesRow && Array.isArray(templatesRow.value)) {
                this.config.emailTemplates = templatesRow.value.map((t: any) => ({
                    id: String(t.id),
                    label: t.label,
                    subject: t.subject,
                    body: t.body,
                    recipients: t.recipients || { admin: true, worker: true, supervisor: false }
                }));
            }
        }

        if (this.currentUser) {
            const updatedSelf = this.users.find(u => u.id === this.currentUser!.id);
            if (updatedSelf) this.currentUser = updatedSelf;

            const { data: notifsData } = await supabase.from('notifications').select('*').eq('user_id', this.currentUser.id).order('date', { ascending: false });
            if (notifsData) this.notifications = notifsData.map((n: any) => ({ id: String(n.id), userId: String(n.user_id), message: n.message, read: n.read, date: n.date, type: n.type }));
        }

        this.notify();
    } catch (error) {
        console.error("Store Refresh Error:", error);
    }
  }

  async init() {
    if (this.initialized) return;
    const savedUser = localStorage.getItem('gda_session');
    if (savedUser) this.currentUser = JSON.parse(savedUser);
    await this.refresh();
    this.initialized = true;
  }

  private mapUsersFromDB(data: any[]): User[] {
      return data.map(u => ({
          id: String(u.id), name: u.name, email: u.email, role: u.role, department_id: String(u.department_id), departmentId: String(u.department_id),
          daysAvailable: Number(u.days_available || 0), overtimeHours: Number(u.overtime_hours || 0),
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`, 
          birthdate: u.birthdate, truckNumber: u.truck_number
      }));
  }

  private mapRequestsFromDB(data: any[]): LeaveRequest[] {
      return data.map(r => ({
          id: String(r.id), userId: String(r.user_id), type_id: String(r.type_id), typeId: String(r.type_id), label: r.label, 
          startDate: r.start_date, endDate: r.end_date, hours: r.hours, reason: r.reason, 
          status: r.status, createdAt: r.created_at, adminComment: r.admin_comment,
          resolvedBy: r.resolved_by ? String(r.resolved_by) : undefined,
          isConsumed: !!r.is_consumed, consumedHours: Number(r.consumed_hours || 0), overtimeUsage: r.overtime_usage || []
      }));
  }

  isOvertimeRequest(typeId: string): boolean {
      return [RequestType.OVERTIME_EARN, RequestType.OVERTIME_SPEND_DAYS, RequestType.OVERTIME_PAY, RequestType.WORKED_HOLIDAY, RequestType.ADJUSTMENT_OVERTIME].includes(typeId as RequestType);
  }

  private async sendEmailNotification(templateLabel: string, req: LeaveRequest) {
    if (!this.config.smtpSettings.enabled) return;

    const worker = this.users.find(u => u.id === req.userId);
    if (!worker) return;

    const template = this.config.emailTemplates.find(t => 
        t.label === templateLabel || t.label.toLowerCase().includes(templateLabel.toLowerCase())
    );
    
    if (!template) {
        console.warn(`No se encontró plantilla de email con etiqueta: "${templateLabel}"`);
        return;
    }

    const typeLabel = this.getTypeLabel(req.typeId);
    const dates = `${new Date(req.startDate).toLocaleDateString()}${req.endDate ? ' al ' + new Date(req.endDate).toLocaleDateString() : ''}`;
    
    // Buscar nombre del supervisor/admin que resolvió
    const supervisor = req.resolvedBy ? (this.users.find(u => u.id === req.resolvedBy)?.name || 'Administración') : 'Administración';

    const replaceVars = (text: string) => {
        if (!text) return '';
        return text
            .replace(/{empleado}/g, worker.name || '')
            .replace(/{tipo}/g, typeLabel || '')
            .replace(/{fechas}/g, dates || '')
            .replace(/{motivo}/g, req.reason || 'No especificado')
            .replace(/{comentario}/g, req.adminComment || '')
            .replace(/{comentario_admin}/g, req.adminComment || 'Sin observaciones')
            .replace(/{supervisor}/g, supervisor)
            .replace(/{horas}/g, String(Math.abs(req.hours || 0)))
            .replace(/{saldo_horas}/g, worker.overtimeHours.toFixed(1));
    };

    const subject = replaceVars(template.subject);
    const body = replaceVars(template.body);
    const html = body.replace(/\n/g, '<br>');

    const recipients: string[] = [];
    if (template.recipients.worker && worker.email) recipients.push(worker.email);
    
    if (template.recipients.supervisor || template.recipients.admin) {
        const dept = this.departments.find(d => d.id === worker.departmentId);
        if (template.recipients.supervisor && dept) {
            dept.supervisorIds.forEach(sid => {
                const sup = this.users.find(u => u.id === sid);
                if (sup?.email) recipients.push(sup.email);
            });
        }
        if (template.recipients.admin) {
            this.users.filter(u => u.role === Role.ADMIN).forEach(adm => {
                if (adm.email) recipients.push(adm.email);
            });
        }
    }

    const uniqueRecipients = Array.from(new Set(recipients)).join(', ');
    if (!uniqueRecipients) return;

    try {
        const { data, error } = await supabase.functions.invoke('send-test-email', {
            body: {
                to: uniqueRecipients,
                config: this.config.smtpSettings,
                subject,
                message: body,
                html
            }
        });
        if (error || !data?.success) {
            console.error("Error en Edge Function de Email:", error || data?.error);
        }
    } catch (error) {
        console.error("Error fatal enviando notificación por email:", error);
    }
  }

  async applyRequestToBalanceDB(req: LeaveRequest, undo: boolean = false) {
    const user = this.users.find(u => u.id === req.userId);
    if (!user) return;

    const multiplier = undo ? -1 : 1;
    let daysDelta = 0;
    let hoursDelta = 0;

    if (req.typeId === RequestType.WORKED_HOLIDAY) {
        daysDelta = 1;
        hoursDelta = 4;
    } 
    else if (this.isOvertimeRequest(req.typeId)) {
        hoursDelta = req.hours || 0;
        if ([RequestType.OVERTIME_SPEND_DAYS, RequestType.OVERTIME_PAY].includes(req.typeId as RequestType)) {
            hoursDelta = -Math.abs(hoursDelta);
        }
    } 
    else {
        const typeConfig = this.config.leaveTypes.find(t => t.id === req.typeId);
        if (req.typeId === RequestType.ADJUSTMENT_DAYS) {
            daysDelta = req.hours || 0;
        } else if (typeConfig?.subtractsDays || req.typeId === RequestType.VACATION || req.typeId === RequestType.PERSONAL) {
            const start = new Date(req.startDate);
            const end = new Date(req.endDate || req.startDate);
            daysDelta = -(Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }
    }

    // 1. Actualizar saldo del usuario
    if (daysDelta !== 0 || hoursDelta !== 0) {
        const newDays = user.daysAvailable + (daysDelta * multiplier);
        const newHours = user.overtimeHours + (hoursDelta * multiplier);
        await supabase.from('users').update({ 
            days_available: newDays, 
            overtime_hours: newHours 
        }).eq('id', user.id);
        
        user.daysAvailable = newDays;
        user.overtimeHours = newHours;
    }

    // 2. Trazabilidad de registros consumidos (Crucial para que no vuelvan a aparecer como disponibles)
    if (req.overtimeUsage && req.overtimeUsage.length > 0) {
        for (const usage of req.overtimeUsage) {
            const sourceReq = this.requests.find(r => r.id === usage.requestId);
            if (sourceReq) {
                // Sumamos (o restamos si es deshacer) las horas consumidas al registro original
                const newConsumed = (sourceReq.consumedHours || 0) + (usage.hoursUsed * multiplier);
                await supabase.from('requests')
                    .update({ consumed_hours: newConsumed })
                    .eq('id', usage.requestId);
                
                // Actualizamos el estado local inmediatamente
                sourceReq.consumedHours = newConsumed;
            }
        }
    }
  }

  async repairOvertimeIntegrity() {
      // 1. Buscamos todas las solicitudes de consumo APROBADAS que tienen uso de horas registrado
      const approvedConsumption = this.requests.filter(r => 
          r.status === RequestStatus.APPROVED && 
          (r.typeId === RequestType.OVERTIME_SPEND_DAYS || r.typeId === RequestType.OVERTIME_PAY) &&
          r.overtimeUsage && r.overtimeUsage.length > 0
      );

      // 2. Mapa para acumular cuántas horas se han consumido de cada ID de origen
      const consumptionMap: Record<string, number> = {};

      approvedConsumption.forEach(req => {
          req.overtimeUsage?.forEach(usage => {
              consumptionMap[usage.requestId] = (consumptionMap[usage.requestId] || 0) + usage.hoursUsed;
          });
      });

      // 3. Actualizamos en la base de datos cada registro de origen con su nuevo valor de consumed_hours
      for (const [requestId, totalConsumed] of Object.entries(consumptionMap)) {
          // Solo actualizamos si el ID existe en nuestra lista de peticiones locales
          const exists = this.requests.some(r => r.id === requestId);
          if (exists) {
              await supabase.from('requests')
                  .update({ consumed_hours: totalConsumed })
                  .eq('id', requestId);
          }
      }

      await this.refresh();
      alert('Trazabilidad de horas sincronizada correctamente. Los registros consumidos ya no aparecerán disponibles.');
  }

  async createRequest(data: any, userId: string, status: RequestStatus) {
      const id = crypto.randomUUID();
      const label = data.label || this.getTypeLabel(data.typeId);
      const isOvertime = this.isOvertimeRequest(data.typeId);
      const finalHours = data.typeId === RequestType.WORKED_HOLIDAY ? 4 : data.hours;

      const finalResolvedBy = status === RequestStatus.APPROVED ? this.currentUser?.id : null;

      const { data: newReqData } = await supabase.from('requests').insert({
          id, user_id: userId, type_id: data.typeId, label, start_date: data.startDate, end_date: data.endDate,
          hours: finalHours, reason: data.reason, status: status, created_at: new Date().toISOString(),
          overtime_usage: data.overtimeUsage || [],
          resolved_by: finalResolvedBy
      }).select().single();

      if (newReqData) {
          const req = {
              id: String(newReqData.id), userId: String(newReqData.user_id), typeId: String(newReqData.type_id),
              startDate: newReqData.start_date, endDate: newReqData.end_date, hours: newReqData.hours,
              status: newReqData.status, reason: newReqData.reason, createdAt: newReqData.created_at,
              resolvedBy: newReqData.resolved_by ? String(newReqData.resolved_by) : undefined, 
              overtimeUsage: newReqData.overtime_usage || []
          } as LeaveRequest;

          if (!isOvertime || status === RequestStatus.APPROVED) {
              await this.applyRequestToBalanceDB(req);
          }

          let templateName = '';
          if (isOvertime) {
              if (req.typeId === RequestType.OVERTIME_SPEND_DAYS) {
                  templateName = 'Horas: Canje por Días';
              } else {
                  templateName = 'Horas: Nuevo Registro';
              }
          } else {
              templateName = 'Ausencia: Nueva Solicitud';
          }

          this.sendEmailNotification(templateName, req);

          if (req.typeId === RequestType.SICKNESS) {
              this.sendEmailNotification('Ausencia: Baja Médica (Aviso)', req);
          }
      }
      await this.refresh();
  }

  async updateRequest(id: string, data: any) {
    const oldReq = this.requests.find(r => r.id === id);
    if (!oldReq) return;

    const isOvertime = this.isOvertimeRequest(oldReq.typeId);
    
    if (oldReq.status === RequestStatus.APPROVED || (!isOvertime && oldReq.status === RequestStatus.PENDING)) {
        await this.applyRequestToBalanceDB(oldReq, true);
    }

    const label = data.label || this.getTypeLabel(data.typeId);
    const { data: updatedReqData } = await supabase.from('requests').update({
        type_id: data.typeId,
        label,
        start_date: data.startDate,
        end_date: data.endDate,
        hours: data.hours,
        reason: data.reason,
        overtime_usage: data.overtimeUsage || []
    }).eq('id', id).select().single();

    if (updatedReqData) {
        const req = {
            id: String(updatedReqData.id), userId: String(updatedReqData.user_id), typeId: String(updatedReqData.type_id),
            startDate: updatedReqData.start_date, endDate: updatedReqData.end_date, hours: updatedReqData.hours,
            status: updatedReqData.status, overtimeUsage: updatedReqData.overtime_usage || []
        } as LeaveRequest;
        
        const isNewOvertime = this.isOvertimeRequest(req.typeId);
        if (req.status === RequestStatus.APPROVED || (!isNewOvertime && req.status === RequestStatus.PENDING)) {
            await this.applyRequestToBalanceDB(req);
        }
    }
    await this.refresh();
  }

  async updateRequestStatus(id: string, status: RequestStatus, adminId: string, comment?: string) {
      const oldReq = this.requests.find(r => r.id === id);
      if (!oldReq) return;

      const isOvertime = this.isOvertimeRequest(oldReq.typeId);
      const finalAdminId = adminId || this.currentUser?.id;

      if (!finalAdminId) {
          console.error("Error: No se pudo identificar al administrador que resuelve la solicitud.");
          return;
      }

      if (oldReq.status === RequestStatus.PENDING && status === RequestStatus.APPROVED) {
          if (isOvertime) {
              await this.applyRequestToBalanceDB(oldReq, false);
          }
      }
      else if (status === RequestStatus.REJECTED) {
          if (oldReq.status === RequestStatus.APPROVED) {
              await this.applyRequestToBalanceDB(oldReq, true);
          } else if (oldReq.status === RequestStatus.PENDING && !isOvertime) {
              await this.applyRequestToBalanceDB(oldReq, true);
          }
      }
      else if (oldReq.status === RequestStatus.REJECTED && status === RequestStatus.APPROVED) {
          await this.applyRequestToBalanceDB(oldReq, false);
      }

      const { error } = await supabase.from('requests').update({ 
          status, 
          admin_comment: comment || '', 
          resolved_by: finalAdminId 
      }).eq('id', id);

      if (error) {
          console.error("Error actualizando estado en Supabase:", error);
      }

      await this.refresh();
      
      const refreshedReq = this.requests.find(r => r.id === id);
      if (refreshedReq) {
          let templateName = '';
          if (status === RequestStatus.APPROVED) {
              templateName = isOvertime ? 'Horas: Aprobadas' : 'Ausencia: Aprobada';
          } else if (status === RequestStatus.REJECTED) {
              templateName = 'Ausencia: Rechazada';
          }

          if (templateName) {
              this.sendEmailNotification(templateName, refreshedReq);
          }
      }
  }

  async deleteRequest(id: string) {
      const req = this.requests.find(r => r.id === id);
      if (req) {
          const isOvertime = this.isOvertimeRequest(req.typeId);
          if (req.status === RequestStatus.APPROVED || (!isOvertime && req.status === RequestStatus.PENDING)) {
              await this.applyRequestToBalanceDB(req, true);
          }
      }
      await supabase.from('requests').delete().eq('id', id);
      await this.refresh();
  }

  async login(email: string, pass: string): Promise<User | null> {
    const { data: userData } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (userData) {
      this.currentUser = this.mapUsersFromDB([userData])[0];
      localStorage.setItem('gda_session', JSON.stringify(this.currentUser));
      await this.refresh();
      return this.currentUser;
    }
    return null;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('gda_session');
    this.notify();
  }

  getMyRequests() {
    if (!this.currentUser) return [];
    return this.requests.filter(r => r.userId === this.currentUser!.id).sort((a,b) => b.startDate.localeCompare(a.startDate));
  }

  getPendingApprovalsForUser(userId: string) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return [];
    if (user.role === Role.ADMIN) return this.requests.filter(r => r.status === RequestStatus.PENDING);
    if (user.role === Role.SUPERVISOR) {
        const myDeptIds = this.departments.filter(d => (d.supervisorIds || []).includes(userId)).map(d => d.id);
        return this.requests.filter(r => {
            if (r.status !== RequestStatus.PENDING) return false;
            const reqUser = this.users.find(u => u.id === r.userId);
            return reqUser && myDeptIds.includes(reqUser.departmentId);
        });
    }
    return [];
  }

  getNotificationsForUser(userId: string) {
    return this.notifications.filter(n => n.userId === userId);
  }

  async markNotificationAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    await this.refresh();
  }

  async markAllNotificationsAsRead(userId: string) {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
    await this.refresh();
  }

  async deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id);
    await this.refresh();
  }

  getNextShift(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const assignments = this.config.shiftAssignments
        .filter(a => a.userId === userId && a.date >= today)
        .sort((a,b) => a.date.localeCompare(b.date));
    if (assignments.length > 0) {
        const a = assignments[0];
        const shift = this.config.shiftTypes.find(s => s.id === a.shiftTypeId);
        return { date: a.date, shift };
    }
    return null;
  }

  getShiftForUserDate(userId: string, date: string) {
    const a = this.config.shiftAssignments.find(a => String(a.userId) === String(userId) && a.date === date);
    return a ? this.config.shiftTypes.find(s => s.id === a.shiftTypeId) : undefined;
  }

  getRequestConflicts(req: LeaveRequest) {
    if (!req.typeId || this.isOvertimeRequest(req.typeId)) return [];
    const u = this.users.find(usr => usr.id === req.userId);
    if (!u) return [];
    return this.requests.filter(other => {
        if (other.id === req.id || other.status === RequestStatus.REJECTED) return false;
        if (this.isOvertimeRequest(other.typeId)) return false;
        const otherUser = this.users.find(usr => usr.id === other.userId);
        if (!otherUser || otherUser.departmentId !== u.departmentId) return false;
        const start = req.startDate.split('T')[0];
        const end = (req.endDate || req.startDate).split('T')[0];
        const oStart = other.startDate.split('T')[0];
        const oEnd = (other.endDate || other.startDate).split('T')[0];
        return (start <= oEnd && end >= oStart);
    });
  }

  getAvailableOvertimeRecords(userId: string) {
    return this.requests.filter(r => r.userId === userId && r.typeId === RequestType.OVERTIME_EARN && r.status === RequestStatus.APPROVED && (r.hours || 0) > (r.consumedHours || 0));
  }

  async createUser(data: any, pass: string) {
    const { error } = await supabase.from('users').insert({
        id: crypto.randomUUID(), 
        name: data.name, 
        email: data.email, 
        role: data.role || Role.WORKER,
        department_id: data.departmentId || data.department_id, 
        days_available: Number(data.daysAvailable || 0),
        overtime_hours: Number(data.overtime_hours || 0), 
        birthdate: data.birthdate || null, 
        avatar: data.avatar, 
        truck_number: data.truckNumber,
        password: pass
    });
    if (error) throw error;
    await this.refresh();
  }

  async updateUserAdmin(id: string, data: any) {
    const updateData: any = {
        name: data.name, 
        email: data.email, 
        role: data.role, 
        department_id: data.departmentId || data.department_id,
        days_available: Number(data.daysAvailable || 0),
        overtime_hours: Number(data.overtimeHours || 0),
        birthdate: data.birthdate || null, 
        avatar: data.avatar, 
        truck_number: data.truckNumber
    };
    if (data.password && data.password.trim() !== '') updateData.password = data.password;
    
    const { error } = await supabase.from('users').update(updateData).eq('id', id);
    if (error) {
        console.error("Supabase User Update Error:", error);
        throw error;
    }
    await this.refresh();
  }

  async updateUserRole(id: string, role: Role) {
    await supabase.from('users').update({ role }).eq('id', id);
    await this.refresh();
  }

  async updateUserProfile(id: string, data: any) {
    const updateData: any = { name: data.name, email: data.email, avatar: data.avatar };
    if (data.password && data.password.trim() !== '') updateData.password = data.password;
    const { error } = await supabase.from('users').update(updateData).eq('id', id);
    if (error) throw error;
    await this.refresh();
  }

  async deleteUser(id: string) {
    await supabase.from('users').delete().eq('id', id);
    await this.refresh();
  }

  async createDepartment(name: string, supervisorIds: string[]) {
    await supabase.from('departments').insert({ id: crypto.randomUUID(), name, supervisor_ids: supervisorIds });
    await this.refresh();
  }

  async updateDepartment(id: string, name: string, supervisorIds: string[]) {
    await supabase.from('departments').update({ name, supervisor_ids: supervisorIds }).eq('id', id);
    await this.refresh();
  }

  async deleteDepartment(id: string) {
    await supabase.from('departments').delete().eq('id', id);
    await this.refresh();
  }

  async createLeaveType(label: string, subtractsDays: boolean, fixedRanges: any) {
    await supabase.from('leave_types').insert({ id: crypto.randomUUID(), label, subtracts_days: subtractsDays, fixed_range: fixedRanges });
    await this.refresh();
  }

  async updateLeaveType(id: string, label: string, subtractsDays: boolean, fixedRanges: any) {
    await supabase.from('leave_types').update({ label, subtracts_days: subtractsDays, fixed_range: fixedRanges }).eq('id', id);
    await this.refresh();
  }

  async deleteLeaveType(id: string) {
    await supabase.from('leave_types').delete().eq('id', id);
    await this.refresh();
  }

  async createShiftType(name: string, color: string, start: string, end: string) {
    await supabase.from('shift_types').insert({ id: crypto.randomUUID(), name, color, segments: [{ start, end }] });
    await this.refresh();
  }

  async updateShiftType(id: string, name: string, color: string, start: string, end: string) {
    await supabase.from('shift_types').update({ name, color, segments: [{ start, end }] }).eq('id', id);
    await this.refresh();
  }

  async deleteShiftType(id: string) {
    await supabase.from('shift_types').delete().eq('id', id);
    await this.refresh();
  }

  async assignShift(userId: string, date: string, shiftTypeId: string) {
    // NORMALIZAR FECHA Y USERID PARA COMPARACIÓN ROBUSTA
    const normalizedDate = date.split('T')[0];
    const targetUserId = String(userId);
    
    const existingIdx = this.config.shiftAssignments.findIndex(a => String(a.userId) === targetUserId && a.date === normalizedDate);
    const originalValue = existingIdx > -1 ? { ...this.config.shiftAssignments[existingIdx] } : null;

    if (!shiftTypeId) {
        if (existingIdx > -1) this.config.shiftAssignments.splice(existingIdx, 1);
    } else {
        if (existingIdx > -1) {
            this.config.shiftAssignments[existingIdx].shiftTypeId = String(shiftTypeId);
        } else {
            this.config.shiftAssignments.push({
                id: 'temp-' + Date.now(),
                userId: targetUserId,
                date: normalizedDate,
                shiftTypeId: String(shiftTypeId)
            });
        }
    }
    
    this.notify();

    try {
        if (!shiftTypeId) {
            await supabase.from('shift_assignments').delete().match({ user_id: targetUserId, date: normalizedDate });
        } else {
            await supabase.from('shift_assignments').delete().match({ user_id: targetUserId, date: normalizedDate });
            await supabase.from('shift_assignments').insert({ 
                id: crypto.randomUUID(), 
                user_id: targetUserId, 
                date: normalizedDate, 
                shift_type_id: String(shiftTypeId) 
            });
        }
    } catch (error) {
        console.error("Error al persistir turno:", error);
        if (originalValue) {
            const idx = this.config.shiftAssignments.findIndex(a => String(a.userId) === targetUserId && a.date === normalizedDate);
            if (idx > -1) this.config.shiftAssignments[idx] = originalValue;
            else this.config.shiftAssignments.push(originalValue);
        } else {
            const idx = this.config.shiftAssignments.findIndex(a => String(a.userId) === targetUserId && a.date === normalizedDate);
            if (idx > -1) this.config.shiftAssignments.splice(idx, 1);
        }
        this.notify();
        throw error;
    }
  }

  async createHoliday(date: string, name: string) {
    await supabase.from('holidays').insert({ id: crypto.randomUUID(), date, name });
    await this.refresh();
  }

  async updateHoliday(id: string, date: string, name: string) {
    await supabase.from('holidays').update({ date, name }).eq('id', id);
    await this.refresh();
  }

  async deleteHoliday(id: string) {
    await supabase.from('holidays').delete().eq('id', id);
    await this.refresh();
  }

  async createPPEType(name: string, sizes: string[]) {
    await supabase.from('ppe_types').insert({ id: crypto.randomUUID(), name, sizes, stock: {} });
    await this.refresh();
  }

  async updatePPEType(id: string, name: string, sizes: string[]) {
    await supabase.from('ppe_types').update({ name, sizes }).eq('id', id);
    await this.refresh();
  }
  
  async updatePPEStock(id: string, stock: Record<string, number>) {
    const idx = this.config.ppeTypes.findIndex(t => t.id === id);
    if (idx !== -1) {
        this.config.ppeTypes[idx].stock = stock;
        this.notify();
    }
    await supabase.from('ppe_types').update({ stock }).eq('id', id);
    this.refresh();
  }

  async deletePPEType(id: string) {
    await supabase.from('ppe_requests').delete().eq('type_id', id);
    await supabase.from('ppe_types').delete().eq('id', id);
    await this.refresh();
  }

  async createPPERequest(userId: string, typeId: string, size: string) {
    await supabase.from('ppe_requests').insert({ id: crypto.randomUUID(), user_id: userId, type_id: typeId, size, status: 'PENDIENTE', created_at: new Date().toISOString() });
    await this.refresh();
  }

  async markPPEAsRequested(id: string) {
    await supabase.from('notifications').insert({
        id: crypto.randomUUID(),
        user_id: String(this.currentUser?.id),
        message: `Se ha marcado el EPI ${id} como solicitado.`,
        read: false,
        date: new Date().toISOString()
    });
    await supabase.from('ppe_requests').update({ status: 'SOLICITADO' }).eq('id', id);
    await this.refresh();
  }

  async deliverPPERequest(id: string, quantity: number = 1) {
    const req = this.config.ppeRequests.find(p => p.id === id);
    if (req) {
        const type = this.config.ppeTypes.find(t => t.id === req.typeId);
        if (type && type.stock && type.stock[req.size] !== undefined) {
            const newStock = { ...type.stock };
            newStock[req.size] = Math.max(0, (newStock[req.size] || 0) - quantity);
            type.stock = newStock;
            this.notify();
            await supabase.from('ppe_types').update({ stock: newStock }).eq('id', type.id);
        }
    }
    await supabase.from('ppe_requests').update({ status: 'ENTREGADO', delivery_date: new Date().toISOString() }).eq('id', id);
    await this.refresh();
  }

  async deletePPERequest(id: string) {
    await supabase.from('ppe_requests').delete().eq('id', id);
    await this.refresh();
  }

  async createNewsPost(title: string, content: string, authorId: string) {
    await supabase.from('news').insert({ id: crypto.randomUUID(), title, content, author_id: authorId, created_at: new Date().toISOString() });
    await this.refresh();
  }

  async deleteNewsPost(id: string) {
    await supabase.from('news').delete().eq('id', id);
    await this.refresh();
  }

  async sendMassNotification(userIds: string[], message: string) {
    const notifs = userIds.map(uid => ({ id: crypto.randomUUID(), user_id: uid, message, read: false, date: new Date().toISOString(), type: 'admin' }));
    await supabase.from('notifications').insert(notifs);
    await this.refresh();
  }

  async saveSmtpSettings(settings: any) {
    await supabase.from('settings').update({ value: settings }).eq('key', 'smtp');
    await this.refresh();
  }

  async saveEmailTemplates(templates: EmailTemplate[]) {
    await supabase.from('settings').update({ value: templates }).eq('key', 'email_templates');
    await this.refresh();
  }

  async createTruck(name: string) {
    await supabase.from('trucks').insert({ id: crypto.randomUUID(), name });
    await this.refresh();
  }

  async deleteTruck(id: string) {
    await supabase.from('trucks').delete().eq('id', id);
    await this.refresh();
  }

  async createDriver(name: string, truckId: string) {
    await supabase.from('drivers').insert({ id: crypto.randomUUID(), name, truck_id: truckId });
    await this.refresh();
  }

  async deleteDriver(id: string) {
    await supabase.from('drivers').delete().eq('id', id);
    await this.refresh();
  }

  async createDriverPPE(driverId: string, typeId: string, size: string) {
    await supabase.from('drivers_ppe').insert({ id: crypto.randomUUID(), driver_id: driverId, type_id: typeId, size, status: 'PENDIENTE', created_at: new Date().toISOString() });
    await this.refresh();
  }

  async updateDriverPPEStatus(id: string, status: 'PENDIENTE' | 'SOLICITADO' | 'ENTREGADO', quantity: number = 1) {
    const data: any = { status };
    if (status === 'SOLICITADO') data.requested_date = new Date().toISOString();
    if (status === 'ENTREGADO') {
        data.delivery_date = new Date().toISOString();
        const req = this.config.driversPpe.find(p => p.id === id);
        if (req) {
            const type = this.config.ppeTypes.find(t => t.id === req.typeId);
            if (type && type.stock && type.stock[req.size] !== undefined) {
                const newStock = { ...type.stock };
                newStock[req.size] = Math.max(0, (newStock[req.size] || 0) - quantity);
                type.stock = newStock;
                this.notify();
                await supabase.from('ppe_types').update({ stock: newStock }).eq('id', type.id);
            }
        }
    }
    await supabase.from('drivers_ppe').update(data).eq('id', id);
    await this.refresh();
  }

  async deleteDriverPPE(id: string) {
    await supabase.from('drivers_ppe').delete().eq('id', id);
    await this.refresh();
  }
}

export const store = new Store();
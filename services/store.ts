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
          [RequestType.OVERTIME_TO_DAYS]: 'Pasar horas a días',
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
        // ESTRATEGIA SENIOR: Carga independiente para evitar que el fallo de una tabla (ej. RLS o tabla inexistente) bloquee el resto de la App
        const fetchTable = async (table: string, query: any = null) => {
            try {
                const q = query || supabase.from(table).select('*');
                const { data, error } = await q;
                if (error) { console.warn(`Error cargando tabla ${table}:`, error); return null; }
                return data;
            } catch (e) { console.error(`Fallo crítico en ${table}:`, e); return null; }
        };

        const [
            usersData, deptsData, reqsData, leaveTypesData, ppeTypesData, 
            ppeReqsData, newsData, holidaysData, shiftTypesData, shiftAssignmentsData,
            trucksData, driversData, driversPpeData, settingsData
        ] = await Promise.all([
            fetchTable('users'),
            fetchTable('departments'),
            fetchTable('requests'),
            fetchTable('leave_types'),
            fetchTable('ppe_types'),
            fetchTable('ppe_requests'),
            fetchTable('news', supabase.from('news').select('*').order('created_at', { ascending: false })),
            fetchTable('holidays'),
            fetchTable('shift_types'),
            fetchTable('shift_assignments'),
            fetchTable('trucks'),
            fetchTable('drivers'),
            fetchTable('drivers_ppe'),
            fetchTable('settings')
        ]);

        if (usersData) this.users = this.mapUsersFromDB(usersData);
        if (deptsData) this.departments = deptsData.map((d: any) => ({ 
            id: String(d.id), name: String(d.name || ''), supervisorIds: (d.supervisor_ids || []).map((id: any) => String(id).toLowerCase())
        }));
        if (reqsData) this.requests = this.mapRequestsFromDB(reqsData);
        if (newsData) this.config.news = newsData;
        if (leaveTypesData) this.config.leaveTypes = leaveTypesData.map((t: any) => ({ 
            id: String(t.id), label: t.label, subtractsDays: !!t.subtracts_days, fixedRanges: t.fixed_range || [] 
        }));
        if (ppeTypesData) this.config.ppeTypes = ppeTypesData.map((p: any) => ({ 
            id: String(p.id), name: p.name, sizes: p.sizes || [], stock: p.stock || {} 
        }));
        if (ppeReqsData) this.config.ppeRequests = ppeReqsData.map((p: any) => ({ id: String(p.id), userId: String(p.user_id).toLowerCase(), type_id: String(p.type_id), typeId: String(p.type_id), size: p.size, status: p.status, createdAt: p.created_at, deliveryDate: p.delivery_date }));
        if (holidaysData) this.config.holidays = holidaysData.map((h: any) => ({ id: String(h.id), date: h.date, name: h.name }));
        if (shiftTypesData) this.config.shiftTypes = shiftTypesData.map((s: any) => ({ ...s, id: String(s.id) }));
        
        if (shiftAssignmentsData) this.config.shiftAssignments = shiftAssignmentsData.map((a: any) => ({ 
            id: String(a.id), 
            userId: String(a.user_id).toLowerCase(), 
            date: a.date ? String(a.date).substring(0, 10) : a.date, 
            shiftTypeId: String(a.shift_type_id || '') 
        }));

        if (trucksData) this.config.trucks = trucksData.map((t: any) => ({ id: String(t.id), name: t.name }));
        if (driversData) this.config.drivers = driversData.map((d: any) => ({ id: String(d.id), name: d.name, truckId: String(d.truck_id) }));
        if (driversPpeData) this.config.driversPpe = driversPpeData.map((p: any) => ({ 
            id: String(p.id), driverId: String(p.driver_id), typeId: String(p.type_id), size: p.size, status: p.status, createdAt: p.created_at, requestedDate: p.requested_date, deliveryDate: p.delivery_date 
        }));

        if (settingsData) {
            const smtpRow = settingsData.find((r:any) => r.key === 'smtp');
            const templatesRow = settingsData.find((r:any) => r.key === 'email_templates');
            if (smtpRow?.value) {
                this.config.smtpSettings = {
                    host: smtpRow.value.host || 'smtp.gmail.com',
                    port: smtpRow.value.port || 587,
                    user: smtpRow.value.user || '',
                    password: smtpRow.value.password || '',
                    enabled: !!smtpRow.value.enabled
                };
            }
            if (Array.isArray(templatesRow?.value)) {
                this.config.emailTemplates = templatesRow.value.map((t: any) => ({
                    id: String(t.id), label: t.label, subject: t.subject, body: t.body,
                    recipients: t.recipients || { admin: true, worker: true, supervisor: false }
                }));
            }
        }

        if (this.currentUser) {
            const updatedSelf = this.users.find(u => u.id === this.currentUser!.id);
            if (updatedSelf) this.currentUser = updatedSelf;
            const { data: notifsData } = await supabase.from('notifications').select('*').eq('user_id', this.currentUser.id).order('date', { ascending: false });
            if (notifsData) this.notifications = notifsData.map((n: any) => ({ id: String(n.id), userId: String(n.user_id).toLowerCase(), message: n.message, read: n.read, date: n.date, type: n.type }));
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
          id: String(u.id).toLowerCase(), name: u.name, email: u.email, role: u.role, department_id: String(u.department_id), departmentId: String(u.department_id),
          daysAvailable: Number(u.days_available || 0), overtimeHours: Number(u.overtime_hours || 0),
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`, 
          birthdate: u.birthdate, truckNumber: u.truck_number
      }));
  }

  private mapRequestsFromDB(data: any[]): LeaveRequest[] {
      return data.map(r => ({
          id: String(r.id), userId: String(r.user_id).toLowerCase(), type_id: String(r.type_id), typeId: String(r.type_id), label: r.label, 
          startDate: r.start_date, endDate: r.end_date, hours: r.hours, reason: r.reason, 
          status: r.status, createdAt: r.created_at, adminComment: r.admin_comment,
          resolvedBy: r.resolved_by ? String(r.resolved_by).toLowerCase() : undefined,
          isConsumed: !!r.is_consumed, consumedHours: Number(r.consumed_hours || 0), overtimeUsage: r.overtime_usage || []
      }));
  }

  isOvertimeRequest(typeId: string): boolean {
      return [RequestType.OVERTIME_EARN, RequestType.OVERTIME_SPEND_DAYS, RequestType.OVERTIME_TO_DAYS, RequestType.OVERTIME_PAY, RequestType.WORKED_HOLIDAY, RequestType.ADJUSTMENT_OVERTIME].includes(typeId as RequestType);
  }

  private async sendEmailNotification(templateLabel: string, req: LeaveRequest) {
    // ELIMINACIÓN TOTAL: No se procesan correos para Bajas Médicas
    const label = (req.label || this.getTypeLabel(req.typeId)).toLowerCase();
    if (req.typeId === RequestType.SICKNESS || label.includes('baja') || label.includes('médica')) return;
    
    if (!this.config.smtpSettings.enabled) return;
    const worker = this.users.find(u => u.id === req.userId);
    if (!worker) return;
    const template = this.config.emailTemplates.find(t => t.label === templateLabel || t.label.toLowerCase().includes(templateLabel.toLowerCase()));
    if (!template) return;

    const typeLabel = this.getTypeLabel(req.typeId);
    const dates = `${new Date(req.startDate).toLocaleDateString()}${req.endDate ? ' al ' + new Date(req.endDate).toLocaleDateString() : ''}`;
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
        await supabase.functions.invoke('send-test-email', {
            body: { to: uniqueRecipients, config: this.config.smtpSettings, subject, message: body, html }
        });
    } catch (error) { console.error("Error enviando notificación por email:", error); }
  }

  async applyRequestToBalanceDB(req: LeaveRequest, undo: boolean = false) {
    const user = this.users.find(u => u.id === req.userId);
    if (!user) return;
    const multiplier = undo ? -1 : 1;
    let daysDelta = 0;
    let hoursDelta = 0;
    if (req.typeId === RequestType.WORKED_HOLIDAY) { daysDelta = 1; hoursDelta = 4; } 
    else if (req.typeId === RequestType.OVERTIME_TO_DAYS) { const h = Math.abs(req.hours || 0); hoursDelta = -h; daysDelta = h / 8; }
    else if (this.isOvertimeRequest(req.typeId)) { hoursDelta = req.hours || 0; } 
    else {
        const typeConfig = this.config.leaveTypes.find(t => t.id === req.typeId);
        if (req.typeId === RequestType.ADJUSTMENT_DAYS) { daysDelta = req.hours || 0; } 
        else if (typeConfig?.subtractsDays || req.typeId === RequestType.VACATION || req.typeId === RequestType.PERSONAL) {
            const start = new Date(req.startDate);
            const end = new Date(req.endDate || req.startDate);
            daysDelta = -(Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }
    }
    if (daysDelta !== 0 || hoursDelta !== 0) {
        const newDays = user.daysAvailable + (daysDelta * multiplier);
        const newHours = user.overtimeHours + (hoursDelta * multiplier);
        await supabase.from('users').update({ days_available: newDays, overtime_hours: newHours }).eq('id', user.id);
        user.daysAvailable = newDays;
        user.overtimeHours = newHours;
    }
    if (req.overtimeUsage && req.overtimeUsage.length > 0) {
        for (const usage of req.overtimeUsage) {
            const sourceReq = this.requests.find(r => r.id === usage.requestId);
            if (sourceReq) {
                const newConsumed = (sourceReq.consumedHours || 0) + (usage.hoursUsed * multiplier);
                await supabase.from('requests').update({ consumed_hours: newConsumed }).eq('id', usage.requestId);
                sourceReq.consumedHours = newConsumed;
            }
        }
    }
  }

  async repairOvertimeIntegrity() {
      const approvedConsumption = this.requests.filter(r => r.status === RequestStatus.APPROVED && (r.typeId === RequestType.OVERTIME_SPEND_DAYS || r.typeId === RequestType.OVERTIME_PAY || r.typeId === RequestType.OVERTIME_TO_DAYS) && r.overtimeUsage && r.overtimeUsage.length > 0);
      const consumptionMap: Record<string, number> = {};
      approvedConsumption.forEach(req => { req.overtimeUsage?.forEach(usage => { consumptionMap[usage.requestId] = (consumptionMap[usage.requestId] || 0) + usage.hoursUsed; }); });
      for (const [requestId, totalConsumed] of Object.entries(consumptionMap)) {
          if (this.requests.some(r => r.id === requestId)) { await supabase.from('requests').update({ consumed_hours: totalConsumed }).eq('id', requestId); }
      }
      await this.refresh();
      alert('Trazabilidad de horas sincronizada correctamente.');
  }

  async createRequest(data: any, userId: string, status: RequestStatus) {
      const id = crypto.randomUUID();
      const label = data.label || this.getTypeLabel(data.typeId);
      const isOvertime = this.isOvertimeRequest(data.typeId);
      const finalHours = data.typeId === RequestType.WORKED_HOLIDAY ? 4 : data.hours;
      const finalResolvedBy = status === RequestStatus.APPROVED ? this.currentUser?.id : null;
      const { data: newReqData } = await supabase.from('requests').insert({ id, user_id: userId.toLowerCase(), type_id: data.typeId, label, start_date: data.startDate, end_date: data.endDate, hours: finalHours, reason: data.reason, status: status, created_at: new Date().toISOString(), overtime_usage: data.overtime_usage || [], resolved_by: finalResolvedBy ? finalResolvedBy.toLowerCase() : null }).select().single();
      if (newReqData) {
          const req = { id: String(newReqData.id), userId: String(newReqData.user_id).toLowerCase(), typeId: String(newReqData.type_id), startDate: newReqData.start_date, endDate: newReqData.end_date, hours: newReqData.hours, status: newReqData.status, reason: newReqData.reason, createdAt: newReqData.created_at, resolvedBy: newReqData.resolved_by ? String(newReqData.resolved_by).toLowerCase() : undefined, overtimeUsage: newReqData.overtime_usage || [] } as LeaveRequest;
          if (!isOvertime || status === RequestStatus.APPROVED) await this.applyRequestToBalanceDB(req);
          
          // ELIMINADO EL PROCESO DE EMAIL PARA BAJAS
          if (req.typeId !== RequestType.SICKNESS) {
              let templateName = isOvertime ? ((req.typeId === RequestType.OVERTIME_SPEND_DAYS || req.typeId === RequestType.OVERTIME_TO_DAYS) ? 'Horas: Canje por Días' : 'Horas: Nuevo Registro') : 'Ausencia: Nueva Solicitud';
              this.sendEmailNotification(templateName, req);
          }
      }
      await this.refresh();
  }

  async updateRequest(id: string, data: any) {
    const oldReq = this.requests.find(r => r.id === id);
    if (!oldReq) return;
    const isOvertime = this.isOvertimeRequest(oldReq.typeId);
    if (oldReq.status === RequestStatus.APPROVED || (!isOvertime && oldReq.status === RequestStatus.PENDING)) await this.applyRequestToBalanceDB(oldReq, true);
    const label = data.label || this.getTypeLabel(data.typeId);
    const { data: updatedReqData } = await supabase.from('requests').update({ type_id: data.typeId, label, start_date: data.startDate, end_date: data.endDate, hours: data.hours, reason: data.reason, overtime_usage: data.overtime_usage || [] }).eq('id', id).select().single();
    if (updatedReqData) {
        const req = { id: String(updatedReqData.id), userId: String(updatedReqData.user_id).toLowerCase(), typeId: String(updatedReqData.type_id), startDate: updatedReqData.start_date, endDate: updatedReqData.end_date, hours: updatedReqData.hours, status: updatedReqData.status, overtimeUsage: updatedReqData.overtime_usage || [] } as LeaveRequest;
        const isNewOvertime = this.isOvertimeRequest(req.typeId);
        if (req.status === RequestStatus.APPROVED || (!isNewOvertime && req.status === RequestStatus.PENDING)) await this.applyRequestToBalanceDB(req);
    }
    await this.refresh();
  }

  async updateRequestStatus(id: string, status: RequestStatus, adminId: string, comment?: string) {
      const oldReq = this.requests.find(r => r.id === id);
      if (!oldReq) return;
      const isOvertime = this.isOvertimeRequest(oldReq.typeId);
      const finalAdminId = adminId || this.currentUser?.id;
      if (!finalAdminId) return;
      if (oldReq.status === RequestStatus.PENDING && status === RequestStatus.APPROVED) { if (isOvertime) await this.applyRequestToBalanceDB(oldReq, false); }
      else if (status === RequestStatus.REJECTED) { if (oldReq.status === RequestStatus.APPROVED || (oldReq.status === RequestStatus.PENDING && !isOvertime)) await this.applyRequestToBalanceDB(oldReq, true); }
      else if (oldReq.status === RequestStatus.REJECTED && status === RequestStatus.APPROVED) await this.applyRequestToBalanceDB(oldReq, false);
      await supabase.from('requests').update({ status, admin_comment: comment || '', resolved_by: finalAdminId.toLowerCase() }).eq('id', id);
      await this.refresh();
      const refreshedReq = this.requests.find(r => r.id === id);
      
      // ELIMINADO EL PROCESO DE EMAIL PARA BAJAS
      if (refreshedReq && refreshedReq.typeId !== RequestType.SICKNESS) {
          let templateName = status === RequestStatus.APPROVED ? (isOvertime ? 'Horas: Aprobadas' : 'Ausencia: Aprobada') : (status === RequestStatus.REJECTED ? 'Ausencia: Rechazada' : '');
          if (templateName) this.sendEmailNotification(templateName, refreshedReq);
      }
  }

  async deleteRequest(id: string) {
      const req = this.requests.find(r => r.id === id);
      if (req) {
          const isOvertime = this.isOvertimeRequest(req.typeId);
          if (req.status === RequestStatus.APPROVED || (!isOvertime && req.status === RequestStatus.PENDING)) await this.applyRequestToBalanceDB(req, true);
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

  logout() { this.currentUser = null; localStorage.removeItem('gda_session'); this.notify(); }

  getMyRequests() {
    if (!this.currentUser) return [];
    return this.requests.filter(r => r.userId === this.currentUser!.id).sort((a,b) => b.startDate.localeCompare(a.startDate));
  }

  getPendingApprovalsForUser(userId: string) {
    const targetId = userId.toLowerCase();
    const user = this.users.find(u => u.id === targetId);
    if (!user) return [];
    if (user.role === Role.ADMIN) return this.requests.filter(r => r.status === RequestStatus.PENDING);
    if (user.role === Role.SUPERVISOR) {
        const myDeptIds = this.departments.filter(d => (d.supervisorIds || []).includes(targetId)).map(d => d.id);
        return this.requests.filter(r => {
            if (r.status !== RequestStatus.PENDING) return false;
            const reqUser = this.users.find(u => u.id === r.userId);
            return reqUser && myDeptIds.includes(reqUser.departmentId);
        });
    }
    return [];
  }

  getNotificationsForUser(userId: string) { return this.notifications.filter(n => n.userId === userId.toLowerCase()); }

  async markNotificationAsRead(id: string) { await supabase.from('notifications').update({ read: true }).eq('id', id); await this.refresh(); }

  async markAllNotificationsAsRead(userId: string) { await supabase.from('notifications').update({ read: true }).eq('user_id', userId.toLowerCase()); await this.refresh(); }

  async deleteNotification(id: string) { await supabase.from('notifications').delete().eq('id', id); await this.refresh(); }

  getNextShift(userId: string) {
    const targetId = userId.toLowerCase();
    const today = new Date().toISOString().split('T')[0];
    const assignments = this.config.shiftAssignments.filter(a => a.userId === targetId && a.date >= today).sort((a,b) => a.date.localeCompare(b.date));
    if (assignments.length > 0) {
        const a = assignments[0];
        const shift = this.config.shiftTypes.find(s => s.id === a.shiftTypeId);
        return { date: a.date, shift };
    }
    return null;
  }

  getShiftForUserDate(userId: string, date: string) {
    const targetId = userId.toLowerCase();
    const a = this.config.shiftAssignments.find(a => a.userId === targetId && a.date === date);
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
        const start = req.startDate.substring(0, 10);
        const end = (req.endDate || req.startDate).substring(0, 10);
        const oStart = other.startDate.substring(0, 10);
        const oEnd = (other.endDate || other.startDate).substring(0, 10);
        return (start <= oEnd && end >= oStart);
    });
  }

  getAvailableOvertimeRecords(userId: string) { return this.requests.filter(r => r.userId === userId.toLowerCase() && r.typeId === RequestType.OVERTIME_EARN && r.status === RequestStatus.APPROVED && (r.hours || 0) > (r.consumedHours || 0)); }

  async createUser(data: any, pass: string) {
    const { error } = await supabase.from('users').insert({ id: crypto.randomUUID(), name: data.name, email: data.email, role: data.role || Role.WORKER, department_id: data.departmentId || data.department_id, days_available: Number(data.daysAvailable || 0), overtime_hours: Number(data.overtime_hours || 0), birthdate: data.birthdate || null, avatar: data.avatar, truck_number: data.truck_number, password: pass });
    if (error) throw error;
    await this.refresh();
  }

  async updateUserAdmin(id: string, data: any) {
    const updateData: any = { name: data.name, email: data.email, role: data.role, department_id: data.departmentId || data.department_id, days_available: Number(data.daysAvailable || 0), overtime_hours: Number(data.overtimeHours || 0), birthdate: data.birthdate || null, avatar: data.avatar, truck_number: data.truck_number };
    if (data.password && data.password.trim() !== '') updateData.password = data.password;
    const { error } = await supabase.from('users').update(updateData).eq('id', id.toLowerCase());
    if (error) throw error;
    await this.refresh();
  }

  async updateUserProfile(id: string, data: any) {
    const updateData: any = { name: data.name, email: data.email, avatar: data.avatar };
    if (data.password && data.password.trim() !== '') updateData.password = data.password;
    const { error } = await supabase.from('users').update(updateData).eq('id', id.toLowerCase());
    if (error) throw error;
    await this.refresh();
  }

  async deleteUser(id: string) {
    const targetId = id.toLowerCase();
    await Promise.all([supabase.from('requests').delete().eq('user_id', targetId), supabase.from('notifications').delete().eq('user_id', targetId), supabase.from('shift_assignments').delete().eq('user_id', targetId), supabase.from('ppe_requests').delete().eq('user_id', targetId)]);
    const { error } = await supabase.from('users').delete().eq('id', targetId);
    if (error) throw error;
    await this.refresh();
  }

  async createDepartment(name: string, supervisorIds: string[]) { await supabase.from('departments').insert({ id: crypto.randomUUID(), name, supervisor_ids: supervisorIds.map(id => id.toLowerCase()) }); await this.refresh(); }
  async updateDepartment(id: string, name: string, supervisorIds: string[]) { await supabase.from('departments').update({ name, supervisor_ids: supervisorIds.map(id => id.toLowerCase()) }).eq('id', id); await this.refresh(); }
  async deleteDepartment(id: string) { await supabase.from('departments').delete().eq('id', id); await this.refresh(); }
  async createLeaveType(label: string, subtractsDays: boolean, fixedRanges: any) { await supabase.from('leave_types').insert({ id: crypto.randomUUID(), label, subtracts_days: subtractsDays, fixed_range: fixedRanges }); await this.refresh(); }
  async updateLeaveType(id: string, label: string, subtractsDays: boolean, fixedRanges: any) { await supabase.from('leave_types').update({ label, subtracts_days: subtractsDays, fixed_range: fixedRanges }).eq('id', id); await this.refresh(); }
  async deleteLeaveType(id: string) { await supabase.from('leave_types').delete().eq('id', id); await this.refresh(); }
  async createShiftType(name: string, color: string, start: string, end: string) { await supabase.from('shift_types').insert({ id: crypto.randomUUID(), name, color, segments: [{ start, end }] }); await this.refresh(); }
  async updateShiftType(id: string, name: string, color: string, start: string, end: string) { await supabase.from('shift_types').update({ name, color, segments: [{ start, end }] }).eq('id', id); await this.refresh(); }
  async deleteShiftType(id: string) { await supabase.from('shift_types').delete().eq('id', id); await this.refresh(); }

  async assignShift(userId: string, date: string, shiftTypeId: string) {
    const normalizedDate = String(date).substring(0, 10);
    const targetUserId = String(userId).toLowerCase();
    try {
        await supabase.from('shift_assignments').delete().eq('user_id', targetUserId).eq('date', normalizedDate);
        if (shiftTypeId) {
            await supabase.from('shift_assignments').insert({ user_id: targetUserId, date: normalizedDate, shift_type_id: String(shiftTypeId) });
        }
        await this.refresh();
    } catch (error) { console.error("Error persistiendo turno:", error); throw error; }
  }

  async assignShiftsBatch(assignments: { userId: string, date: string, shiftTypeId: string }[]) {
    if (assignments.length === 0) return;
    try {
        // ESTRATEGIA SENIOR: Agrupar por usuario para asegurar coherencia y evitar solapamientos
        const userGroups: Record<string, { date: string, shiftTypeId: string }[]> = {};
        assignments.forEach(a => {
            const uid = a.userId.toLowerCase();
            if (!userGroups[uid]) userGroups[uid] = [];
            userGroups[uid].push({ date: a.date.substring(0, 10), shiftTypeId: a.shiftTypeId });
        });

        for (const [userId, userChanges] of Object.entries(userGroups)) {
            const datesToClean = userChanges.map(c => c.date);
            
            // 1. Limpieza total de los días del lote para ESTE usuario
            const { error: delError } = await supabase.from('shift_assignments')
                .delete()
                .eq('user_id', userId)
                .in('date', datesToClean);
                
            if (delError) throw delError;

            // 2. Inserción de los nuevos valores (si no son borradores)
            const toInsert = userChanges
                .filter(c => c.shiftTypeId && c.shiftTypeId !== '')
                .map(c => ({
                    user_id: userId,
                    date: c.date,
                    shift_type_id: String(c.shiftTypeId)
                }));

            if (toInsert.length > 0) {
                const { error: insError } = await supabase.from('shift_assignments').insert(toInsert);
                if (insError) throw insError;
            }

            // OPTIMIZACIÓN LOCAL: Actualizamos el store inmediatamente para evitar que la UI "borre" visualmente antes del refresh
            this.config.shiftAssignments = [
                ...this.config.shiftAssignments.filter(a => a.userId !== userId || !datesToClean.includes(a.date)),
                ...toInsert.map(i => ({ id: crypto.randomUUID(), userId: i.user_id, date: i.date, shiftTypeId: i.shift_type_id }))
            ];
        }
        
        // Sincronización final
        await this.refresh();
        this.notify();
    } catch (error) { 
        console.error("Fallo crítico persistiendo lote de turnos:", error); 
        throw error; 
    }
  }

  async createHoliday(date: string, name: string) { await supabase.from('holidays').insert({ id: crypto.randomUUID(), date, name }); await this.refresh(); }
  async updateHoliday(id: string, date: string, name: string) { await supabase.from('holidays').update({ date, name }).eq('id', id); await this.refresh(); }
  async deleteHoliday(id: string) { await supabase.from('holidays').delete().eq('id', id); await this.refresh(); }
  async createPPEType(name: string, sizes: string[]) { await supabase.from('ppe_types').insert({ id: crypto.randomUUID(), name, sizes, stock: {} }); await this.refresh(); }
  async updatePPEType(id: string, name: string, sizes: string[]) { await supabase.from('ppe_types').update({ name, sizes }).eq('id', id); await this.refresh(); }
  async updatePPEStock(id: string, stock: Record<string, number>) { const idx = this.config.ppeTypes.findIndex(t => t.id === id); if (idx !== -1) { this.config.ppeTypes[idx].stock = stock; this.notify(); } await supabase.from('ppe_types').update({ stock }).eq('id', id); this.refresh(); }
  async deletePPEType(id: string) { await supabase.from('ppe_requests').delete().eq('type_id', id); await supabase.from('ppe_types').delete().eq('id', id); await this.refresh(); }
  async createPPERequest(userId: string, typeId: string, size: string) { await supabase.from('ppe_requests').insert({ id: crypto.randomUUID(), user_id: userId.toLowerCase(), type_id: typeId, size, status: 'PENDIENTE', created_at: new Date().toISOString() }); await this.refresh(); }
  async markPPEAsRequested(id: string) { await supabase.from('notifications').insert({ id: crypto.randomUUID(), user_id: String(this.currentUser?.id).toLowerCase(), message: `Se ha marcado el EPI ${id} como solicitado.`, read: false, date: new Date().toISOString() }); await supabase.from('ppe_requests').update({ status: 'SOLICITADO' }).eq('id', id); await this.refresh(); }
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
  async deletePPERequest(id: string) { await supabase.from('ppe_requests').delete().eq('id', id); await this.refresh(); }
  async createNewsPost(title: string, content: string, authorId: string) { await supabase.from('news').insert({ id: crypto.randomUUID(), title, content, author_id: authorId.toLowerCase(), created_at: new Date().toISOString() }); await this.refresh(); }
  async deleteNewsPost(id: string) { await supabase.from('news').delete().eq('id', id); await this.refresh(); }
  async sendMassNotification(userIds: string[], message: string) { const notifs = userIds.map(uid => ({ id: crypto.randomUUID(), user_id: uid.toLowerCase(), message, read: false, date: new Date().toISOString(), type: 'admin' })); await supabase.from('notifications').insert(notifs); await this.refresh(); }
  async saveSmtpSettings(settings: any) { await supabase.from('settings').update({ value: settings }).eq('key', 'smtp'); await this.refresh(); }
  async saveEmailTemplates(templates: EmailTemplate[]) { await supabase.from('settings').update({ value: templates }).eq('key', 'email_templates'); await this.refresh(); }
  async createTruck(name: string) { await supabase.from('trucks').insert({ id: crypto.randomUUID(), name }); await this.refresh(); }
  async deleteTruck(id: string) { await supabase.from('trucks').delete().eq('id', id); await this.refresh(); }
  async createDriver(name: string, truckId: string) { await supabase.from('drivers').insert({ id: crypto.randomUUID(), name, truck_id: truckId }); await this.refresh(); }
  async deleteDriver(id: string) { await supabase.from('drivers').delete().eq('id', id); await this.refresh(); }
  async createDriverPPE(driverId: string, typeId: string, size: string) { await supabase.from('drivers_ppe').insert({ id: crypto.randomUUID(), driver_id: driverId, type_id: typeId, size, status: 'PENDIENTE', created_at: new Date().toISOString() }); await this.refresh(); }
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
  async deleteDriverPPE(id: string) { await supabase.from('drivers_ppe').delete().eq('id', id); await this.refresh(); }
}

export const store = new Store();
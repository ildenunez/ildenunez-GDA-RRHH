import { User, Role, Department, LeaveRequest, RequestStatus, AppConfig, LeaveTypeConfig, EmailTemplate, ShiftType, ShiftAssignment, Holiday, PPEType, PPERequest, RequestType, OvertimeUsage, DateRange, NewsPost, Truck, Driver, DriverPPE } from '../types';
import type { Notification } from '../types';
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
    whatsappSettings: { companyPhone: '', enabled: false },
    trucks: [],
    drivers: [],
    driversPpe: []
  };

  currentUser: User | null = null;
  initialized = false;
  isBusy = false;
  private listeners: (() => void)[] = [];
  private realtimeChannel: any = null;

  subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  setBusy(val: boolean) {
    this.isBusy = val;
    this.notify();
  }

  private async fetchAll(table: string, baseQuery?: any) {
    let allData: any[] = [];
    let from = 0;
    let to = 999;
    let isFinished = false;

    while (!isFinished) {
        const query = baseQuery ? baseQuery.range(from, to) : supabase.from(table).select('*').range(from, to);
        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) {
            isFinished = true;
        } else {
            allData = [...allData, ...data];
            if (data.length < 1000) isFinished = true;
            else { from += 1000; to += 1000; }
        }
    }
    return allData;
  }

  private mapUser(u: any): User {
    return {
      ...u,
      id: String(u.id).trim().toLowerCase(), 
      departmentId: String(u.department_id),
      daysAvailable: Number(u.days_available ?? 0),
      overtimeHours: Number(u.overtime_hours ?? 0),
      avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}`,
      truckNumber: u.truck_number,
      phone: u.phone // Mapeo desde la base de datos
    };
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

  /**
   * Genera y abre un enlace de WhatsApp
   */
  openWhatsApp(phone: string, message: string) {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
    window.open(url, '_blank');
  }

  /**
   * Envía una notificación Push al navegador si hay permiso
   */
  sendPush(title: string, body: string) {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") {
          const icon = "https://termosycalentadoresgranada.com/wp-content/uploads/2025/08/https___cdn.evbuc_.com_images_677236879_73808960223_1_original.png";
          try {
              navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification(title, {
                      body,
                      icon,
                      badge: icon,
                      vibrate: [200, 100, 200],
                      tag: 'gda-rrhh-notif'
                  } as any);
              }).catch(() => {
                  new Notification(title, { body, icon });
              });
          } catch (e) {
              new Notification(title, { body, icon });
          }
      } else if (Notification.permission !== "denied") {
          Notification.requestPermission();
      }
  }

  private setupRealtime() {
      if (!this.currentUser) return;
      if (this.realtimeChannel) this.realtimeChannel.unsubscribe();

      this.realtimeChannel = supabase.channel('push-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
            const req = payload.new as any;
            if (!req) return;

            if (payload.eventType === 'INSERT' && req.status === 'PENDIENTE') {
                const isSuper = this.currentUser!.role === Role.SUPERVISOR || this.currentUser!.role === Role.ADMIN;
                if (isSuper) {
                    const applicant = this.users.find(u => u.id === req.user_id);
                    const myDepts = this.departments.filter(d => d.supervisorIds.includes(this.currentUser!.id)).map(d => d.id);
                    if (this.currentUser!.role === Role.ADMIN || (applicant && myDepts.includes(applicant.departmentId))) {
                        this.sendPush("Nueva Solicitud Pendiente", `${applicant?.name || 'Un empleado'} ha solicitado ${this.getTypeLabel(req.type_id)}.`);
                    }
                }
            }

            if (payload.eventType === 'UPDATE' && req.user_id === this.currentUser!.id) {
                const oldReq = payload.old as any;
                if (oldReq.status !== req.status) {
                    const statusText = req.status === 'APROBADO' ? '✅ APROBADA' : '❌ RECHAZADA';
                    this.sendPush(`Solicitud ${statusText}`, `Tu petición de ${this.getTypeLabel(req.type_id)} ha sido actualizada.`);
                }
            }
            this.refresh();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
            const notif = payload.new as any;
            if (notif && notif.user_id === this.currentUser!.id) {
                this.sendPush("Mensaje de Administración", notif.message);
                this.refresh();
            }
        })
        .subscribe();
  }

  async refresh() {
    try {
        const fetchT = async (table: string) => {
            const { data, error } = await supabase.from(table).select('*');
            if (error) throw error;
            return data;
        };

        const [u, d, r, lt, pt, pr, nw, hl, st, sa, tr, dr, dp, sett] = await Promise.all([
            fetchT('users'),
            fetchT('departments'),
            this.fetchAll('requests'),
            fetchT('leave_types'),
            fetchT('ppe_types'),
            fetchT('ppe_requests'),
            supabase.from('news').select('*').order('created_at', { ascending: false }),
            fetchT('holidays'),
            fetchT('shift_types'),
            this.fetchAll('user_schedules'),
            fetchT('trucks'),
            fetchT('drivers'),
            fetchT('drivers_ppe'),
            fetchT('settings')
        ]);

        this.users = u.map((x: any) => this.mapUser(x));
        this.departments = d.map((x: any) => ({ 
            id: String(x.id), name: String(x.name || ''), supervisorIds: (x.supervisor_ids || []).map((id: any) => String(id).trim().toLowerCase())
        }));
        this.requests = r.map((r: any) => ({
            id: String(r.id), 
            userId: String(r.user_id).trim().toLowerCase(), 
            typeId: String(r.type_id), label: r.label, 
            startDate: r.start_date, endDate: r.end_date, hours: r.hours, reason: r.reason, 
            status: r.status, createdAt: r.created_at, adminComment: r.admin_comment,
            resolvedBy: r.resolved_by ? String(r.resolved_by).trim().toLowerCase() : undefined,
            consumedHours: Number(r.consumed_hours || 0), overtimeUsage: r.overtime_usage || [],
            documentUrl: r.document_url
        }));
        this.config.news = Array.isArray(nw) ? nw : (nw as any).data || [];
        this.config.leaveTypes = lt.map((t: any) => ({ id: String(t.id), label: t.label, subtractsDays: !!t.subtracts_days, fixedRanges: t.fixed_range || [] }));
        this.config.ppeTypes = pt.map((p: any) => ({ id: String(p.id), name: p.name, sizes: p.sizes || [], stock: p.stock || {} }));
        this.config.ppeRequests = pr.map((p: any) => ({ id: String(p.id), userId: String(p.user_id).trim().toLowerCase(), type_id: String(p.type_id), size: p.size, status: p.status, createdAt: p.created_at, deliveryDate: p.delivery_date }));
        this.config.holidays = hl.map((h: any) => ({ id: String(h.id), date: h.date, name: h.name }));
        this.config.shiftTypes = st.map((s: any) => ({ ...s, id: String(s.id) }));
        
        this.config.shiftAssignments = (sa || []).map((a: any) => ({ 
            id: String(a.id), 
            userId: String(a.user_id).trim().toLowerCase(), 
            date: String(a.date).split(/[ T]/)[0].trim(), 
            shiftTypeId: String(a.shift_type_id || '') 
        }));

        this.config.trucks = tr.map((t: any) => ({ id: String(t.id), name: t.name }));
        this.config.drivers = dr.map((d: any) => ({ id: String(d.id), name: d.name, truckId: String(d.truck_id) }));
        this.config.driversPpe = dp.map((p: any) => ({ id: String(p.id), driverId: String(p.driver_id).trim().toLowerCase(), typeId: String(p.type_id), size: p.size, status: p.status, createdAt: p.created_at, requestedDate: p.requested_date, deliveryDate: p.delivery_date }));

        if (sett) {
            const smtpRow = sett.find((r: any) => r.key === 'smtp');
            const templatesRow = sett.find((r: any) => r.key === 'email_templates');
            const waRow = sett.find((r: any) => r.key === 'whatsapp');
            if (smtpRow?.value) this.config.smtpSettings = smtpRow.value;
            if (templatesRow?.value) this.config.emailTemplates = templatesRow.value;
            if (waRow?.value) this.config.whatsappSettings = waRow.value;
        }

        if (this.currentUser) {
            const updatedSelf = this.users.find(u => u.id === this.currentUser!.id);
            if (updatedSelf) this.currentUser = updatedSelf;
            const n = await this.fetchAll('notifications', supabase.from('notifications').select('*').eq('user_id', this.currentUser.id).order('created_at', { ascending: false }));
            if (n) {
                this.notifications = n.map((x: any) => ({ 
                    id: String(x.id), 
                    userId: String(x.user_id).trim().toLowerCase(), 
                    message: x.message, 
                    read: x.read, 
                    date: x.created_at,
                    type: x.type 
                }));
            }
        }
        this.notify();
    } catch (error) { console.error("Store Refresh Error:", error); }
  }

  async init() {
    if (this.initialized) return;
    const saved = localStorage.getItem('gda_session');
    if (saved) {
        this.currentUser = this.mapUser(JSON.parse(saved));
        this.setupRealtime();
    }
    await this.refresh();
    this.initialized = true;
  }

  async assignShiftsBatch(changes: { userId: string, date: string, shiftTypeId: string }[]) {
    if (changes.length === 0) return;
    this.setBusy(true);
    try {
        for (const change of changes) {
            const cleanUid = String(change.userId).trim().toLowerCase();
            const cleanDate = String(change.date).trim();
            await supabase.from('user_schedules').delete().eq('user_id', cleanUid).eq('date', cleanDate);
            if (change.shiftTypeId && change.shiftTypeId !== '') {
                await supabase.from('user_schedules').insert({ user_id: cleanUid, date: cleanDate, shift_type_id: change.shiftTypeId });
            }
        }
        await this.refresh();
    } finally { this.setBusy(false); }
  }

  async uploadJustificante(file: File): Promise<string | null> {
    this.setBusy(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${this.currentUser?.id || 'common'}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('justificantes').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('justificantes').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (e) { console.error("Error uploading file:", e); return null; } finally { this.setBusy(false); }
  }

  async createRequest(d: any, uid: string, s: RequestStatus) {
      this.setBusy(true);
      try {
        const id = crypto.randomUUID();
        const { error } = await supabase.from('requests').insert({ 
            id, 
            user_id: uid, 
            type_id: d.typeId, 
            label: d.label || this.getTypeLabel(d.typeId), 
            start_date: d.startDate, 
            end_date: d.endDate || null, 
            hours: d.hours, 
            reason: d.reason, 
            status: s, 
            created_at: new Date().toISOString(), 
            overtime_usage: d.overtimeUsage || [], 
            consumed_hours: 0
        });
        
        if (error) {
            console.error("Error creating request in Supabase:", error);
            throw error;
        }

        // Descontar saldo si entra como PENDIENTE o APROBADO
        if (s === RequestStatus.PENDING || s === RequestStatus.APPROVED) {
            await this.adjustUserBalance(uid, d.typeId, d.startDate, d.endDate, d.hours, 1);
        }
        await this.refresh();
      } catch (e) {
          console.error("Error in createRequest:", e);
          throw e;
      } finally { this.setBusy(false); }
  }

  async updateRequest(id: string, d: any) {
    this.setBusy(true);
    try {
      const oldReq = this.requests.find(r => r.id === id);
      if (oldReq && (oldReq.status === RequestStatus.PENDING || oldReq.status === RequestStatus.APPROVED)) {
          // Revertir saldo anterior
          await this.adjustUserBalance(oldReq.userId, oldReq.typeId, oldReq.startDate, oldReq.endDate, oldReq.hours, -1);
          // Aplicar nuevo saldo
          await this.adjustUserBalance(oldReq.userId, d.typeId, d.startDate, d.endDate, d.hours, 1);
      }
      const { error } = await supabase.from('requests').update({ 
          type_id: d.typeId, 
          start_date: d.startDate, 
          end_date: d.endDate || null, 
          hours: d.hours, 
          reason: d.reason, 
          overtime_usage: d.overtimeUsage || []
      }).eq('id', id);

      if (error) {
          console.error("Error updating request in Supabase:", error);
          throw error;
      }
      await this.refresh();
    } catch (e) {
        console.error("Error in updateRequest:", e);
        throw e;
    } finally { this.setBusy(false); }
  }

  async updateRequestStatus(id: string, s: RequestStatus, aid: string, c?: string) {
      this.setBusy(true);
      try {
        const req = this.requests.find(r => r.id === id);
        if (!req) return;

        const oldStatus = req.status;
        const newStatus = s;

        // Si pasa de PENDIENTE a RECHAZADO, devolvemos los días
        if (oldStatus === RequestStatus.PENDING && newStatus === RequestStatus.REJECTED) {
            await this.adjustUserBalance(req.userId, req.typeId, req.startDate, req.endDate, req.hours, -1);
        }
        
        // Si pasa de RECHAZADO a APROBADO o PENDIENTE, aplicamos el descuento
        if (oldStatus === RequestStatus.REJECTED && (newStatus === RequestStatus.APPROVED || newStatus === RequestStatus.PENDING)) {
            await this.adjustUserBalance(req.userId, req.typeId, req.startDate, req.endDate, req.hours, 1);
        }

        // Manejo de horas extra consumidas
        if (newStatus === RequestStatus.APPROVED && oldStatus !== RequestStatus.APPROVED) {
            const usage = req.overtimeUsage || [];
            for (const u of usage) {
                const source = this.requests.find(r => r.id === u.requestId);
                if (source) {
                    const newConsumed = (source.consumedHours || 0) + u.hoursUsed;
                    const { error: consumedError } = await supabase.from('requests').update({ consumed_hours: newConsumed }).eq('id', u.requestId);
                    if (consumedError) throw consumedError;
                }
            }
        }

        const { error } = await supabase.from('requests').update({ status: s, admin_comment: c || '', resolved_by: aid }).eq('id', id);
        if (error) {
            console.error("Error updating request status in Supabase:", error);
            throw error;
        }
        await this.refresh();
      } catch (e) {
          console.error("Error in updateRequestStatus:", e);
          throw e;
      } finally { this.setBusy(false); }
  }

  async deleteRequest(id: string) { 
    this.setBusy(true); 
    try { 
      const req = this.requests.find(r => r.id === id);
      if (req && (req.status === RequestStatus.PENDING || req.status === RequestStatus.APPROVED)) {
          // Si se elimina estando pendiente o aprobada, devolvemos los días
          await this.adjustUserBalance(req.userId, req.typeId, req.startDate, req.endDate, req.hours, -1);
      }
      const { error } = await supabase.from('requests').delete().eq('id', id); 
      if (error) {
          console.error("Error deleting request in Supabase:", error);
          throw error;
      }
      await this.refresh();
    } catch (e) {
        console.error("Error in deleteRequest:", e);
        throw e;
    } finally { this.setBusy(false); } 
  }
  async markNotificationAsRead(id: string) { this.setBusy(true); try { await supabase.from('notifications').update({ read: true }).eq('id', id); } finally { this.setBusy(false); } }
  async markAllNotificationsAsRead(uid: string) { this.setBusy(true); try { await supabase.from('notifications').update({ read: true }).eq('user_id', uid); } finally { this.setBusy(false); } }
  async deleteNotification(id: string) { this.setBusy(true); try { await supabase.from('notifications').delete().eq('id', id); } finally { this.setBusy(false); } }

  async sendChatMessage(senderId: string, message: string, recipientId?: string) {
    this.setBusy(true);
    try {
        const sender = this.users.find(u => u.id === senderId);
        if (!sender) return;

        const recipients: string[] = [];
        if (recipientId) {
            recipients.push(recipientId);
        } else {
            // Si no hay destinatario específico, enviamos a supervisores y admins
            const dept = this.departments.find(d => d.id === sender.departmentId);
            if (dept && dept.supervisorIds) {
                recipients.push(...dept.supervisorIds);
            }
            const admins = this.users.filter(u => u.role === Role.ADMIN).map(u => u.id);
            recipients.push(...admins);
        }

        // Eliminar duplicados y el propio remitente
        const uniqueRecipients = Array.from(new Set(recipients)).filter(id => id !== senderId);

        const notifications = uniqueRecipients.map(rid => ({
            id: crypto.randomUUID(),
            user_id: rid,
            message: `[CHAT][${senderId}] ${sender.name}: ${message}`,
            type: 'chat',
            read: false,
            created_at: new Date().toISOString()
        }));

        if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
        }
        await this.refresh();
    } catch (e) {
        console.error("Error sending chat message:", e);
    } finally {
        this.setBusy(false);
    }
  }

  private async adjustUserBalance(userId: string, typeId: string, startDate: string, endDate: string | undefined, hours: number | undefined, multiplier: number) {
    const { data: userData, error: userError } = await supabase.from('users').select('overtime_hours, days_available').eq('id', userId).single();
    if (userError || !userData) return;

    let currentOvertime = Number(userData.overtime_hours || 0);
    let currentDays = Number(userData.days_available || 0);

    if (this.isOvertimeRequest(typeId)) {
        currentOvertime += ((hours || 0) * multiplier);
        await supabase.from('users').update({ overtime_hours: currentOvertime }).eq('id', userId);
        
        if (typeId === RequestType.OVERTIME_TO_DAYS) {
            const daysAdded = Math.abs(hours || 0) / 8;
            currentDays += (daysAdded * multiplier);
            await supabase.from('users').update({ days_available: currentDays }).eq('id', userId);
        }
    } else if (typeId === RequestType.ADJUSTMENT_DAYS) {
        currentDays += ((hours || 0) * multiplier);
        await supabase.from('users').update({ days_available: currentDays }).eq('id', userId);
    } else {
        const isSickness = typeId === RequestType.SICKNESS;
        const isUnjustified = typeId === RequestType.UNJUSTIFIED;
        const currentType = this.config.leaveTypes.find(t => t.id === typeId);
        const subtracts = currentType ? currentType.subtractsDays : true;

        if (subtracts && !isSickness && !isUnjustified) {
            const start = new Date(startDate);
            const end = new Date(endDate || startDate);
            const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            currentDays -= (diffDays * multiplier);
            await supabase.from('users').update({ days_available: currentDays }).eq('id', userId);
        }
    }
  }

  getMyRequests() { return this.requests.filter(r => r.userId === this.currentUser?.id).sort((a,b) => b.startDate.localeCompare(a.startDate)); }
  getNotificationsForUser(uid: string) { return this.notifications.filter(n => n.userId === uid); }
  getShiftForUserDate(uid: string, d: string) { 
    const cleanUid = String(uid).trim().toLowerCase();
    const assignment = this.config.shiftAssignments.find(a => String(a.userId).toLowerCase() === cleanUid && a.date === d);
    return assignment ? this.config.shiftTypes.find(s => s.id === assignment.shiftTypeId) : undefined;
  }
  getPendingApprovalsForUser(uid: string) {
    const u = this.users.find(x => x.id === uid);
    if (!u) return [];
    if (u.role === Role.ADMIN) return this.requests.filter(r => r.status === RequestStatus.PENDING);
    if (u.role === Role.SUPERVISOR) {
        const dIds = this.departments.filter(d => (d.supervisorIds || []).includes(uid)).map(d => d.id);
        return this.requests.filter(r => {
            if (r.status !== RequestStatus.PENDING) return false;
            // Ver solicitudes de sus departamentos asignados
            const applicant = this.users.find(x => x.id === r.userId);
            if (applicant && dIds.includes(applicant.departmentId)) return true;
            // Ver sus propias solicitudes pendientes
            if (r.userId === uid) return true;
            return false;
        });
    }
    return [];
  }
  isOvertimeRequest(t: string) { return [RequestType.OVERTIME_EARN, RequestType.OVERTIME_SPEND_DAYS, RequestType.OVERTIME_TO_DAYS, RequestType.OVERTIME_PAY, RequestType.WORKED_HOLIDAY, RequestType.ADJUSTMENT_OVERTIME].includes(t as RequestType); }
  getAvailableOvertimeRecords(uid: string) { return this.requests.filter(r => r.userId === uid && r.status === RequestStatus.APPROVED && (r.typeId === RequestType.OVERTIME_EARN || r.typeId === RequestType.WORKED_HOLIDAY) && (r.hours || 0) > (r.consumedHours || 0)); }
  getRequestConflicts(req: LeaveRequest) {
    const u = this.users.find(usr => usr.id === req.userId);
    if (!u) return [];
    if (req.typeId === RequestType.ADJUSTMENT_DAYS) return [];
    const s1 = req.startDate.split(/[ T]/)[0];
    const e1 = (req.endDate || req.startDate).split(/[ T]/)[0];
    return this.requests.filter(r => {
      if (r.id === req.id) return false;
      if (r.status !== RequestStatus.APPROVED && r.status !== RequestStatus.PENDING) return false;
      if (r.typeId === RequestType.ADJUSTMENT_DAYS) return false;
      const rUser = this.users.find(usr => usr.id === r.userId);
      if (!rUser || rUser.departmentId !== u.departmentId) return false;
      const rIsOvertime = this.isOvertimeRequest(r.typeId);
      const isOvertime = this.isOvertimeRequest(req.typeId);
      if (rIsOvertime && ![RequestType.OVERTIME_SPEND_DAYS, RequestType.OVERTIME_TO_DAYS].includes(r.typeId as RequestType)) return false;
      if (isOvertime && ![RequestType.OVERTIME_SPEND_DAYS, RequestType.OVERTIME_TO_DAYS].includes(req.typeId as RequestType)) return false;
      const s2 = r.startDate.split(/[ T]/)[0];
      const e2 = (r.endDate || r.startDate).split(/[ T]/)[0];
      return s1 <= e2 && e1 >= s2;
    });
  }
  async login(email: string, pass: string) { 
    this.setBusy(true); 
    try { 
        const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle(); 
        if (data && data.password === pass) { 
            this.currentUser = this.mapUser(data); 
            localStorage.setItem('gda_session', JSON.stringify(this.currentUser)); 
            this.setupRealtime(); 
            await this.refresh(); 
            return this.currentUser; 
        } 
        return null; 
    } finally { this.setBusy(false); } 
  }
  logout() { 
    if (this.realtimeChannel) this.realtimeChannel.unsubscribe();
    this.currentUser = null; 
    localStorage.removeItem('gda_session'); 
    this.notify(); 
  }
  async createUser(d: any, p: string) { 
    this.setBusy(true); 
    try { 
        const { error } = await supabase.from('users').insert({ 
            id: crypto.randomUUID(), 
            name: d.name,
            email: d.email,
            role: d.role,
            department_id: d.departmentId,
            days_available: d.daysAvailable ?? 22,
            overtime_hours: d.overtimeHours ?? 0,
            avatar: d.avatar,
            phone: d.phone || null,
            birthdate: d.birthdate || null,
            password: p 
        }); 
        if (error) {
            console.error("Error creating user in Supabase:", error);
            throw error;
        }
        await this.refresh();
    } catch (e) {
        console.error("Error in createUser:", e);
        throw e;
    } finally { this.setBusy(false); } 
  }
  async updateUserAdmin(id: string, d: any) { 
    this.setBusy(true); 
    try { 
        const updateData: any = {
            name: d.name,
            email: d.email,
            role: d.role,
            department_id: d.departmentId,
            days_available: d.daysAvailable,
            overtime_hours: d.overtimeHours,
            avatar: d.avatar,
            phone: d.phone,
            birthdate: d.birthdate
        };
        
        if (d.password) {
            updateData.password = d.password;
        }

        const { error } = await supabase.from('users').update(updateData).eq('id', id); 
        if (error) {
            console.error("Error updating user in Supabase:", error);
            throw error;
        }
        await this.refresh();
    } catch (e) {
        console.error("Error in updateUserAdmin:", e);
        throw e;
    } finally { this.setBusy(false); } 
  }
  async updateUserProfile(id: string, d: any) { 
    this.setBusy(true); 
    try { 
        await supabase.from('users').update(d).eq('id', id); 
    } finally { this.setBusy(false); } 
  }
  async deleteUser(id: string) { this.setBusy(true); try { await supabase.from('users').delete().eq('id', id); } finally { this.setBusy(false); } }
  async createDepartment(n: string, sids: string[]) { this.setBusy(true); try { await supabase.from('departments').insert({ id: crypto.randomUUID(), name: n, supervisor_ids: sids }); } finally { this.setBusy(false); } }
  async updateDepartment(id: string, n: string, sids: string[]) { this.setBusy(true); try { await supabase.from('departments').update({ name: n, supervisor_ids: sids }).eq('id', id); } finally { this.setBusy(false); } }
  async deleteDepartment(id: string) { this.setBusy(true); try { await supabase.from('departments').delete().eq('id', id); } finally { this.setBusy(false); } }
  async createLeaveType(l: string, s: boolean, f: any) { this.setBusy(true); try { await supabase.from('leave_types').insert({ id: crypto.randomUUID(), label: l, subtracts_days: s, fixed_range: f }); } finally { this.setBusy(false); } }
  async updateLeaveType(id: string, l: string, s: boolean, f: any) { this.setBusy(true); try { await supabase.from('leave_types').update({ label: l, subtracts_days: s, fixed_range: f }).eq('id', id); } finally { this.setBusy(false); } }
  async deleteLeaveType(id: string) { this.setBusy(true); try { await supabase.from('leave_types').delete().eq('id', id); } finally { this.setBusy(false); } }
  async createShiftType(n: string, c: string, st: string, e: string) { this.setBusy(true); try { await supabase.from('shift_types').insert({ id: crypto.randomUUID(), name: n, color: c, segments: [{ start: st, end: e }] }); } finally { this.setBusy(false); } }
  async deleteShiftType(id: string) { this.setBusy(true); try { await supabase.from('shift_types').delete().eq('id', id); } finally { this.setBusy(false); } }
  async createHoliday(d: string, n: string) { this.setBusy(true); try { await supabase.from('holidays').insert({ id: crypto.randomUUID(), date: d, name: n }); } finally { this.setBusy(false); } }
  async deleteHoliday(id: string) { this.setBusy(true); try { await supabase.from('holidays').delete().eq('id', id); } finally { this.setBusy(false); } }
  async createPPEType(n: string, s: string[]) { this.setBusy(true); try { await supabase.from('ppe_types').insert({ id: crypto.randomUUID(), name: n, sizes: s, stock: {} }); } finally { this.setBusy(false); } }
  async updatePPEType(id: string, n: string, s: string[]) { this.setBusy(true); try { await supabase.from('ppe_types').update({ name: n, sizes: s }).eq('id', id); } finally { this.setBusy(false); } }
  async updatePPEStock(id: string, s: any) { this.setBusy(true); try { await supabase.from('ppe_types').update({ stock: s }).eq('id', id); } finally { this.setBusy(false); } }
  async deletePPEType(id: string) { this.setBusy(true); try { await supabase.from('ppe_types').delete().eq('id', id); } finally { this.setBusy(false); } }
  async createPPERequest(uid: string, tid: string, sz: string) { this.setBusy(true); try { await supabase.from('ppe_requests').insert({ id: crypto.randomUUID(), user_id: uid, type_id: tid, size: sz, status: 'PENDIENTE', created_at: new Date().toISOString() }); } finally { this.setBusy(false); } }
  async markPPEAsRequested(id: string) { this.setBusy(true); try { await supabase.from('ppe_requests').update({ status: 'SOLICITADO' }).eq('id', id); } finally { this.setBusy(false); } }
  async deliverPPERequest(id: string, q: number = 1) { this.setBusy(true); try { await supabase.from('ppe_requests').update({ status: 'ENTREGADO', delivery_date: new Date().toISOString() }).eq('id', id); } finally { this.setBusy(false); } }
  async deletePPERequest(id: string) { this.setBusy(true); try { await supabase.from('ppe_requests').delete().eq('id', id); } finally { this.setBusy(false); } }
  async createNewsPost(t: string, c: string, aid: string) { this.setBusy(true); try { await supabase.from('news').insert({ id: crypto.randomUUID(), title: t, content: c, author_id: aid, created_at: new Date().toISOString() }); } finally { this.setBusy(false); } }
  async deleteNewsPost(id: string) { this.setBusy(true); try { await supabase.from('news').delete().eq('id', id); } finally { this.setBusy(false); } }
  async saveSmtpSettings(s: any) { this.setBusy(true); try { await supabase.from('settings').update({ value: s }).eq('key', 'smtp'); } finally { this.setBusy(false); } }
  async saveEmailTemplates(t: EmailTemplate[]) { this.setBusy(true); try { await supabase.from('settings').update({ value: t }).eq('key', 'email_templates'); } finally { this.setBusy(false); } }
  async saveWhatsAppSettings(s: any) { this.setBusy(true); try { await supabase.from('settings').update({ value: s }).eq('key', 'whatsapp'); } finally { this.setBusy(false); } }
  async createTruck(n: string) { this.setBusy(true); try { await supabase.from('trucks').insert({ id: crypto.randomUUID(), name: n }); } finally { this.setBusy(false); } }
  async deleteTruck(id: string) { this.setBusy(true); try { await supabase.from('trucks').delete().eq('id', id); } finally { this.setBusy(false); } }
  async createDriver(n: string, tid: string) { this.setBusy(true); try { await supabase.from('drivers').insert({ id: crypto.randomUUID(), name: n, truck_id: tid }); } finally { this.setBusy(false); } }
  async deleteDriver(id: string) { this.setBusy(true); try { await supabase.from('drivers').delete().eq('id', id); } finally { this.setBusy(false); } }
  async createDriverPPE(did: string, tid: string, sz: string) { this.setBusy(true); try { await supabase.from('drivers_ppe').insert({ id: crypto.randomUUID(), driver_id: did, type_id: tid, size: sz, status: 'PENDIENTE', created_at: new Date().toISOString() }); } finally { this.setBusy(false); } }
  async updateDriverPPEStatus(id: string, s: string, _q?: number) { this.setBusy(true); try { const updateData: any = { status: s }; if (s === 'ENTREGADO') updateData.delivery_date = new Date().toISOString(); if (s === 'SOLICITADO') updateData.requested_date = new Date().toISOString(); await supabase.from('drivers_ppe').update(updateData).eq('id', id); } finally { this.setBusy(false); } }
  async deleteDriverPPE(id: string) { this.setBusy(true); try { await supabase.from('drivers_ppe').delete().eq('id', id); } finally { this.setBusy(false); } }
  async repairOvertimeIntegrity() { this.setBusy(true); try { const approvedWithUsage = this.requests.filter(r => r.status === RequestStatus.APPROVED); for (const req of approvedWithUsage) { const isConsumptionType = [RequestType.OVERTIME_SPEND_DAYS, RequestType.OVERTIME_PAY, RequestType.OVERTIME_TO_DAYS].includes(req.typeId as RequestType); if (isConsumptionType && req.hours && req.hours > 0) { const correctedHours = -req.hours; await supabase.from('requests').update({ hours: correctedHours }).eq('id', req.id); req.hours = correctedHours; } const usageList = req.overtimeUsage || []; if (usageList.length > 0) { for (const u of usageList) { const source = this.requests.find(r => r.id === u.requestId); if (source) { const allUsages = this.requests.filter(r => r.status === RequestStatus.APPROVED && r.overtimeUsage).flatMap(r => r.overtimeUsage || []).filter(usage => usage.requestId === source.id); const totalConsumed = allUsages.reduce((sum, usage) => sum + usage.hoursUsed, 0); await supabase.from('requests').update({ consumed_hours: totalConsumed }).eq('id', source.id); } } } } for (const user of this.users) { const userOvertimeReqs = this.requests.filter(r => r.userId === user.id && r.status === RequestStatus.APPROVED && this.isOvertimeRequest(r.typeId)); const theoreticalBalance = userOvertimeReqs.reduce((sum, r) => sum + (r.hours || 0), 0); await supabase.from('users').update({ overtime_hours: theoreticalBalance }).eq('id', user.id); } await this.refresh(); } finally { this.setBusy(false); } }
}

export const store = new Store();
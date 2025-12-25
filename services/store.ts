
import { User, Role, Department, LeaveRequest, RequestStatus, AppConfig, Notification, LeaveTypeConfig, EmailTemplate, ShiftType, ShiftAssignment, Holiday, PPEType, PPERequest, RequestType, OvertimeUsage, DateRange, NewsPost } from '../types';
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
    smtpSettings: { host: 'smtp.gmail.com', port: 587, user: 'admin@empresa.com', password: '', enabled: false }
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
          'unjustified_absence': 'Ausencia Justificada'
      };
      const dynamic = this.config.leaveTypes.find(t => t.id === typeId);
      if (dynamic) return dynamic.label;
      if (map[typeId]) return map[typeId];
      return typeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getDefaultEmailTemplates(): EmailTemplate[] {
    return [
      { id: 'request_created', label: 'Ausencia: Crea', subject: 'Nueva solicitud de ausencia', body: 'Hola {worker_name}, se ha registrado una nueva solicitud de {type}.', recipients: { worker: true, supervisor: true, admin: false } },
      { id: 'request_approved', label: 'Ausencia: OK', subject: 'Solicitud aprobada', body: 'Hola {worker_name}, tu solicitud de {type} ha sido aprobada.', recipients: { worker: true, supervisor: false, admin: false } },
      { id: 'request_rejected', label: 'Ausencia: KO', subject: 'Solicitud rechazada', body: 'Hola {worker_name}, tu solicitud de {type} ha sido rechazada.', recipients: { worker: true, supervisor: false, admin: false } },
      { id: 'overtime_created', label: 'Horas: Reg', subject: 'Registro de horas extra', body: 'Se ha registrado un nuevo bloque de {hours}h extra.', recipients: { worker: true, supervisor: true, admin: false } },
      { id: 'overtime_approved', label: 'Horas: OK', subject: 'Horas extra aprobadas', body: 'Tus horas extra han sido validadas.', recipients: { worker: true, supervisor: false, admin: false } },
      { id: 'overtime_consumed', label: 'Horas: Canje', subject: 'Canje de horas extra', body: 'Has canjeado horas extra por días libres.', recipients: { worker: true, supervisor: true, admin: false } },
      { id: 'adjustment_applied', label: 'Regularización', subject: 'Ajuste de saldo', body: 'Se ha aplicado una regularización a tu saldo de días/horas.', recipients: { worker: true, supervisor: false, admin: false } }
    ];
  }

  async init() {
    if (this.initialized) return;
    try {
        const { data: usersData, error: usersError } = await supabase.from('users').select('*');
        if (usersError) throw usersError;

        const { data: deptsData } = await supabase.from('departments').select('*');
        const { data: reqsData } = await supabase.from('requests').select('*');
        const { data: typesData } = await supabase.from('leave_types').select('*');
        const { data: shiftTypesData } = await supabase.from('shift_types').select('*');
        const { data: shiftAssignmentsData } = await supabase.from('shift_assignments').select('*');
        const { data: holidaysData } = await supabase.from('holidays').select('*');
        const { data: ppeTypes } = await supabase.from('ppe_types').select('*');
        const { data: ppeRequests } = await supabase.from('ppe_requests').select('*');
        const { data: notificationsData } = await supabase.from('notifications').select('*');
        const { data: settingsData } = await supabase.from('settings').select('*');
        const { data: newsData } = await supabase.from('news').select('*').order('publish_at', { ascending: false });

        if (usersData) this.users = this.mapUsersFromDB(usersData);
        if (deptsData) this.departments = deptsData.map((d: any) => ({ id: d.id, name: String(d.name || ''), supervisorIds: d.supervisor_ids || [] }));
        if (reqsData) this.requests = this.mapRequestsFromDB(reqsData);
        
        if (newsData) {
            this.config.news = newsData.map((n: any) => ({ 
                id: n.id, 
                title: n.title, 
                content: n.content, 
                authorId: n.author_id, 
                createdAt: n.created_at, 
                publishAt: n.publish_at || n.created_at,
                pinned: !!n.pinned 
            }));
        }
        
        if (typesData) {
            this.config.leaveTypes = typesData.map((t: any) => {
                let ranges: DateRange[] = [];
                if (Array.isArray(t.fixed_range)) ranges = t.fixed_range;
                else if (t.fixed_range && typeof t.fixed_range === 'object') ranges = [t.fixed_range];
                return { id: t.id, label: String(t.label || ''), subtractsDays: !!t.subtracts_days, fixedRanges: ranges };
            });
        }

        if (shiftTypesData) this.config.shiftTypes = shiftTypesData.map((s: any) => ({ id: s.id, name: String(s.name || ''), color: String(s.color || '#cccccc'), segments: s.segments || [] }));
        if (shiftAssignmentsData) this.config.shiftAssignments = shiftAssignmentsData.map((a: any) => ({ id: a.id, userId: a.user_id, date: String(a.date || ''), shiftTypeId: a.shift_type_id }));
        if (holidaysData) this.config.holidays = holidaysData.map((h: any) => ({ id: h.id, date: String(h.date || ''), name: String(h.name || '') }));
        if (ppeTypes) this.config.ppeTypes = ppeTypes.map((p: any) => ({ id: p.id, name: String(p.name || ''), sizes: p.sizes || [] }));
        if (ppeRequests) this.config.ppeRequests = ppeRequests.map((r: any) => ({ id: r.id, userId: r.user_id, type_id: r.type_id, typeId: r.type_id, size: String(r.size || ''), status: r.status, createdAt: String(r.created_at || ''), deliveryDate: r.delivery_date }));
        if (notificationsData) this.notifications = this.mapNotificationsFromDB(notificationsData);
        
        if (settingsData) {
            const smtp = settingsData.find(s => s.key === 'smtp');
            if (smtp) this.config.smtpSettings = smtp.value;
            const templates = settingsData.find(s => s.key === 'email_templates');
            if (templates && Array.isArray(templates.value)) {
                this.config.emailTemplates = templates.value;
            } else this.config.emailTemplates = this.getDefaultEmailTemplates();
        } else this.config.emailTemplates = this.getDefaultEmailTemplates();
        
        const savedUser = localStorage.getItem('gda_session');
        if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              const freshUser = this.users.find(u => u.id === parsed.id);
              if (freshUser) this.currentUser = freshUser;
            } catch(e) { localStorage.removeItem('gda_session'); }
        }

        this.initialized = true;
        this.notify();
    } catch (error) {
        console.error("Critical Store Init Error:", error);
        throw error;
    }
  }

  private mapUsersFromDB(data: any[]): User[] {
      return data.map(u => ({
          id: u.id,
          name: String(u.name || 'Usuario'),
          email: String(u.email || '').trim().toLowerCase(),
          role: u.role as Role,
          departmentId: u.department_id,
          daysAvailable: Number(u.days_available || 0),
          overtimeHours: Number(u.overtime_hours || 0),
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=random`,
          birthdate: u.birthdate || undefined
      }));
  }

  private mapRequestsFromDB(data: any[]): LeaveRequest[] {
      return data.map(r => ({
          id: String(r.id), userId: r.user_id, typeId: r.type_id, label: String(r.label || 'Solicitud'), startDate: String(r.start_date || ''), endDate: r.end_date,
          hours: r.hours, reason: r.reason, status: r.status as RequestStatus, createdAt: String(r.created_at || ''), adminComment: r.admin_comment, createdByAdmin: !!r.created_by_admin, 
          isConsumed: !!r.is_consumed, consumedHours: r.consumed_hours, overtimeUsage: r.overtime_usage, isJustified: !!r.is_justified, reported_to_admin: !!r.reported_to_admin
      }));
  }

  private mapNotificationsFromDB(data: any[]): Notification[] {
    return data.map(n => ({ id: String(n.id), userId: n.user_id, message: String(n.message || ''), read: !!n.read, date: String(n.date || n.created_at || '') }));
  }

  async login(email: string, pass: string): Promise<User | null> {
    if (!this.initialized) await this.init();
    const user = this.users.find(u => u.email === email.trim().toLowerCase());
    if (user) {
        const { data } = await supabase.from('users').select('password').eq('id', user.id).maybeSingle();
        if (data && String(data.password) === String(pass)) {
            this.currentUser = { ...user };
            localStorage.setItem('gda_session', JSON.stringify(this.currentUser));
            return this.currentUser;
        }
    }
    return null;
  }

  logout() { this.currentUser = null; localStorage.removeItem('gda_session'); this.notify(); }

  async createNewsPost(title: string, content: string, authorId: string, publishAt?: string) {
    const pubDate = publishAt || new Date().toISOString();
    const { data, error } = await supabase.from('news').insert({
        id: crypto.randomUUID(), 
        title, 
        content, 
        author_id: authorId, 
        created_at: new Date().toISOString(),
        publish_at: pubDate
    }).select().single();

    if (error) {
        console.error("Error creating news:", error);
        throw error;
    }

    if (data) {
        const newPost: NewsPost = { 
            id: data.id, 
            title: data.title, 
            content: data.content, 
            authorId: data.author_id, 
            createdAt: data.created_at,
            publishAt: data.publish_at || data.created_at
        };
        this.config.news.unshift(newPost);
        this.notify();
    }
  }

  async deleteNewsPost(id: string) {
    await supabase.from('news').delete().eq('id', id);
    this.config.news = this.config.news.filter(n => n.id !== id);
    this.notify();
  }

  async markNotificationAsRead(id: string) { await supabase.from('notifications').update({ read: true }).eq('id', id); const n = this.notifications.find(notif => notif.id === id); if (n) n.read = true; this.notify(); }
  async markAllNotificationsAsRead(userId: string) { await supabase.from('notifications').update({ read: true }).eq('user_id', userId); this.notifications.forEach(n => { if (n.userId === userId) n.read = true; }); this.notify(); }
  async deleteNotification(id: string) { await supabase.from('notifications').delete().eq('id', id); this.notifications = this.notifications.filter(n => n.id !== id); this.notify(); }
  
  async createPPERequest(userId: string, typeId: string, size: string) { const { data } = await supabase.from('ppe_requests').insert({ id: crypto.randomUUID(), user_id: userId, type_id: typeId, size, status: 'PENDIENTE', created_at: new Date().toISOString() }).select().single(); if (data) { const mapped = { id: data.id, userId: data.user_id, typeId: data.type_id, type_id: data.type_id, size: data.size, status: data.status, createdAt: data.created_at, deliveryDate: data.delivery_date }; this.config.ppeRequests.push(mapped); this.notify(); } }
  async deliverPPERequest(id: string) { const d = new Date().toISOString(); await supabase.from('ppe_requests').update({ status: 'ENTREGADO', delivery_date: d }).eq('id', id); const req = this.config.ppeRequests.find(r => r.id === id); if (req) { req.status = 'ENTREGADO'; req.deliveryDate = d; this.notify(); } }
  
  async createDepartment(name: string, supervisorIds: string[]) { const { data } = await supabase.from('departments').insert({ id: crypto.randomUUID(), name, supervisor_ids: supervisorIds }).select().single(); if(data) { this.departments.push({ id: data.id, name: data.name, supervisorIds: data.supervisor_ids }); this.notify(); } }
  async updateDepartment(id: string, name: string, supervisorIds: string[]) { await supabase.from('departments').update({ name, supervisor_ids: supervisorIds }).eq('id', id); const d = this.departments.find(dep => dep.id === id); if(d) { d.name = name; d.supervisorIds = supervisorIds; this.notify(); } }
  async deleteDepartment(id: string) { await supabase.from('departments').delete().eq('id', id); this.departments = this.departments.filter(d => d.id !== id); this.notify(); }
  
  async createHoliday(date: string, name: string) { const { data } = await supabase.from('holidays').insert({ id: crypto.randomUUID(), date, name }).select().single(); if (data) { this.config.holidays.push({ id: data.id, date: data.date, name: data.name }); this.notify(); } }
  async deleteHoliday(id: string) { await supabase.from('holidays').delete().eq('id', id); this.config.holidays = this.config.holidays.filter(h => h.id !== id); this.notify(); }
  
  async createLeaveType(label: string, subtractsDays: boolean, fixedRanges?: DateRange[] | null) { const payload = { id: crypto.randomUUID(), label, subtracts_days: subtractsDays, fixed_range: fixedRanges || null }; const { data } = await supabase.from('leave_types').insert(payload).select().single(); if(data) { this.config.leaveTypes.push({ id: data.id, label: data.label, subtractsDays: !!data.subtracts_days, fixedRanges: fixedRanges || undefined }); this.notify(); } }
  async deleteLeaveType(id: string) { await supabase.from('leave_types').delete().eq('id', id); this.config.leaveTypes = this.config.leaveTypes.filter(t => t.id !== id); this.notify(); }
  
  async createShiftType(name: string, color: string, start: string, end: string) { const segments = [{ start, end }]; const { data } = await supabase.from('shift_types').insert({ id: crypto.randomUUID(), name, color, segments }).select().single(); if (data) { this.config.shiftTypes.push({ id: data.id, name: data.name, color: data.color, segments: data.segments }); this.notify(); } }
  async deleteShiftType(id: string) { await supabase.from('shift_types').delete().eq('id', id); this.config.shiftTypes = this.config.shiftTypes.filter(s => s.id !== id); this.notify(); }
  
  async createPPEType(name: string, sizes: string[]) { const { data } = await supabase.from('ppe_types').insert({ id: crypto.randomUUID(), name, sizes }).select().single(); if(data) { this.config.ppeTypes.push({ id: data.id, name: data.name, sizes: data.sizes }); this.notify(); } }
  async deletePPEType(id: string) { await supabase.from('ppe_types').delete().eq('id', id); this.config.ppeTypes = this.config.ppeTypes.filter(p => p.id !== id); this.notify(); }
  
  async saveSmtpSettings(settings: AppConfig['smtpSettings']) { const { error } = await supabase.from('settings').upsert({ key: 'smtp', value: settings }); if (!error) { this.config.smtpSettings = settings; this.notify(); } }
  async saveEmailTemplates(templates: EmailTemplate[]) { const { error } = await supabase.from('settings').upsert({ key: 'email_templates', value: templates }); if (!error) { this.config.emailTemplates = templates; this.notify(); } }
  async sendMassNotification(userIds: string[], message: string) { const notifications = userIds.map(uid => ({ id: crypto.randomUUID(), user_id: uid, message, read: false, created_at: new Date().toISOString() })); const { error } = await supabase.from('notifications').insert(notifications); if(!error) { userIds.forEach(uid => { this.notifications.push({ id: crypto.randomUUID(), userId: uid, message, read: false, date: new Date().toISOString() }); }); this.notify(); } }
  
  async createRequest(data: any, userId: string, status: RequestStatus = RequestStatus.PENDING) {
    let label = data.label || this.getTypeLabel(data.typeId);
    const { data: inserted } = await supabase.from('requests').insert({
      id: crypto.randomUUID(), user_id: userId, type_id: data.typeId, label, start_date: data.startDate, end_date: data.endDate,
      hours: data.hours, reason: data.reason, status, created_at: new Date().toISOString(), overtime_usage: data.overtimeUsage, is_justified: data.isJustified, reported_to_admin: data.reportedToAdmin
    }).select().single();
    if (inserted) { this.requests.push(this.mapRequestsFromDB([inserted])[0]); this.notify(); }
  }

  async deleteRequest(id: string) { await supabase.from('requests').delete().eq('id', id); this.requests = this.requests.filter(r => r.id !== id); this.notify(); }
  async updateRequest(id: string, data: any) { this.notify(); }
  async updateRequestStatus(id: string, newStatus: RequestStatus, adminId: string, adminComment?: string) { 
      const { data: updated } = await supabase.from('requests').update({ status: newStatus, admin_comment: adminComment }).eq('id', id).select().single();
      if (updated) { const idx = this.requests.findIndex(r => r.id === id); if(idx !== -1) { this.requests[idx].status = newStatus; this.requests[idx].adminComment = adminComment; this.notify(); } }
  }

  async updateUserProfile(userId: string, data: { name: string; email: string; password?: string; avatar?: string; birthdate?: string }) {
      const updateData: any = { name: data.name, email: data.email, avatar: data.avatar, birthdate: data.birthdate };
      if (data.password) updateData.password = data.password;
      const { data: updated } = await supabase.from('users').update(updateData).eq('id', userId).select().single();
      if (updated) { const idx = this.users.findIndex(u => u.id === userId); if(idx !== -1) { this.users[idx] = this.mapUsersFromDB([updated])[0]; if(this.currentUser?.id === userId) this.currentUser = this.users[idx]; this.notify(); } }
  }

  async createUser(user: Partial<User>, password: string) {
      const { data } = await supabase.from('users').insert({ ...user, password, days_available: 31, overtime_hours: 0 }).select().single();
      if (data) { this.users.push(this.mapUsersFromDB([data])[0]); this.notify(); }
  }
  
  async deleteUser(id: string) { await supabase.from('users').delete().eq('id', id); this.users = this.users.filter(u => u.id !== id); this.notify(); }
  async updateUserAdmin(userId: string, data: Partial<User>) { const { data: updated } = await supabase.from('users').update({ name: data.name, email: data.email, department_id: data.departmentId, birthdate: data.birthdate, role: data.role }).eq('id', userId).select().single(); if(updated) { const idx = this.users.findIndex(u => u.id === userId); if(idx !== -1) { this.users[idx] = this.mapUsersFromDB([updated])[0]; this.notify(); } } }

  async assignShift(user_id: string, date: string, shift_type_id: string) { 
      if (!shift_type_id) { 
          await supabase.from('shift_assignments').delete().match({ user_id, date }); 
          this.config.shiftAssignments = this.config.shiftAssignments.filter(a => !(a.userId === user_id && a.date === date)); 
      } else { 
          const { data } = await supabase.from('shift_assignments').upsert({ user_id, date, shift_type_id }).select().single(); 
          if (data) { 
              const idx = this.config.shiftAssignments.findIndex(a => a.userId === user_id && a.date === date); 
              const m = { id: data.id, userId: data.user_id, date: data.date, shiftTypeId: data.shift_type_id }; 
              if (idx !== -1) this.config.shiftAssignments[idx] = m; else this.config.shiftAssignments.push(m); 
          } 
      } 
      this.notify(); 
  }

  getMyRequests() { return this.requests.filter(r => r.userId === this.currentUser?.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt)); }
  getNotificationsForUser(userId: string) { return this.notifications.filter(n => n.userId === userId).sort((a,b) => b.date.localeCompare(a.date)); }
  getPendingApprovalsForUser(userId: string) { return this.requests.filter(r => r.status === RequestStatus.PENDING); }
  isOvertimeRequest(typeId: string) { return [RequestType.OVERTIME_EARN, RequestType.OVERTIME_PAY, RequestType.OVERTIME_SPEND_DAYS, RequestType.WORKED_HOLIDAY, RequestType.ADJUSTMENT_OVERTIME].includes(typeId as RequestType); }
  getAvailableOvertimeRecords(userId: string) { return this.requests.filter(r => r.userId === userId && r.status === RequestStatus.APPROVED && this.isOvertimeRequest(r.typeId)); }
  getShiftForUserDate(userId: string, date: string) { const a = this.config.shiftAssignments.find(as => as.userId === userId && as.date === date); if (!a) return undefined; return this.config.shiftTypes.find(s => s.id === a.shiftTypeId); }
  getNextShift(userId: string) { const today = new Date().toISOString().split('T')[0]; const a = this.config.shiftAssignments.filter(as => as.userId === userId && as.date >= today).sort((a,b) => a.date.localeCompare(b.date))[0]; if (!a) return null; const shift = this.config.shiftTypes.find(s => s.id === a.shiftTypeId); return shift ? { date: a.date, shift } : null; }
  getRequestConflicts(request: LeaveRequest) { return []; }
}

export const store = new Store();

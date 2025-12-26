
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
      const tid = typeId.toLowerCase();
      const fallback = Object.entries(map).find(([key]) => key.toLowerCase() === tid);
      if (fallback) return fallback[1];
      return typeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Carga todos los datos desde Supabase y actualiza el estado local.
   * Se puede llamar repetidamente para sincronizar.
   */
  async refresh() {
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
        const { data: newsData } = await supabase.from('news').select('*').order('created_at', { ascending: false });

        if (usersData) this.users = this.mapUsersFromDB(usersData);
        if (deptsData) this.departments = deptsData.map((d: any) => ({ id: d.id, name: String(d.name || ''), supervisorIds: d.supervisor_ids || [] }));
        if (reqsData) this.requests = this.mapRequestsFromDB(reqsData);
        if (newsData) this.config.news = newsData.map((n: any) => ({ id: n.id, title: n.title, content: n.content, authorId: n.author_id, createdAt: n.created_at, pinned: n.pinned }));
        
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
        
        // Actualizar el objeto currentUser si ya existe una sesión
        if (this.currentUser) {
            const freshUser = this.users.find(u => u.id === this.currentUser!.id);
            if (freshUser) {
                this.currentUser = { ...freshUser };
                localStorage.setItem('gda_session', JSON.stringify(this.currentUser));
            }
        }

        this.notify();
    } catch (error) {
        console.error("Store Refresh Error:", error);
    }
  }

  async init() {
    if (this.initialized) return;
    try {
        await this.refresh();

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

  private getDefaultEmailTemplates(): EmailTemplate[] {
      return [
          { id: 'request_created', label: 'Ausencia: Nueva Solicitud', subject: 'Nueva solicitud de {tipo} - {empleado}', body: 'Hola,\n\nSe ha registrado una nueva solicitud de {tipo} para el empleado {empleado}.', recipients: { worker: true, supervisor: true, admin: false } },
          { id: 'request_approved', label: 'Ausencia: Aprobada', subject: 'Solicitud Aprobada: {tipo}', body: 'Hola {empleado},\n\nTu solicitud de {tipo} ha sido APROBADA.', recipients: { worker: true, supervisor: false, admin: false } }
      ];
  }

  private mapUsersFromDB(data: any[]): User[] {
      return data.map(u => ({
          id: u.id,
          name: String(u.name || 'Usuario'),
          email: String(u.email || '').trim().toLowerCase(),
          role: u.role as Role,
          departmentId: u.department_id,
          daysAvailable: u.days_available !== null ? Number(u.days_available) : 0,
          overtimeHours: u.overtime_hours !== null ? Number(u.overtime_hours) : 0,
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
    return data.map(n => ({ id: String(n.id), userId: n.user_id, message: String(n.message || ''), read: !!n.read, date: String(n.date || n.created_at || ''), type: n.type }));
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

  isOvertimeRequest(typeId: string) {
    const tid = typeId.toLowerCase();
    return [RequestType.OVERTIME_EARN, RequestType.OVERTIME_PAY, RequestType.OVERTIME_SPEND_DAYS, RequestType.WORKED_HOLIDAY, RequestType.ADJUSTMENT_OVERTIME].includes(typeId as RequestType) || tid.includes('hora') || tid.includes('overtime') || tid.includes('festivo_trabajado');
  }

  private calculateRequestImpact(typeId: string, startDate: string, endDate?: string, hours?: number) {
      let deltaDays = 0; let deltaHours = 0;
      const tid = typeId.toLowerCase();
      const leaveType = this.config.leaveTypes.find(t => t.id === typeId || t.id.toLowerCase() === tid);
      
      const isVacation = tid.includes('vacac');
      const isPersonal = tid.includes('asuntos');
      const isSpendHoursForDays = tid.includes('canje');
      const isUnjustified = tid.includes('justific') || tid.includes('unjustified');
      
      const isPhysicalAbsence = (isVacation || isPersonal || isUnjustified || (leaveType && leaveType.subtractsDays)) && !isSpendHoursForDays;
      
      if (isPhysicalAbsence) {
          const start = new Date(startDate); const end = new Date(endDate || startDate);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            start.setHours(0,0,0,0); end.setHours(0,0,0,0);
            const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            deltaDays = -diffDays;
          }
      }

      if (isSpendHoursForDays || tid.includes('overtime_spend') || tid.includes('canje_horas')) {
          deltaHours = -(hours || 0);
          deltaDays = 0;
      } else if (tid.includes('registro_horas') || tid.includes('overtime_earn')) {
          deltaHours = +(hours || 0);
      } else if (tid.includes('abono') || tid.includes('overtime_pay')) {
          deltaHours = -(hours || 0);
      } else if (tid.includes('ajuste_dias') || tid.includes('adjustment_days')) {
          deltaDays = +(hours || 0);
      } else if (tid.includes('ajuste_horas') || tid.includes('adjustment_overtime')) {
          deltaHours = +(hours || 0);
      } else if (tid.includes('festivo_trabajado') || tid.includes('worked_holiday')) {
          deltaDays = +1;
          deltaHours = +4;
      }
      return { deltaDays, deltaHours };
  }

  async createRequest(data: any, userId: string, status: RequestStatus = RequestStatus.PENDING) {
    let label = data.label || this.getTypeLabel(data.typeId);
    const { data: inserted } = await supabase.from('requests').insert({
      id: crypto.randomUUID(), user_id: userId, type_id: data.typeId, label, start_date: data.startDate, end_date: data.endDate,
      hours: data.hours, reason: data.reason, status, created_at: new Date().toISOString(), overtime_usage: data.overtimeUsage, is_justified: data.isJustified, reported_to_admin: data.reportedToAdmin
    }).select().single();
    
    if (inserted) {
      this.requests.push(this.mapRequestsFromDB([inserted])[0]);
      if (status === RequestStatus.PENDING || status === RequestStatus.APPROVED) {
          const { deltaDays, deltaHours } = this.calculateRequestImpact(data.typeId, data.startDate, data.endDate, data.hours);
          const tid = data.typeId.toLowerCase();
          const isEarning = tid.includes('registro') || tid.includes('festivo') || tid.includes('ajuste');
          if (!isEarning || status === RequestStatus.APPROVED) {
             const u = this.users.find(usr => usr.id === userId);
             if (u) await this.updateUserBalance(userId, u.daysAvailable + deltaDays, u.overtimeHours + deltaHours);
          }
      }
      this.notify();
    }
  }

  async updateRequestStatus(id: string, newStatus: RequestStatus, adminId: string, adminComment?: string) {
    const oldReq = this.requests.find(r => r.id === id);
    if (!oldReq) return;
    const oldStatus = oldReq.status;
    const { deltaDays, deltaHours } = this.calculateRequestImpact(oldReq.typeId, oldReq.startDate, oldReq.endDate, oldReq.hours);
    const tid = oldReq.typeId.toLowerCase();
    const isEarning = tid.includes('registro') || tid.includes('festivo') || tid.includes('ajuste');
    
    let applyChange = false; let multiplier = 0;
    if (oldStatus === RequestStatus.PENDING && newStatus === RequestStatus.APPROVED) { 
        if (isEarning) { applyChange = true; multiplier = 1; } 
    } 
    else if ((oldStatus === RequestStatus.PENDING || oldStatus === RequestStatus.APPROVED) && newStatus === RequestStatus.REJECTED) { 
        if (!isEarning || oldStatus === RequestStatus.APPROVED) { applyChange = true; multiplier = -1; } 
    }
    else if (oldStatus === RequestStatus.REJECTED && (newStatus === RequestStatus.APPROVED || newStatus === RequestStatus.PENDING)) { 
        if (!isEarning || newStatus === RequestStatus.APPROVED) { applyChange = true; multiplier = 1; } 
    }

    if (applyChange) { 
        const u = this.users.find(usr => usr.id === oldReq.userId); 
        if (u) await this.updateUserBalance(u.id, u.daysAvailable + (deltaDays * multiplier), u.overtimeHours + (deltaHours * multiplier)); 
    }

    await supabase.from('requests').update({ status: newStatus, admin_comment: adminComment }).eq('id', id);
    const idx = this.requests.findIndex(r => r.id === id);
    if (idx !== -1) { this.requests[idx].status = newStatus; this.requests[idx].adminComment = adminComment; }
    this.notify();
  }

  async updateUserBalance(id: string, daysAvailable: number, overtimeHours: number) { 
      await supabase.from('users').update({ days_available: daysAvailable, overtime_hours: overtimeHours }).eq('id', id); 
      const idx = this.users.findIndex(u => u.id === id); 
      if (idx !== -1) { 
          this.users[idx].daysAvailable = daysAvailable; 
          this.users[idx].overtimeHours = overtimeHours; 
          this.users = [...this.users];
          if (this.currentUser?.id === id) { 
              this.currentUser = { ...this.users[idx] }; 
              localStorage.setItem('gda_session', JSON.stringify(this.currentUser)); 
          } 
      } 
      this.notify(); 
  }

  async updateRequest(id: string, data: any) {
    const { data: updated } = await supabase.from('requests').update({
      type_id: data.typeId, label: this.getTypeLabel(data.typeId), start_date: data.startDate, end_date: data.endDate, hours: data.hours, reason: data.reason
    }).eq('id', id).select().single();
    if (updated) {
        const idx = this.requests.findIndex(r => r.id === id);
        if (idx !== -1) this.requests[idx] = this.mapRequestsFromDB([updated])[0];
        this.notify();
    }
  }

  async deleteRequest(id: string) { 
      const req = this.requests.find(r => r.id === id); 
      if (!req) return; 
      if (req.status === RequestStatus.APPROVED || req.status === RequestStatus.PENDING) { 
          const { deltaDays, deltaHours } = this.calculateRequestImpact(req.typeId, req.startDate, req.endDate, req.hours); 
          const tid = req.typeId.toLowerCase();
          const isEarning = tid.includes('registro') || tid.includes('festivo') || tid.includes('ajuste');
          if (!isEarning || req.status === RequestStatus.APPROVED) { 
              const u = this.users.find(usr => usr.id === req.userId); 
              if (u) await this.updateUserBalance(u.id, u.daysAvailable - deltaDays, u.overtimeHours - deltaHours); 
          } 
      } 
      await supabase.from('requests').delete().eq('id', id); 
      this.requests = this.requests.filter(r => r.id !== id); 
      this.notify(); 
  }

  async createUser(user: Partial<User>, password: string) { const { data } = await supabase.from('users').insert({ id: crypto.randomUUID(), name: user.name, email: user.email?.trim().toLowerCase(), role: user.role, department_id: user.departmentId, days_available: user.daysAvailable || 0, overtime_hours: user.overtimeHours || 0, password: password || '123456', birthdate: user.birthdate }).select().single(); if (data) { this.users = [...this.users, this.mapUsersFromDB([data])[0]]; this.notify(); } }
  async deleteUser(id: string) { await supabase.from('users').delete().eq('id', id); this.users = this.users.filter(u => u.id !== id); this.notify(); }
  async updateUserAdmin(userId: string, data: Partial<User>) { const { data: updated } = await supabase.from('users').update({ name: data.name, email: data.email?.trim().toLowerCase(), department_id: data.departmentId, birthdate: data.birthdate }).eq('id', userId).select().single(); if (updated) { const idx = this.users.findIndex(u => u.id === userId); if (idx !== -1) { this.users[idx] = { ...this.users[idx], ...this.mapUsersFromDB([updated])[0] }; this.users = [...this.users]; if (this.currentUser?.id === userId) { this.currentUser = { ...this.users[idx] }; localStorage.setItem('gda_session', JSON.stringify(this.currentUser)); } } this.notify(); } }
  async updateUserRole(userId: string, role: Role) { const { data: updated } = await supabase.from('users').update({ role }).eq('id', userId).select().single(); if (updated) { const idx = this.users.findIndex(u => u.id === userId); if (idx !== -1) { this.users[idx].role = role; this.users = [...this.users]; if (this.currentUser?.id === userId) { this.currentUser.role = role; localStorage.setItem('gda_session', JSON.stringify(this.currentUser)); } } this.notify(); } }
  async updateUserProfile(userId: string, data: { name: string; email: string; password?: string; avatar?: string }) { const updateData: any = { name: data.name, email: data.email.trim().toLowerCase(), avatar: data.avatar }; if (data.password) updateData.password = data.password; const { data: updated } = await supabase.from('users').update(updateData).eq('id', userId).select().single(); if (updated) { const idx = this.users.findIndex(u => u.id === userId); if (idx !== -1) { this.users[idx] = { ...this.users[idx], ...this.mapUsersFromDB([updated])[0] }; this.users = [...this.users]; if (this.currentUser?.id === userId) { this.currentUser = { ...this.users[idx] }; localStorage.setItem('gda_session', JSON.stringify(this.currentUser)); } } this.notify(); } }
  getMyRequests() { if (!this.currentUser) return []; return this.requests.filter(r => r.userId === this.currentUser!.id).sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || '')); }
  getNotificationsForUser(userId: string) { return this.notifications.filter(n => n.userId === userId).sort((a,b) => (b.date || '').localeCompare(a.date || '')); }
  getPendingApprovalsForUser(userId: string) { const u = this.users.find(usr => usr.id === userId); if (!u) return []; const depts = u.role === Role.ADMIN ? this.departments.map(d => d.id) : this.departments.filter(d => d.supervisorIds.includes(userId)).map(d => d.id); return this.requests.filter(r => r.status === RequestStatus.PENDING && depts.includes(this.users.find(usr => usr.id === r.userId)?.departmentId || '')); }
  getAvailableOvertimeRecords(userId: string) { return this.requests.filter(r => r.userId === userId && r.status === RequestStatus.APPROVED && (r.typeId.toLowerCase().includes('registro') || r.typeId.toLowerCase().includes('festivo')) && (Number(r.hours || 0) - Number(r.consumedHours || 0)) > 0.01); }
  getShiftForUserDate(userId: string, date: string) { const a = this.config.shiftAssignments.find(as => as.userId === userId && as.date === date); if (!a) return undefined; return this.config.shiftTypes.find(s => s.id === a.shiftTypeId); }
  getNextShift(userId: string) { const today = new Date().toISOString().split('T')[0]; const a = this.config.shiftAssignments.filter(as => as.userId === userId && as.date >= today).sort((a,b) => (a.date || '').localeCompare(b.date || ''))[0]; if (!a) return null; const shift = this.config.shiftTypes.find(s => s.id === a.shiftTypeId); return shift ? { date: a.date, shift } : null; }
  async assignShift(user_id: string, date: string, shift_type_id: string) { if (!shift_type_id) { await supabase.from('shift_assignments').delete().match({ user_id, date }); this.config.shiftAssignments = this.config.shiftAssignments.filter(a => !(a.userId === user_id && a.date === date)); } else { const { data } = await supabase.from('shift_assignments').upsert({ user_id, date, shift_type_id }).select().single(); if (data) { const idx = this.config.shiftAssignments.findIndex(a => a.userId === user_id && a.date === date); const m = { id: data.id, userId: data.user_id, date: data.date, shiftTypeId: data.shift_type_id }; if (idx !== -1) this.config.shiftAssignments[idx] = m; else this.config.shiftAssignments.push(m); } } this.notify(); }
  async markNotificationAsRead(id: string) { await supabase.from('notifications').update({ read: true }).eq('id', id); const n = this.notifications.find(notif => notif.id === id); if (n) n.read = true; this.notify(); }
  async markAllNotificationsAsRead(userId: string) { await supabase.from('notifications').update({ read: true }).eq('user_id', userId); this.notifications.forEach(n => { if (n.userId === userId) n.read = true; }); this.notify(); }
  async deleteNotification(id: string) { await supabase.from('notifications').delete().eq('id', id); this.notifications = this.notifications.filter(n => n.id !== id); this.notify(); }
  async createPPERequest(userId: string, typeId: string, size: string) { const { data } = await supabase.from('ppe_requests').insert({ id: crypto.randomUUID(), user_id: userId, type_id: typeId, size, status: 'PENDIENTE', created_at: new Date().toISOString() }).select().single(); if (data) { this.config.ppeRequests.push({ id: data.id, userId: data.user_id, type_id: data.type_id, typeId: data.type_id, size: data.size, status: data.status, createdAt: data.created_at, deliveryDate: data.delivery_date }); this.notify(); } }
  async deliverPPERequest(id: string) { const d = new Date().toISOString(); await supabase.from('ppe_requests').update({ status: 'ENTREGADO', delivery_date: d }).eq('id', id); const req = this.config.ppeRequests.find(r => r.id === id); if (req) { req.status = 'ENTREGADO'; req.deliveryDate = d; this.notify(); } }
  async createNewsPost(title: string, content: string, authorId: string) { const { data } = await supabase.from('news').insert({ id: crypto.randomUUID(), title, content, author_id: authorId, created_at: new Date().toISOString() }).select().single(); if(data) { this.config.news.unshift({ id: data.id, title: data.title, content: data.content, authorId: data.author_id, createdAt: data.created_at }); this.notify(); } }
  async deleteNewsPost(id: string) { await supabase.from('news').delete().eq('id', id); this.config.news = this.config.news.filter(n => n.id !== id); this.notify(); }
  async createDepartment(name: string, supervisorIds: string[]) { const { data } = await supabase.from('departments').insert({ id: crypto.randomUUID(), name, supervisor_ids: supervisorIds }).select().single(); if(data) { this.departments.push({ id: data.id, name: data.name, supervisorIds: data.supervisor_ids }); this.notify(); } }
  async updateDepartment(id: string, name: string, supervisorIds: string[]) { await supabase.from('departments').update({ name, supervisor_ids: supervisorIds }).eq('id', id); const d = this.departments.find(dep => dep.id === id); if(d) { d.name = name; d.supervisorIds = supervisorIds; this.notify(); } }
  async deleteDepartment(id: string) { await supabase.from('departments').delete().eq('id', id); this.departments = this.departments.filter(d => d.id !== id); this.notify(); }
  async createHoliday(date: string, name: string) { const { data } = await supabase.from('holidays').insert({ id: crypto.randomUUID(), date, name }).select().single(); if (data) { this.config.holidays.push({ id: data.id, date: data.date, name: data.name }); this.notify(); } }
  async updateHoliday(id: string, date: string, name: string) { await supabase.from('holidays').update({ date, name }).eq('id', id); const h = this.config.holidays.find(ho => ho.id === id); if(h) { h.date = date; h.name = name; this.notify(); } }
  async deleteHoliday(id: string) { await supabase.from('holidays').delete().eq('id', id); this.config.holidays = this.config.holidays.filter(h => h.id !== id); this.notify(); }
  async createLeaveType(label: string, subtractsDays: boolean, fixedRanges?: DateRange[] | null) { const { data } = await supabase.from('leave_types').insert({ id: crypto.randomUUID(), label, subtracts_days: subtractsDays, fixed_range: fixedRanges || null }).select().single(); if(data) { this.config.leaveTypes.push({ id: data.id, label: data.label, subtractsDays: !!data.subtracts_days, fixedRanges: fixedRanges || undefined }); this.notify(); } }
  async updateLeaveType(id: string, label: string, subtractsDays: boolean, fixedRanges?: DateRange[] | null) { const { data } = await supabase.from('leave_types').update({ label, subtracts_days: subtractsDays, fixed_range: fixedRanges || null }).eq('id', id).select().single(); if(data) { const idx = this.config.leaveTypes.findIndex(t => t.id === id); if (idx !== -1) this.config.leaveTypes[idx] = { id: data.id, label: data.label, subtractsDays: !!data.subtracts_days, fixedRanges: fixedRanges || undefined }; this.notify(); } }
  async deleteLeaveType(id: string) { await supabase.from('leave_types').delete().eq('id', id); this.config.leaveTypes = this.config.leaveTypes.filter(t => t.id !== id); this.notify(); }
  async createShiftType(name: string, color: string, start: string, end: string) { const { data } = await supabase.from('shift_types').insert({ id: crypto.randomUUID(), name, color, segments: [{start, end}] }).select().single(); if (data) { this.config.shiftTypes.push({ id: data.id, name: data.name, color: data.color, segments: data.segments }); this.notify(); } }
  async deleteShiftType(id: string) { await supabase.from('shift_types').delete().eq('id', id); this.config.shiftTypes = this.config.shiftTypes.filter(s => s.id !== id); this.notify(); }
  async createPPEType(name: string, sizes: string[]) { const { data } = await supabase.from('ppe_types').insert({ id: crypto.randomUUID(), name, sizes }).select().single(); if(data) { this.config.ppeTypes.push({ id: data.id, name: data.name, sizes: data.sizes }); this.notify(); } }
  async updatePPEType(id: string, name: string, sizes: string[]) { const { data } = await supabase.from('ppe_types').update({ name, sizes }).eq('id', id).select().single(); if (data) { const idx = this.config.ppeTypes.findIndex(p => p.id === id); if (idx !== -1) this.config.ppeTypes[idx] = { id: data.id, name: data.name, sizes: data.sizes }; this.notify(); } }
  async deletePPEType(id: string) { await supabase.from('ppe_types').delete().eq('id', id); this.config.ppeTypes = this.config.ppeTypes.filter(p => p.id !== id); this.notify(); }
  async saveSmtpSettings(settings: AppConfig['smtpSettings']) { await supabase.from('settings').upsert({ key: 'smtp', value: settings }); this.config.smtpSettings = settings; this.notify(); }
  async saveEmailTemplates(templates: EmailTemplate[]) { await supabase.from('settings').upsert({ key: 'email_templates', value: templates }); this.config.emailTemplates = templates; this.notify(); }
  async sendMassNotification(userIds: string[], message: string) { const { error } = await supabase.from('notifications').insert(userIds.map(uid => ({ id: crypto.randomUUID(), user_id: uid, message, read: false, created_at: new Date().toISOString(), type: 'admin' }))); if(!error) { userIds.forEach(uid => { this.notifications.push({ id: crypto.randomUUID(), userId: uid, message, read: false, date: new Date().toISOString(), type: 'admin' }); }); this.notify(); } }
  async sendTestEmail(to: string) { try { const { data, error } = await supabase.functions.invoke('send-test-email', { body: { to, config: this.config.smtpSettings } }); if (error) throw error; return true; } catch (err: any) { throw err; } }
  getRequestConflicts(request: LeaveRequest) {
    const user = this.users.find(u => u.id === request.userId);
    if (!user) return [];
    const tid = request.typeId.toLowerCase();
    const isAbsence = tid.includes('vacac') || tid.includes('asuntos') || tid.includes('canje') || tid.includes('unjustified') || tid.includes('justific');
    if (!isAbsence) return [];
    return this.requests.filter(r => {
        if (r.id === request.id || r.status === RequestStatus.REJECTED) return false;
        const otherUser = this.users.find(u => u.id === r.userId);
        if (!otherUser || otherUser.departmentId !== user.departmentId) return false;
        const startA = request.startDate.split('T')[0];
        const endA = (request.endDate || request.startDate).split('T')[0];
        const startB = r.startDate.split('T')[0];
        const endB = (r.endDate || r.startDate).split('T')[0];
        return (startA <= endB && endA >= startB);
    });
  }
}

export const store = new Store();


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
        const { data: usersData } = await supabase.from('users').select('*');
        const { data: deptsData } = await supabase.from('departments').select('*');
        const { data: reqsData } = await supabase.from('requests').select('*');
        const { data: typesData } = await supabase.from('leave_types').select('*');
        const { data: ppeTypes } = await supabase.from('ppe_types').select('*');
        const { data: ppeReqsData } = await supabase.from('ppe_requests').select('*');
        const { data: newsData } = await supabase.from('news').select('*').order('created_at', { ascending: false });
        const { data: holidayData } = await supabase.from('holidays').select('*');
        const { data: shiftTypesData } = await supabase.from('shift_types').select('*');
        const { data: assignmentsData } = await supabase.from('shift_assignments').select('*');
        
        // Carga de Repartidores
        const { data: trucksData } = await supabase.from('trucks').select('*');
        const { data: driversData } = await supabase.from('drivers').select('*');
        const { data: driversPpeData } = await supabase.from('drivers_ppe').select('*');

        if (usersData) this.users = this.mapUsersFromDB(usersData);
        if (deptsData) this.departments = deptsData.map((d: any) => ({ id: d.id, name: String(d.name || ''), supervisorIds: d.supervisor_ids || [] }));
        if (reqsData) this.requests = this.mapRequestsFromDB(reqsData);
        if (newsData) this.config.news = newsData;
        if (typesData) this.config.leaveTypes = typesData.map((t: any) => ({ id: t.id, label: t.label, subtractsDays: !!t.subtracts_days, fixedRanges: t.fixed_range }));
        if (ppeTypes) this.config.ppeTypes = ppeTypes.map((p: any) => ({ id: p.id, name: p.name, sizes: p.sizes || [] }));
        if (ppeReqsData) this.config.ppeRequests = ppeReqsData.map((p: any) => ({ id: p.id, userId: p.user_id, typeId: p.type_id, size: p.size, status: p.status, createdAt: p.created_at, deliveryDate: p.delivery_date }));
        if (holidayData) this.config.holidays = holidayData;
        if (shiftTypesData) this.config.shiftTypes = shiftTypesData;
        if (assignmentsData) this.config.shiftAssignments = assignmentsData.map((a: any) => ({ id: a.id, userId: a.user_id, date: a.date, shiftTypeId: a.shift_type_id }));
        
        // Mapeo Repartidores
        if (trucksData) this.config.trucks = trucksData;
        if (driversData) this.config.drivers = driversData.map((d: any) => ({ id: d.id, name: d.name, truckId: d.truck_id }));
        if (driversPpeData) this.config.driversPpe = driversPpeData.map((p: any) => ({ 
            id: p.id, driverId: p.driver_id, typeId: p.type_id, size: p.size, status: p.status, createdAt: p.created_at, deliveryDate: p.delivery_date 
        }));

        // Load notifications for current user
        if (this.currentUser) {
            const { data: notifsData } = await supabase.from('notifications').select('*').eq('user_id', this.currentUser.id).order('date', { ascending: false });
            if (notifsData) this.notifications = notifsData.map((n: any) => ({ id: n.id, userId: n.user_id, message: n.message, read: n.read, date: n.date, type: n.type }));
        }

        this.notify();
    } catch (error) {
        console.error("Store Refresh Error:", error);
    }
  }

  async init() {
    if (this.initialized) return;
    const savedUser = localStorage.getItem('gda_session');
    if (savedUser) {
        const parsed = JSON.parse(savedUser);
        this.currentUser = parsed;
    }
    await this.refresh();
    this.initialized = true;
    this.notify();
  }

  private mapUsersFromDB(data: any[]): User[] {
      return data.map(u => ({
          id: u.id, name: u.name, email: u.email, role: u.role, departmentId: u.department_id,
          daysAvailable: Number(u.days_available || 0), overtimeHours: Number(u.overtime_hours || 0),
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`, 
          birthdate: u.birthdate, truckNumber: u.truck_number
      }));
  }

  private mapRequestsFromDB(data: any[]): LeaveRequest[] {
      return data.map(r => ({
          id: String(r.id), userId: r.user_id, typeId: r.type_id, label: r.label, startDate: r.start_date, endDate: r.end_date,
          hours: r.hours, reason: r.reason, status: r.status, createdAt: r.created_at, adminComment: r.admin_comment,
          isConsumed: !!r.is_consumed, consumedHours: Number(r.consumed_hours || 0), overtimeUsage: r.overtime_usage || []
      }));
  }

  // --- REQUISITOS DEL STORE ---

  isOvertimeRequest(typeId: string): boolean {
      return [
          RequestType.OVERTIME_EARN,
          RequestType.OVERTIME_SPEND_DAYS,
          RequestType.OVERTIME_PAY,
          RequestType.WORKED_HOLIDAY,
          RequestType.ADJUSTMENT_OVERTIME
      ].includes(typeId as RequestType);
  }

  async createRequest(data: any, userId: string, status: RequestStatus, silent: boolean = false) {
      const { data: newReq } = await supabase.from('requests').insert({
          id: crypto.randomUUID(),
          user_id: userId,
          type_id: data.typeId,
          label: data.label || this.getTypeLabel(data.typeId),
          start_date: data.startDate,
          end_date: data.endDate,
          hours: data.hours,
          reason: data.reason,
          status: status,
          created_at: new Date().toISOString()
      }).select().single();

      if (newReq) {
          await this.refresh();
          if (status === RequestStatus.APPROVED) {
              await this.applyRequestToBalance(newReq);
          }
      }
  }

  async updateRequest(id: string, data: any) {
      const { error } = await supabase.from('requests').update({
          type_id: data.typeId,
          label: data.label || this.getTypeLabel(data.typeId),
          start_date: data.startDate,
          end_date: data.endDate,
          hours: data.hours,
          reason: data.reason
      }).eq('id', id);
      if (!error) await this.refresh();
  }

  async deleteRequest(id: string) {
      const { error } = await supabase.from('requests').delete().eq('id', id);
      if (!error) await this.refresh();
  }

  async updateRequestStatus(id: string, status: RequestStatus, adminId: string, comment?: string) {
      const { data: updated } = await supabase.from('requests').update({
          status,
          admin_comment: comment
      }).eq('id', id).select().single();

      if (updated) {
          if (status === RequestStatus.APPROVED) {
              await this.applyRequestToBalance(updated);
          }
          await this.createNotification(updated.user_id, `Tu solicitud de ${this.getTypeLabel(updated.type_id)} ha sido ${status}${comment ? ': ' + comment : '.'}`, 'system');
          await this.refresh();
      }
  }

  private async applyRequestToBalance(req: any) {
      const user = this.users.find(u => u.id === req.user_id);
      if (!user) return;
      let newDays = user.daysAvailable;
      let newHours = user.overtimeHours;
      const typeId = req.type_id;
      if (typeId === RequestType.ADJUSTMENT_DAYS) newDays += Number(req.hours || 0);
      else if (typeId === RequestType.ADJUSTMENT_OVERTIME) newHours += Number(req.hours || 0);
      else if (this.isOvertimeRequest(typeId)) {
          if (typeId === RequestType.OVERTIME_EARN || typeId === RequestType.WORKED_HOLIDAY) {
              newHours += Number(req.hours || 0);
              if (typeId === RequestType.WORKED_HOLIDAY) newDays += 1;
          } else {
              newHours -= Number(req.hours || 0);
          }
      } else {
          const leaveType = this.config.leaveTypes.find(t => t.id === typeId);
          const subtracts = leaveType ? leaveType.subtractsDays : (typeId === RequestType.VACATION || typeId === RequestType.PERSONAL);
          if (subtracts) {
              const start = new Date(req.start_date);
              const end = new Date(req.end_date || req.start_date);
              const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              newDays -= diff;
          }
      }
      await supabase.from('users').update({ days_available: newDays, overtime_hours: newHours }).eq('id', user.id);
  }

  getRequestConflicts(request: LeaveRequest): LeaveRequest[] {
      const u = this.users.find(usr => usr.id === request.userId);
      if (!u) return [];
      const start = request.startDate.split('T')[0];
      const end = (request.endDate || request.startDate).split('T')[0];
      return this.requests.filter(r => {
          if (r.id === request.id || r.status === RequestStatus.REJECTED) return false;
          if (this.isOvertimeRequest(r.typeId)) return false;
          const otherUser = this.users.find(usr => usr.id === r.userId);
          if (!otherUser || otherUser.departmentId !== u.departmentId) return false;
          const rStart = r.startDate.split('T')[0];
          const rEnd = (r.endDate || r.startDate).split('T')[0];
          return (start <= rEnd && end >= rStart);
      });
  }

  getAvailableOvertimeRecords(userId: string): LeaveRequest[] {
      return this.requests.filter(r => r.userId === userId && r.status === RequestStatus.APPROVED && (r.typeId === RequestType.OVERTIME_EARN || r.typeId === RequestType.WORKED_HOLIDAY) && !r.isConsumed);
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

  async createLeaveType(label: string, subtractsDays: boolean, fixedRanges: DateRange[] | null) {
      await supabase.from('leave_types').insert({ id: crypto.randomUUID(), label, subtracts_days: subtractsDays, fixed_range: fixedRanges });
      await this.refresh();
  }

  async updateLeaveType(id: string, label: string, subtractsDays: boolean, fixedRanges: DateRange[] | null) {
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
      await supabase.from('ppe_types').insert({ id: crypto.randomUUID(), name, sizes });
      await this.refresh();
  }

  async updatePPEType(id: string, name: string, sizes: string[]) {
      await supabase.from('ppe_types').update({ name, sizes }).eq('id', id);
      await this.refresh();
  }

  async deletePPEType(id: string) {
      await supabase.from('ppe_types').delete().eq('id', id);
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

  async saveEmailTemplates(templates: EmailTemplate[]) {
      await supabase.from('settings').upsert({ id: 'email_templates', value: templates });
      await this.refresh();
  }

  async saveSmtpSettings(settings: any) {
      await supabase.from('settings').upsert({ id: 'smtp_settings', value: settings });
      await this.refresh();
  }

  async createUser(data: any, pass: string) {
      await supabase.from('users').insert({
          id: crypto.randomUUID(), name: data.name, email: data.email, password: pass, role: data.role,
          department_id: data.departmentId, days_available: data.daysAvailable, overtime_hours: data.overtimeHours,
          birthdate: data.birthdate, avatar: data.avatar, truck_number: data.truckNumber
      });
      await this.refresh();
  }

  async updateUserAdmin(id: string, data: any) {
      await supabase.from('users').update({ name: data.name, email: data.email, department_id: data.departmentId, birthdate: data.birthdate, avatar: data.avatar, truck_number: data.truckNumber }).eq('id', id);
      await this.refresh();
  }

  async updateUserRole(id: string, role: Role) {
      await supabase.from('users').update({ role }).eq('id', id);
      await this.refresh();
  }

  async updateUserProfile(id: string, data: any) {
      const obj: any = { name: data.name, email: data.email, avatar: data.avatar };
      if (data.password) obj.password = data.password;
      await supabase.from('users').update(obj).eq('id', id);
      if (this.currentUser?.id === id) this.currentUser = { ...this.currentUser, ...obj };
      await this.refresh();
  }

  async deleteUser(id: string) {
      await supabase.from('users').delete().eq('id', id);
      await this.refresh();
  }

  async createNotification(userId: string, message: string, type: 'system' | 'admin' = 'system') {
      await supabase.from('notifications').insert({ id: crypto.randomUUID(), user_id: userId, message, read: false, date: new Date().toISOString(), type });
      await this.refresh();
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

  async createPPERequest(userId: string, typeId: string, size: string) {
      await supabase.from('ppe_requests').insert({ id: crypto.randomUUID(), user_id: userId, type_id: typeId, size, status: 'PENDIENTE', created_at: new Date().toISOString() });
      await this.refresh();
  }

  async markPPEAsRequested(id: string) {
      await supabase.from('ppe_requests').update({ status: 'SOLICITADO' }).eq('id', id);
      await this.refresh();
  }

  async deliverPPERequest(id: string) {
      await supabase.from('ppe_requests').update({ status: 'ENTREGADO', delivery_date: new Date().toISOString() }).eq('id', id);
      await this.refresh();
  }

  async deletePPERequest(id: string) {
      await supabase.from('ppe_requests').delete().eq('id', id);
      await this.refresh();
  }

  async assignShift(userId: string, date: string, shiftTypeId: string) {
      if (!shiftTypeId) await supabase.from('shift_assignments').delete().eq('user_id', userId).eq('date', date);
      else await supabase.from('shift_assignments').upsert({ user_id: userId, date, shift_type_id: shiftTypeId }, { onConflict: 'user_id,date' });
      await this.refresh();
  }

  async exportConfig() {
      return JSON.stringify({ leaveTypes: this.config.leaveTypes, ppeTypes: this.config.ppeTypes, holidays: this.config.holidays, emailTemplates: this.config.emailTemplates }, null, 2);
  }

  async importConfig(json: string) {
      try {
          const data = JSON.parse(json);
          // Simplified implementation for restoration
          if (data.leaveTypes) {
              await supabase.from('leave_types').delete().neq('id', '0');
              await supabase.from('leave_types').insert(data.leaveTypes.map((t: any) => ({ id: t.id, label: t.label, subtracts_days: t.subtractsDays, fixed_range: t.fixedRanges })));
          }
          await this.refresh();
          return true;
      } catch (e) { return false; }
  }

  // --- MÉTODOS GESTIÓN REPARTIDORES ---

  async createTruck(name: string) {
      const { data } = await supabase.from('trucks').insert({ id: crypto.randomUUID(), name }).select().single();
      if (data) { this.config.trucks.push(data); this.notify(); }
  }

  async deleteTruck(id: string) {
      await supabase.from('drivers').delete().eq('truck_id', id);
      await supabase.from('trucks').delete().eq('id', id);
      this.config.trucks = this.config.trucks.filter(t => t.id !== id);
      this.config.drivers = this.config.drivers.filter(d => d.truckId !== id);
      this.notify();
  }

  async createDriver(name: string, truckId: string) {
      const { data } = await supabase.from('drivers').insert({ id: crypto.randomUUID(), name, truck_id: truckId }).select().single();
      if (data) { this.config.drivers.push({ id: data.id, name: data.name, truckId: data.truck_id }); this.notify(); }
  }

  async deleteDriver(id: string) {
      await supabase.from('drivers_ppe').delete().eq('driver_id', id);
      await supabase.from('drivers').delete().eq('id', id);
      this.config.drivers = this.config.drivers.filter(d => d.id !== id);
      this.config.driversPpe = this.config.driversPpe.filter(p => p.driverId !== id);
      this.notify();
  }

  async createDriverPPE(driverId: string, typeId: string, size: string) {
      const { data } = await supabase.from('drivers_ppe').insert({ 
          id: crypto.randomUUID(), driver_id: driverId, type_id: typeId, size, status: 'PENDIENTE', created_at: new Date().toISOString() 
      }).select().single();
      if (data) { 
          this.config.driversPpe.push({ 
              id: data.id, driverId: data.driver_id, typeId: data.type_id, size: data.size, status: data.status, createdAt: data.created_at 
          }); 
          this.notify(); 
      }
  }

  async updateDriverPPEStatus(id: string, status: 'SOLICITADO' | 'ENTREGADO') {
      const updateData: any = { status };
      if (status === 'ENTREGADO') updateData.delivery_date = new Date().toISOString();
      await supabase.from('drivers_ppe').update(updateData).eq('id', id);
      const req = this.config.driversPpe.find(r => r.id === id);
      if (req) { 
          req.status = status; 
          if (status === 'ENTREGADO') req.deliveryDate = updateData.delivery_date;
          this.notify(); 
      }
  }

  async deleteDriverPPE(id: string) {
      await supabase.from('drivers_ppe').delete().eq('id', id);
      this.config.driversPpe = this.config.driversPpe.filter(p => p.id !== id);
      this.notify();
  }

  // --- OTROS MÉTODOS ---

  async login(email: string, pass: string): Promise<User | null> {
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

  getNotificationsForUser(id: string) { return this.notifications.filter(n => n.userId === id); }
  getPendingApprovalsForUser(id: string) { return this.requests.filter(r => r.status === 'PENDIENTE'); }
  getMyRequests() { return this.requests.filter(r => r.userId === this.currentUser?.id); }
  getNextShift(userId: string) {
      const today = new Date().toISOString().split('T')[0];
      const next = this.config.shiftAssignments
          .filter(a => a.userId === userId && a.date >= today)
          .sort((a,b) => a.date.localeCompare(b.date))[0];
      if (next) return { date: next.date, shift: this.config.shiftTypes.find(s => s.id === next.shiftTypeId) };
      return null;
  }
  getShiftForUserDate(id: string, d: string) { 
      const assignment = this.config.shiftAssignments.find(a => a.userId === id && a.date === d);
      return assignment ? this.config.shiftTypes.find(s => s.id === assignment.shiftTypeId) : undefined;
  }
  getTypeLabelDynamic(id: string) { return this.getTypeLabel(id); }
}

export const store = new Store();

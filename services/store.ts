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
            id: p.id, driverId: p.driver_id, typeId: p.type_id, size: p.size, status: p.status, createdAt: p.created_at, requestedDate: p.requested_date, deliveryDate: p.delivery_date 
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

  isOvertimeRequest(typeId: string): boolean {
      return [
          RequestType.OVERTIME_EARN,
          RequestType.OVERTIME_SPEND_DAYS,
          RequestType.OVERTIME_PAY,
          RequestType.WORKED_HOLIDAY,
          RequestType.ADJUSTMENT_OVERTIME
      ].includes(typeId as RequestType);
  }

  // Implementation of applyRequestToBalance to update user balances in Supabase
  async applyRequestToBalance(req: LeaveRequest) {
    const user = this.users.find(u => u.id === req.userId);
    if (!user) return;

    const isOvertime = this.isOvertimeRequest(req.typeId);
    let daysDelta = 0;
    let hoursDelta = 0;

    if (isOvertime) {
        hoursDelta = req.hours || 0;
        if ([RequestType.OVERTIME_SPEND_DAYS, RequestType.OVERTIME_PAY].includes(req.typeId as RequestType)) {
            hoursDelta = -Math.abs(hoursDelta);
        }
    } else {
        const typeConfig = this.config.leaveTypes.find(t => t.id === req.typeId);
        if (typeConfig?.subtractsDays || req.typeId === RequestType.VACATION || req.typeId === RequestType.PERSONAL) {
            const start = new Date(req.startDate);
            const end = new Date(req.endDate || req.startDate);
            daysDelta = -(Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }
    }

    if (daysDelta !== 0 || hoursDelta !== 0) {
        await supabase.from('users').update({
            days_available: (user.daysAvailable || 0) + daysDelta,
            overtime_hours: (user.overtimeHours || 0) + hoursDelta
        }).eq('id', user.id);
        await this.refresh();
    }
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
              await this.applyRequestToBalance(this.mapRequestsFromDB([newReq])[0]);
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

  // Completing updateRequestStatus and fixing RequestStatus comparison
  async updateRequestStatus(id: string, status: RequestStatus, adminId: string, comment?: string) {
      const { data: updated } = await supabase.from('requests').update({
          status,
          admin_comment: comment
      }).eq('id', id).select().single();

      if (updated) {
          if (status === RequestStatus.APPROVED) {
              const req = this.mapRequestsFromDB([updated])[0];
              await this.applyRequestToBalance(req);
          }
          await this.refresh();
      }
  }

  async login(email: string, pass: string): Promise<User | null> {
    const { data: userData } = await supabase.from('users').select('*').eq('email', email).single();
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
        const myDeptIds = this.departments.filter(d => d.supervisorIds.includes(userId)).map(d => d.id);
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
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (!error) await this.refresh();
  }

  async markAllNotificationsAsRead(userId: string) {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
    if (!error) await this.refresh();
  }

  async deleteNotification(id: string) {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) await this.refresh();
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
    const a = this.config.shiftAssignments.find(a => a.userId === userId && a.date === date);
    return a ? this.config.shiftTypes.find(s => s.id === a.shiftTypeId) : undefined;
  }

  getRequestConflicts(req: LeaveRequest) {
    if (this.isOvertimeRequest(req.typeId)) return [];
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
    return this.requests.filter(r => 
        r.userId === userId && 
        r.typeId === RequestType.OVERTIME_EARN && 
        r.status === RequestStatus.APPROVED &&
        (r.hours || 0) > (r.consumedHours || 0)
    );
  }

  async createUser(data: any, pass: string) {
    const { data: newUser } = await supabase.from('users').insert({
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        role: data.role,
        department_id: data.departmentId,
        days_available: data.daysAvailable,
        overtime_hours: data.overtimeHours,
        birthdate: data.birthdate,
        avatar: data.avatar,
        truck_number: data.truckNumber
    }).select().single();
    if (newUser) await this.refresh();
  }

  async updateUserAdmin(id: string, data: any) {
    const { error } = await supabase.from('users').update({
        name: data.name,
        email: data.email,
        department_id: data.departmentId,
        birthdate: data.birthdate,
        avatar: data.avatar,
        truck_number: data.truckNumber
    }).eq('id', id);
    if (!error) await this.refresh();
  }

  async updateUserRole(id: string, role: Role) {
    await supabase.from('users').update({ role }).eq('id', id);
    await this.refresh();
  }

  async updateUserProfile(id: string, data: any) {
    await supabase.from('users').update({
        name: data.name,
        email: data.email,
        avatar: data.avatar
    }).eq('id', id);
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
    if (!shiftTypeId) {
        await supabase.from('shift_assignments').delete().eq('user_id', userId).eq('date', date);
    } else {
        const { data: existing } = await supabase.from('shift_assignments').select('*').eq('user_id', userId).eq('date', date).single();
        if (existing) {
            await supabase.from('shift_assignments').update({ shift_type_id: shiftTypeId }).eq('id', existing.id);
        } else {
            await supabase.from('shift_assignments').insert({ id: crypto.randomUUID(), user_id: userId, date, shift_type_id: shiftTypeId });
        }
    }
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

  async createNewsPost(title: string, content: string, authorId: string) {
    await supabase.from('news').insert({ id: crypto.randomUUID(), title, content, author_id: authorId, created_at: new Date().toISOString() });
    await this.refresh();
  }

  async deleteNewsPost(id: string) {
    await supabase.from('news').delete().eq('id', id);
    await this.refresh();
  }

  async sendMassNotification(userIds: string[], message: string) {
    const notifs = userIds.map(uid => ({ id: crypto.randomUUID(), user_id: uid, message, read: false, date: new Date().toISOString() }));
    await supabase.from('notifications').insert(notifs);
    await this.refresh();
  }

  async saveSmtpSettings(settings: any) {
    this.config.smtpSettings = settings;
    this.notify();
  }

  async saveEmailTemplates(templates: EmailTemplate[]) {
    this.config.emailTemplates = templates;
    this.notify();
  }

  async exportConfig() {
    return JSON.stringify({
        leaveTypes: this.config.leaveTypes,
        ppeTypes: this.config.ppeTypes,
        holidays: this.config.holidays,
        emailTemplates: this.config.emailTemplates
    });
  }

  async importConfig(json: string) {
    try {
        const data = JSON.parse(json);
        this.config.leaveTypes = data.leaveTypes || [];
        this.config.ppeTypes = data.ppeTypes || [];
        this.config.holidays = data.holidays || [];
        this.config.emailTemplates = data.emailTemplates || [];
        this.notify();
        return true;
    } catch { return false; }
  }

  // --- REPARTIDORES ---

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

  async updateDriverPPEStatus(id: string, status: 'PENDIENTE' | 'SOLICITADO' | 'ENTREGADO') {
    const data: any = { status };
    if (status === 'SOLICITADO') data.requested_date = new Date().toISOString();
    if (status === 'ENTREGADO') data.delivery_date = new Date().toISOString();
    await supabase.from('drivers_ppe').update(data).eq('id', id);
    await this.refresh();
  }

  async deleteDriverPPE(id: string) {
    await supabase.from('drivers_ppe').delete().eq('id', id);
    await this.refresh();
  }
}

// Exporting the store instance
export const store = new Store();
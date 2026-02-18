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

  private mapUser(u: any): User {
    return {
      ...u,
      id: String(u.id),
      departmentId: String(u.department_id),
      daysAvailable: Number(u.days_available ?? 0),
      overtimeHours: Number(u.overtime_hours ?? 0),
      avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}`,
      truckNumber: u.truck_number
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

  async refresh() {
    try {
        const fetchT = async (table: string, query: any = null) => {
            const { data, error } = await (query || supabase.from(table).select('*'));
            if (error) throw error;
            return data;
        };

        const [u, d, r, lt, pt, pr, nw, hl, st, sa, tr, dr, dp, sett] = await Promise.all([
            fetchT('users'),
            fetchT('departments'),
            fetchT('requests'),
            fetchT('leave_types'),
            fetchT('ppe_types'),
            fetchT('ppe_requests'),
            fetchT('news', supabase.from('news').select('*').order('created_at', { ascending: false })),
            fetchT('holidays'),
            fetchT('shift_types'),
            fetchT('shift_assignments'),
            fetchT('trucks'),
            fetchT('drivers'),
            fetchT('drivers_ppe'),
            fetchT('settings')
        ]);

        this.users = u.map((x: any) => this.mapUser(x));
        this.departments = d.map((x: any) => ({ 
            id: String(x.id), name: String(x.name || ''), supervisorIds: (x.supervisor_ids || []).map((id: any) => String(id))
        }));
        this.requests = r.map((r: any) => ({
            id: String(r.id), userId: String(r.user_id), typeId: String(r.type_id), label: r.label, 
            startDate: r.start_date, endDate: r.end_date, hours: r.hours, reason: r.reason, 
            status: r.status, createdAt: r.created_at, adminComment: r.admin_comment,
            resolvedBy: r.resolved_by ? String(r.resolved_by) : undefined,
            consumedHours: Number(r.consumed_hours || 0), overtimeUsage: r.overtime_usage || []
        }));
        this.config.news = nw;
        this.config.leaveTypes = lt.map((t: any) => ({ id: String(t.id), label: t.label, subtractsDays: !!t.subtracts_days, fixedRanges: t.fixed_range || [] }));
        this.config.ppeTypes = pt.map((p: any) => ({ id: String(p.id), name: p.name, sizes: p.sizes || [], stock: p.stock || {} }));
        this.config.ppeRequests = pr.map((p: any) => ({ id: String(p.id), userId: String(p.user_id), type_id: String(p.type_id), size: p.size, status: p.status, createdAt: p.created_at, deliveryDate: p.delivery_date }));
        this.config.holidays = hl.map((h: any) => ({ id: String(h.id), date: h.date, name: h.name }));
        this.config.shiftTypes = st.map((s: any) => ({ ...s, id: String(s.id) }));
        this.config.shiftAssignments = sa.map((a: any) => ({ id: String(a.id), userId: String(a.user_id), date: a.date, shiftTypeId: String(a.shift_type_id || '') }));
        this.config.trucks = tr.map((t: any) => ({ id: String(t.id), name: t.name }));
        this.config.drivers = dr.map((d: any) => ({ id: String(d.id), name: d.name, truckId: String(d.truck_id) }));
        this.config.driversPpe = dp.map((p: any) => ({ id: String(p.id), driverId: String(p.driver_id), typeId: String(p.type_id), size: p.size, status: p.status, createdAt: p.created_at, requestedDate: p.requested_date, deliveryDate: p.delivery_date }));

        if (sett) {
            const smtpRow = sett.find((r: any) => r.key === 'smtp');
            const templatesRow = sett.find((r: any) => r.key === 'email_templates');
            if (smtpRow?.value) this.config.smtpSettings = smtpRow.value;
            if (templatesRow?.value) this.config.emailTemplates = templatesRow.value;
        }

        if (this.currentUser) {
            const updatedSelf = this.users.find(u => u.id === this.currentUser!.id);
            if (updatedSelf) this.currentUser = updatedSelf;
            const { data: n } = await supabase.from('notifications').select('*').eq('user_id', this.currentUser.id).order('date', { ascending: false });
            if (n) this.notifications = n.map((x: any) => ({ id: String(x.id), userId: String(x.user_id), message: x.message, read: x.read, date: x.date, type: x.type }));
        }
        this.notify();
    } catch (error) { console.error("Store Refresh Error:", error); }
  }

  async init() {
    if (this.initialized) return;
    const saved = localStorage.getItem('gda_session');
    if (saved) this.currentUser = this.mapUser(JSON.parse(saved));
    await this.refresh();
    this.initialized = true;
  }

  async assignShiftsBatch(changes: { userId: string, date: string, shiftTypeId: string }[]) {
    if (changes.length === 0) return;
    try {
        const groups: Record<string, typeof changes> = {};
        changes.forEach(c => {
            if (!groups[c.userId]) groups[c.userId] = [];
            groups[c.userId].push(c);
        });

        for (const [uid, userChanges] of Object.entries(groups)) {
            const dates = userChanges.map(c => c.date);
            await supabase.from('shift_assignments').delete().eq('user_id', uid).in('date', dates);
            const inserts = userChanges.filter(c => c.shiftTypeId !== '').map(c => ({
                user_id: uid,
                date: c.date,
                shift_type_id: c.shiftTypeId
            }));
            if (inserts.length > 0) {
                const { error } = await supabase.from('shift_assignments').insert(inserts);
                if (error) throw error;
            }
        }
        await this.refresh();
    } catch (e) { console.error("Batch Save Error:", e); throw e; }
  }

  async createRequest(d: any, uid: string, s: RequestStatus) {
      await supabase.from('requests').insert({ 
        id: crypto.randomUUID(), 
        user_id: uid, 
        type_id: d.typeId, 
        label: d.label || this.getTypeLabel(d.typeId), 
        start_date: d.startDate, 
        end_date: d.endDate, 
        hours: d.hours, 
        reason: d.reason, 
        status: s, 
        created_at: new Date().toISOString(),
        overtime_usage: d.overtimeUsage || [] 
      });
      await this.refresh();
  }

  async updateRequest(id: string, d: any) {
    await supabase.from('requests').update({ 
        type_id: d.typeId, 
        start_date: d.startDate, 
        end_date: d.endDate, 
        hours: d.hours, 
        reason: d.reason,
        overtime_usage: d.overtimeUsage || [] 
    }).eq('id', id);
    await this.refresh();
  }

  async updateRequestStatus(id: string, s: RequestStatus, aid: string, c?: string) {
      const req = this.requests.find(r => r.id === id);
      if (req && s === RequestStatus.APPROVED) {
          if (req.overtimeUsage && req.overtimeUsage.length > 0) {
              for (const usage of req.overtimeUsage) {
                  const source = this.requests.find(r => r.id === usage.requestId);
                  if (source) {
                      const newConsumed = (source.consumedHours || 0) + usage.hoursUsed;
                      await supabase.from('requests').update({ consumed_hours: newConsumed }).eq('id', usage.requestId);
                  }
              }
          }

          const targetUser = this.users.find(u => u.id === req.userId);
          if (targetUser) {
              const isOvertime = this.isOvertimeRequest(req.typeId);
              if (isOvertime) {
                  const newBalance = targetUser.overtimeHours + (req.hours || 0);
                  await supabase.from('users').update({ overtime_hours: newBalance }).eq('id', req.userId);
              } else {
                  const isSickness = req.typeId === RequestType.SICKNESS;
                  const isUnjustified = req.typeId === RequestType.UNJUSTIFIED;
                  const currentType = this.config.leaveTypes.find(t => t.id === req.typeId);
                  const subtracts = currentType ? currentType.subtractsDays : true;

                  if (subtracts && !isSickness && !isUnjustified) {
                      const start = new Date(req.startDate);
                      const end = new Date(req.endDate || req.startDate);
                      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      const newBalance = targetUser.daysAvailable - diffDays;
                      await supabase.from('users').update({ days_available: newBalance }).eq('id', req.userId);
                  }
                  
                  if (req.typeId === RequestType.OVERTIME_TO_DAYS) {
                      const daysAdded = Math.abs(req.hours || 0) / 8;
                      const newBalance = targetUser.daysAvailable + daysAdded;
                      await supabase.from('users').update({ days_available: newBalance }).eq('id', req.userId);
                  }
              }
          }
      }

      await supabase.from('requests').update({ status: s, admin_comment: c || '', resolved_by: aid }).eq('id', id);
      await this.refresh();
  }

  async deleteRequest(id: string) { await supabase.from('requests').delete().eq('id', id); await this.refresh(); }
  async markNotificationAsRead(id: string) { await supabase.from('notifications').update({ read: true }).eq('id', id); await this.refresh(); }
  async markAllNotificationsAsRead(uid: string) { await supabase.from('notifications').update({ read: true }).eq('user_id', uid); await this.refresh(); }
  async deleteNotification(id: string) { await supabase.from('notifications').delete().eq('id', id); await this.refresh(); }
  getMyRequests() { return this.requests.filter(r => r.userId === this.currentUser?.id).sort((a,b) => b.startDate.localeCompare(a.startDate)); }
  getNotificationsForUser(uid: string) { return this.notifications.filter(n => n.userId === uid); }
  getShiftForUserDate(uid: string, d: string) { return this.config.shiftTypes.find(s => s.id === this.config.shiftAssignments.find(a => a.userId === uid && a.date === d)?.shiftTypeId); }
  getPendingApprovalsForUser(uid: string) {
    const u = this.users.find(x => x.id === uid);
    if (!u) return [];
    if (u.role === Role.ADMIN) return this.requests.filter(r => r.status === RequestStatus.PENDING);
    if (u.role === Role.SUPERVISOR) {
        const dIds = this.departments.filter(d => (d.supervisorIds || []).includes(uid)).map(d => d.id);
        return this.requests.filter(r => r.status === RequestStatus.PENDING && dIds.includes(this.users.find(x => x.id === r.userId)?.departmentId || ''));
    }
    return [];
  }
  isOvertimeRequest(t: string) { return [RequestType.OVERTIME_EARN, RequestType.OVERTIME_SPEND_DAYS, RequestType.OVERTIME_TO_DAYS, RequestType.OVERTIME_PAY, RequestType.WORKED_HOLIDAY, RequestType.ADJUSTMENT_OVERTIME].includes(t as RequestType); }
  getRequestConflicts(r: LeaveRequest) {
    const u = this.users.find(x => x.id === r.userId);
    if (!u) return [];
    return this.requests.filter(x => x.id !== r.id && x.status !== RequestStatus.REJECTED && !this.isOvertimeRequest(x.typeId) && this.users.find(y => y.id === x.userId)?.departmentId === u.departmentId && r.startDate.split('T')[0] <= (x.endDate || x.startDate).split('T')[0] && (r.endDate || r.startDate).split('T')[0] >= x.startDate.split('T')[0]);
  }
  getAvailableOvertimeRecords(uid: string) { return this.requests.filter(r => r.userId === uid && r.status === RequestStatus.APPROVED && (r.typeId === RequestType.OVERTIME_EARN || r.typeId === RequestType.WORKED_HOLIDAY) && (r.hours || 0) > (r.consumedHours || 0)); }
  async login(email: string, pass: string) {
    const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (data) {
        this.currentUser = this.mapUser(data);
        localStorage.setItem('gda_session', JSON.stringify(this.currentUser));
        await this.refresh();
        return this.currentUser;
    }
    return null;
  }
  logout() { this.currentUser = null; localStorage.removeItem('gda_session'); this.notify(); }
  async createUser(d: any, p: string) { await supabase.from('users').insert({ id: crypto.randomUUID(), ...d, department_id: d.departmentId, password: p }); await this.refresh(); }
  async updateUserAdmin(id: string, d: any) { const { departmentId, ...rest } = d; await supabase.from('users').update({ ...rest, department_id: departmentId }).eq('id', id); await this.refresh(); }
  async updateUserProfile(id: string, d: any) { await supabase.from('users').update(d).eq('id', id); await this.refresh(); }
  async deleteUser(id: string) { await supabase.from('users').delete().eq('id', id); await this.refresh(); }
  async createDepartment(n: string, sids: string[]) { await supabase.from('departments').insert({ id: crypto.randomUUID(), name: n, supervisor_ids: sids }); await this.refresh(); }
  async updateDepartment(id: string, n: string, sids: string[]) { await supabase.from('departments').update({ name: n, supervisor_ids: sids }).eq('id', id); await this.refresh(); }
  async deleteDepartment(id: string) { await supabase.from('departments').delete().eq('id', id); await this.refresh(); }
  async createLeaveType(l: string, s: boolean, f: any) { await supabase.from('leave_types').insert({ id: crypto.randomUUID(), label: l, subtracts_days: s, fixed_range: f }); await this.refresh(); }
  async updateLeaveType(id: string, l: string, s: boolean, f: any) { await supabase.from('leave_types').update({ label: l, subtracts_days: s, fixed_range: f }).eq('id', id); await this.refresh(); }
  async deleteLeaveType(id: string) { await supabase.from('leave_types').delete().eq('id', id); await this.refresh(); }
  async createShiftType(n: string, c: string, st: string, e: string) { await supabase.from('shift_types').insert({ id: crypto.randomUUID(), name: n, color: c, segments: [{ start: st, end: e }] }); await this.refresh(); }
  async deleteShiftType(id: string) { await supabase.from('shift_types').delete().eq('id', id); await this.refresh(); }
  async createHoliday(d: string, n: string) { await supabase.from('holidays').insert({ id: crypto.randomUUID(), date: d, name: n }); await this.refresh(); }
  async deleteHoliday(id: string) { await supabase.from('holidays').delete().eq('id', id); await this.refresh(); }
  async createPPEType(n: string, s: string[]) { await supabase.from('ppe_types').insert({ id: crypto.randomUUID(), name: n, sizes: s, stock: {} }); await this.refresh(); }
  async updatePPEType(id: string, n: string, s: string[]) { await supabase.from('ppe_types').update({ name: n, sizes: s }).eq('id', id); await this.refresh(); }
  async updatePPEStock(id: string, s: any) { await supabase.from('ppe_types').update({ stock: s }).eq('id', id); await this.refresh(); }
  async deletePPEType(id: string) { await supabase.from('ppe_types').delete().eq('id', id); await this.refresh(); }
  async createPPERequest(uid: string, tid: string, sz: string) { await supabase.from('ppe_requests').insert({ id: crypto.randomUUID(), user_id: uid, type_id: tid, size: sz, status: 'PENDIENTE', created_at: new Date().toISOString() }); await this.refresh(); }
  async markPPEAsRequested(id: string) { await supabase.from('ppe_requests').update({ status: 'SOLICITADO' }).eq('id', id); await this.refresh(); }
  async deliverPPERequest(id: string, q: number = 1) { await supabase.from('ppe_requests').update({ status: 'ENTREGADO', delivery_date: new Date().toISOString() }).eq('id', id); await this.refresh(); }
  async deletePPERequest(id: string) { await supabase.from('ppe_requests').delete().eq('id', id); await this.refresh(); }
  async createNewsPost(t: string, c: string, aid: string) { await supabase.from('news').insert({ id: crypto.randomUUID(), title: t, content: c, author_id: aid, created_at: new Date().toISOString() }); await this.refresh(); }
  async deleteNewsPost(id: string) { await supabase.from('news').delete().eq('id', id); await this.refresh(); }
  async saveSmtpSettings(s: any) { await supabase.from('settings').update({ value: s }).eq('key', 'smtp'); await this.refresh(); }
  async saveEmailTemplates(t: EmailTemplate[]) { await supabase.from('settings').update({ value: t }).eq('key', 'email_templates'); await this.refresh(); }
  async createTruck(n: string) { await supabase.from('trucks').insert({ id: crypto.randomUUID(), name: n }); await this.refresh(); }
  async deleteTruck(id: string) { await supabase.from('trucks').delete().eq('id', id); await this.refresh(); }
  async createDriver(n: string, tid: string) { await supabase.from('drivers').insert({ id: crypto.randomUUID(), name: n, truck_id: tid }); await this.refresh(); }
  async deleteDriver(id: string) { await supabase.from('drivers').delete().eq('id', id); await this.refresh(); }
  async createDriverPPE(did: string, tid: string, sz: string) { await supabase.from('drivers_ppe').insert({ id: crypto.randomUUID(), driver_id: did, type_id: tid, size: sz, status: 'PENDIENTE', created_at: new Date().toISOString() }); await this.refresh(); }
  async updateDriverPPEStatus(id: string, s: string, _q?: number) { 
    const updateData: any = { status: s };
    if (s === 'ENTREGADO') updateData.delivery_date = new Date().toISOString();
    if (s === 'SOLICITADO') updateData.requested_date = new Date().toISOString();
    await supabase.from('drivers_ppe').update(updateData).eq('id', id); 
    await this.refresh(); 
  }
  async deleteDriverPPE(id: string) { await supabase.from('drivers_ppe').delete().eq('id', id); await this.refresh(); }
  
  async repairOvertimeIntegrity() { 
      // 1. Sincronización de horas consumidas en registros de origen
      for (const req of this.requests.filter(r => r.status === RequestStatus.APPROVED && r.overtimeUsage && r.overtimeUsage.length > 0)) {
          for (const usage of req.overtimeUsage) {
              const source = this.requests.find(r => r.id === usage.requestId);
              if (source) {
                  const allUsages = this.requests
                    .filter(r => r.status === RequestStatus.APPROVED && r.overtimeUsage)
                    .flatMap(r => r.overtimeUsage!)
                    .filter(u => u.requestId === source.id);
                  const totalConsumed = allUsages.reduce((sum, u) => sum + u.hoursUsed, 0);
                  await supabase.from('requests').update({ consumed_hours: totalConsumed }).eq('id', source.id);
              }
          }
      }

      // 2. RECALCULAR SALDO TOTAL REAL DE CADA USUARIO
      // Esto sumará todos los ingresos (+) y restará todos los consumos (-) aprobados
      for (const user of this.users) {
          const userOvertimeReqs = this.requests.filter(r => 
              r.userId === user.id && 
              r.status === RequestStatus.APPROVED && 
              this.isOvertimeRequest(r.typeId)
          );
          
          const theoreticalBalance = userOvertimeReqs.reduce((sum, r) => sum + (r.hours || 0), 0);
          
          // Actualizamos en la base de datos para que el usuario vea su saldo real al loguear
          await supabase.from('users').update({ overtime_hours: theoreticalBalance }).eq('id', user.id);
      }

      await this.refresh(); 
  }
}

export const store = new Store();
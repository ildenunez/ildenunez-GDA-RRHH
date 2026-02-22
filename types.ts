export enum Role {
  WORKER = 'TRABAJADOR',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN'
}

export enum RequestStatus {
  PENDING = 'PENDIENTE',
  APPROVED = 'APROBADO',
  REJECTED = 'RECHAZADO'
}

export interface DateRange {
  startDate: string;
  endDate: string;
  label?: string;
}

export interface LeaveTypeConfig {
  id: string;
  label: string;
  subtractsDays: boolean;
  fixedRanges?: DateRange[];
}

export enum RequestType {
  VACATION = 'vacaciones',
  SICKNESS = 'baja_medica',
  PERSONAL = 'asuntos_propios',
  OVERTIME_EARN = 'registro_horas_extra',
  OVERTIME_SPEND_DAYS = 'canje_horas_por_dias',
  OVERTIME_TO_DAYS = 'pasar_horas_a_dias',
  OVERTIME_PAY = 'abono_en_nomina',
  WORKED_HOLIDAY = 'festivo_trabajado',
  UNJUSTIFIED = 'ausencia_justificable',
  ADJUSTMENT_DAYS = 'ajuste_dias',
  ADJUSTMENT_OVERTIME = 'ajuste_horas_extra'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string; // Campo para WhatsApp
  role: Role;
  departmentId: string;
  daysAvailable: number;
  overtimeHours: number;
  avatar?: string;
  birthdate?: string; 
  truckNumber?: string;
}

export interface Truck {
  id: string;
  name: string;
}

export interface Driver {
  id: string;
  name: string;
  truckId: string;
}

export interface DriverPPE {
  id: string;
  driverId: string;
  typeId: string;
  size: string;
  status: 'PENDIENTE' | 'SOLICITADO' | 'ENTREGADO';
  createdAt: string;
  requestedDate?: string;
  deliveryDate?: string;
}

export interface Department {
  id: string;
  name: string;
  supervisorIds: string[];
}

export interface OvertimeUsage {
  requestId: string;
  hoursUsed: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  typeId: string;
  label: string;
  startDate: string;
  endDate?: string;
  hours?: number;
  reason?: string;
  status: RequestStatus;
  createdAt: string;
  adminComment?: string;
  resolvedBy?: string;
  createdByAdmin?: boolean;
  isConsumed?: boolean;
  consumedHours?: number;
  overtimeUsage?: OvertimeUsage[];
  isJustified?: boolean; 
  reportedToAdmin?: boolean;
  documentUrl?: string; // Nueva propiedad para justificantes
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  date: string;
  type?: 'system' | 'admin' | 'chat';
}

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  pinned?: boolean;
}

export interface EmailTemplate {
  id: string;
  label: string;
  subject: string;
  body: string;
  recipients: {
    worker: boolean;
    supervisor: boolean;
    admin: boolean;
  };
}

export interface ShiftSegment {
  start: string;
  end: string;
}

export interface ShiftType {
  id: string;
  name: string;
  color: string;
  segments: ShiftSegment[];
}

export interface ShiftAssignment {
  id: string;
  userId: string;
  date: string;
  shiftTypeId: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface PPEType {
  id: string;
  name: string;
  sizes: string[];
  stock?: Record<string, number>;
}

export interface PPERequest {
  id: string;
  userId: string;
  type_id: string;
  size: string;
  status: 'PENDIENTE' | 'SOLICITADO' | 'ENTREGADO';
  createdAt: string;
  deliveryDate?: string;
}

export interface AppConfig {
  leaveTypes: LeaveTypeConfig[];
  emailTemplates: EmailTemplate[];
  shifts: string[];
  shiftTypes: ShiftType[];
  shiftAssignments: ShiftAssignment[];
  holidays: Holiday[];
  ppeTypes: PPEType[];
  ppeRequests: PPERequest[];
  news: NewsPost[];
  smtpSettings: {
    host: string;
    port: number;
    user: string;
    password?: string;
    enabled: boolean;
  };
  whatsappSettings: {
    companyPhone: string;
    enabled: boolean;
  };
  trucks: Truck[];
  drivers: Driver[];
  driversPpe: DriverPPE[];
}
/** Presentation contracts, independently defined; no database or authorization implementation. */
export type Role =
  "platform_admin" | "organization_admin" | "property_owner" | "manager" | "resident";
export type PortalKind = "supervisor" | "owner" | "portfolio" | "admin";
export type GenderPolicy = "male" | "female" | "unspecified";
export type StayKind = "short" | "long";
export type DepartureIntent = "tentative" | "confirmed" | "unknown";
export interface MembershipOption {
  id: string;
  role: Role;
  organizationId: string | null;
  organizationName: string;
  portal: PortalKind;
}
export type AppRole = Role;
export type OpaqueId = string;
/** JSON transport: integer paise encoded as a decimal string. */
export type Paise = string;
export function decodePaise(value: Paise): number {
  if (!/^-?(0|[1-9]\d*)$/.test(value)) throw new Error("Invalid integer paise");
  const result = Number(value);
  if (!Number.isSafeInteger(result))
    throw new Error("Amount exceeds this frontend’s safe display range");
  return result;
}
export function encodePaise(value: number): Paise {
  if (!Number.isSafeInteger(value))
    throw new Error("Expected safe integer paise");
  return String(value);
}
export interface TenantScope {
  userId: string;
  role: Role;
  organizationId: string | null;
  allowedHostelIds: string[];
  activeHostelId: string | null;
}
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
}
export interface HostelOption {
  id: string;
  name: string;
  code: string;
}
export interface AppData {
  user: UserProfile;
  scope: TenantScope;
  hostels: HostelOption[];
  memberships?: MembershipOption[];
  activeMembershipId?: string;
}
export interface Hostel extends HostelOption {
  organizationId: string;
  city: string;
  addressLine1: string;
  status: "active" | "inactive";
  timezone: string;
  genderPolicy?: GenderPolicy;
  reminderDays?: number;
}
export interface Occupancy {
  physicalBeds: number;
  sellableBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
}
export interface HostelSummary extends Hostel, Occupancy {
  residentCount: number;
  isActive: boolean;
}
export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: "active" | "inactive";
  createdAt: Date;
  hostelCount: number;
  residentCount: number;
  billedPaise: number;
  outstandingPaise: number;
}
export interface Manager {
  bindingId: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string | null;
  hostelId: string | null;
  isActive: boolean;
  createdAt: Date;
  canManage: boolean;
  hostelName: string;
  orgName: string;
  assignedHostelIds?: string[];
}
export type BedOperationalStatus = "in_service" | "maintenance" | "inactive";
export type BedEffectiveStatus =
  "available" | "occupied" | "blocked" | "maintenance" | "inactive";
export interface BedDetail {
  id: string;
  bedLabel: string;
  operationalStatus: BedOperationalStatus;
  status: BedEffectiveStatus;
  residentName?: string;
  residentId?: string;
}
export interface RoomCardData {
  id: string;
  roomNumber: string;
  floorId: string;
  floorLabel: string;
  floorSortOrder: number;
  buildingId: string;
  buildingName: string;
  roomTypeId: string;
  roomTypeName: string;
  acType: "ac" | "non_ac";
  standardCapacity: number;
  isStore: boolean;
  status: "active" | "maintenance" | "inactive";
  occupiedCount: number;
  blockedCount: number;
  availableCount: number;
  totalBeds: number;
  sharingLabel: string;
  statusColor: "green" | "amber" | "red" | "gray";
  beds: BedDetail[];
}
export interface FloorGroup {
  id: string;
  label: string;
  sortOrder: number;
  buildingId: string;
  buildingName: string;
  rooms: RoomCardData[];
  totalRooms: number;
  occupiedBeds: number;
  totalBeds: number;
  availableBeds: number;
}
export interface Building {
  id: string;
  name: string;
  sortOrder: number;
}
export interface Floor {
  id: string;
  buildingId: string;
  label: string;
  sortOrder: number;
}
export type ResidentStatus =
  "registered" | "active" | "checked_out" | "inactive";
export const residentStatusLabel: Record<ResidentStatus, string> = {
  registered: "Registered",
  active: "Active",
  checked_out: "Checked out",
  inactive: "Inactive",
};
export interface ResidentListItem {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  gender: string;
  status: ResidentStatus;
  createdAt: Date;
  roomNumber?: string;
  bedLabel?: string;
  agreedRentPaise?: number;
  startDate?: string;
}
export interface Agreement {
  id: string;
  status: string;
  agreedRentPaise: number;
  agreedDepositPaise: number;
  billingDay: number;
  startDate: string;
  expectedEndDate: string | null;
  noticePeriodDays: number;
  stayKind?: StayKind;
  billingPeriod?: "day" | "month";
  departureIntent?: DepartureIntent;
  followUpDate?: string | null;
  lastContactedAt?: Date | null;
  departureNotes?: string;
  version?: number;
}
export interface ResidentDetail extends ResidentListItem {
  portraitUrl?: string | null;
  identityDocumentUrl?: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  room: { id: string; roomNumber: string } | null;
  bed: { id: string; bedLabel: string } | null;
  activeAgreement: Agreement | null;
  ratePlan: { id: string; name: string } | null;
}
export interface Invoice {
  id: string;
  invoiceNumber: string;
  residentName: string;
  residentPhone: string;
  residentId: string;
  totalPaise: number;
  paidPaise: number;
  outstandingPaise: number;
  dueDate: string;
  issueDate: string;
  periodStart: string;
  periodEnd: string;
  status: "open" | "paid" | "partially_paid" | "overdue" | "void" | "draft";
}
export type PaymentMethod = "cash" | "upi" | "bank_transfer" | "card" | "other";
export interface Payment {
  id: string;
  receivedAt: Date;
  paymentMethod: PaymentMethod;
  reference: string | null;
  amountPaise: number;
  status: string;
  notes: string | null;
}
export interface Activity {
  id: string;
  action: string;
  entityType: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
}
export interface ResidentPage {
  resident: ResidentDetail;
  location: { buildingName: string | null; floorLabel: string | null };
  invoices: Invoice[];
  payments: Payment[];
  financialSummary: {
    totalBilledPaise: number;
    totalPaidPaise: number;
    totalOutstandingPaise: number;
  };
  activityTimeline: Activity[];
}
export interface ActiveResident {
  allocationId: string;
  residentId: string;
  residentName: string;
  phone: string;
  email: string | null;
  gender: string;
  occupiedFrom: Date;
  agreementId: string;
  agreedRentPaise: number;
  billingDay: number;
  roomNumber: string;
  bedLabel: string;
  roomId: string;
  bedId: string;
}
export interface RecentCheckout {
  residentId: string;
  residentName: string;
  phone: string;
  roomNumber: string;
  bedLabel: string;
  occupiedFrom: Date;
  occupiedUntil: Date | null;
}
export interface RatePlan {
  id: string;
  roomTypeId: string;
  name: string;
  occupancyCount: number;
  rentPaise: number;
  depositPaise: number;
  billingPeriod?: "day" | "month";
}
export interface LeavingSoonItem {
  hostelId: string;
  hostelName: string;
  residentId: string;
  name: string;
  phone: string;
  roomNumber: string;
  bedLabel: string;
  agreementId: string;
  stayKind: StayKind;
  expectedEndDate: string | null;
  departureIntent: DepartureIntent;
  followUpDate: string | null;
  lastContactedAt: Date | null;
  notes: string;
  version: number;
  daysUntilDeparture: number | null;
  needsFollowUp: boolean;
  outstandingPaise: number;
}
export interface LeavingSoonPage {
  hostel: Hostel | null;
  reminderDays: number;
  today: string;
  items: LeavingSoonItem[];
  stats: { dueForFollowUp: number; leavingThisWeek: number; overduePlans: number; outstandingPaise: number };
}
export interface AttentionPage { leavingSoon: number; overduePlans: number; dueFollowUps: number; }
export interface PortalDashboardData {
  portal: PortalKind;
  title: string;
  subtitle: string;
  hostels: HostelSummary[];
  organizations: Organization[];
  stats: { hostelCount: number; residentCount: number; availableBeds: number; leavingSoonCount: number; overdueFollowUps: number; outstandingPaise: number };
  attention: LeavingSoonItem[];
  page: number;
  pageSize: number;
  totalHostels: number;
}
export interface Inquiry {
  id: string;
  contactName: string;
  phone: string | null;
  source: "phone" | "walk_in";
  partySize: number;
  stayKind: StayKind;
  acPreference: "any" | "ac" | "non_ac";
  sharingPreference: "any" | "1" | "2" | "3" | "4" | "private";
  expectedArrival: string | null;
  expectedDeparture: string | null;
  followUpDate: string | null;
  notes: string;
  status: "open" | "contacted" | "closed";
  createdAt: Date;
  version: number;
}
export interface InquiriesPage {
  hostel: Hostel | null;
  items: Inquiry[];
  stats: { open: number; followUpsDue: number; availableBeds: number };
}
export interface SetupPage {
  organizations: Organization[];
  hostels: HostelSummary[];
  staff: Manager[];
  allowedRoles: Role[];
  capabilities: { canCreateOrganization: boolean; canCreateHostel: boolean; canManageStaff: boolean; canConfigureInventory: boolean };
}
export interface PlatformDashboardData {
  activeOrganizations: number;
  activeHostels: number;
  activeResidents: number;
  currentMonthBilledPaise: number;
  currentMonthCollectedPaise: number;
  totalOutstandingPaise: number;
  totalOverduePaise: number;
  overdueInvoicesCount: number;
  organizations: (Pick<
    Organization,
    | "id"
    | "name"
    | "hostelCount"
    | "residentCount"
    | "billedPaise"
    | "outstandingPaise"
  > & { overduePaise: number })[];
}
export interface OrganizationDashboardData extends Occupancy {
  organizationName: string;
  hostelCount: number;
  totalResidents: number;
  currentMonthBilledPaise: number;
  currentMonthCollectedPaise: number;
  totalOutstandingPaise: number;
  totalOverduePaise: number;
  hostels: (Pick<HostelSummary, "id" | "name" | "city" | "residentCount"> &
    Occupancy & { outstandingPaise: number })[];
}
export interface ManagerDashboardData extends Occupancy {
  hostelName: string;
  blockedBeds: number;
  activeResidents: number;
  overdueInvoices: number;
  collectionsTodayPaise: number;
  paymentsDueToday: number;
  expectedCheckouts: number;
  recentActivity: Activity[];
  overdueInvoicesList: {
    residentName: string;
    amountPaise: number;
    daysOverdue: number;
  }[];
}
export interface FloorOccupancyReport {
  floorId: string;
  floorLabel: string;
  buildingName: string;
  roomCount: number;
  totalBeds: number;
  sellableBeds: number;
  occupiedBeds: number;
  blockedBeds: number;
  maintenanceBeds: number;
  availableBeds: number;
  occupancyRate: number;
}
export interface AgingInvoiceItem {
  invoiceId: string;
  invoiceNumber: string;
  residentName: string;
  dueDate: string;
  daysOverdue: number;
  totalPaise: number;
  outstandingPaise: number;
}
export interface AgingBucketReport {
  bucket: "1-7 days" | "8-30 days" | "31-60 days" | "61-90 days" | "90+ days";
  count: number;
  totalOutstandingPaise: number;
  invoices: AgingInvoiceItem[];
}
export interface PageDataMap {
  "/supervisor": PortalDashboardData;
  "/owner": PortalDashboardData;
  "/portfolio": PortalDashboardData;
  "/admin": PortalDashboardData;
  "/leaving-soon": LeavingSoonPage;
  "/attention": AttentionPage;
  "/inquiries": InquiriesPage;
  "/setup": SetupPage;
  "/dashboard": {
    role: Role;
    platformData: PlatformDashboardData | null;
    orgData: OrganizationDashboardData | null;
    managerData: ManagerDashboardData | null;
  };
  "/organizations": { organizations: Organization[] };
  "/hostels": { hostels: HostelSummary[]; activeHostelId: string | null };
  "/managers": {
    managers: Manager[];
    hostels: Hostel[];
    organizations: Organization[];
  };
  "/rooms": {
    hostel: Hostel | null;
    floors: FloorGroup[];
    buildings: Building[];
    stats: {
      totalRooms: number;
      totalBeds: number;
      occupiedBeds: number;
      availableBeds: number;
    };
  };
  "/residents": {
    hostel: Hostel | null;
    residents: ResidentListItem[];
    stats: { total: number; active: number; checkedOut: number };
    filters: { search: string; status: string };
  };
  "/residents/:id": ResidentPage;
  "/check-ins": {
    hostel: Hostel | null;
    buildings: Building[];
    floors: Floor[];
    rooms: Pick<
      RoomCardData,
      | "id"
      | "buildingId"
      | "floorId"
      | "roomTypeId"
      | "roomNumber"
      | "roomTypeName"
      | "standardCapacity"
      | "acType"
    >[];
    availableBeds: { id: string; roomId: string; bedLabel: string }[];
    ratePlans: RatePlan[];
    preselectedRoomId: string | null;
  };
  "/check-outs": {
    activeResidents: ActiveResident[];
    recentCheckouts: RecentCheckout[];
  };
  "/payments": { invoices: Invoice[] };
  "/reports": {
    hostel: Hostel | null;
    floorOccupancy: FloorOccupancyReport[];
    agingBuckets: AgingBucketReport[];
    occupancySummary: Occupancy & {
      blockedBeds: number;
      maintenanceBeds: number;
    };
    financialSummary: {
      totalBilledPaise: number;
      totalCollectedPaise: number;
      totalOutstandingPaise: number;
      collectionRate: number;
    };
  };
  "/settings": Pick<AppData, "user" | "scope"> & {
    systemInfo: {
      appName: string;
      locale: string;
      timezone: string;
      currency: string;
      version: string;
    };
  };
  "/login": { user: UserProfile | null; scope: TenantScope | null };
}
export interface DemoFixtures {
  app: AppData;
  pages: PageDataMap;
  residentDetails: Record<string, ResidentPage>;
}

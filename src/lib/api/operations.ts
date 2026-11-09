/** Business operations. The backend owns authorization, validation and atomicity. */
export const operations = {
  switchMembership: { method: "POST", path: "/session/active-membership", resource: false },
  updateStayPlan: { method: "POST", path: "/stays/departure-plan", resource: false },
  createInquiry: { method: "POST", path: "/inquiries", resource: false },
  updateInquiry: { method: "POST", path: "/inquiries/status", resource: false },
  createHostel: { method: "POST", path: "/hostels", resource: false },
  configureHostel: { method: "POST", path: "/hostels/settings", resource: false },
  createStaff: { method: "POST", path: "/staff", resource: false },
  assignStaff: { method: "POST", path: "/staff/assignments", resource: false },
  createRoomBatch: { method: "POST", path: "/inventory/rooms", resource: false },
  signIn: { method: "POST", path: "/session", resource: false },
  signOut: { method: "DELETE", path: "/session", resource: false },
  switchHostel: {
    method: "POST",
    path: "/session/active-hostel",
    resource: false,
  },
  createOrganization: {
    method: "POST",
    path: "/organizations",
    resource: false,
  },
  toggleOrganization: {
    method: "POST",
    path: "/organizations/status",
    resource: false,
  },
  toggleManager: { method: "POST", path: "/staff/access", resource: false },
  registerResident: { method: "POST", path: "/residents", resource: false },
  checkIn: { method: "POST", path: "/admissions", resource: false },
  checkOut: { method: "POST", path: "/departures", resource: false },
  updateResident: {
    method: "PATCH",
    path: "/residents/:id/profile",
    resource: true,
  },
  recordPayment: { method: "POST", path: "/payments", resource: false },
  setBedStatus: {
    method: "POST",
    path: "/inventory/bed-status",
    resource: false,
  },
} as const;
export type Operation = keyof typeof operations;
export type CommandInput = Record<string, string>;
export interface CommandResult {
  success: true;
  message: string;
  resourceId?: string;
  redirectTo?: string;
}

import type { CollectionDef, FieldDef } from "@/lib/demos/types";

export const SOCIETY_EXTRA_NOTE: FieldDef = {
  key: "extraNote",
  label: "Extra Note",
  type: "textarea",
  placeholder: "Optional additional information…",
};

function withNote(fields: FieldDef[]): FieldDef[] {
  if (fields.some((f) => f.key === "extraNote")) return fields;
  return [...fields, SOCIETY_EXTRA_NOTE];
}

export type SocietyRole =
  | "administrator"
  | "guard"
  | "accountant"
  | "maintenance"
  | "resident";

export type SocietyNavCategory = {
  id: string;
  label: string;
  items: Array<{ id: string; label: string; roles: SocietyRole[] }>;
};

/** Expanded Society modules — Hospital untouched. */
export const societyCollections: CollectionDef[] = [
  {
    id: "societyInfo",
    label: "Society Information",
    description: "Core society profile and office contacts.",
    fields: withNote([
      { key: "societyName", label: "Society Name", required: true },
      { key: "address", label: "Address", required: true },
      { key: "city", label: "City", required: true },
      { key: "officePhone", label: "Office Phone", type: "tel" },
      { key: "manager", label: "Manager / Admin Name" },
      { key: "totalBlocks", label: "Total Blocks", type: "number" },
      { key: "totalUnits", label: "Total Units", type: "number" },
    ]),
  },
  {
    id: "blocks",
    label: "Blocks and Sections",
    description: "Society blocks, wings, and sections.",
    fields: withNote([
      { key: "blockName", label: "Block / Section", required: true },
      { key: "floors", label: "Floors", type: "number" },
      { key: "units", label: "Units", type: "number" },
      { key: "inCharge", label: "In-Charge" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Active", "Under Development", "Closed"],
        required: true,
      },
    ]),
  },
  {
    id: "houses",
    label: "Houses and Flats",
    description: "Property units with ownership and occupancy.",
    fields: withNote([
      { key: "unitNo", label: "Property Number", required: true },
      { key: "block", label: "Block / Section", required: true },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: ["House", "Flat", "Plot", "Shop"],
        required: true,
      },
      { key: "owner", label: "Owner Name", required: true },
      { key: "tenant", label: "Tenant Name" },
      {
        key: "occupancy",
        label: "Occupancy Status",
        type: "select",
        options: [
          "Occupied",
          "Vacant",
          "Under Maintenance",
          "Rented",
          "Owner Occupied",
        ],
        required: true,
      },
      { key: "size", label: "Size (sq yd / sq ft)" },
      { key: "documents", label: "Property Documents Note", type: "textarea" },
    ]),
  },
  {
    id: "residents",
    label: "Residents & Families",
    description: "Resident profiles, family and emergency contacts.",
    fields: withNote([
      { key: "name", label: "Resident Name", required: true },
      { key: "houseNo", label: "House / Flat Number", required: true },
      { key: "phone", label: "Contact Number", type: "tel", required: true },
      { key: "email", label: "Email", type: "email" },
      {
        key: "status",
        label: "Owner or Tenant",
        type: "select",
        options: ["Owner", "Tenant", "Family Member"],
        required: true,
      },
      { key: "familyMembers", label: "Family Members" },
      { key: "emergencyContact", label: "Emergency Contact" },
      { key: "vehicles", label: "Resident Vehicles" },
      { key: "moveInDate", label: "Move-in Date", type: "date" },
      {
        key: "residentStatus",
        label: "Resident Status",
        type: "select",
        options: ["Active", "Inactive", "Moved Out"],
        required: true,
      },
    ]),
  },
  {
    id: "visitors",
    label: "Visitor Registration",
    description: "Pre-register visitors and generate secure entry codes.",
    fields: withNote([
      { key: "visitorName", label: "Visitor Full Name", required: true },
      { key: "mobile", label: "Visitor Mobile Number", type: "tel", required: true },
      { key: "purpose", label: "Visit Purpose", required: true },
      { key: "residentName", label: "Resident Name", required: true },
      { key: "houseNo", label: "House / Flat Number", required: true },
      {
        key: "category",
        label: "Visitor Category",
        type: "select",
        options: [
          "Guest",
          "Family Member",
          "Delivery Person",
          "Service Provider",
          "Contractor",
          "Official Visitor",
          "Other",
        ],
        required: true,
      },
      { key: "expectedDate", label: "Expected Visit Date", type: "date", required: true },
      {
        key: "expectedArrival",
        label: "Expected Arrival Time",
        required: true,
        placeholder: "e.g. 4:30 PM",
      },
      {
        key: "expectedDeparture",
        label: "Expected Departure Time",
        placeholder: "e.g. 6:00 PM",
      },
      { key: "vehicle", label: "Vehicle Number (optional)" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          "Pending",
          "Approved",
          "Checked In",
          "Checked Out",
          "Rejected",
          "Expired",
          "Cancelled",
        ],
        required: true,
      },
      { key: "entryCode", label: "Entry Code" },
      { key: "codeExpiresAt", label: "Code Expires At" },
      { key: "checkedInAt", label: "Checked In At" },
      { key: "checkedOutAt", label: "Checked Out At" },
      { key: "guardId", label: "Guard Account" },
      { key: "durationMinutes", label: "Visit Duration (min)" },
    ]),
  },
  {
    id: "walkIns",
    label: "Unexpected Visitors",
    description: "Walk-in visitors requiring resident/office approval.",
    fields: withNote([
      { key: "visitorName", label: "Visitor Name", required: true },
      { key: "mobile", label: "Mobile Number", type: "tel", required: true },
      { key: "houseNo", label: "House / Flat Number", required: true },
      { key: "purpose", label: "Visit Purpose", required: true },
      {
        key: "approvalStatus",
        label: "Approval Status",
        type: "select",
        options: ["Pending Approval", "Approved", "Rejected", "Checked In", "Checked Out"],
        required: true,
      },
      { key: "approvedBy", label: "Approved By" },
      { key: "guardId", label: "Security Guard" },
      { key: "entryAt", label: "Entry Date/Time" },
    ]),
  },
  {
    id: "securityGuards",
    label: "Security Guard Directory",
    description: "Authorized security staff accounts and contacts.",
    fields: withNote([
      { key: "name", label: "Guard Name", required: true },
      { key: "employeeId", label: "Employee / Account ID", required: true },
      { key: "phone", label: "Phone", type: "tel", required: true },
      {
        key: "gate",
        label: "Assigned Gate",
        type: "select",
        options: ["Main Gate", "Side Gate", "Parking Gate", "All Gates"],
        required: true,
      },
      {
        key: "shift",
        label: "Shift",
        type: "select",
        options: ["Morning", "Evening", "Night"],
        required: true,
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Active", "On Leave", "Off Duty"],
        required: true,
      },
    ]),
  },
  {
    id: "guardAttendance",
    label: "Guard Attendance",
    description: "Daily guard attendance and shift check-ins.",
    fields: withNote([
      { key: "guardName", label: "Guard Name", required: true },
      { key: "date", label: "Date", type: "date", required: true },
      { key: "shift", label: "Shift", type: "select", options: ["Morning", "Evening", "Night"], required: true },
      { key: "checkIn", label: "Check-In Time", required: true },
      { key: "checkOut", label: "Check-Out Time" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Present", "Absent", "Late"],
        required: true,
      },
    ]),
  },
  {
    id: "incidents",
    label: "Security Incidents",
    description: "Incidents, emergencies, and suspicious activity reports.",
    fields: withNote([
      { key: "title", label: "Incident Title", required: true },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: [
          "Security Incident",
          "Emergency Entry",
          "Suspicious Activity",
          "Duty Handover",
        ],
        required: true,
      },
      { key: "gate", label: "Gate / Location", required: true },
      { key: "reportedBy", label: "Reported By", required: true },
      { key: "date", label: "Date", type: "date", required: true },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Open", "Investigating", "Closed"],
        required: true,
      },
      { key: "details", label: "Details", type: "textarea", required: true },
    ]),
  },
  {
    id: "staff",
    label: "Society Staff",
    description: "Office and operations staff directory.",
    fields: withNote([
      { key: "name", label: "Staff Name", required: true },
      {
        key: "role",
        label: "Role",
        type: "select",
        options: [
          "Manager",
          "Accountant",
          "Maintenance",
          "Cleaner",
          "Electrician",
          "Admin Clerk",
        ],
        required: true,
      },
      { key: "phone", label: "Phone", type: "tel", required: true },
      {
        key: "shift",
        label: "Shift",
        type: "select",
        options: ["Morning", "Evening", "Night", "General"],
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Active", "On Leave"],
        required: true,
      },
    ]),
  },
  {
    id: "bills",
    label: "Invoices & Charges",
    description: "Maintenance and society charge invoices.",
    fields: withNote([
      { key: "invoiceNo", label: "Invoice Number", required: true },
      { key: "resident", label: "Resident / Property", required: true },
      { key: "month", label: "Billing Month", required: true, placeholder: "e.g. Nov 2026" },
      { key: "maintenance", label: "Maintenance Charges", type: "number", required: true },
      { key: "water", label: "Water Charges", type: "number" },
      { key: "electricity", label: "Electricity Charges", type: "number" },
      { key: "parking", label: "Parking Fees", type: "number" },
      { key: "other", label: "Other Charges", type: "number" },
      { key: "lateFee", label: "Late Payment Fees", type: "number" },
      { key: "outstanding", label: "Previous Outstanding", type: "number" },
      { key: "amount", label: "Total Amount", type: "number", required: true },
      {
        key: "status",
        label: "Payment Status",
        type: "select",
        options: ["Pending", "Paid", "Partial", "Overdue"],
        required: true,
      },
    ]),
  },
  {
    id: "payments",
    label: "Payment History",
    description: "Recorded payments and receipts.",
    fields: withNote([
      { key: "receiptNo", label: "Receipt Number", required: true },
      { key: "invoiceNo", label: "Invoice Number", required: true },
      { key: "resident", label: "Resident / Property", required: true },
      { key: "amount", label: "Amount Paid", type: "number", required: true },
      { key: "date", label: "Payment Date", type: "date", required: true },
      {
        key: "method",
        label: "Method",
        type: "select",
        options: ["Cash", "Bank Transfer", "Online", "Cheque"],
        required: true,
      },
    ]),
  },
  {
    id: "complaints",
    label: "Complaints",
    description: "Resident and staff complaint tracking.",
    fields: withNote([
      { key: "complaintNo", label: "Complaint Number", required: true },
      { key: "residentName", label: "Resident Name", required: true },
      { key: "propertyNo", label: "Property Number", required: true },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          "Water Supply",
          "Electricity",
          "Cleaning",
          "Security",
          "Roads",
          "Waste Management",
          "Plumbing",
          "Other",
        ],
        required: true,
      },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "submittedAt", label: "Submission Date", type: "date", required: true },
      { key: "assignedStaff", label: "Assigned Staff" },
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: ["Low", "Medium", "High"],
        required: true,
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["New", "Assigned", "In Progress", "Resolved", "Closed"],
        required: true,
      },
      { key: "remarks", label: "Admin Remarks", type: "textarea" },
    ]),
  },
  {
    id: "maintenance",
    label: "Maintenance & Work Orders",
    description: "Maintenance requests, schedules, and repair history.",
    fields: withNote([
      { key: "title", label: "Request / Work Order", required: true },
      { key: "location", label: "Location", required: true },
      { key: "assignedStaff", label: "Assigned Staff" },
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: ["Low", "Medium", "High"],
        required: true,
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Open", "Scheduled", "In Progress", "Resolved"],
        required: true,
      },
      { key: "expense", label: "Maintenance Expense", type: "number" },
      { key: "scheduleDate", label: "Schedule Date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ]),
  },
  {
    id: "facilities",
    label: "Facilities & Amenities",
    description: "Shared facilities and booking availability.",
    fields: withNote([
      {
        key: "facility",
        label: "Facility",
        type: "select",
        options: [
          "Community Hall",
          "Park",
          "Gym",
          "Swimming Pool",
          "Sports Facility",
          "Meeting Room",
        ],
        required: true,
      },
      { key: "bookedBy", label: "Booked By", required: true },
      { key: "houseNo", label: "House / Flat", required: true },
      { key: "date", label: "Date", type: "date", required: true },
      { key: "timeSlot", label: "Time Slot", required: true },
      { key: "charges", label: "Charges", type: "number" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Available", "Reserved", "Completed", "Cancelled"],
        required: true,
      },
    ]),
  },
  {
    id: "parking",
    label: "Parking & Vehicles",
    description: "Resident vehicles, slots, and visitor parking.",
    fields: withNote([
      { key: "vehicleNo", label: "Vehicle Registration", required: true },
      { key: "owner", label: "Owner / Resident", required: true },
      { key: "houseNo", label: "House / Flat", required: true },
      { key: "slot", label: "Parking Slot" },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: ["Resident Vehicle", "Visitor Parking", "Unauthorized Report"],
        required: true,
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Assigned", "Available", "Reported"],
        required: true,
      },
    ]),
  },
  {
    id: "deliveries",
    label: "Deliveries Management",
    description: "Courier and parcel receiving at the gate.",
    fields: withNote([
      { key: "recipient", label: "Recipient Name", required: true },
      { key: "houseNo", label: "House / Flat Number", required: true },
      { key: "courier", label: "Courier Company", required: true },
      { key: "trackingNo", label: "Tracking Number" },
      { key: "arrivedAt", label: "Arrival Date/Time", required: true },
      { key: "guardId", label: "Receiving Guard", required: true },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Received", "Waiting for Collection", "Collected", "Returned"],
        required: true,
      },
      { key: "collectedAt", label: "Collection Date/Time" },
    ]),
  },
  {
    id: "notices",
    label: "Notices & Announcements",
    description: "Society notices, alerts, and announcements.",
    fields: withNote([
      { key: "title", label: "Notice Title", required: true },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: ["Society Notice", "Maintenance", "Emergency Alert", "General"],
        required: true,
      },
      {
        key: "audience",
        label: "Audience",
        type: "select",
        options: ["All Residents", "Owners", "Staff", "Guards"],
        required: true,
      },
      { key: "date", label: "Date", type: "date", required: true },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Draft", "Published", "Archived"],
        required: true,
      },
      { key: "message", label: "Message", type: "textarea", required: true },
    ]),
  },
  {
    id: "documents",
    label: "Documents Management",
    description: "Society document index and references.",
    fields: withNote([
      { key: "title", label: "Document Title", required: true },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: ["Policy", "Agreement", "Invoice Archive", "Property", "Other"],
        required: true,
      },
      { key: "refNo", label: "Reference No" },
      { key: "date", label: "Date", type: "date", required: true },
      { key: "owner", label: "Owner / Department" },
      { key: "summary", label: "Summary", type: "textarea" },
    ]),
  },
  {
    id: "reports",
    label: "Reports & Analytics",
    description: "Operational and financial summary reports.",
    fields: withNote([
      { key: "title", label: "Report Title", required: true },
      { key: "period", label: "Period", required: true },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: [
          "Visitors",
          "Payments",
          "Complaints",
          "Maintenance",
          "Security",
          "Expenses",
        ],
        required: true,
      },
      { key: "summary", label: "Summary", type: "textarea", required: true },
    ]),
  },
  {
    id: "settings",
    label: "Society Settings",
    description: "Operational preferences for this society workspace.",
    fields: withNote([
      { key: "settingKey", label: "Setting Name", required: true },
      { key: "settingValue", label: "Value", required: true },
      { key: "updatedBy", label: "Updated By" },
    ]),
  },
];

export const societyNav: SocietyNavCategory[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        roles: ["administrator", "guard", "accountant", "maintenance", "resident"],
      },
    ],
  },
  {
    id: "society-properties",
    label: "Society & Properties",
    items: [
      { id: "societyInfo", label: "Society Information", roles: ["administrator"] },
      { id: "blocks", label: "Blocks and Sections", roles: ["administrator"] },
      {
        id: "houses",
        label: "Houses and Flats",
        roles: ["administrator", "accountant", "resident"],
      },
    ],
  },
  {
    id: "residents-mgmt",
    label: "Residents Management",
    items: [
      {
        id: "residents",
        label: "Residents & Families",
        roles: ["administrator", "accountant", "resident"],
      },
    ],
  },
  {
    id: "visitor-gate",
    label: "Visitor & Gate Management",
    items: [
      {
        id: "visitors",
        label: "Visitor Registration",
        roles: ["administrator", "guard", "resident"],
      },
      {
        id: "verify-entry",
        label: "Visitor Entry Verification",
        roles: ["administrator", "guard"],
      },
      {
        id: "active-visitors",
        label: "Currently Inside",
        roles: ["administrator", "guard"],
      },
      {
        id: "walkIns",
        label: "Unexpected Visitors",
        roles: ["administrator", "guard"],
      },
      {
        id: "visitor-dashboard",
        label: "Visitor Dashboard",
        roles: ["administrator", "guard"],
      },
    ],
  },
  {
    id: "security",
    label: "Security Management",
    items: [
      {
        id: "securityGuards",
        label: "Guard Directory",
        roles: ["administrator", "guard"],
      },
      {
        id: "guardAttendance",
        label: "Guard Attendance",
        roles: ["administrator", "guard"],
      },
      {
        id: "incidents",
        label: "Incidents & Reports",
        roles: ["administrator", "guard"],
      },
    ],
  },
  {
    id: "staff-mgmt",
    label: "Staff Management",
    items: [
      { id: "staff", label: "Society Staff", roles: ["administrator"] },
    ],
  },
  {
    id: "billing",
    label: "Billing & Payments",
    items: [
      {
        id: "bills",
        label: "Invoices & Charges",
        roles: ["administrator", "accountant", "resident"],
      },
      {
        id: "payments",
        label: "Payment History",
        roles: ["administrator", "accountant", "resident"],
      },
      {
        id: "finance-dashboard",
        label: "Financial Dashboard",
        roles: ["administrator", "accountant"],
      },
    ],
  },
  {
    id: "complaints-maint",
    label: "Complaints & Maintenance",
    items: [
      {
        id: "complaints",
        label: "Complaints",
        roles: ["administrator", "maintenance", "resident"],
      },
      {
        id: "maintenance",
        label: "Maintenance & Work Orders",
        roles: ["administrator", "maintenance"],
      },
    ],
  },
  {
    id: "facilities-cat",
    label: "Facilities & Amenities",
    items: [
      {
        id: "facilities",
        label: "Facilities Bookings",
        roles: ["administrator", "resident"],
      },
    ],
  },
  {
    id: "parking-cat",
    label: "Parking & Vehicles",
    items: [
      {
        id: "parking",
        label: "Parking & Vehicles",
        roles: ["administrator", "guard", "resident"],
      },
    ],
  },
  {
    id: "deliveries-cat",
    label: "Deliveries Management",
    items: [
      {
        id: "deliveries",
        label: "Deliveries",
        roles: ["administrator", "guard", "resident"],
      },
    ],
  },
  {
    id: "notices-cat",
    label: "Notices & Announcements",
    items: [
      {
        id: "notices",
        label: "Notices",
        roles: ["administrator", "resident", "guard", "accountant", "maintenance"],
      },
    ],
  },
  {
    id: "documents-cat",
    label: "Documents Management",
    items: [
      { id: "documents", label: "Documents", roles: ["administrator", "accountant"] },
    ],
  },
  {
    id: "reports-cat",
    label: "Reports & Analytics",
    items: [
      {
        id: "reports",
        label: "Reports",
        roles: ["administrator", "accountant"],
      },
    ],
  },
  {
    id: "settings-cat",
    label: "Settings",
    items: [
      { id: "settings", label: "Society Settings", roles: ["administrator"] },
    ],
  },
];

export const societyRoleLabels: Record<SocietyRole, string> = {
  administrator: "Society Administrator",
  guard: "Security Guard",
  accountant: "Accountant",
  maintenance: "Maintenance Staff",
  resident: "Resident",
};

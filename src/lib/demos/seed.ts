import { randomUUID } from "crypto";
import type { DemoDatabase, DemoProduct, DemoRecord } from "@/lib/demos/types";
import { defaultCodeExpiry, generateEntryCode } from "@/lib/society/visitors";

function record(data: Record<string, string>): DemoRecord {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...data,
  };
}

export function createSeedData(product: DemoProduct): DemoDatabase {
  if (product === "society") {
    const code1 = generateEntryCode();
    const today = new Date().toISOString().slice(0, 10);
    return {
      societyInfo: [
        record({
          societyName: "Jarcode Heights Demo Society",
          address: "Demo Block, Main Boulevard",
          city: "Karachi",
          officePhone: "+92 21 0000000",
          manager: "Office Admin Demo",
          totalBlocks: "2",
          totalUnits: "48",
          extraNote: "Fictional society profile for public demo only.",
        }),
      ],
      blocks: [
        record({
          blockName: "Block A",
          floors: "3",
          units: "24",
          inCharge: "Ahmed Khan",
          status: "Active",
        }),
        record({
          blockName: "Block B",
          floors: "4",
          units: "24",
          inCharge: "Sara Malik",
          status: "Active",
        }),
      ],
      houses: [
        record({
          unitNo: "A-12",
          block: "Block A",
          type: "House",
          owner: "Ahmed Khan",
          tenant: "",
          occupancy: "Owner Occupied",
          size: "240 sq yd",
          documents: "Ownership file — fictional",
        }),
        record({
          unitNo: "B-05",
          block: "Block B",
          type: "Flat",
          owner: "Estate Demo Co",
          tenant: "Sara Malik",
          occupancy: "Rented",
          size: "1200 sq ft",
          documents: "Tenancy agreement — fictional",
        }),
      ],
      residents: [
        record({
          name: "Ahmed Khan",
          houseNo: "A-12",
          phone: "+92 300 1112233",
          email: "ahmed.demo@example.com",
          status: "Owner",
          familyMembers: "4",
          emergencyContact: "+92 300 0001111",
          vehicles: "ABC-123",
          moveInDate: "2024-01-15",
          residentStatus: "Active",
        }),
        record({
          name: "Sara Malik",
          houseNo: "B-05",
          phone: "+92 300 4455667",
          email: "sara.demo@example.com",
          status: "Tenant",
          familyMembers: "2",
          emergencyContact: "+92 300 0002222",
          vehicles: "XYZ-987",
          moveInDate: "2025-06-01",
          residentStatus: "Active",
        }),
      ],
      visitors: [
        record({
          visitorName: "Courier Demo",
          mobile: "+92 300 5556677",
          purpose: "Parcel Delivery",
          residentName: "Ahmed Khan",
          houseNo: "A-12",
          category: "Delivery Person",
          expectedDate: today,
          expectedArrival: "3:15 PM",
          expectedDeparture: "3:45 PM",
          vehicle: "KHI-1234",
          status: "Approved",
          entryCode: code1,
          codeExpiresAt: defaultCodeExpiry(today),
          extraNote: "Demo pre-registered visitor. Use Verify Entry with this code.",
        }),
      ],
      walkIns: [],
      securityGuards: [
        record({
          name: "Imran Ali",
          employeeId: "GRD-001",
          phone: "+92 301 9988776",
          gate: "Main Gate",
          shift: "Night",
          status: "Active",
        }),
      ],
      guardAttendance: [
        record({
          guardName: "Imran Ali",
          date: today,
          shift: "Night",
          checkIn: "8:00 PM",
          checkOut: "",
          status: "Present",
        }),
      ],
      incidents: [
        record({
          title: "Demo duty handover note",
          type: "Duty Handover",
          gate: "Main Gate",
          reportedBy: "Imran Ali",
          date: today,
          status: "Closed",
          details: "Fictional handover — no real incident.",
        }),
      ],
      staff: [
        record({
          name: "Office Clerk Demo",
          role: "Admin Clerk",
          phone: "+92 302 1112233",
          shift: "General",
          status: "Active",
        }),
        record({
          name: "Farah Maintenance",
          role: "Maintenance",
          phone: "+92 302 4445566",
          shift: "Morning",
          status: "Active",
        }),
      ],
      bills: [
        record({
          invoiceNo: "INV-2026-10-A12",
          resident: "A-12 / Ahmed Khan",
          month: "Oct 2026",
          maintenance: "3500",
          water: "500",
          electricity: "0",
          parking: "500",
          other: "0",
          lateFee: "0",
          outstanding: "0",
          amount: "4500",
          status: "Paid",
          extraNote: "Demo invoice with Extra Note field.",
        }),
        record({
          invoiceNo: "INV-2026-11-B05",
          resident: "B-05 / Sara Malik",
          month: "Nov 2026",
          maintenance: "3000",
          water: "400",
          electricity: "0",
          parking: "0",
          other: "200",
          lateFee: "0",
          outstanding: "500",
          amount: "4100",
          status: "Pending",
        }),
      ],
      payments: [
        record({
          receiptNo: "RCPT-1001",
          invoiceNo: "INV-2026-10-A12",
          resident: "A-12 / Ahmed Khan",
          amount: "4500",
          date: "2026-10-05",
          method: "Online",
        }),
      ],
      complaints: [
        record({
          complaintNo: "CMP-1001",
          residentName: "Sara Malik",
          propertyNo: "B-05",
          category: "Cleaning",
          description: "Demo complaint — corridor cleaning request (fictional).",
          submittedAt: today,
          assignedStaff: "Farah Maintenance",
          priority: "Medium",
          status: "In Progress",
          remarks: "",
        }),
      ],
      maintenance: [
        record({
          title: "Street Light Repair",
          location: "Block A Gate",
          assignedStaff: "Farah Maintenance",
          priority: "Medium",
          status: "In Progress",
          expense: "2500",
          scheduleDate: today,
          notes: "Fictional maintenance ticket for demo.",
        }),
      ],
      facilities: [
        record({
          facility: "Community Hall",
          bookedBy: "Ahmed Khan",
          houseNo: "A-12",
          date: today,
          timeSlot: "6:00 PM - 9:00 PM",
          charges: "5000",
          status: "Reserved",
        }),
      ],
      parking: [
        record({
          vehicleNo: "ABC-123",
          owner: "Ahmed Khan",
          houseNo: "A-12",
          slot: "A-01",
          type: "Resident Vehicle",
          status: "Assigned",
        }),
      ],
      deliveries: [
        record({
          recipient: "Sara Malik",
          houseNo: "B-05",
          courier: "Demo Courier Co",
          trackingNo: "TRK-DEMO-01",
          arrivedAt: `${today} 11:20 AM`,
          guardId: "GRD-001",
          status: "Waiting for Collection",
          collectedAt: "",
        }),
      ],
      notices: [
        record({
          title: "Water Supply Maintenance",
          type: "Maintenance",
          audience: "All Residents",
          date: today,
          status: "Published",
          message: "Demo notice: water tank cleaning scheduled this weekend.",
        }),
      ],
      documents: [
        record({
          title: "Society Bye-Laws (Demo)",
          category: "Policy",
          refNo: "DOC-001",
          date: "2026-01-01",
          owner: "Admin Office",
          summary: "Fictional document index entry.",
        }),
      ],
      reports: [
        record({
          title: "Monthly Visitor Summary",
          period: "Oct 2026",
          type: "Visitors",
          summary: "Fictional report showing average daily visitor entries.",
        }),
      ],
      settings: [
        record({
          settingKey: "gate_verify_mode",
          settingValue: "entry_code",
          updatedBy: "Admin",
        }),
      ],
    };
  }

  return {
    patients: [
      record({
        name: "Demo Patient One",
        age: "34",
        gender: "Male",
        phone: "+92 300 2223344",
        condition: "General checkup — fictional",
      }),
      record({
        name: "Demo Patient Two",
        age: "28",
        gender: "Female",
        phone: "+92 300 5556677",
        condition: "Follow-up — fictional",
      }),
      record({
        name: "Demo Patient Three",
        age: "51",
        gender: "Male",
        phone: "+92 301 8889900",
        condition: "OPD visit — fictional",
      }),
    ],
    doctors: [
      record({
        name: "Dr. Demo Ali",
        specialty: "General Medicine",
        department: "OPD",
        phone: "+92 321 1112233",
        status: "Available",
      }),
      record({
        name: "Dr. Demo Noor",
        specialty: "Cardiology",
        department: "Cardiology",
        phone: "+92 321 4445566",
        status: "In Surgery",
      }),
    ],
    appointments: [
      record({
        patient: "Demo Patient One",
        doctor: "Dr. Demo Ali",
        date: new Date().toISOString().slice(0, 10),
        time: "10:30 AM",
        status: "Scheduled",
      }),
    ],
    departments: [
      record({
        name: "OPD",
        head: "Dr. Demo Ali",
        floor: "Ground",
        beds: "0",
        status: "Open",
      }),
      record({
        name: "Cardiology",
        head: "Dr. Demo Noor",
        floor: "2nd Floor",
        beds: "12",
        status: "Open",
      }),
    ],
    opd: [
      record({
        patient: "Demo Patient Two",
        doctor: "Dr. Demo Ali",
        token: "T-21",
        complaint: "Fever — fictional",
        status: "Waiting",
      }),
    ],
    admissions: [
      record({
        patient: "Demo Patient Three",
        ward: "Ward B / Room 2",
        doctor: "Dr. Demo Noor",
        admitDate: new Date().toISOString().slice(0, 10),
        status: "Admitted",
      }),
    ],
    billing: [
      record({
        patient: "Demo Patient One",
        service: "OPD Consultation",
        amount: "1500",
        status: "Paid",
        notes: "Fictional billing entry",
      }),
    ],
    pharmacy: [
      record({
        medicine: "Demo Paracetamol 500mg",
        sku: "MED-001",
        quantity: "120",
        expiry: "2027-01-01",
        status: "In Stock",
      }),
    ],
    reports: [
      record({
        title: "OPD Daily Summary",
        period: "Today",
        type: "OPD",
        summary: "Fictional hospital operational report.",
      }),
    ],
  };
}

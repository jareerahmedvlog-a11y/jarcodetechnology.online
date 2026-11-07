import type { CollectionDef, DemoProduct, FieldDef } from "@/lib/demos/types";
import { societyCollections } from "@/config/society";

export { societyCollections };

export const DEMO_WARNING =
  "Public Demo Environment: Information entered here may be visible to other visitors. Please use fictional demo information only. Do not enter real personal, financial, or medical information.";

const EXTRA_NOTE_FIELD: FieldDef = {
  key: "extraNote",
  label: "Extra Note",
  type: "textarea",
  placeholder: "Optional additional information, instructions, or remarks…",
};

function withExtraNote(collections: CollectionDef[]): CollectionDef[] {
  return collections.map((collection) => {
    if (collection.fields.some((field) => field.key === "extraNote")) {
      return collection;
    }
    return {
      ...collection,
      fields: [...collection.fields, EXTRA_NOTE_FIELD],
    };
  });
}

const hospitalCollectionsBase: CollectionDef[] = [
  {
    id: "patients",
    label: "Patient Management",
    description: "Manage fictional patient profiles.",
    fields: [
      { key: "name", label: "Patient Name", required: true },
      { key: "age", label: "Age", type: "number", required: true },
      { key: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"], required: true },
      { key: "phone", label: "Phone", type: "tel", required: true },
      { key: "condition", label: "Condition / Notes", type: "textarea" },
    ],
  },
  {
    id: "doctors",
    label: "Doctor Management",
    description: "Doctor profiles and specialties.",
    fields: [
      { key: "name", label: "Doctor Name", required: true },
      { key: "specialty", label: "Specialty", required: true },
      { key: "department", label: "Department", required: true },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "status", label: "Status", type: "select", options: ["Available", "In Surgery", "On Leave"], required: true },
    ],
  },
  {
    id: "appointments",
    label: "Appointments Management",
    description: "Schedule and track appointments.",
    fields: [
      { key: "patient", label: "Patient", required: true },
      { key: "doctor", label: "Doctor", required: true },
      { key: "date", label: "Date", type: "date", required: true },
      { key: "time", label: "Time", required: true, placeholder: "e.g. 10:30 AM" },
      { key: "status", label: "Status", type: "select", options: ["Scheduled", "Completed", "Cancelled"], required: true },
    ],
  },
  {
    id: "departments",
    label: "Departments Management",
    description: "Hospital departments and head doctors.",
    fields: [
      { key: "name", label: "Department", required: true },
      { key: "head", label: "Head Doctor", required: true },
      { key: "floor", label: "Floor / Wing" },
      { key: "beds", label: "Beds", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["Open", "Limited", "Closed"], required: true },
    ],
  },
  {
    id: "opd",
    label: "OPD Management",
    description: "Outpatient department visit records.",
    fields: [
      { key: "patient", label: "Patient", required: true },
      { key: "doctor", label: "Doctor", required: true },
      { key: "token", label: "Token No", required: true },
      { key: "complaint", label: "Complaint", required: true },
      { key: "status", label: "Status", type: "select", options: ["Waiting", "In Consultation", "Done"], required: true },
    ],
  },
  {
    id: "admissions",
    label: "Admission Records",
    description: "Inpatient admission demo records.",
    fields: [
      { key: "patient", label: "Patient", required: true },
      { key: "ward", label: "Ward / Room", required: true },
      { key: "doctor", label: "Attending Doctor", required: true },
      { key: "admitDate", label: "Admit Date", type: "date", required: true },
      { key: "status", label: "Status", type: "select", options: ["Admitted", "Discharged"], required: true },
    ],
  },
  {
    id: "billing",
    label: "Billing Management",
    description: "Hospital billing / invoice entries.",
    fields: [
      { key: "patient", label: "Patient", required: true },
      { key: "service", label: "Service", required: true },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "status", label: "Status", type: "select", options: ["Unpaid", "Paid", "Partial"], required: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    id: "pharmacy",
    label: "Pharmacy Inventory",
    description: "Demo pharmacy stock items.",
    fields: [
      { key: "medicine", label: "Medicine", required: true },
      { key: "sku", label: "SKU / Batch", required: true },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "expiry", label: "Expiry", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["In Stock", "Low", "Out of Stock"], required: true },
    ],
  },
  {
    id: "reports",
    label: "Reports and Records",
    description: "Hospital operational report demos.",
    fields: [
      { key: "title", label: "Report Title", required: true },
      { key: "period", label: "Period", required: true },
      { key: "type", label: "Type", type: "select", options: ["OPD", "Admissions", "Billing", "Pharmacy"], required: true },
      { key: "summary", label: "Summary", type: "textarea", required: true },
    ],
  },
];

export const hospitalCollections = withExtraNote(hospitalCollectionsBase);

export const demoProducts: Record<
  DemoProduct,
  {
    title: string;
    shortTitle: string;
    description: string;
    href: string;
    collections: CollectionDef[];
  }
> = {
  society: {
    title: "Society Office Management Software",
    shortTitle: "Society Demo",
    description:
      "A complete management solution for housing societies, residential communities, and society offices.",
    href: "/create-your-demo/society",
    collections: societyCollections,
  },
  hospital: {
    title: "Hospital Management System",
    shortTitle: "Hospital Demo",
    description:
      "A management solution designed for hospitals, clinics, doctors, and healthcare administration.",
    href: "/create-your-demo/hospital",
    collections: hospitalCollections,
  },
};

export function getCollections(product: DemoProduct) {
  return demoProducts[product].collections;
}

export function isValidCollection(product: DemoProduct, collection: string) {
  return getCollections(product).some((item) => item.id === collection);
}

export function isInvoiceCollection(collectionId: string) {
  return collectionId === "billing" || collectionId === "bills";
}

export type CustomFieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "textarea"
  | "select";

export type CustomFieldDef = {
  key: string;
  label: string;
  type: CustomFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type CustomModuleDef = {
  id: string;
  label: string;
  description: string;
  fields: CustomFieldDef[];
};

export type CustomDemoStatus =
  | "draft"
  | "published"
  | "unpublished"
  | "suspended"
  | "archived";

export type CustomDemoRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
} & Record<string, string>;

export type CustomDemoData = Record<string, CustomDemoRecord[]>;

export type CustomDemoConfig = {
  id: string;
  slug: string;
  businessName: string;
  businessType: string;
  niche: string;
  description: string;
  requirements: string;
  currency: string;
  country: string;
  extraInstructions: string;
  modules: CustomModuleDef[];
  aiAssistantEnabled: boolean;
  unsupportedNotes: string[];
  status: CustomDemoStatus;
  creatorLabel: string;
  creatorKey: string;
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

export type CustomDemoBundle = {
  config: CustomDemoConfig;
  data: CustomDemoData;
};

export const BUSINESS_NICHES = [
  "School Management",
  "College Management",
  "University Management",
  "Restaurant Management",
  "Hotel Management",
  "Gym Management",
  "Pharmacy Management",
  "Real Estate Management",
  "Construction Management",
  "Retail Store Management",
  "Supermarket Management",
  "Warehouse Management",
  "Factory Management",
  "Textile Management",
  "Transport Management",
  "Automobile Workshop Management",
  "Salon Management",
  "Clinic Management",
  "Diagnostic Laboratory",
  "Travel Agency Management",
  "Event Management",
  "Custom Business",
] as const;

export const ALLOWED_FIELD_TYPES: CustomFieldType[] = [
  "text",
  "email",
  "tel",
  "number",
  "date",
  "textarea",
  "select",
];

export type DemoProduct = "society" | "hospital";

export type DemoRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
} & Record<string, string>;

export type DemoDatabase = Record<string, DemoRecord[]>;

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type CollectionDef = {
  id: string;
  label: string;
  description: string;
  fields: FieldDef[];
};

import type { DemoProduct } from "@/lib/demos/types";

export type ClientStatus = "active" | "suspended" | "deactivated";

export type ClientAccount = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  erp: DemoProduct;
  passwordHash: string;
  status: ClientStatus;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

export type ClientPublic = Omit<ClientAccount, "passwordHash">;

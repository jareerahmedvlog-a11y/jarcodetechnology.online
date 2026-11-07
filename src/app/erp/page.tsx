import { redirect } from "next/navigation";
import { DemoWorkspace } from "@/components/demos/DemoWorkspace";
import { SocietyWorkspace } from "@/components/society/SocietyWorkspace";
import { ClientErpShell } from "@/components/erp/ClientErpShell";
import { getClientSession } from "@/lib/client-auth";
import { emptyDemoDatabase } from "@/lib/demos/empty";
import { getTenantDatabase } from "@/lib/tenants/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Client ERP System",
  robots: { index: false, follow: false },
};

export default async function ClientErpPage() {
  const client = await getClientSession();
  if (!client) redirect("/login?next=/erp");

  const initialData = await getTenantDatabase(client.tenantId, client.erp);

  return (
    <div className="demo-shell pb-16 pt-4">
      <ClientErpShell
        clientName={client.name}
        email={client.email}
        erp={client.erp}
        mustChangePassword={client.mustChangePassword}
      />
      {client.erp === "society" ? (
        <SocietyWorkspace
          mode="tenant"
          clientName={client.name}
          initialData={initialData ?? emptyDemoDatabase("society")}
        />
      ) : (
        <DemoWorkspace
          product="hospital"
          mode="tenant"
          clientName={client.name}
          initialData={initialData ?? emptyDemoDatabase("hospital")}
        />
      )}
    </div>
  );
}

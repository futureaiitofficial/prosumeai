import { ApiKeysManagement } from "@/components/admin/api-keys-management";
import { AdminLayout } from "@/components/admin/layout";

export default function ApiKeysPage() {
  return (
    <AdminLayout>
      <ApiKeysManagement />
    </AdminLayout>
  );
} 
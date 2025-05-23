import React from "react";
import { AdminLayout } from "@/components/admin/layout";
import EmailTemplatesManagement from "@/components/admin/email-templates-management";
import { Helmet } from "react-helmet";

export default function AdminEmailTemplatesPage() {
  return (
    <AdminLayout>
      <Helmet>
        <title>Email Templates | Admin Dashboard</title>
      </Helmet>
      <EmailTemplatesManagement />
    </AdminLayout>
  );
} 
import React from "react";
import { AdminLayout } from "@/components/admin/layout";
import SettingsTabs from "@/components/admin/settings-tabs";

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-8">Admin Settings</h1>
        <SettingsTabs />
      </div>
    </AdminLayout>
  );
} 
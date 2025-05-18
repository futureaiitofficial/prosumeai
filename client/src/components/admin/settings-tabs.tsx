import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandSettings from "@/components/admin/settings/brand-settings";
import SMTPSettings from "@/components/admin/settings/smtp-settings";
import TwoFactorSettings from "@/components/admin/settings/two-factor-settings";

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("branding");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-4 pt-4">
          <BrandSettings />
        </TabsContent>

        <TabsContent value="email" className="space-y-4 pt-4">
          <SMTPSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-4 pt-4">
          <TwoFactorSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
} 
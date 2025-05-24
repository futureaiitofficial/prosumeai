import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandSettings from "@/components/admin/settings/brand-settings";
import SMTPSettings from "@/components/admin/settings/smtp-settings";

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("branding");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-4 pt-4">
          <BrandSettings />
        </TabsContent>

        <TabsContent value="email" className="space-y-4 pt-4">
          <SMTPSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
} 
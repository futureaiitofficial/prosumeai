import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function TwoFactorSettings() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // 2FA settings form data
  const [formData, setFormData] = useState({
    requireAdminTwoFactor: true,
    allowUserTwoFactor: true,
    defaultTwoFactorMethod: "app",
    sessionTimeout: "30",
    maxFailedAttempts: "5",
    lockoutDuration: "15",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>
            Security settings updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Configure two-factor authentication settings for your application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireAdminTwoFactor" className="font-medium">
                  Require 2FA for Admin Access
                </Label>
                <p className="text-sm text-gray-500">
                  Force administrators to use two-factor authentication to access admin areas.
                </p>
              </div>
              <Switch
                id="requireAdminTwoFactor"
                checked={formData.requireAdminTwoFactor}
                onCheckedChange={(checked) => handleSwitchChange("requireAdminTwoFactor", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowUserTwoFactor" className="font-medium">
                  Allow Users to Enable 2FA
                </Label>
                <p className="text-sm text-gray-500">
                  Let regular users enable two-factor authentication for their accounts.
                </p>
              </div>
              <Switch
                id="allowUserTwoFactor"
                checked={formData.allowUserTwoFactor}
                onCheckedChange={(checked) => handleSwitchChange("allowUserTwoFactor", checked)}
              />
            </div>

            <div className="pt-4">
              <Label htmlFor="defaultTwoFactorMethod" className="font-medium">
                Default 2FA Method
              </Label>
              <Select 
                value={formData.defaultTwoFactorMethod}
                onValueChange={(value) => handleSelectChange("defaultTwoFactorMethod", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select default 2FA method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="app">Authenticator App (TOTP)</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                The default method offered to users for two-factor authentication.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  name="sessionTimeout"
                  type="number"
                  value={formData.sessionTimeout}
                  onChange={handleInputChange}
                  min="5"
                  max="1440"
                />
                <p className="text-xs text-gray-500">
                  Time before users are logged out automatically.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxFailedAttempts">Max Failed Login Attempts</Label>
                <Input
                  id="maxFailedAttempts"
                  name="maxFailedAttempts"
                  type="number"
                  value={formData.maxFailedAttempts}
                  onChange={handleInputChange}
                  min="3"
                  max="10"
                />
                <p className="text-xs text-gray-500">
                  Number of failed attempts before account lockout.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                <Input
                  id="lockoutDuration"
                  name="lockoutDuration"
                  type="number"
                  value={formData.lockoutDuration}
                  onChange={handleInputChange}
                  min="5"
                  max="1440"
                />
                <p className="text-xs text-gray-500">
                  Time an account remains locked after too many failed attempts.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Save Security Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
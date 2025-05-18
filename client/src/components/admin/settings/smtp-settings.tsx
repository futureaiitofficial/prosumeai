import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SMTPSettings() {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState<string | boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // SMTP settings form data
  const [formData, setFormData] = useState({
    host: "",
    port: "587",
    username: "",
    password: "",
    encryption: "tls",
    senderName: "atScribe",
    senderEmail: "no-reply@atscribe.com",
    enabled: true,
  });

  useEffect(() => {
    // Fetch SMTP settings on component mount
    fetchSmtpSettings();
  }, []);

  const fetchSmtpSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/smtp-settings');
      
      if (!response.ok) {
        if (response.status === 404) {
          // No settings found, use defaults
          setIsLoading(false);
          return;
        }
        throw new Error(`Failed to fetch SMTP settings: ${response.statusText}`);
      }
      
      const data = await response.json();
      setFormData({
        host: data.host || "",
        port: data.port || "587",
        username: data.username || "",
        password: data.password || "",
        encryption: data.encryption || "tls",
        senderName: data.senderName || "atScribe",
        senderEmail: data.senderEmail || "no-reply@atscribe.com",
        enabled: data.enabled !== undefined ? data.enabled : true,
      });
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching SMTP settings:", err);
      setError("Failed to load SMTP settings. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setSuccess(false);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/smtp-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save SMTP settings: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Update form with returned data
      setFormData({
        host: data.host || "",
        port: data.port || "587",
        username: data.username || "",
        password: data.password || "",
        encryption: data.encryption || "tls",
        senderName: data.senderName || "atScribe",
        senderEmail: data.senderEmail || "no-reply@atscribe.com",
        enabled: data.enabled !== undefined ? data.enabled : true,
      });
      
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error saving SMTP settings:", err);
      setError(err.message || "Failed to save SMTP settings");
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    const testEmail = prompt("Enter email address to send test message to:");
    if (!testEmail) return;
    
    setTestLoading(true);
    setTestSuccess(false);
    setTestError(false);
    
    try {
      const response = await fetch('/api/admin/smtp-settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testEmail }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `Failed to send test email: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTestSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setTestSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error sending test email:", err);
      setTestError(err.message || "Failed to send test email");
      
      // Reset error message after 5 seconds
      setTimeout(() => {
        setTestError(false);
      }, 5000);
    } finally {
      setTestLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="bg-red-50 text-red-800 border-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>
            SMTP settings updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {testSuccess && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>
            Test email sent successfully! Check your inbox.
          </AlertDescription>
        </Alert>
      )}

      {testError && (
        <Alert className="bg-red-50 text-red-800 border-red-200">
          <AlertDescription>
            {typeof testError === 'string' ? testError : "Failed to send test email. Please check your SMTP settings."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => handleSwitchChange("enabled", checked)}
              />
              <Label htmlFor="enabled">Enable SMTP Email Sending</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">SMTP Host</Label>
                <Input
                  id="host"
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                  placeholder="smtp.example.com"
                  disabled={!formData.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">SMTP Port</Label>
                <Input
                  id="port"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  placeholder="587"
                  disabled={!formData.enabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">SMTP Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="username@example.com"
                  disabled={!formData.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">SMTP Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="•••••••••••"
                  disabled={!formData.enabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="encryption">Encryption</Label>
                <Select 
                  value={formData.encryption}
                  onValueChange={(value) => handleSelectChange("encryption", value)}
                  disabled={!formData.enabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select encryption type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                    <SelectItem value="tls">TLS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Sender Name</Label>
                <Input
                  id="senderName"
                  name="senderName"
                  value={formData.senderName}
                  onChange={handleChange}
                  placeholder="Your Application Name"
                  disabled={!formData.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderEmail">Sender Email</Label>
                <Input
                  id="senderEmail"
                  name="senderEmail"
                  value={formData.senderEmail}
                  onChange={handleChange}
                  placeholder="no-reply@yourdomain.com"
                  disabled={!formData.enabled}
                />
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button type="submit" disabled={loading || !formData.enabled}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={handleTestEmail}
                disabled={testLoading || !formData.enabled}
              >
                {testLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Email
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
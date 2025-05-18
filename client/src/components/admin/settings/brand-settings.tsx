import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, Save, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";

export default function BrandSettings() {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  
  // Brand settings form data
  const [formData, setFormData] = useState({
    appName: "ProsumeAI",
    appTagline: "AI-powered resume and career tools",
    logoUrl: "/logo.png",
    faviconUrl: "/favicon.ico",
    enableDarkMode: true,
    primaryColor: "#4f46e5",
    secondaryColor: "#10b981",
    accentColor: "#f97316",
    footerText: "© 2023 ProsumeAI. All rights reserved.",
    customCss: "",
    customJs: ""
  });

  // Fetch branding settings on component mount
  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    setFetchLoading(true);
    try {
      const response = await axios.get('/api/admin/branding-settings');
      setFormData(response.data);
    } catch (err) {
      console.error("Error fetching branding settings:", err);
      setError("Failed to load branding settings. Please refresh the page.");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/api/admin/branding-settings', formData);
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error updating branding settings:", err);
      setError("Failed to save branding settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('logo', file);
    
    try {
      setLoading(true);
      const response = await axios.post('/api/admin/branding/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update the logo URL in the form data
      setFormData(prev => ({ ...prev, logoUrl: response.data.logoUrl }));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error uploading logo:", err);
      setError("Failed to upload logo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('favicon', file);
    
    try {
      setLoading(true);
      const response = await axios.post('/api/admin/branding/favicon', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update the favicon URL in the form data
      setFormData(prev => ({ ...prev, faviconUrl: response.data.faviconUrl }));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error uploading favicon:", err);
      setError("Failed to upload favicon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading branding settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>
            Brand settings updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 text-red-800 border-red-200">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Brand Settings</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchBrandingSettings}
          disabled={fetchLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="customization">Customization</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appName">Application Name</Label>
                    <Input
                      id="appName"
                      name="appName"
                      value={formData.appName}
                      onChange={handleChange}
                      placeholder="Your application name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appTagline">Tagline/Slogan</Label>
                    <Input
                      id="appTagline"
                      name="appTagline"
                      value={formData.appTagline}
                      onChange={handleChange}
                      placeholder="A short description of your application"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="footerText">Footer Text</Label>
                    <Input
                      id="footerText"
                      name="footerText"
                      value={formData.footerText}
                      onChange={handleChange}
                      placeholder="Copyright text and information"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 pt-4">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        id="primaryColor"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleChange}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={formData.primaryColor}
                        onChange={handleChange}
                        name="primaryColor"
                        placeholder="#4f46e5"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        id="secondaryColor"
                        name="secondaryColor"
                        value={formData.secondaryColor}
                        onChange={handleChange}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={handleChange}
                        name="secondaryColor"
                        placeholder="#10b981"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        id="accentColor"
                        name="accentColor"
                        value={formData.accentColor}
                        onChange={handleChange}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={formData.accentColor}
                        onChange={handleChange}
                        name="accentColor"
                        placeholder="#f97316"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="enableDarkMode"
                    checked={formData.enableDarkMode}
                    onCheckedChange={(checked) => handleSwitchChange("enableDarkMode", checked)}
                  />
                  <Label htmlFor="enableDarkMode">Enable Dark Mode Option for Users</Label>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customization" className="space-y-4 pt-4">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="logoUpload" className="block mb-2">Logo Upload</Label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center overflow-hidden">
                        {formData.logoUrl ? (
                          <img 
                            src={formData.logoUrl} 
                            alt="Logo" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-gray-400">No logo</span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          id="logoUpload"
                          accept="image/png,image/jpeg,image/gif"
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          onChange={handleLogoUpload}
                          disabled={loading}
                        />
                        <Button type="button" variant="outline" className="h-10">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Logo
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="faviconUpload" className="block mb-2">Favicon Upload</Label>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center overflow-hidden">
                        {formData.faviconUrl ? (
                          <img 
                            src={formData.faviconUrl} 
                            alt="Favicon" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">No icon</span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          id="faviconUpload"
                          accept="image/png,image/jpeg,image/gif,image/x-icon"
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          onChange={handleFaviconUpload}
                          disabled={loading}
                        />
                        <Button type="button" variant="outline" className="h-10">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Favicon
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-6">
                    <Label htmlFor="customCss">Custom CSS</Label>
                    <textarea
                      id="customCss"
                      name="customCss"
                      value={formData.customCss}
                      onChange={handleChange}
                      placeholder="Add custom CSS rules here"
                      className="w-full min-h-[120px] rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500">
                      Custom CSS will be applied globally to all pages. Be careful with styling conflicts.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customJs">Custom JavaScript</Label>
                    <textarea
                      id="customJs"
                      name="customJs"
                      value={formData.customJs}
                      onChange={handleChange}
                      placeholder="Add custom JavaScript here"
                      className="w-full min-h-[120px] rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500">
                      Custom JavaScript will be executed on all pages. Use with caution.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
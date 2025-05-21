import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { PlusCircle, Trash2, Save, Info, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Country, State } from 'country-state-city';

interface CountryType {
  isoCode: string;
  name: string;
  phonecode: string;
  flag: string;
  currency: string;
  latitude: string;
  longitude: string;
  timezones?: {zoneName: string; gmtOffset: number}[];
}

interface StateType {
  isoCode: string;
  name: string;
  countryCode: string;
  latitude?: string;
  longitude?: string;
}

interface TaxSetting {
  id?: number;
  name: string;
  type: 'GST' | 'CGST' | 'SGST' | 'IGST';
  percentage: number;
  country: string;
  stateApplicable?: string;
  enabled: boolean;
  applyToRegion: 'INDIA' | 'GLOBAL';
  applyCurrency: 'INR' | 'USD';
}

interface CompanyTaxInfo {
  id?: number;
  companyName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  gstin?: string;
  pan?: string;
  taxRegNumber?: string;
  email: string;
  phone: string;
}

interface InvoiceSettings {
  id?: number;
  logoUrl?: string;
  footerText?: string;
  termsAndConditions?: string;
  invoicePrefix: string;
  showTaxBreakdown: boolean;
  nextInvoiceNumber: number;
  defaultDueDays: number;
}

export default function TaxSettings() {
  const [activeTab, setActiveTab] = useState('tax-settings');
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyTaxInfo>({
    companyName: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    email: '',
    phone: ''
  });
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    invoicePrefix: 'INV-',
    showTaxBreakdown: true,
    nextInvoiceNumber: 1000,
    defaultDueDays: 15
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Add state for countries and states data
  const [countries, setCountries] = useState<CountryType[]>([]);
  const [statesByCountry, setStatesByCountry] = useState<Record<string, StateType[]>>({});
  const [selectedCompanyCountry, setSelectedCompanyCountry] = useState<string>('');

  // Load countries and states on component mount
  useEffect(() => {
    // Load countries
    const allCountries = Country.getAllCountries();
    setCountries(allCountries as CountryType[]);
  }, []);

  // Update states when company country changes
  useEffect(() => {
    if (selectedCompanyCountry) {
      const countryStates = State.getStatesOfCountry(selectedCompanyCountry);
      setStatesByCountry(prev => ({
        ...prev,
        [selectedCompanyCountry]: countryStates as StateType[]
      }));
    }
  }, [selectedCompanyCountry]);

  // New tax setting template
  const newTaxSetting: TaxSetting = {
    name: '',
    type: 'GST',
    percentage: 18,
    country: 'IN',
    enabled: true,
    applyToRegion: 'INDIA',
    applyCurrency: 'INR'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tax settings
      const taxResponse = await axios.get('/api/admin/tax-settings');
      setTaxSettings(taxResponse.data);

      // Fetch company info
      const companyResponse = await axios.get('/api/admin/company-tax-info');
      if (companyResponse.data) {
        setCompanyInfo(companyResponse.data);
        // Set selected country to trigger states loading
        if (companyResponse.data.country) {
          setSelectedCompanyCountry(companyResponse.data.country);
        }
      }

      // Fetch invoice settings
      const invoiceResponse = await axios.get('/api/admin/invoice-settings');
      if (invoiceResponse.data) {
        setInvoiceSettings(invoiceResponse.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load tax settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTaxSetting = () => {
    setTaxSettings([...taxSettings, { ...newTaxSetting }]);
  };

  const handleDeleteTaxSetting = async (index: number) => {
    const setting = taxSettings[index];
    if (setting.id) {
      try {
        await axios.delete(`/api/admin/tax-settings/${setting.id}`);
        toast({
          title: 'Success',
          description: 'Tax setting deleted successfully'
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to delete tax setting',
          variant: 'destructive'
        });
        return;
      }
    }
    
    const updatedSettings = [...taxSettings];
    updatedSettings.splice(index, 1);
    setTaxSettings(updatedSettings);
  };

  const handleTaxSettingChange = (index: number, field: keyof TaxSetting, value: any) => {
    const updatedSettings = [...taxSettings];
    updatedSettings[index] = {
      ...updatedSettings[index],
      [field]: value
    };
    setTaxSettings(updatedSettings);
  };

  const handleCompanyInfoChange = (field: keyof CompanyTaxInfo, value: any) => {
    setCompanyInfo({
      ...companyInfo,
      [field]: value
    });
  };

  const handleInvoiceSettingsChange = (field: keyof InvoiceSettings, value: any) => {
    setInvoiceSettings({
      ...invoiceSettings,
      [field]: value
    });
  };

  const saveTaxSettings = async () => {
    setSaving(true);
    try {
      // Save each tax setting
      for (const setting of taxSettings) {
        if (setting.id) {
          // Update existing
          await axios.patch(`/api/admin/tax-settings/${setting.id}`, setting);
        } else {
          // Create new
          await axios.post('/api/admin/tax-settings', setting);
        }
      }
      
      toast({
        title: 'Success',
        description: 'Tax settings saved successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save tax settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const saveCompanyInfo = async () => {
    setSaving(true);
    try {
      await axios.put('/api/admin/company-tax-info', companyInfo);
      toast({
        title: 'Success',
        description: 'Company tax information saved successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save company information',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const saveInvoiceSettings = async () => {
    setSaving(true);
    try {
      await axios.put('/api/admin/invoice-settings', invoiceSettings);
      toast({
        title: 'Success',
        description: 'Invoice settings saved successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save invoice settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Add a function to create default Indian GST structure
  const createDefaultIndianGST = async () => {
    setSaving(true);
    try {
      // Get the state name if we have an isoCode
      let stateName = companyInfo.state;
      if (companyInfo.state && companyInfo.country === 'IN') {
        const stateObj = State.getStateByCodeAndCountry(companyInfo.state, 'IN');
        if (stateObj) {
          stateName = stateObj.name;
        }
      }

      // Create default tax settings for India
      const defaultTaxes = [
        {
          name: 'GST',
          type: 'GST',
          percentage: 18.0,
          country: 'IN',
          enabled: true,
          applyToRegion: 'INDIA',
          applyCurrency: 'INR'
        },
        {
          name: 'CGST',
          type: 'CGST',
          percentage: 9.0,
          country: 'IN',
          stateApplicable: companyInfo.state || '',
          enabled: true,
          applyToRegion: 'INDIA',
          applyCurrency: 'INR'
        },
        {
          name: 'SGST',
          type: 'SGST',
          percentage: 9.0,
          country: 'IN',
          stateApplicable: companyInfo.state || '',
          enabled: true,
          applyToRegion: 'INDIA',
          applyCurrency: 'INR'
        },
        {
          name: 'IGST',
          type: 'IGST',
          percentage: 18.0,
          country: 'IN',
          enabled: true,
          applyToRegion: 'INDIA',
          applyCurrency: 'INR'
        }
      ];
      
      // First, delete existing tax settings
      for (const tax of taxSettings) {
        if (tax.id) {
          await axios.delete(`/api/admin/tax-settings/${tax.id}`);
        }
      }
      
      // Then create new ones
      for (const tax of defaultTaxes) {
        await axios.post('/api/admin/tax-settings', tax);
      }
      
      // Refetch the tax settings
      await fetchData();
      
      toast({
        title: 'Success',
        description: 'Default GST structure for India created successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create default GST structure',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tax Management</CardTitle>
          <CardDescription>Loading tax settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tax Management</CardTitle>
          <CardDescription>
            Configure tax settings for your application. For INR payments, GST tax will be applied.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="tax-settings">Tax Settings</TabsTrigger>
              <TabsTrigger value="company-info">Company Information</TabsTrigger>
              <TabsTrigger value="invoice-settings">Invoice Settings</TabsTrigger>
            </TabsList>

            {/* Tax Settings Tab */}
            <TabsContent value="tax-settings">
              <div className="space-y-6">
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    For proper GST calculation in India, you need to set up CGST, SGST for intra-state transactions (same state) 
                    and IGST for inter-state transactions. Make sure your company state is set correctly in the Company Information tab.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Tax Settings</h3>
                  <div className="space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Info className="mr-2 h-4 w-4" />
                          Create Default GST
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Default GST Structure</DialogTitle>
                          <DialogDescription>
                            This will create a standard GST structure for India with CGST, SGST, and IGST. Any existing tax settings will be replaced.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <p className="text-sm">The following tax rates will be created:</p>
                          <ul className="list-disc pl-5 mt-2 text-sm">
                            <li>GST: 18% (standard rate)</li>
                            <li>CGST: 9% (for intra-state transactions)</li>
                            <li>SGST: 9% (for intra-state transactions)</li>
                            <li>IGST: 18% (for inter-state transactions)</li>
                          </ul>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => document.querySelector('[data-state="open"] [role="dialog"] button[type="button"]')?.dispatchEvent(new MouseEvent('click'))}>
                            Cancel
                          </Button>
                          <Button onClick={createDefaultIndianGST}>
                            Create Default GST
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={handleAddTaxSetting} variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Tax Setting
                    </Button>
                  </div>
                </div>

                {taxSettings.map((setting, index) => (
                  <div key={index} className="border p-4 rounded-md space-y-4">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Tax Setting {index + 1}</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteTaxSetting(index)}
                        className="text-destructive h-7"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${index}`}>Tax Name</Label>
                        <Input 
                          id={`name-${index}`}
                          value={setting.name} 
                          onChange={(e) => handleTaxSettingChange(index, 'name', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`type-${index}`}>Tax Type</Label>
                        <Select 
                          value={setting.type}
                          onValueChange={(value) => handleTaxSettingChange(index, 'type', value)}
                        >
                          <SelectTrigger id={`type-${index}`}>
                            <SelectValue placeholder="Select tax type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GST">GST</SelectItem>
                            <SelectItem value="CGST">CGST</SelectItem>
                            <SelectItem value="SGST">SGST</SelectItem>
                            <SelectItem value="IGST">IGST</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`percentage-${index}`}>Percentage (%)</Label>
                        <Input 
                          id={`percentage-${index}`}
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          value={setting.percentage} 
                          onChange={(e) => handleTaxSettingChange(index, 'percentage', parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`country-${index}`}>Country</Label>
                        <Select 
                          value={setting.country}
                          onValueChange={(value) => {
                            handleTaxSettingChange(index, 'country', value);
                            // If there are states for this country and stateApplicable is set, check if it's valid
                            const countryStates = State.getStatesOfCountry(value);
                            if (countryStates.length > 0 && setting.stateApplicable) {
                              // If current state not in this country's states, reset it
                              const stateExists = countryStates.some(state => state.isoCode === setting.stateApplicable);
                              if (!stateExists) {
                                handleTaxSettingChange(index, 'stateApplicable', '');
                              }
                            }
                          }}
                        >
                          <SelectTrigger id={`country-${index}`}>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.isoCode} value={country.isoCode}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`state-${index}`}>State (if applicable)</Label>
                        {setting.country && State.getStatesOfCountry(setting.country).length > 0 ? (
                          <Select 
                            value={setting.stateApplicable || ''}
                            onValueChange={(value) => handleTaxSettingChange(index, 'stateApplicable', value)}
                          >
                            <SelectTrigger id={`state-${index}`}>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {(State.getStatesOfCountry(setting.country) as StateType[]).map((state) => (
                                <SelectItem key={state.isoCode} value={state.isoCode}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input 
                            id={`state-${index}`}
                            value={setting.stateApplicable || ''} 
                            onChange={(e) => handleTaxSettingChange(index, 'stateApplicable', e.target.value)}
                          />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`region-${index}`}>Apply to Region</Label>
                        <Select 
                          value={setting.applyToRegion}
                          onValueChange={(value: 'INDIA' | 'GLOBAL') => handleTaxSettingChange(index, 'applyToRegion', value)}
                        >
                          <SelectTrigger id={`region-${index}`}>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INDIA">India Only</SelectItem>
                            <SelectItem value="GLOBAL">Global</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`currency-${index}`}>Apply to Currency</Label>
                        <Select 
                          value={setting.applyCurrency}
                          onValueChange={(value: 'INR' | 'USD') => handleTaxSettingChange(index, 'applyCurrency', value)}
                        >
                          <SelectTrigger id={`currency-${index}`}>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2 flex items-center">
                        <Label htmlFor={`enabled-${index}`} className="mr-2">Enabled</Label>
                        <Switch 
                          id={`enabled-${index}`}
                          checked={setting.enabled} 
                          onCheckedChange={(checked) => handleTaxSettingChange(index, 'enabled', checked)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button onClick={saveTaxSettings} disabled={saving} className="mt-4">
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save className="h-4 w-4 mr-2" />}
                  Save Tax Settings
                </Button>
              </div>
            </TabsContent>

            {/* Company Info Tab */}
            <TabsContent value="company-info">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Company Tax Information</h3>
                <p className="text-sm text-muted-foreground">
                  This information will be displayed on invoices and used for tax calculations.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input 
                      id="companyName"
                      value={companyInfo.companyName} 
                      onChange={(e) => handleCompanyInfoChange('companyName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address"
                      value={companyInfo.address} 
                      onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city"
                      value={companyInfo.city} 
                      onChange={(e) => handleCompanyInfoChange('city', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select 
                      value={companyInfo.country} 
                      onValueChange={(value) => {
                        handleCompanyInfoChange('country', value);
                        setSelectedCompanyCountry(value);
                      }}
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.isoCode} value={country.isoCode}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    {selectedCompanyCountry && statesByCountry[selectedCompanyCountry]?.length > 0 ? (
                      <Select 
                        value={companyInfo.state} 
                        onValueChange={(value) => handleCompanyInfoChange('state', value)}
                      >
                        <SelectTrigger id="state">
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        <SelectContent>
                          {statesByCountry[selectedCompanyCountry].map((state) => (
                            <SelectItem key={state.isoCode} value={state.isoCode}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        id="state"
                        value={companyInfo.state} 
                        onChange={(e) => handleCompanyInfoChange('state', e.target.value)}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input 
                      id="postalCode"
                      value={companyInfo.postalCode} 
                      onChange={(e) => handleCompanyInfoChange('postalCode', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={companyInfo.email} 
                      onChange={(e) => handleCompanyInfoChange('email', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone"
                      value={companyInfo.phone} 
                      onChange={(e) => handleCompanyInfoChange('phone', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN (for India)</Label>
                    <Input 
                      id="gstin"
                      value={companyInfo.gstin || ''} 
                      onChange={(e) => handleCompanyInfoChange('gstin', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN (for India)</Label>
                    <Input 
                      id="pan"
                      value={companyInfo.pan || ''} 
                      onChange={(e) => handleCompanyInfoChange('pan', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRegNumber">Tax Registration Number</Label>
                    <Input 
                      id="taxRegNumber"
                      value={companyInfo.taxRegNumber || ''} 
                      onChange={(e) => handleCompanyInfoChange('taxRegNumber', e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={saveCompanyInfo} disabled={saving} className="mt-4">
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save className="h-4 w-4 mr-2" />}
                  Save Company Information
                </Button>
              </div>
            </TabsContent>

            {/* Invoice Settings Tab */}
            <TabsContent value="invoice-settings">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Invoice Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure how invoices are generated and displayed.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input 
                      id="logoUrl"
                      value={invoiceSettings.logoUrl || ''} 
                      onChange={(e) => handleInvoiceSettingsChange('logoUrl', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                    <Input 
                      id="invoicePrefix"
                      value={invoiceSettings.invoicePrefix} 
                      onChange={(e) => handleInvoiceSettingsChange('invoicePrefix', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nextInvoiceNumber">Next Invoice Number</Label>
                    <Input 
                      id="nextInvoiceNumber"
                      type="number"
                      min="1"
                      value={invoiceSettings.nextInvoiceNumber} 
                      onChange={(e) => handleInvoiceSettingsChange('nextInvoiceNumber', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultDueDays">Default Due Days</Label>
                    <Input 
                      id="defaultDueDays"
                      type="number"
                      min="0"
                      value={invoiceSettings.defaultDueDays} 
                      onChange={(e) => handleInvoiceSettingsChange('defaultDueDays', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="footerText">Footer Text</Label>
                    <Input 
                      id="footerText"
                      value={invoiceSettings.footerText || ''} 
                      onChange={(e) => handleInvoiceSettingsChange('footerText', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
                    <textarea 
                      id="termsAndConditions"
                      className="w-full min-h-[100px] p-2 border rounded-md"
                      value={invoiceSettings.termsAndConditions || ''} 
                      onChange={(e) => handleInvoiceSettingsChange('termsAndConditions', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 flex items-center">
                    <Label htmlFor="showTaxBreakdown" className="mr-2">Show Tax Breakdown</Label>
                    <Switch 
                      id="showTaxBreakdown"
                      checked={invoiceSettings.showTaxBreakdown} 
                      onCheckedChange={(checked) => handleInvoiceSettingsChange('showTaxBreakdown', checked)}
                    />
                  </div>
                </div>

                <Button onClick={saveInvoiceSettings} disabled={saving} className="mt-4">
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save className="h-4 w-4 mr-2" />}
                  Save Invoice Settings
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 
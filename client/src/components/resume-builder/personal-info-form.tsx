import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from 'react';

interface PersonalInfoFormProps {
  data: any;
  updateData: (data: any) => void;
}

type Errors = {
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  fullName?: string;
};

export default function PersonalInfoForm({ data, updateData }: PersonalInfoFormProps) {
  const [errors, setErrors] = useState<Errors>({});

  const validateEmail = (email: string) => {
    const re = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^[0-9+\-\s]*$/;
    return re.test(phone);
  };

  const validateURL = (url: string) => {
    if (!url) return true; // Allow empty URLs
    
    try {
      // Automatically prepend https:// for validation if missing
      const processedUrl = url.startsWith('http') ? url : `https://${url}`;
      new URL(processedUrl);
      return true;
    } catch (_) {
      return false;
    }
  };

  const validateName = (name: string) => {
    const re = /^[A-Za-z\s]*$/;
    return re.test(name);
  };

  const updateField = (field: string, value: any) => {
    let isValid = true;
    let errorMsg = '';
    let updatedValue = value;

    switch (field) {
      case 'email':
        isValid = value === '' || validateEmail(value);
        errorMsg = isValid ? '' : 'Invalid email format';
        break;
      case 'phone':
        isValid = value === '' || validatePhone(value);
        errorMsg = isValid ? '' : 'Invalid phone number';
        break;
      case 'linkedinUrl':
      case 'portfolioUrl':
        isValid = value === '' || validateURL(value);
        errorMsg = isValid ? '' : 'Invalid URL';
        // Ensure URL has http/https prefix for proper linking
        if (isValid && value && !value.startsWith('http')) {
          updatedValue = `https://${value}`;
        }
        break;
      case 'fullName':
        isValid = value === '' || validateName(value);
        errorMsg = isValid ? '' : 'Name can only contain letters and spaces';
        break;
      default:
        break;
    }

    // Always update the data regardless of validation
    updateData({ [field]: updatedValue });
    
    setErrors((prevErrors) => ({ ...prevErrors, [field]: errorMsg }));
  };

  // Safely get full name parts, handling null/undefined
  const getFullNameParts = () => {
    const fullName = data?.fullName || '';
    const parts = fullName.split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  };

  const { firstName, lastName } = getFullNameParts();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
      
      <div className="grid gap-2">
        <Label htmlFor="jobTitle">Job Title</Label>
        <Input
          id="jobTitle"
          placeholder="The role you want"
          value={data?.targetJobTitle || ""}
          onChange={(e) => updateField("targetJobTitle", e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="Your first name"
            value={firstName}
            onChange={(e) => {
              updateField("fullName", `${e.target.value} ${lastName}`.trim());
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Your last name"
            value={lastName}
            onChange={(e) => {
              updateField("fullName", `${firstName} ${e.target.value}`.trim());
            }}
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={data?.email || ""}
          onChange={(e) => updateField("email", e.target.value)}
        />
        {errors.email && <p className="text-red-500">{errors.email}</p>}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          placeholder="Your phone number"
          value={data?.phone || ""}
          onChange={(e) => updateField("phone", e.target.value)}
        />
        {errors.phone && <p className="text-red-500">{errors.phone}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="Your city"
            value={data?.city || ""}
            onChange={(e) => updateField("city", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            placeholder="Your state/province"
            value={data?.state || ""}
            onChange={(e) => updateField("state", e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
        <Input
          id="linkedinUrl"
          placeholder="linkedin.com/in/username"
          value={data?.linkedinUrl ? data.linkedinUrl.replace(/^https?:\/\//, '') : ""}
          onChange={(e) => {
            const value = e.target.value;
            // Only add prefix when saving to data, not in the input display
            const urlToSave = value && !value.startsWith('http') ? `https://${value}` : value;
            updateField("linkedinUrl", urlToSave);
          }}
        />
        {errors.linkedinUrl && <p className="text-red-500">{errors.linkedinUrl}</p>}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="portfolioUrl">Portfolio/Website URL</Label>
        <Input
          id="portfolioUrl"
          placeholder="yourwebsite.com"
          value={data?.portfolioUrl ? data.portfolioUrl.replace(/^https?:\/\//, '') : ""}
          onChange={(e) => {
            const value = e.target.value;
            // Only add prefix when saving to data, not in the input display
            const urlToSave = value && !value.startsWith('http') ? `https://${value}` : value;
            updateField("portfolioUrl", urlToSave);
          }}
        />
        {errors.portfolioUrl && <p className="text-red-500">{errors.portfolioUrl}</p>}
      </div>
    </div>
  );
}
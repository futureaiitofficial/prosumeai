import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from 'react';
import { Info } from "lucide-react";

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
    // More comprehensive phone validation that allows international formats
    const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}$/;
    return phone === '' || re.test(phone);
  };

  const formatPhoneNumber = (phone: string) => {
    // If it's already well-formatted, don't change it
    if (phone.includes('-') || phone.includes('(') || phone.includes(')') || phone.includes('+')) {
      return phone;
    }
    
    // Basic US phone formatting if it's 10 digits
    if (phone.replace(/\D/g, '').length === 10) {
      const digits = phone.replace(/\D/g, '');
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
    }
    
    return phone;
  };

  const validateURL = (url: string) => {
    if (!url) return true; // Allow empty URLs
    
    try {
      // Automatically prepend https:// for validation if missing
      const processedUrl = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(processedUrl);
      
      // Basic checks for valid URL structure
      if (!urlObj.hostname || urlObj.hostname.length < 1) {
        return false;
      }
      
      // Check for at least one dot in hostname (basic domain validation)
      if (!urlObj.hostname.includes('.')) {
        return false;
      }
      
      // Check hostname length
      if (urlObj.hostname.length > 253) {
        return false;
      }
      
      return true;
    } catch (_) {
      return false;
    }
  };

  const validateLinkedInURL = (url: string) => {
    if (!url) return true; // Allow empty URLs
    
    try {
      const processedUrl = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(processedUrl);
      
      // Check if it's a LinkedIn domain
      const domain = urlObj.hostname.replace(/^www\./, '');
      if (!domain.includes('linkedin.com')) {
        return false;
      }
      
      return validateURL(url);
    } catch (_) {
      return false;
    }
  };

  const formatURL = (url: string) => {
    // Return empty string if URL is empty
    if (!url) return '';
    
    // Add https:// if missing
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    
    try {
      const urlObj = new URL(url);
      
      // Remove www. prefix for cleaner display
      let host = urlObj.hostname;
      if (host.startsWith('www.')) {
        host = host.substring(4);
      }
      
      // Truncate paths that are too long
      const path = urlObj.pathname;
      let displayPath = path;
      if (path.length > 15 && path !== '/') {
        displayPath = path.substring(0, 12) + '...';
      }
      
      // Format the final URL
      return `${host}${displayPath === '/' ? '' : displayPath}`;
    } catch (_) {
      return url;
    }
  };

  const validateName = (name: string) => {
    // Allow letters, spaces, hyphens, and apostrophes for names
    const re = /^[A-Za-z\s'-]*$/;
    return name === '' || re.test(name);
  };

  const sanitizeInput = (input: string, fieldType: string) => {
    let sanitized = input.trim();
    
    switch (fieldType) {
      case 'fullName':
        // Capitalize each word in the name
        sanitized = sanitized
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        break;
      
      case 'email':
        // Convert email to lowercase
        sanitized = sanitized.toLowerCase();
        break;
      
      case 'city':
      case 'state':
        // Capitalize first letter of city/state names
        sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
        break;
      
      case 'phone':
        sanitized = formatPhoneNumber(sanitized);
        break;
    }
    
    return sanitized;
  };

  const updateField = (field: string, value: any) => {
    let isValid = true;
    let errorMsg = '';
    let updatedValue = value;

    // Sanitize input first
    updatedValue = sanitizeInput(updatedValue, field);

    switch (field) {
      case 'email':
        isValid = updatedValue === '' || validateEmail(updatedValue);
        errorMsg = isValid ? '' : 'Invalid email format';
        break;
      case 'phone':
        isValid = validatePhone(updatedValue);
        errorMsg = isValid ? '' : 'Invalid phone number';
        break;
      case 'linkedinUrl':
        isValid = updatedValue === '' || validateLinkedInURL(updatedValue);
        errorMsg = isValid ? '' : 'Please enter a valid LinkedIn URL (e.g., linkedin.com/in/yourname)';
        // Ensure URL has http/https prefix for proper linking
        if (isValid && updatedValue && !updatedValue.startsWith('http')) {
          updatedValue = `https://${updatedValue}`;
        }
        break;
      case 'portfolioUrl':
        isValid = updatedValue === '' || validateURL(updatedValue);
        errorMsg = isValid ? '' : 'Please enter a valid website URL (e.g., www.yoursite.com)';
        // Ensure URL has http/https prefix for proper linking
        if (isValid && updatedValue && !updatedValue.startsWith('http')) {
          updatedValue = `https://${updatedValue}`;
        }
        break;
      case 'fullName':
        isValid = validateName(updatedValue);
        errorMsg = isValid ? '' : 'Name can only contain letters, spaces, hyphens, and apostrophes';
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

  // Format URLs for display in inputs
  const formatDisplayUrl = (url: string) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '');
  };

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
        <p className="text-xs text-muted-foreground">This will appear at the top of your resume</p>
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
          {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
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
        {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          placeholder="(123) 456-7890"
          value={data?.phone || ""}
          onChange={(e) => updateField("phone", e.target.value)}
        />
        {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
        <p className="text-xs text-muted-foreground">Use format: (123) 456-7890 or +1 123-456-7890</p>
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
          placeholder="linkedin.com/in/yourname"
          value={formatDisplayUrl(data?.linkedinUrl || "")}
          onChange={(e) => {
            const value = e.target.value;
            // Only add prefix when saving to data, not in the input display
            const urlToSave = value && !value.startsWith('http') ? `https://${value}` : value;
            updateField("linkedinUrl", urlToSave);
          }}
          className={errors.linkedinUrl ? "border-red-500" : ""}
        />
        {errors.linkedinUrl && <p className="text-red-500 text-xs">{errors.linkedinUrl}</p>}
        <p className="text-xs text-muted-foreground">
          Example: linkedin.com/in/yourname or https://linkedin.com/in/yourname
        </p>
        {data?.linkedinUrl && !errors.linkedinUrl && (
          <p className="text-xs text-green-600">
            ✓ Will appear as: {formatURL(data.linkedinUrl)}
          </p>
        )}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="portfolioUrl">Portfolio/Website URL</Label>
        <Input
          id="portfolioUrl"
          placeholder="www.yourwebsite.com"
          value={formatDisplayUrl(data?.portfolioUrl || "")}
          onChange={(e) => {
            const value = e.target.value;
            // Only add prefix when saving to data, not in the input display
            const urlToSave = value && !value.startsWith('http') ? `https://${value}` : value;
            updateField("portfolioUrl", urlToSave);
          }}
          className={errors.portfolioUrl ? "border-red-500" : ""}
        />
        {errors.portfolioUrl && <p className="text-red-500 text-xs">{errors.portfolioUrl}</p>}
        <p className="text-xs text-muted-foreground">
          Example: www.yoursite.com or https://github.com/yourusername
        </p>
        {data?.portfolioUrl && !errors.portfolioUrl && (
          <p className="text-xs text-green-600">
            ✓ Will appear as: {formatURL(data.portfolioUrl)}
          </p>
        )}
      </div>
      
      <div className="mt-4 p-3 border rounded-md bg-blue-50 dark:bg-blue-900/20 flex gap-2">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Make sure your contact information is up-to-date and professional. Recruiters will use this information to contact you.
        </p>
      </div>
    </div>
  );
}
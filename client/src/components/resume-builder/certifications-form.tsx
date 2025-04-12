import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash, Award } from "lucide-react";

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expires: boolean;
  expiryDate: string | null;
}

interface CertificationsFormProps {
  data: any;
  updateData: (data: any) => void;
}

export default function CertificationsForm({ data, updateData }: CertificationsFormProps) {
  const [newCertification, setNewCertification] = useState<Certification>({
    id: "",
    name: "",
    issuer: "",
    date: "",
    expires: false,
    expiryDate: null
  });

  // Ensure certifications array exists
  const certifications = data?.certifications || [];

  const addCertification = () => {
    const certification = {
      ...newCertification,
      id: Date.now().toString()
    };
    
    updateData({ 
      certifications: [...certifications, certification] 
    });
    
    // Reset form
    setNewCertification({
      id: "",
      name: "",
      issuer: "",
      date: "",
      expires: false,
      expiryDate: null
    });
  };

  const removeCertification = (id: string) => {
    updateData({
      certifications: certifications.filter((cert: Certification) => cert.id !== id)
    });
  };

  const editCertification = (certification: Certification) => {
    const updatedCertifications = certifications.map((cert: Certification) => 
      cert.id === certification.id ? certification : cert
    );
    
    updateData({ 
      certifications: updatedCertifications 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Certifications</h2>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Add relevant certifications to demonstrate your expertise and qualifications.
      </p>
      
      {/* Existing certifications */}
      {certifications.length > 0 && (
        <div className="space-y-4 mb-6">
          {certifications.map((cert: Certification) => (
            <Card key={cert.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="font-medium">{cert.name}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCertification(cert.id)}
                    className="h-8 w-8 text-gray-500 hover:text-red-500"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Certification Name</Label>
                    <Input
                      value={cert.name}
                      onChange={(e) => {
                        editCertification({
                          ...cert,
                          name: e.target.value
                        });
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Issuing Organization</Label>
                    <Input
                      value={cert.issuer}
                      onChange={(e) => {
                        editCertification({
                          ...cert,
                          issuer: e.target.value
                        });
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="grid gap-2">
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={cert.date}
                      onChange={(e) => {
                        editCertification({
                          ...cert,
                          date: e.target.value
                        });
                      }}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Has Expiry Date</Label>
                      <Switch 
                        checked={cert.expires} 
                        onCheckedChange={(checked) => {
                          editCertification({
                            ...cert,
                            expires: checked,
                            expiryDate: checked ? cert.expiryDate : null
                          });
                        }}
                      />
                    </div>
                    
                    {cert.expires && (
                      <Input
                        type="date"
                        value={cert.expiryDate || ""}
                        onChange={(e) => {
                          editCertification({
                            ...cert,
                            expiryDate: e.target.value
                          });
                        }}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add new certification form */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Add New Certification</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Certification Name</Label>
              <Input
                placeholder="AWS Certified Solutions Architect"
                value={newCertification.name}
                onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Issuing Organization</Label>
              <Input
                placeholder="Amazon Web Services"
                value={newCertification.issuer}
                onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="grid gap-2">
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={newCertification.date}
                onChange={(e) => setNewCertification({ ...newCertification, date: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Has Expiry Date</Label>
                <Switch 
                  checked={newCertification.expires} 
                  onCheckedChange={(checked) => {
                    setNewCertification({
                      ...newCertification, 
                      expires: checked,
                      expiryDate: checked ? newCertification.expiryDate : null
                    });
                  }}
                />
              </div>
              
              {newCertification.expires && (
                <Input
                  type="date"
                  value={newCertification.expiryDate || ""}
                  onChange={(e) => setNewCertification({ ...newCertification, expiryDate: e.target.value })}
                />
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              onClick={addCertification}
              disabled={!newCertification.name || !newCertification.issuer || !newCertification.date}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
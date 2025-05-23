import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, Book } from "lucide-react";

interface Publication {
  id: string;
  title: string;
  publisher: string;
  authors: string;
  publicationDate: string | null;
  url: string | null;
  description: string;
}

interface PublicationsFormProps {
  data: any;
  updateData: (data: any) => void;
}

export default function PublicationsForm({ data, updateData }: PublicationsFormProps) {
  const [newPublication, setNewPublication] = useState<Publication>({
    id: "",
    title: "",
    publisher: "",
    authors: "",
    publicationDate: null,
    url: null,
    description: ""
  });

  // Ensure publications array exists
  const publications = data?.publications || [];

  const addPublication = () => {
    const publication = {
      ...newPublication,
      id: Date.now().toString()
    };
    
    updateData({ 
      publications: [...publications, publication] 
    });
    
    // Reset form
    setNewPublication({
      id: "",
      title: "",
      publisher: "",
      authors: "",
      publicationDate: null,
      url: null,
      description: ""
    });
  };

  const removePublication = (id: string) => {
    updateData({
      publications: publications.filter((pub: Publication) => pub.id !== id)
    });
  };

  const editPublication = (publication: Publication) => {
    const updatedPublications = publications.map((pub: Publication) => 
      pub.id === publication.id ? publication : pub
    );
    
    updateData({ 
      publications: updatedPublications 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Publications</h2>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Add your academic or professional publications to showcase your research and expertise in your field.
      </p>
      
      {/* Existing publications */}
      {publications.length > 0 && (
        <div className="space-y-4 mb-6">
          {publications.map((pub: Publication) => (
            <Card key={pub.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <Book className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="font-medium">{pub.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePublication(pub.id)}
                    className="h-8 w-8 text-gray-500 hover:text-red-500"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Publication Title</Label>
                    <Input
                      value={pub.title}
                      onChange={(e) => {
                        editPublication({
                          ...pub,
                          title: e.target.value
                        });
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Publisher/Journal</Label>
                    <Input
                      value={pub.publisher}
                      onChange={(e) => {
                        editPublication({
                          ...pub,
                          publisher: e.target.value
                        });
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="grid gap-2">
                    <Label>Authors</Label>
                    <Input
                      value={pub.authors}
                      onChange={(e) => {
                        editPublication({
                          ...pub,
                          authors: e.target.value
                        });
                      }}
                      placeholder="e.g., Smith, J., Jones, A., et al."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Publication Date</Label>
                    <Input
                      type="date"
                      value={pub.publicationDate || ""}
                      onChange={(e) => {
                        editPublication({
                          ...pub,
                          publicationDate: e.target.value
                        });
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid gap-2 mt-4">
                  <Label>URL/DOI</Label>
                  <Input
                    value={pub.url || ""}
                    onChange={(e) => {
                      editPublication({
                        ...pub,
                        url: e.target.value
                      });
                    }}
                    placeholder="https://doi.org/10.xxxx/xxxxx"
                  />
                </div>

                <div className="grid gap-2 mt-4">
                  <Label>Description</Label>
                  <Textarea
                    value={pub.description}
                    onChange={(e) => {
                      editPublication({
                        ...pub,
                        description: e.target.value
                      });
                    }}
                    placeholder="Brief description or abstract of your publication"
                    className="h-24"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add new publication form */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Add New Publication</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Publication Title</Label>
              <Input
                placeholder="Machine Learning Applications in Healthcare"
                value={newPublication.title}
                onChange={(e) => setNewPublication({ ...newPublication, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Publisher/Journal</Label>
              <Input
                placeholder="Journal of Medical Informatics"
                value={newPublication.publisher}
                onChange={(e) => setNewPublication({ ...newPublication, publisher: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="grid gap-2">
              <Label>Authors</Label>
              <Input
                placeholder="e.g., Smith, J., Jones, A., et al."
                value={newPublication.authors}
                onChange={(e) => setNewPublication({ ...newPublication, authors: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Publication Date</Label>
              <Input
                type="date"
                value={newPublication.publicationDate || ""}
                onChange={(e) => setNewPublication({ ...newPublication, publicationDate: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid gap-2 mt-4">
            <Label>URL/DOI</Label>
            <Input
              placeholder="https://doi.org/10.xxxx/xxxxx"
              value={newPublication.url || ""}
              onChange={(e) => setNewPublication({ ...newPublication, url: e.target.value })}
            />
          </div>

          <div className="grid gap-2 mt-4">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief description or abstract of your publication"
              className="h-24"
              value={newPublication.description}
              onChange={(e) => setNewPublication({ ...newPublication, description: e.target.value })}
            />
          </div>
          
          <div className="mt-6">
            <Button
              onClick={addPublication}
              disabled={!newPublication.title || !newPublication.publisher || !newPublication.authors}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Publication
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon, ReloadIcon } from "@radix-ui/react-icons";

interface ApiKey {
  id: number;
  name: string;
  key: string;
  service: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export function ApiKeysManagement() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: "",
    service: "openai",
    key: "",
  });
  
  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/api-keys");
      if (!response.ok) throw new Error("Failed to fetch API keys");
      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast({
        title: "Error",
        description: "Failed to load API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleAddNewKey = async () => {
    if (!newKeyData.name || !newKeyData.key) {
      toast({
        title: "Validation Error",
        description: "Name and API key are required fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newKeyData),
      });
      
      if (!response.ok) throw new Error("Failed to add API key");
      
      toast({
        title: "Success",
        description: "API key added successfully.",
      });
      
      setNewKeyDialogOpen(false);
      setNewKeyData({
        name: "",
        service: "openai",
        key: "",
      });
      fetchApiKeys();
    } catch (error) {
      console.error("Error adding API key:", error);
      toast({
        title: "Error",
        description: "Failed to add API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleKeyStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${id}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (!response.ok) throw new Error("Failed to update API key status");
      
      toast({
        title: "Success",
        description: `API key ${currentStatus ? "disabled" : "enabled"} successfully.`,
      });
      
      fetchApiKeys();
    } catch (error) {
      console.error("Error updating API key status:", error);
      toast({
        title: "Error",
        description: "Failed to update API key status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteKey = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete API key");
      
      toast({
        title: "Success",
        description: "API key deleted successfully.",
      });
      
      fetchApiKeys();
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast({
        title: "Error",
        description: "Failed to delete API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return "";
    return key.substring(0, 4) + "..." + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys Management</h2>
          <p className="text-muted-foreground">
            Manage API keys for external services like OpenAI.
          </p>
        </div>
        <Dialog open={newKeyDialogOpen} onOpenChange={setNewKeyDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New API Key</DialogTitle>
              <DialogDescription>
                Add a new API key for external services.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Production OpenAI Key"
                  className="col-span-3"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service" className="text-right">
                  Service
                </Label>
                <Input
                  id="service"
                  placeholder="openai"
                  className="col-span-3"
                  value={newKeyData.service}
                  onChange={(e) => setNewKeyData({ ...newKeyData, service: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="api-key" className="text-right">
                  API Key
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="sk-..."
                  className="col-span-3"
                  value={newKeyData.key}
                  onChange={(e) => setNewKeyData({ ...newKeyData, key: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewKeyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNewKey}>Add Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {loading ? (
        <div className="flex justify-center p-8">
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          <span>Loading API keys...</span>
        </div>
      ) : apiKeys.length === 0 ? (
        <Alert>
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>No API keys found. Add your first API key to get started.</AlertDescription>
        </Alert>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell className="font-medium">{apiKey.name}</TableCell>
                <TableCell>{apiKey.service}</TableCell>
                <TableCell>{maskApiKey(apiKey.key)}</TableCell>
                <TableCell>
                  <Badge variant={apiKey.isActive ? "success" : "destructive"}>
                    {apiKey.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleString() : "Never"}</TableCell>
                <TableCell>{new Date(apiKey.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleKeyStatus(apiKey.id, apiKey.isActive)}
                    >
                      {apiKey.isActive ? "Disable" : "Enable"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the API key.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteKey(apiKey.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 
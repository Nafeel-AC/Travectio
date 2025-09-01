import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useDrivers } from "@/hooks/useSupabase";
import { 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  X, 
  Save, 
  Loader2,
  AlertTriangle 
} from "lucide-react";

interface Driver {
  id: string;
  name: string;
  cdlNumber: string;
  phone?: string;
  email?: string;
  payPerMile?: number;
  isActive: boolean;
  createdAt: string;
}

interface DriverEditFormProps {
  driver: Driver;
  onSave?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

export function DriverEditForm({ driver, onSave, onCancel, compact = false }: DriverEditFormProps) {
  const [formData, setFormData] = useState({
    name: driver.name || "",
    cdlNumber: driver.cdlNumber || "",
    phone: driver.phone || "",
    email: driver.email || "",
    payPerMile: driver.payPerMile || 0.50,
    isActive: driver.isActive
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { updateDriver } = useDrivers();

  const updateDriverMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Split name into firstName and lastName
      const nameParts = data.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Convert boolean isActive to integer for database
      const driverData = {
        ...data,
        firstName,
        lastName,
        isActive: data.isActive ? 1 : 0
      };
      return updateDriver(driver.id, driverData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      toast({
        title: "Driver Updated",
        description: `${formData.name}'s information has been updated successfully.`,
      });
      onSave?.();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update driver information",
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Driver name is required";
    } else {
      // Check if we have both first and last name
      const nameParts = formData.name.trim().split(' ');
      if (nameParts.length < 2) {
        newErrors.name = "Please enter both first and last name";
      }
    }
    
    if (!formData.cdlNumber.trim()) {
      newErrors.cdlNumber = "CDL number is required";
    } else if (formData.cdlNumber.length < 8) {
      newErrors.cdlNumber = "CDL number must be at least 8 characters";
    }
    
    if (formData.email && !formData.email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (formData.phone && formData.phone.length > 0 && formData.phone.length < 10) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    if (formData.payPerMile < 0.10 || formData.payPerMile > 5.00) {
      newErrors.payPerMile = "Pay per mile should be between $0.10 and $5.00";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      updateDriverMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Driver full name"
            />
            {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cdlNumber" className="text-slate-200">CDL Number</Label>
            <Input
              id="cdlNumber"
              value={formData.cdlNumber}
              onChange={(e) => handleInputChange("cdlNumber", e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="CDL-XXXXXXXXX"
            />
            {errors.cdlNumber && <p className="text-red-400 text-xs">{errors.cdlNumber}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-200">Phone (Optional)</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="(555) 123-4567"
            />
            {errors.phone && <p className="text-red-400 text-xs">{errors.phone}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="driver@email.com"
            />
            {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payPerMile" className="text-slate-200">Pay Per Mile</Label>
            <Input
              id="payPerMile"
              type="number"
              step="0.01"
              min="0.10"
              max="5.00"
              value={formData.payPerMile}
              onChange={(e) => handleInputChange("payPerMile", parseFloat(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="0.50"
            />
            {errors.payPerMile && <p className="text-red-400 text-xs">{errors.payPerMile}</p>}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-slate-200">Status</Label>
          <Select 
            value={formData.isActive ? "active" : "inactive"} 
            onValueChange={(value) => handleInputChange("isActive", value === "active")}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="active" className="text-white">Active</SelectItem>
              <SelectItem value="inactive" className="text-white">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="border-slate-600 text-slate-300"
            disabled={updateDriverMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={updateDriverMutation.isPending}
          >
            {updateDriverMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="w-5 h-5" />
          Edit Driver Information
          <Badge className="bg-blue-600/20 text-blue-200 border-blue-600/30 ml-auto">
            {formData.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200 flex items-center gap-2">
                <User className="w-4 h-4" />
                Driver Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter driver's full name"
              />
              {errors.name && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cdlNumber" className="text-slate-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                CDL Number
              </Label>
              <Input
                id="cdlNumber"
                value={formData.cdlNumber}
                onChange={(e) => handleInputChange("cdlNumber", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="CDL-XXXXXXXXX"
              />
              {errors.cdlNumber && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.cdlNumber}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-200 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
                <Badge variant="secondary" className="bg-slate-600 text-slate-300 text-xs">Optional</Badge>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="(555) 123-4567"
              />
              {errors.phone && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.phone}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
                <Badge variant="secondary" className="bg-slate-600 text-slate-300 text-xs">Optional</Badge>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="driver@email.com"
              />
              {errors.email && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Driver Status</Label>
            <Select 
              value={formData.isActive ? "active" : "inactive"} 
              onValueChange={(value) => handleInputChange("isActive", value === "active")}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="active" className="text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="inactive" className="text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Inactive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-600">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="border-slate-600 text-slate-300"
              disabled={updateDriverMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={updateDriverMutation.isPending}
            >
              {updateDriverMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default DriverEditForm;
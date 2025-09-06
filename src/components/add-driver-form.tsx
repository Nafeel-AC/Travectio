import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DriverService } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  Save, 
  Loader2,
  AlertTriangle 
} from "lucide-react";

interface AddDriverFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddDriverForm({ onSuccess, onCancel }: AddDriverFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    cdlNumber: "",
    phoneNumber: "",
    email: "",
    isActive: true
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addDriverMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Split name into firstName and lastName
      const nameParts = data.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Map form data to database schema
      const driverData = {
        name: data.name,
        firstName,
        lastName,
        cdlNumber: data.cdlNumber,
        phoneNumber: data.phoneNumber,
        email: data.email,
        isActive: data.isActive ? 1 : 0
      };
      return DriverService.createDriver(driverData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({
        title: "Driver Added",
        description: `${formData.name} has been successfully added to your fleet.`,
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Driver",
        description: error.message || "Failed to add driver. Please try again.",
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
    
    if (formData.phoneNumber && formData.phoneNumber.length > 0 && formData.phoneNumber.length < 10) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      addDriverMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-200 flex items-center gap-2">
            <User className="w-4 h-4" />
            Driver Name *
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
            CDL Number *
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
          <Label htmlFor="phoneNumber" className="text-slate-200 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number
          </Label>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            placeholder="(555) 123-4567"
          />
          {errors.phoneNumber && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {errors.phoneNumber}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
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
          disabled={addDriverMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700"
          disabled={addDriverMutation.isPending}
        >
          {addDriverMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Add Driver
        </Button>
      </div>
    </form>
  );
}

export default AddDriverForm;

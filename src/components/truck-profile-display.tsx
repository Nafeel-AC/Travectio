import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, User, Phone, Mail, IdCard, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface TruckProfileDisplayProps {
  truck: {
    id: string;
    name: string;
    equipmentType: string;
    vin?: string;
    licensePlate?: string;
    eldDeviceId?: string;
    driver?: {
      id: string;
      name: string;
      cdlNumber: string;
      phone?: string;
      email?: string;
    };
    costPerMile?: number;
  };
  compact?: boolean;
  showProfileLink?: boolean;
}

export function TruckProfileDisplay({ truck, compact = false, showProfileLink = true }: TruckProfileDisplayProps) {
  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case "Dry Van": return "📦";
      case "Reefer": return "🧊";
      case "Flatbed": return "🏗️";
      case "Step Deck": return "📋";
      case "Lowboy": return "🚛";
      case "Tanker": return "🛢️";
      case "Car Hauler": return "🚗";
      case "Dump Truck": return "🚚";
      default: return "🚛";
    }
  };

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getEquipmentIcon(truck.equipmentType)}</span>
          <div className="text-white font-medium">{truck.name}</div>
          {showProfileLink && (
            <Link href={`/truck/${truck.id}`}>
              <ExternalLink className="h-3 w-3 text-blue-400 hover:text-blue-300 cursor-pointer" />
            </Link>
          )}
        </div>
        <div className="text-slate-400 text-sm">{truck.equipmentType}</div>
        {truck.driver && (
          <div className="text-slate-400 text-xs">
            Driver: {truck.driver.name}
          </div>
        )}
        {truck.licensePlate && (
          <div className="text-slate-500 text-xs font-mono">
            Plate: {truck.licensePlate}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{getEquipmentIcon(truck.equipmentType)}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-lg">{truck.name}</h3>
                {showProfileLink && (
                  <Link href={`/truck/${truck.id}`}>
                    <Button size="sm" variant="ghost" className="p-1 h-auto text-blue-400 hover:text-blue-300">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                {truck.equipmentType}
              </Badge>
            </div>
          </div>
          {truck.costPerMile && (
            <div className="text-right">
              <div className="text-white font-semibold">${truck.costPerMile.toFixed(2)}</div>
              <div className="text-slate-400 text-xs">per mile</div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Truck Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {truck.vin && (
              <div className="flex items-center gap-2 text-sm">
                <IdCard className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">VIN:</span>
                <span className="text-white font-mono">{truck.vin}</span>
              </div>
            )}
            {truck.licensePlate && (
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">Plate:</span>
                <span className="text-white font-mono">{truck.licensePlate}</span>
              </div>
            )}
          </div>

          {/* Driver Information */}
          {truck.driver && (
            <div className="border-t border-slate-700 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300 font-medium">Assigned Driver</span>
              </div>
              <div className="pl-6 space-y-1">
                <div className="text-white font-medium">{truck.driver.name}</div>
                <div className="text-slate-400 text-sm">CDL: {truck.driver.cdlNumber}</div>
                {truck.driver.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-400">{truck.driver.phoneNumber}</span>
                  </div>
                )}
                {truck.driver.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-400">{truck.driver.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
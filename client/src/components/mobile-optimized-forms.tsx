import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Package, Clock, Plus } from "lucide-react";

export function MobileLoadEntryForm() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full touch-target h-12"
      >
        <Package className="w-4 h-4 mr-2" />
        Add Load
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>New Load Entry</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="origin" className="text-sm font-medium">From</Label>
            <Input id="origin" placeholder="Origin City" className="mobile-form-input" />
          </div>
          <div>
            <Label htmlFor="destination" className="text-sm font-medium">To</Label>
            <Input id="destination" placeholder="Destination City" className="mobile-form-input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="miles" className="text-sm font-medium">Miles</Label>
            <Input 
              id="miles" 
              type="number" 
              placeholder="0" 
              className="mobile-form-input" 
            />
          </div>
          <div>
            <Label htmlFor="pay" className="text-sm font-medium">Pay</Label>
            <Input 
              id="pay" 
              type="number" 
              placeholder="$0" 
              className="mobile-form-input" 
            />
          </div>
        </div>

        <div>
          <Label htmlFor="truck" className="text-sm font-medium">Truck</Label>
          <Select>
            <SelectTrigger className="mobile-form-input">
              <SelectValue placeholder="Select truck" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="truck1">T1063</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-2 pt-2">
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
            className="flex-1 touch-target"
          >
            Cancel
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            className="flex-1 touch-target"
          >
            Save Load
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function MobileHOSEntryForm() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full touch-target h-12"
      >
        <Clock className="w-4 h-4 mr-2" />
        Log HOS
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>HOS Entry</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="driver" className="text-sm font-medium">Driver</Label>
          <Select>
            <SelectTrigger className="mobile-form-input">
              <SelectValue placeholder="Select driver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kendrick">Kendrick</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status" className="text-sm font-medium">Status</Label>
          <Select>
            <SelectTrigger className="mobile-form-input">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="driving">Driving</SelectItem>
              <SelectItem value="on-duty">On Duty</SelectItem>
              <SelectItem value="sleeper">Sleeper Berth</SelectItem>
              <SelectItem value="off-duty">Off Duty</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="start-time" className="text-sm font-medium">Start Time</Label>
            <Input 
              id="start-time" 
              type="time" 
              className="mobile-form-input" 
            />
          </div>
          <div>
            <Label htmlFor="duration" className="text-sm font-medium">Duration (hrs)</Label>
            <Input 
              id="duration" 
              type="number" 
              placeholder="8" 
              className="mobile-form-input" 
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
          <Textarea 
            id="notes"
            placeholder="Optional notes..."
            className="mobile-form-input"
            rows={2}
          />
        </div>

        <div className="flex space-x-2 pt-2">
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
            className="flex-1 touch-target"
          >
            Cancel
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            className="flex-1 touch-target"
          >
            Log Entry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useOrgRole } from '@/lib/org-role-context';
import { 
  OrgTruckService, 
  OrgLoadService, 
  OrgDriverService, 
  OrgHOSService, 
  OrgFuelService,
  OrgFleetMetricsService
} from '@/lib/org-supabase-client';

// ============================================================================
// ORGANIZATION-AWARE TRUCK HOOKS
// ============================================================================

export function useOrgTrucks() {
  const { activeOrgId, role } = useOrgRole();
  
  return useQuery({
    queryKey: ['org-trucks', activeOrgId, role],
    queryFn: () => OrgTruckService.getTrucks(),
    enabled: !!activeOrgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreateOrgTruck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: (truckData: any) => OrgTruckService.createTruck(truckData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-trucks', activeOrgId, role] });
      toast({
        title: "Truck Created",
        description: "New truck has been added to the fleet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Truck",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOrgTruck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: ({ truckId, updates }: { truckId: string; updates: any }) => 
      OrgTruckService.updateTruck(truckId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-trucks', activeOrgId, role] });
      toast({
        title: "Truck Updated",
        description: "Truck information has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Truck",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteOrgTruck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: (truckId: string) => OrgTruckService.deleteTruck(truckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-trucks', activeOrgId, role] });
      toast({
        title: "Truck Deleted",
        description: "Truck has been removed from the fleet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Truck",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================================================
// ORGANIZATION-AWARE LOAD HOOKS
// ============================================================================

export function useOrgLoads() {
  const { activeOrgId, role } = useOrgRole();
  
  return useQuery({
    queryKey: ['org-loads', activeOrgId, role],
    queryFn: () => OrgLoadService.getLoads(),
    enabled: !!activeOrgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreateOrgLoad() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: (loadData: any) => OrgLoadService.createLoad(loadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-loads', activeOrgId, role] });
      toast({
        title: "Load Created",
        description: "New load has been added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Load",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOrgLoad() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: ({ loadId, updates }: { loadId: string; updates: any }) => 
      OrgLoadService.updateLoad(loadId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-loads', activeOrgId, role] });
      toast({
        title: "Load Updated",
        description: "Load information has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Load",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteOrgLoad() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: (loadId: string) => OrgLoadService.deleteLoad(loadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-loads', activeOrgId, role] });
      toast({
        title: "Load Deleted",
        description: "Load has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Load",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================================================
// ORGANIZATION-AWARE DRIVER HOOKS
// ============================================================================

export function useOrgDrivers() {
  const { activeOrgId, role } = useOrgRole();
  
  return useQuery({
    queryKey: ['org-drivers', activeOrgId, role],
    queryFn: () => OrgDriverService.getDrivers(),
    enabled: !!activeOrgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreateOrgDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: (driverData: any) => OrgDriverService.createDriver(driverData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-drivers', activeOrgId, role] });
      toast({
        title: "Driver Created",
        description: "New driver has been added to the fleet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Driver",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOrgDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: ({ driverId, updates }: { driverId: string; updates: any }) => 
      OrgDriverService.updateDriver(driverId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-drivers', activeOrgId, role] });
      toast({
        title: "Driver Updated",
        description: "Driver information has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Driver",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteOrgDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: (driverId: string) => OrgDriverService.deleteDriver(driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-drivers', activeOrgId, role] });
      toast({
        title: "Driver Deleted",
        description: "Driver has been removed from the fleet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Driver",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================================================
// ORGANIZATION-AWARE HOS HOOKS
// ============================================================================

export function useOrgHosLogs(driverId?: string, truckId?: string) {
  const { activeOrgId, role } = useOrgRole();
  
  return useQuery({
    queryKey: ['org-hos-logs', activeOrgId, role, driverId, truckId],
    queryFn: () => OrgHOSService.getHosLogs(driverId, truckId),
    enabled: !!activeOrgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreateOrgHosLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: (hosLogData: any) => OrgHOSService.createHosLog(hosLogData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-hos-logs', activeOrgId, role] });
      toast({
        title: "HOS Log Created",
        description: "New HOS entry has been recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create HOS Log",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOrgHosLogStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: ({ hosLogId, dutyStatus }: { hosLogId: string; dutyStatus: string }) => 
      OrgHOSService.updateHosLogStatus(hosLogId, dutyStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-hos-logs', activeOrgId, role] });
      toast({
        title: "HOS Status Updated",
        description: "Duty status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update HOS Status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================================================
// ORGANIZATION-AWARE FUEL HOOKS
// ============================================================================

export function useOrgFuelPurchases(loadId?: string, truckId?: string) {
  const { activeOrgId, role } = useOrgRole();
  
  return useQuery({
    queryKey: ['org-fuel-purchases', activeOrgId, role, loadId, truckId],
    queryFn: () => OrgFuelService.getFuelPurchases(loadId, truckId),
    enabled: !!activeOrgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreateOrgFuelPurchase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: (purchaseData: any) => OrgFuelService.createFuelPurchase(purchaseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-fuel-purchases', activeOrgId, role] });
      toast({
        title: "Fuel Purchase Recorded",
        description: "Fuel purchase has been added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Record Fuel Purchase",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOrgFuelPurchase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: ({ purchaseId, updates }: { purchaseId: string; updates: any }) => 
      OrgFuelService.updateFuelPurchase(purchaseId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-fuel-purchases', activeOrgId, role] });
      toast({
        title: "Fuel Purchase Updated",
        description: "Fuel purchase information has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Fuel Purchase",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteOrgFuelPurchase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeOrgId, role } = useOrgRole();

  return useMutation({
    mutationFn: (purchaseId: string) => OrgFuelService.deleteFuelPurchase(purchaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-fuel-purchases', activeOrgId, role] });
      toast({
        title: "Fuel Purchase Deleted",
        description: "Fuel purchase has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Fuel Purchase",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================================================
// ROLE-BASED ACCESS HELPERS
// ============================================================================

export function useRoleAccess() {
  const { role } = useOrgRole();

  return {
    canManageFleet: role === 'owner' || role === 'dispatcher',
    canManageDrivers: role === 'owner' || role === 'dispatcher',
    canManageLoads: role === 'owner' || role === 'dispatcher',
    canViewAnalytics: role === 'owner', // Only owners can view business analytics
    canViewOperationalAnalytics: role === 'owner' || role === 'dispatcher', // Dispatchers can view operational metrics
    canManageBilling: role === 'owner',
    canDeleteData: role === 'owner',
    canCreateData: role === 'owner' || role === 'dispatcher',
    canUpdateOwnData: true, // All roles can update their own data
    isOwner: role === 'owner',
    isDispatcher: role === 'dispatcher',
    isDriver: role === 'driver',
    role
  };
}

// ============================================================================
// FLEET METRICS HOOKS
// ============================================================================

export function useOrgFleetMetrics() {
  const { activeOrgId, role } = useOrgRole();

  return useQuery({
    queryKey: ['org-fleet-metrics', activeOrgId, role],
    queryFn: () => OrgFleetMetricsService.getFleetMetrics(),
    enabled: !!activeOrgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

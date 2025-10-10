import { useEffect, useState } from 'react';
import { OrgTruckService } from '@/lib/org-supabase-client';
import { useRoleAccess } from '@/hooks/useOrgData';

export default function AssignedTruckPage() {
  const { isDriver } = useRoleAccess();
  const [loading, setLoading] = useState(true);
  const [truck, setTruck] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const t = await OrgTruckService.getAssignedTruckForCurrentDriver();
        if (isMounted) setTruck(t);
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Failed to load assigned truck');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (!isDriver) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-slate-200">
          Access restricted. Drivers only.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-700 rounded" />
          <div className="h-24 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-slate-200">
          No truck is currently assigned to you.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Assigned Truck</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <div className="text-slate-400 text-sm mb-1">Truck</div>
          <div className="text-white text-lg font-medium">{truck.name || 'Unnamed Truck'}</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-slate-900 border border-slate-700 p-3">
              <div className="text-slate-400">License Plate</div>
              <div className="text-slate-200">{truck.licensePlate || '-'}</div>
            </div>
            <div className="rounded-md bg-slate-900 border border-slate-700 p-3">
              <div className="text-slate-400">VIN</div>
              <div className="text-slate-200">{truck.vin || '-'}</div>
            </div>
            <div className="rounded-md bg-slate-900 border border-slate-700 p-3">
              <div className="text-slate-400">Equipment</div>
              <div className="text-slate-200">{truck.equipmentType || '-'}</div>
            </div>
            <div className="rounded-md bg-slate-900 border border-slate-700 p-3">
              <div className="text-slate-400">Cost / Mile</div>
              <div className="text-slate-200">{truck.costPerMile != null ? `$${truck.costPerMile.toFixed(2)}` : '-'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <div className="text-slate-400 text-sm mb-2">Driver</div>
          <div className="rounded-md bg-slate-900 border border-slate-700 p-4">
            <div className="text-white font-medium">{truck.drivers?.name || 'You'}</div>
            <div className="text-slate-400 text-sm mt-1">CDL: {truck.drivers?.cdlNumber || '-'}</div>
            <div className="text-slate-400 text-sm">Phone: {truck.drivers?.phoneNumber || '-'}</div>
            <div className="text-slate-400 text-sm">Email: {truck.drivers?.email || '-'}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="text-slate-400 text-sm mb-2">Notes</div>
        <div className="text-slate-300 text-sm">
          Contact your dispatcher for changes to your assignment or truck details.
        </div>
      </div>
    </div>
  );
}



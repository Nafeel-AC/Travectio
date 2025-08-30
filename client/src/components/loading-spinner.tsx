import { Truck } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Truck className="h-6 w-6 text-blue-400" />
          </div>
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">Travectio</h2>
        <p className="text-slate-300">Loading your fleet dashboard...</p>
      </div>
    </div>
  );
}
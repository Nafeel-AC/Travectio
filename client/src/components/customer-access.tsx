import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function CustomerAccess() {
  const [, setLocation] = useLocation();

  const handleCustomerAccess = () => {
    // Redirect to customer version
    const currentPath = window.location.pathname;
    const newUrl = `${currentPath}?dev_user=customer`;
    window.location.href = newUrl;
  };

  return (
    <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
      <div className="text-sm font-medium text-white mb-2">Customer Account Testing</div>
      <div className="text-xs text-blue-300 mb-3">
        Access the system as travectiosolutionsinc@gmail.com customer account
      </div>
      <Button
        onClick={handleCustomerAccess}
        size="sm"
        variant="ghost"
        className="w-full justify-start gap-2 text-blue-300 hover:text-white hover:bg-blue-800/30"
      >
        <ExternalLink className="w-4 h-4" />
        Switch to Customer Account
      </Button>
    </div>
  );
}
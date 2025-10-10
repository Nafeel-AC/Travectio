import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useOrgRole } from "@/lib/org-role-context";

export default function PendingInviteHandler() {
  const { refresh } = useOrgRole();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handlePendingInvite = async () => {
      const pendingToken = localStorage.getItem('pendingInviteToken');
      if (!pendingToken) return;

      setIsProcessing(true);
      try {
        // Accept the invitation
        const { data, error } = await supabase.rpc('accept_invitation', {
          p_token: pendingToken
        });

        if (error) {
          console.error('Failed to accept pending invitation:', error);
          toast({
            title: "Failed to accept invitation",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome to the organization!",
            description: "Your invitation has been accepted successfully.",
          });
          
          // Refresh organization context to load new membership
          await refresh();
        }
      } catch (error: any) {
        console.error('Error processing pending invitation:', error);
        toast({
          title: "Failed to process invitation",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        // Clear the pending token regardless of success/failure
        localStorage.removeItem('pendingInviteToken');
        setIsProcessing(false);
      }
    };

    handlePendingInvite();
  }, [refresh, toast]);

  // This component doesn't render anything, it just handles the logic
  return null;
}

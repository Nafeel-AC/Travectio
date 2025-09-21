import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import {
  User,
  Mail,
  Calendar,
  Building,
  Trash2,
  Crown,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useUserManagement } from "@/hooks/useSupabase";
import { useFounderAccess } from "@/hooks/useFounderAccess";

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  isAdmin?: boolean;
  isFounder?: boolean;
  isActive?: number;
  createdAt: string;
}

export default function UserManagement() {
  // Use Supabase-backed hook
  const { users, loading, deleteUser } = useUserManagement();

  const { isFounder, isAdmin } = useFounderAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await deleteUser(userId);
    },
    onSuccess: () => {
      // Force cache refresh - both invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.refetchQueries({ queryKey: ["users"] });
      toast({
        title: "User deleted",
        description:
          "User and all associated data has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      // Handle case where user was already deleted (404)
      if (error.message && error.message.includes("404")) {
        // User already deleted, just refresh the cache
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.refetchQueries({ queryKey: ["users"] });
        toast({
          title: "User already deleted",
          description: "This user was already removed from the system.",
        });
      } else {
        toast({
          title: "Delete failed",
          description:
            error.message || "Failed to delete user. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6 p-4 md:p-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-white">User Management</h1>
        </div>

        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-slate-700" />
                <Skeleton className="h-4 w-1/2 bg-slate-700" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-slate-700" />
                  <Skeleton className="h-4 w-2/3 bg-slate-700" />
                  <Skeleton className="h-4 w-1/3 bg-slate-700" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            View all users who have accessed the system
          </p>
        </div>

        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:gap-3 md:space-y-0">
          <Badge
            variant="outline"
            className={`px-3 py-1 text-xs md:text-sm ${
              isFounder
                ? "border-purple-600 text-purple-600"
                : "border-amber-600 text-amber-600"
            }`}
          >
            {isFounder ? (
              <>
                <Crown className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                <span className="mobile-hide">Founder Access</span>
                <span className="mobile-show">Founder</span>
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                <span className="mobile-hide">Admin Access</span>
                <span className="mobile-show">Admin</span>
              </>
            )}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-blue-900/20 text-blue-400 border-blue-800 text-xs md:text-sm"
          >
            {users?.length || 0} registered users
          </Badge>
        </div>
      </div>

      {!users || users.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6 text-center">
            <User className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No users found in the system.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card
              key={user.id}
              className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base md:text-lg text-white truncate">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email
                        ? user.email.split("@")[0]
                        : "Deleted User"}
                    </CardTitle>
                    {user.title && (
                      <p className="text-xs md:text-sm text-slate-400 truncate">
                        {user.title}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300">
                  <Mail className="h-3 w-3 md:h-4 md:w-4 text-slate-500 flex-shrink-0" />
                  <span className="truncate">
                    {user.email || "Email removed"}
                  </span>
                </div>

                {user.company && (
                  <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300">
                    <Building className="h-3 w-3 md:h-4 md:w-4 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{user.company}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 text-slate-500 flex-shrink-0" />
                  <span>
                    Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </span>
                </div>

                <div className="pt-2 flex flex-wrap gap-1 md:gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-green-900/20 text-green-400 border-green-800 text-xs"
                  >
                    Active User
                  </Badge>
                  {user.isFounder && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-900/20 text-purple-400 border-purple-800 text-xs flex items-center gap-1"
                    >
                      <Crown className="h-3 w-3" />
                      <span className="mobile-hide">Founder</span>
                      <span className="mobile-show">F</span>
                    </Badge>
                  )}
                  {user.isAdmin && !user.isFounder && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-900/20 text-amber-400 border-amber-800 text-xs"
                    >
                      <span className="mobile-hide">Administrator</span>
                      <span className="mobile-show">Admin</span>
                    </Badge>
                  )}
                </div>

                {/* Delete button - only show for non-founder users */}
                {!user.isFounder && (
                  <div className="pt-3 border-t border-slate-700 mt-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-red-400 border-red-800 hover:bg-red-900/20 hover:text-red-300 touch-target"
                          disabled={deleteUserMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span className="mobile-hide">Delete User</span>
                          <span className="mobile-show">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-900 border-slate-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">
                            Delete User Account
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-400">
                            This will permanently delete{" "}
                            <strong>
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email
                                ? user.email.split("@")[0]
                                : "this user"}
                            </strong>
                            and all their associated data including trucks,
                            loads, and drivers. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={deleteUserMutation.isPending}
                          >
                            {deleteUserMutation.isPending
                              ? "Deleting..."
                              : "Delete User"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-xs text-slate-500 text-center pt-4 px-4">
        User data is displayed based on authentication records and registration
        information.
      </div>
    </div>
  );
}

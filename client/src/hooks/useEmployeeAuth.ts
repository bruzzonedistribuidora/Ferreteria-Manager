import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export type EmployeeSession = {
  employeeId: number;
  username: string;
  firstName: string;
  lastName: string;
  roleId: number | null;
  roleName: string | null;
  permissions: Array<{
    moduleCode: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>;
};

type SessionResponse = {
  authenticated: boolean;
  employee?: EmployeeSession;
};

export function useEmployeeAuth() {
  const { data, isLoading, refetch } = useQuery<SessionResponse>({
    queryKey: ["/api/employee/session"],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/employee/logout", {});
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/employee/session"], { authenticated: false });
      window.location.href = "/";
    },
  });

  const hasPermission = (moduleCode: string, permission: "canView" | "canCreate" | "canEdit" | "canDelete"): boolean => {
    if (!data?.employee) return false;
    
    // Admin has all permissions
    if (data.employee.roleName === "admin") return true;
    
    const modulePerm = data.employee.permissions.find(p => p.moduleCode === moduleCode);
    return modulePerm ? modulePerm[permission] : false;
  };

  const canAccessModule = (moduleCode: string): boolean => {
    return hasPermission(moduleCode, "canView");
  };

  return {
    isAuthenticated: data?.authenticated ?? false,
    isLoading,
    employee: data?.employee ?? null,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    hasPermission,
    canAccessModule,
    refetch,
  };
}

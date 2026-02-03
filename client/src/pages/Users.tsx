import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users as UsersIcon, 
  Shield, 
  LayoutGrid, 
  Plus, 
  Edit, 
  Trash2, 
  UserCog,
  Loader2,
  Check,
  X
} from "lucide-react";
import type { UserWithRole, Role, Module, RoleWithPermissions } from "@shared/schema";

export default function Users() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("usuarios");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });
  const [userForm, setUserForm] = useState({ firstName: "", lastName: "", email: "", roleId: "" });
  const [permissions, setPermissions] = useState<Record<number, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>>({});

  const { data: users, isLoading: loadingUsers } = useQuery<UserWithRole[]>({
    queryKey: ["/api/users"]
  });

  const { data: roles, isLoading: loadingRoles } = useQuery<Role[]>({
    queryKey: ["/api/roles"]
  });

  const { data: modules, isLoading: loadingModules } = useQuery<Module[]>({
    queryKey: ["/api/modules"]
  });

  const createRoleMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => 
      apiRequest("POST", "/api/roles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setShowRoleDialog(false);
      setRoleForm({ name: "", description: "" });
      toast({ title: "Rol creado exitosamente" });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Role> }) => 
      apiRequest("PUT", `/api/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setShowRoleDialog(false);
      setEditingRole(null);
      setRoleForm({ name: "", description: "" });
      toast({ title: "Rol actualizado" });
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Rol eliminado" });
    }
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: any[] }) =>
      apiRequest("PUT", `/api/roles/${roleId}/permissions`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setShowPermissionsDialog(false);
      setSelectedRole(null);
      toast({ title: "Permisos actualizados" });
    }
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: number }) =>
      apiRequest("PUT", `/api/users/${userId}/role`, { roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Rol de usuario actualizado" });
    }
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      apiRequest("PUT", `/api/users/${userId}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Estado de usuario actualizado" });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      apiRequest("PUT", `/api/users/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowUserDialog(false);
      setEditingUser(null);
      setUserForm({ firstName: "", lastName: "", email: "", roleId: "" });
      toast({ title: "Usuario actualizado exitosamente" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowDeleteUserDialog(false);
      setUserToDelete(null);
      toast({ title: "Usuario eliminado" });
    }
  });

  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setUserForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      roleId: user.roleId?.toString() || ""
    });
    setShowUserDialog(true);
  };

  const handleDeleteUser = (user: UserWithRole) => {
    setUserToDelete(user);
    setShowDeleteUserDialog(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      updateUserMutation.mutate({
        userId: editingUser.id,
        data: {
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          roleId: userForm.roleId ? parseInt(userForm.roleId) : null
        }
      });
    }
  };

  const updateModuleStatusMutation = useMutation({
    mutationFn: ({ moduleId, isActive }: { moduleId: number; isActive: boolean }) =>
      apiRequest("PUT", `/api/modules/${moduleId}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      toast({ title: "Estado del módulo actualizado" });
    }
  });

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description || "" });
    setShowRoleDialog(true);
  };

  const handleOpenPermissions = async (role: Role) => {
    const response = await fetch(`/api/roles/${role.id}`, { credentials: "include" });
    const roleWithPerms: RoleWithPermissions = await response.json();
    setSelectedRole(roleWithPerms);
    
    const permsMap: Record<number, any> = {};
    modules?.forEach(m => {
      const existing = roleWithPerms.permissions.find(p => p.moduleId === m.id);
      permsMap[m.id] = existing ? {
        canView: existing.canView || false,
        canCreate: existing.canCreate || false,
        canEdit: existing.canEdit || false,
        canDelete: existing.canDelete || false
      } : { canView: false, canCreate: false, canEdit: false, canDelete: false };
    });
    setPermissions(permsMap);
    setShowPermissionsDialog(true);
  };

  const handleSaveRole = () => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: roleForm });
    } else {
      createRoleMutation.mutate(roleForm);
    }
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;
    const permsArray = Object.entries(permissions).map(([moduleId, perms]) => ({
      moduleId: parseInt(moduleId),
      ...perms
    }));
    updatePermissionsMutation.mutate({ roleId: selectedRole.id, permissions: permsArray });
  };

  const toggleAllPermissions = (moduleId: number, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [moduleId]: { canView: value, canCreate: value, canEdit: value, canDelete: value }
    }));
  };

  if (loadingUsers || loadingRoles || loadingModules) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios y Roles</h1>
          <p className="text-gray-500">Gestiona usuarios, roles y permisos del sistema</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="usuarios" data-testid="tab-usuarios">
            <UsersIcon className="w-4 h-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="roles" data-testid="tab-roles">
            <Shield className="w-4 h-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="modulos" data-testid="tab-modulos">
            <LayoutGrid className="w-4 h-4 mr-2" />
            Módulos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5" />
                Lista de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!users || users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay usuarios registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map(user => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`user-row-${user.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          {user.profileImageUrl ? (
                            <img src={user.profileImageUrl} alt="" className="w-10 h-10 rounded-full" />
                          ) : (
                            <UserCog className="w-5 h-5 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Select
                          value={user.roleId?.toString() || ""}
                          onValueChange={(value) => updateUserRoleMutation.mutate({ 
                            userId: user.id, 
                            roleId: parseInt(value) 
                          })}
                        >
                          <SelectTrigger className="w-40" data-testid={`select-role-${user.id}`}>
                            <SelectValue placeholder="Sin rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles?.map(role => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteUser(user)}
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Switch
                            checked={user.isActive === true}
                            onCheckedChange={(checked) => updateUserStatusMutation.mutate({
                              userId: user.id,
                              isActive: checked
                            })}
                            data-testid={`switch-user-status-${user.id}`}
                          />
                          <span className="text-sm text-gray-500">
                            {user.isActive === true ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Roles del Sistema
              </CardTitle>
              <Button 
                onClick={() => {
                  setEditingRole(null);
                  setRoleForm({ name: "", description: "" });
                  setShowRoleDialog(true);
                }}
                data-testid="button-new-role"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Rol
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roles?.map(role => (
                  <div 
                    key={role.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`role-row-${role.id}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{role.name}</p>
                        {role.isSystem && (
                          <Badge variant="secondary">Sistema</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{role.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenPermissions(role)}
                        data-testid={`button-permissions-${role.id}`}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Permisos
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditRole(role)}
                        disabled={role.isSystem === true}
                        data-testid={`button-edit-role-${role.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteRoleMutation.mutate(role.id)}
                        disabled={role.isSystem === true}
                        data-testid={`button-delete-role-${role.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modulos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                Módulos del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Activa o desactiva módulos según el plan contratado por el cliente.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {modules?.map(module => (
                  <div 
                    key={module.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`module-row-${module.id}`}
                  >
                    <div>
                      <p className="font-medium">{module.name}</p>
                      <p className="text-sm text-gray-500">{module.description}</p>
                      <p className="text-xs text-gray-400">Ruta: {module.route}</p>
                    </div>
                    <Switch
                      checked={module.isActive === true}
                      onCheckedChange={(checked) => updateModuleStatusMutation.mutate({
                        moduleId: module.id,
                        isActive: checked
                      })}
                      data-testid={`switch-module-${module.id}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre del Rol</Label>
              <Input
                value={roleForm.name}
                onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Supervisor"
                data-testid="input-role-name"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={roleForm.description}
                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del rol..."
                data-testid="input-role-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveRole}
              disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
              data-testid="button-save-role"
            >
              {(createRoleMutation.isPending || updateRoleMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Permisos: {selectedRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Módulo</th>
                  <th className="text-center py-2">Ver</th>
                  <th className="text-center py-2">Crear</th>
                  <th className="text-center py-2">Editar</th>
                  <th className="text-center py-2">Eliminar</th>
                  <th className="text-center py-2">Todos</th>
                </tr>
              </thead>
              <tbody>
                {modules?.map(module => (
                  <tr key={module.id} className="border-b">
                    <td className="py-2">{module.name}</td>
                    <td className="text-center">
                      <Checkbox
                        checked={permissions[module.id]?.canView || false}
                        onCheckedChange={(checked) => setPermissions(prev => ({
                          ...prev,
                          [module.id]: { ...prev[module.id], canView: !!checked }
                        }))}
                        data-testid={`perm-view-${module.id}`}
                      />
                    </td>
                    <td className="text-center">
                      <Checkbox
                        checked={permissions[module.id]?.canCreate || false}
                        onCheckedChange={(checked) => setPermissions(prev => ({
                          ...prev,
                          [module.id]: { ...prev[module.id], canCreate: !!checked }
                        }))}
                        data-testid={`perm-create-${module.id}`}
                      />
                    </td>
                    <td className="text-center">
                      <Checkbox
                        checked={permissions[module.id]?.canEdit || false}
                        onCheckedChange={(checked) => setPermissions(prev => ({
                          ...prev,
                          [module.id]: { ...prev[module.id], canEdit: !!checked }
                        }))}
                        data-testid={`perm-edit-${module.id}`}
                      />
                    </td>
                    <td className="text-center">
                      <Checkbox
                        checked={permissions[module.id]?.canDelete || false}
                        onCheckedChange={(checked) => setPermissions(prev => ({
                          ...prev,
                          [module.id]: { ...prev[module.id], canDelete: !!checked }
                        }))}
                        data-testid={`perm-delete-${module.id}`}
                      />
                    </td>
                    <td className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const allChecked = permissions[module.id]?.canView && 
                            permissions[module.id]?.canCreate && 
                            permissions[module.id]?.canEdit && 
                            permissions[module.id]?.canDelete;
                          toggleAllPermissions(module.id, !allChecked);
                        }}
                        data-testid={`perm-toggle-all-${module.id}`}
                      >
                        {permissions[module.id]?.canView && 
                         permissions[module.id]?.canCreate && 
                         permissions[module.id]?.canEdit && 
                         permissions[module.id]?.canDelete ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSavePermissions}
              disabled={updatePermissionsMutation.isPending}
              data-testid="button-save-permissions"
            >
              {updatePermissionsMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Guardar Permisos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                value={userForm.firstName}
                onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                data-testid="input-user-firstName"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={userForm.lastName}
                onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                data-testid="input-user-lastName"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={userForm.email}
                disabled
                className="bg-gray-50"
                data-testid="input-user-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleId">Rol</Label>
              <Select
                value={userForm.roleId}
                onValueChange={(value) => setUserForm({ ...userForm, roleId: value })}
              >
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue placeholder="Sin rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveUser}
              disabled={updateUserMutation.isPending}
              data-testid="button-save-user"
            >
              {updateUserMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este usuario?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Se eliminará permanentemente el usuario <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong> ({userToDelete?.email}).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteUserDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete-user"
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </Layout>
  );
}

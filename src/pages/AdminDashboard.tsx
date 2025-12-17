import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Search, Shield, Users, Wallet, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UserRecharge from "./UserRecharge";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [userDevices, setUserDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    totalDevices: 0
  });

  useEffect(() => {
    checkAdminAccess();
    fetchUsers();
    fetchStats();
    fetchUserDevices();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      toast.error("Access denied. Admin privileges required.");
      navigate('/dashboard');
      return;
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('registered_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase
        .from('registered_users')
        .select('*', { count: 'exact', head: true });

      const { data: balanceData } = await supabase
        .from('registered_users')
        .select('balance');
      
      const totalBalance = balanceData?.reduce((sum, user) => sum + (Number(user.balance) || 0), 0) || 0;

      const { count: deviceCount } = await supabase
        .from('user_devices')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: userCount || 0,
        totalBalance,
        totalDevices: deviceCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUserDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select(`
          *,
          registered_users!inner(unique_code, phone)
        `)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      setUserDevices(data || []);
    } catch (error) {
      console.error('Error fetching user devices:', error);
    }
  };

  const handleUpdateBalance = async (userId: string, amountToAdd: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.rpc('admin_add_balance', {
        p_admin_user_id: session.user.id,
        p_target_user_id: userId,
        p_amount: amountToAdd,
        p_transaction_id: `ADMIN-${Date.now()}`,
        p_e_wallet_number: 'N/A'
      });

      if (error) throw error;

      const result = data as any;
      if (!result.success) {
        toast.error(result.error || "Failed to update balance");
        return;
      }

      toast.success(`Added GHS ${amountToAdd} to balance`);
      fetchUsers();
      fetchStats();
      fetchUserDevices();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error("Failed to update balance");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate('/login');
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allUserIds = new Set(filteredUsers.map(user => user.id));
      setSelectedUsers(allUserIds);
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleDeleteSelectedUsers = async () => {
    if (selectedUsers.size === 0) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const userIds = Array.from(selectedUsers);
      
      // Delete from registered_users
      const { error } = await supabase
        .from('registered_users')
        .delete()
        .in('id', userIds);

      if (error) throw error;

      // Immediately update UI state
      setUsers(prevUsers => prevUsers.filter(user => !selectedUsers.has(user.id)));
      toast.success(`Successfully deleted ${selectedUsers.size} user(s)`);
      setSelectedUsers(new Set());
      fetchStats();
      fetchUserDevices();
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error("Failed to delete users");
    }
  };

  const filteredUsers = users.filter(user => 
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.unique_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSelected = filteredUsers.length > 0 && filteredUsers.every(user => selectedUsers.has(user.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm opacity-90">Manage users and platform</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <Tabs defaultValue="overview" className="px-6 py-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recharge">User Recharge</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">GHS {stats.totalBalance.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDevices}</div>
              </CardContent>
            </Card>
          </div>

          {/* User Devices/Investments Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Code</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Daily Income</TableHead>
                      <TableHead>Total Income</TableHead>
                      <TableHead>Purchased</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userDevices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No investments yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      userDevices.map((device) => (
                        <TableRow key={device.id}>
                          <TableCell className="font-medium">
                            {device.registered_users?.unique_code || 'N/A'}
                          </TableCell>
                          <TableCell>{device.registered_users?.phone || 'N/A'}</TableCell>
                          <TableCell className="font-semibold">{device.device_name}</TableCell>
                          <TableCell>{device.product_price}</TableCell>
                          <TableCell>{device.daily_income}</TableCell>
                          <TableCell>{device.total_income}</TableCell>
                          <TableCell>
                            {new Date(device.purchased_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle>User Management</CardTitle>
                  {selectedUsers.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelectedUsers}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete ({selectedUsers.size})
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by phone or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Loading users...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Unique Code</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Current Balance</TableHead>
                        <TableHead>Add Amount</TableHead>
                        <TableHead>Invitation Code</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.has(user.id)}
                                onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{user.unique_code || 'N/A'}</TableCell>
                            <TableCell>{user.phone || 'N/A'}</TableCell>
                            <TableCell className="font-semibold">
                              GHS {Number(user.balance || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="Amount to add"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const amountToAdd = parseFloat((e.target as HTMLInputElement).value);
                                      if (!isNaN(amountToAdd) && amountToAdd > 0) {
                                        handleUpdateBalance(user.user_id, amountToAdd);
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }
                                  }}
                                  className="w-32"
                                />
                              </div>
                            </TableCell>
                            <TableCell>{user.invitation_code || 'N/A'}</TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recharge">
          <UserRecharge />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
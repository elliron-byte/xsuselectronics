import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Search, Shield, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [userDevices, setUserDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

    // Check if user has admin role
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
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total users
      const { count: userCount } = await supabase
        .from('registered_users')
        .select('*', { count: 'exact', head: true });

      // Total balance
      const { data: balanceData } = await supabase
        .from('registered_users')
        .select('balance');
      
      const totalBalance = balanceData?.reduce((sum, user) => sum + (Number(user.balance) || 0), 0) || 0;

      // Total devices
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

  const handleUpdateBalance = async (userId: string, newBalance: number) => {
    try {
      // Get current balance first
      const { data: currentUser } = await supabase
        .from('registered_users')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const currentBalance = Number(currentUser?.balance) || 0;

      // Update balance
      const { error } = await supabase
        .from('registered_users')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      if (error) throw error;

      // Log recharge record if balance increased
      if (newBalance > currentBalance) {
        const rechargeAmount = newBalance - currentBalance;
        await supabase
          .from('recharge_records')
          .insert({
            user_id: userId,
            amount: rechargeAmount,
            previous_balance: currentBalance,
            new_balance: newBalance
          });
      }

      toast.success("Balance updated successfully");
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

  const filteredUsers = users.filter(user => 
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.unique_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Stats */}
      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <div className="px-6 pb-6">
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
      </div>

      {/* Users Table */}
      <div className="px-6 pb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Management</CardTitle>
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
                      <TableHead>Unique Code</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Invitation Code</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.unique_code || 'N/A'}</TableCell>
                          <TableCell>{user.phone || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                defaultValue={user.balance || 0}
                                onBlur={(e) => {
                                  const newBalance = parseFloat(e.target.value);
                                  if (!isNaN(newBalance) && newBalance !== user.balance) {
                                    handleUpdateBalance(user.user_id, newBalance);
                                  }
                                }}
                                className="w-24"
                              />
                            </div>
                          </TableCell>
                          <TableCell>{user.invitation_code || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateBalance(user.user_id, Number(user.balance) || 0)}
                            >
                              Refresh
                            </Button>
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
      </div>
    </div>
  );
};

export default AdminDashboard;

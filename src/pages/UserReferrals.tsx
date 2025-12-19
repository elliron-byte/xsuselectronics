import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Users, Check, X, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReferredUser {
  id: string;
  user_id: string | null;
  phone: string | null;
  email: string | null;
  unique_code: string | null;
  balance: number | null;
  created_at: string;
  hasDevice: boolean;
  is_blocked: boolean;
}

const UserReferrals = () => {
  const navigate = useNavigate();
  const { uniqueCode } = useParams();
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceUser, setSourceUser] = useState<any>(null);

  useEffect(() => {
    checkAdminAccess();
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

    fetchData();
  };

  const fetchData = async () => {
    try {
      // Fetch the source user details
      const { data: userData, error: userError } = await supabase
        .from('registered_users')
        .select('*')
        .eq('unique_code', uniqueCode)
        .maybeSingle();

      if (userError) throw userError;
      setSourceUser(userData);

      // Fetch users who used this unique_code as their invitation_code
      const { data: referrals, error: referralsError } = await supabase
        .from('registered_users')
        .select('*')
        .eq('invitation_code', uniqueCode)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      // For each referred user, check if they own any devices
      const referralsWithDevices = await Promise.all(
        (referrals || []).map(async (user) => {
          const { count } = await supabase
            .from('user_devices')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.user_id);

          return {
            ...user,
            hasDevice: (count || 0) > 0,
            is_blocked: user.is_blocked || false
          };
        })
      );

      setReferredUsers(referralsWithDevices);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('registered_users')
        .update({ is_blocked: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setReferredUsers(prev => 
        prev.map(user => 
          user.user_id === userId 
            ? { ...user, is_blocked: !currentStatus }
            : user
        )
      );

      toast.success(`User ${!currentStatus ? 'blocked' : 'unblocked'} successfully`);
    } catch (error) {
      console.error('Error toggling block status:', error);
      toast.error("Failed to update user status");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white px-6 py-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin')}
          className="text-white hover:bg-white/20"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">User Referrals</h1>
          <p className="text-sm opacity-90">
            Referrals for code: {uniqueCode}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Source User Info */}
        {sourceUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Source User Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Code</p>
                  <p className="font-semibold">{sourceUser.unique_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{sourceUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{sourceUser.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="font-semibold">GHS {Number(sourceUser.balance || 0).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{referredUsers.length}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  {referredUsers.filter(u => u.hasDevice).length}
                </p>
                <p className="text-sm text-muted-foreground">With Devices</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Referred Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading referrals...</p>
            ) : referredUsers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No users have used this code to sign up yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unique Code</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Owns Device</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <Ban className="w-4 h-4" />
                          Block
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.unique_code || 'N/A'}</TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{user.email || 'N/A'}</TableCell>
                        <TableCell>GHS {Number(user.balance || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          {user.hasDevice ? (
                            <span className="inline-flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">
                              <Check className="w-3 h-3" />
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs">
                              <X className="w-3 h-3" />
                              No
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={user.is_blocked}
                            onCheckedChange={() => user.user_id && handleToggleBlock(user.user_id, user.is_blocked)}
                            className="data-[state=checked]:bg-destructive"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
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

export default UserReferrals;

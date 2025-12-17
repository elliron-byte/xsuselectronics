import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Search, Check, X } from "lucide-react";

interface RechargeRequest {
  id: string;
  user_id: string;
  amount: number;
  transaction_id: string;
  e_wallet_number: string;
  status: string;
  created_at: string;
  user_phone?: string;
  user_email?: string;
}

const UserRecharge = () => {
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchRechargeRequests();
  }, []);

  const fetchRechargeRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('recharge_records')
        .select(`
          id,
          user_id,
          amount,
          transaction_id,
          e_wallet_number,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user phone numbers and emails
      const requestsWithUserData = await Promise.all(
        (data || []).map(async (record) => {
          const { data: userData } = await supabase
            .from('registered_users')
            .select('phone, email')
            .eq('user_id', record.user_id)
            .single();

          return {
            ...record,
            user_phone: userData?.phone || 'N/A',
            user_email: userData?.email || 'N/A'
          };
        })
      );

      setRechargeRequests(requestsWithUserData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (record: RechargeRequest) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Call secure database function to fund the account with the requested amount
      const { data, error } = await supabase.rpc('admin_add_balance', {
        p_admin_user_id: session.user.id,
        p_target_user_id: record.user_id,
        p_amount: record.amount,
        p_transaction_id: record.transaction_id,
        p_e_wallet_number: record.e_wallet_number
      });

      if (error) throw error;

      const result = data as any;
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Account funded with GHS ${record.amount}`,
      });

      fetchRechargeRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDecline = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('recharge_records')
        .update({ status: 'failed' })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Declined",
        description: "Recharge request has been declined",
      });

      fetchRechargeRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const filteredRequests = rechargeRequests.filter(request => 
    request.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.user_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.e_wallet_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Recharge Requests</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by transaction ID, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Button onClick={fetchRechargeRequests}>Refresh</Button>
        </div>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>E-Wallet</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.user_email}</TableCell>
                <TableCell>{request.user_phone}</TableCell>
                <TableCell>{request.e_wallet_number}</TableCell>
                <TableCell className="font-mono text-sm">{request.transaction_id}</TableCell>
                <TableCell className="font-semibold">GHS {request.amount}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    request.status === 'successful' ? 'bg-green-100 text-green-800' :
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {request.status}
                  </span>
                </TableCell>
                <TableCell>{format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(request)}
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleDecline(request.id)}
                        size="sm"
                        variant="destructive"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredRequests.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No matching recharge requests found" : "No recharge requests found"}
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserRecharge;
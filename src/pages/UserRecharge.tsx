import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Search } from "lucide-react";

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
  const [fundingAmounts, setFundingAmounts] = useState<{ [key: string]: string }>({});
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
          // Get phone and email from registered_users
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

  const handleStatusChange = async (recordId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('recharge_records')
        .update({ status: newStatus })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Status updated to ${newStatus}`,
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

  const handleFundAccount = async (record: RechargeRequest) => {
    const fundAmount = parseFloat(fundingAmounts[record.id] || "0");
    
    if (fundAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to fund",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current user balance
      const { data: userData, error: userError } = await supabase
        .from('registered_users')
        .select('balance')
        .eq('user_id', record.user_id)
        .single();

      if (userError) throw userError;

      const currentBalance = userData?.balance || 0;
      const newBalance = parseFloat(currentBalance.toString()) + fundAmount;

      // Update user balance
      const { error: updateError } = await supabase
        .from('registered_users')
        .update({ balance: newBalance })
        .eq('user_id', record.user_id);

      if (updateError) throw updateError;

      // Update recharge record
      const { error: rechargeError } = await supabase
        .from('recharge_records')
        .update({
          new_balance: newBalance,
          status: 'successful'
        })
        .eq('id', record.id);

      if (rechargeError) throw rechargeError;

      toast({
        title: "Success",
        description: `Account funded with GHS ${fundAmount}`,
      });

      setFundingAmounts({ ...fundingAmounts, [record.id]: "" });
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
              <TableHead>Fund Amount</TableHead>
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
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={fundingAmounts[request.id] || ""}
                    onChange={(e) => setFundingAmounts({
                      ...fundingAmounts,
                      [request.id]: e.target.value
                    })}
                    className="w-24"
                    disabled={request.status === 'successful'}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleFundAccount(request)}
                          size="sm"
                          variant="default"
                        >
                          Fund
                        </Button>
                        <Button
                          onClick={() => handleStatusChange(request.id, 'successful')}
                          size="sm"
                          variant="outline"
                        >
                          Approve
                        </Button>
                      </>
                    )}
                  </div>
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

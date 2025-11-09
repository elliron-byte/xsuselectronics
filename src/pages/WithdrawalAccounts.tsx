import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WithdrawalAccounts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bank, setBank] = useState("");
  const selectedAccountId = location.state?.selectedAccountId;

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    const { data } = await supabase
      .from('withdrawal_accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setAccounts(data);
    }
  };

  const handleCreateAccount = async () => {
    if (!accountName || !accountNumber || !bank) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { error } = await supabase
        .from('withdrawal_accounts')
        .insert({
          user_id: session.user.id,
          account_name: accountName,
          account_number: accountNumber,
          bank: bank
        });

      if (error) throw error;

      toast({
        title: "Account created",
        description: "Your withdrawal account has been added",
      });

      setAccountName("");
      setAccountNumber("");
      setBank("");
      setShowForm(false);
      fetchAccounts();
    } catch (error) {
      console.error('Account creation error:', error);
      toast({
        title: "Failed to create account",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleSelectAccount = (account: any) => {
    navigate('/withdrawal', { state: { selectedAccount: account } });
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-primary text-white px-4 py-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowForm(false)}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Add Withdrawal Account</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <Label htmlFor="accountName" className="text-foreground">Account Name</Label>
            <Input
              id="accountName"
              placeholder="Enter account name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="accountNumber" className="text-foreground">Account Number</Label>
            <Input
              id="accountNumber"
              placeholder="Enter account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="bank" className="text-foreground">Bank</Label>
            <Select value={bank} onValueChange={setBank}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MTN">MTN</SelectItem>
                <SelectItem value="Telecel">Telecel</SelectItem>
                <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleCreateAccount}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium mt-6"
          >
            Save Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/withdrawal')}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Select Withdrawal Account</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No withdrawal accounts yet. Create one to continue.
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card 
              key={account.id}
              className={`cursor-pointer hover:bg-accent/5 transition-colors ${
                selectedAccountId === account.id ? 'border-primary' : ''
              }`}
              onClick={() => handleSelectAccount(account)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{account.account_name}</div>
                    <div className="text-sm text-muted-foreground">{account.bank}</div>
                    <div className="text-sm text-muted-foreground">{account.account_number}</div>
                  </div>
                  {selectedAccountId === account.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <Button 
          onClick={() => setShowForm(true)}
          variant="outline"
          className="w-full h-12 rounded-lg font-medium"
        >
          + Add New Account
        </Button>
      </div>
    </div>
  );
};

export default WithdrawalAccounts;

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Withdrawal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [balance, setBalance] = useState(0);
  const [withdrawalAccounts, setWithdrawalAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [amountReceived, setAmountReceived] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.selectedAccount) {
      setSelectedAccount(location.state.selectedAccount);
    }
  }, [location.state]);

  useEffect(() => {
    if (withdrawAmount) {
      const amount = Number(withdrawAmount);
      if (!isNaN(amount)) {
        const tax = amount * 0.15;
        setAmountReceived(amount - tax);
      } else {
        setAmountReceived(0);
      }
    } else {
      setAmountReceived(0);
    }
  }, [withdrawAmount]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    // Fetch balance
    const { data: userData } = await supabase
      .from('registered_users')
      .select('balance')
      .eq('user_id', session.user.id)
      .single();

    if (userData) {
      setBalance(Number(userData.balance) || 0);
    }

    // Fetch withdrawal accounts
    const { data: accounts } = await supabase
      .from('withdrawal_accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (accounts) {
      setWithdrawalAccounts(accounts);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    
    if (!amount || amount < 20) {
      toast({
        title: "Invalid amount",
        description: "Minimum withdrawal amount is GHS 20",
        variant: "destructive"
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient balance",
        description: `Your balance is GHS ${balance.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    if (!selectedAccount) {
      toast({
        title: "No account selected",
        description: "Please select a withdrawal account",
        variant: "destructive"
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Deduct balance
      const newBalance = balance - amount;
      const { error: balanceError } = await supabase
        .from('registered_users')
        .update({ balance: newBalance })
        .eq('user_id', session.user.id);

      if (balanceError) throw balanceError;

      // Create withdrawal record
      const { error: withdrawError } = await supabase
        .from('withdraw_records')
        .insert({
          user_id: session.user.id,
          amount: amount,
          status: 'pending'
        });

      if (withdrawError) throw withdrawError;

      toast({
        title: "Withdrawal submitted",
        description: "Your withdrawal request has been submitted and is pending approval",
      });

      setBalance(newBalance);
      setWithdrawAmount("");
      setAmountReceived(0);
      setSelectedAccount(null);
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Withdrawal failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Withdrawal</h1>
          </div>
          <button className="p-2">
            <Info className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Account Balance */}
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Account balance</div>
            <div className="text-3xl font-bold text-foreground">GHS {balance.toFixed(2)}</div>
          </CardContent>
        </Card>

        {/* Withdrawal Account */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-foreground">Withdrawal account</h2>
          <Card 
            className="cursor-pointer hover:bg-accent/5 transition-colors"
            onClick={() => navigate('/withdrawal-accounts', { state: { selectedAccountId: selectedAccount?.id } })}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-foreground">
                {selectedAccount 
                  ? `${selectedAccount.account_name} - ${selectedAccount.bank}` 
                  : "Select the withdrawal wallet account"}
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Amount */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-foreground">Withdrawal amount</h2>
            <span className="text-sm text-muted-foreground">Tax: 15%</span>
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="Please choose the withdrawal amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="pl-16 h-12"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-medium">
              GHS
            </span>
          </div>
          <div className="mt-2 text-sm text-foreground">
            Amount received: GHS {amountReceived.toFixed(2)}
          </div>
        </div>

        {/* Withdraw Button */}
        <Button 
          onClick={handleWithdraw}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium"
        >
          Withdraw
        </Button>

        {/* Withdrawal Instructions */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-center mb-4 text-foreground">Withdrawal Instructions</h3>
          <div className="space-y-3 text-sm text-foreground">
            <div>
              <span className="font-semibold">1.</span> Minimum Withdrawal Amount: GHS 20
            </div>
            <div>
              <span className="font-semibold">2.</span> Withdrawal Hours: 9:00 AM to 6:00 PM (Monday to Sunday)
            </div>
            <div>
              <span className="font-semibold">3.</span> Withdrawal Fee: 15% (Government Fee, used for product maintenance)
            </div>
            <div>
              <span className="font-semibold">4.</span> All withdrawals will be processed within 1 hour; in special circumstances, processing may be completed within 24 hours.
            </div>
            <div>
              <span className="font-semibold">5. 🎁🎁</span> Once the product countdown ends, your investment will be automatically returned to your wallet!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Withdrawal;

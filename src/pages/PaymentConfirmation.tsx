import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const amount = location.state?.amount || 0;
  const eWalletNumber = location.state?.eWalletNumber || "";
  
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleGetResult = async () => {
    if (!transactionId || transactionId.length < 11) {
      toast({
        title: "Invalid Transaction ID",
        description: "Please enter a valid Transaction ID (11 or 16 digits)",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to continue",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      // Get current balance
      const { data: userData, error: userError } = await supabase
        .from('registered_users')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (userError) throw userError;

      // Insert recharge record
      const { error: insertError } = await supabase
        .from('recharge_records')
        .insert({
          user_id: user.id,
          amount: amount,
          previous_balance: userData?.balance || 0,
          new_balance: userData?.balance || 0,
          transaction_id: transactionId,
          e_wallet_number: eWalletNumber,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: "Request Submitted",
        description: "Your recharge request has been submitted and is pending approval",
      });

      navigate('/recharge-record');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit recharge request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Timer at top */}
      <div className="text-center mb-4">
        <span className="text-2xl font-bold text-foreground">{formatTime(timeLeft)}</span>
      </div>

      <div className="max-w-md mx-auto bg-card rounded-lg shadow-lg p-6 space-y-6">
        {/* Important Reminder Header */}
        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded relative">
          <button 
            onClick={() => navigate('/dashboard')}
            className="absolute top-2 right-2 text-foreground/60 hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-foreground mb-2">Important Reminder</h2>
          <p className="text-sm text-foreground/80">
            When you completed the payment, please backfill the Txn ID (11 or 16 digits) here from MoMo or Vodafone (Telecel Play Ghana) such as:
          </p>
          {/* Carousel dots indicator */}
          <div className="flex justify-center gap-1 mt-3">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
        </div>

        {/* Main Form */}
        <div className="space-y-4">
          {/* It is Important badge */}
          <div className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            It is Important!
          </div>

          {/* Transaction ID Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Transaction ID (Txn ID 11 or 16 digits)"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, ""))}
              className="w-full pr-10"
            />
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setTransactionId("")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Repay To Section */}
          <div className="bg-white rounded-lg p-4 space-y-3">
            <p className="text-sm">
              Please repay to <span className="text-orange-500">Vodafone (Telecel Play Ghana)</span> account:
            </p>
            
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded">
              <div className="bg-red-500 text-white w-10 h-10 rounded flex items-center justify-center font-bold text-xl">
                t
              </div>
              <span className="text-xl font-bold flex-1">0266716101</span>
              <button 
                onClick={() => handleCopy("0266716101")}
                className="text-primary text-sm"
              >
                📋 Copy
              </button>
            </div>

            {/* Amount Display */}
            <div className="space-y-2">
              <p className="text-sm text-foreground/80">The amount you should repay is:</p>
              <div className="flex items-center gap-2">
                <div className="bg-primary text-white px-3 py-2 rounded font-bold">
                  GHS
                </div>
                <span className="text-2xl font-bold">{amount}</span>
                <button 
                  onClick={() => handleCopy(amount.toString())}
                  className="text-primary text-sm ml-auto"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If your payment completed, you can click the button to get the result. It may take a few minutes.
          </p>

          <Button
            onClick={handleGetResult}
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg"
          >
            {isSubmitting ? "Processing..." : "Get the result"}
          </Button>

          {/* E-wallet Display */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600 mb-1">Please check the correct payment e-wallet:</p>
              <p className="text-lg font-bold">{eWalletNumber}</p>
            </div>
            <button className="text-orange-500 text-sm">✏️ Modify</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;

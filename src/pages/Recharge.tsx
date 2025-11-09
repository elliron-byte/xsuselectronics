import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Recharge = () => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  const quickAmounts = [40, 110, 220, 400, 600];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleDeposit = () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount < 40) {
      alert("Please enter a valid amount (minimum 40 GHS)");
      return;
    }
    // Handle deposit logic here
    console.log("Deposit amount:", amount);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Recharge</h1>
        </div>
        <button className="p-2 bg-white/10 rounded-full">
          <Info className="w-6 h-6" />
        </button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Recharge Amount Section */}
        <div>
          <h2 className="text-foreground text-lg font-semibold mb-4">
            Recharge amount <span className="text-muted-foreground">(Minimum GHS 40)</span>
          </h2>
          
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleAmountSelect(amount)}
                className={`py-4 rounded-xl border-2 transition-all ${
                  selectedAmount === amount
                    ? "border-primary bg-primary/5 text-primary font-semibold"
                    : "border-border bg-card text-foreground"
                }`}
              >
                {amount}
              </button>
            ))}
          </div>

          {/* Custom Amount Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-semibold">
              GHS
            </div>
            <Input
              type="number"
              placeholder="Please enter the recharge amount"
              value={customAmount}
              onChange={handleCustomAmountChange}
              className="pl-16 py-6 text-base"
            />
          </div>
        </div>

        {/* Recharge Channels */}
        <div>
          <h2 className="text-foreground text-lg font-semibold mb-4">Recharge channels</h2>
          <Button className="w-full py-6 bg-primary hover:bg-primary/90 text-white rounded-xl">
            Recharge Channel 1
          </Button>
        </div>

        {/* Deposit Button */}
        <Button 
          onClick={handleDeposit}
          className="w-full py-6 bg-primary hover:bg-primary/90 text-white rounded-xl text-lg font-semibold"
        >
          Deposit now
        </Button>

        {/* Recharge Instructions */}
        <div className="space-y-4">
          <h2 className="text-foreground text-lg font-semibold">Recharge Instructions</h2>
          <div className="space-y-3 text-foreground/80">
            <p className="text-sm leading-relaxed">
              1. Minimum deposit amount: 40 (Please do not deposit amounts less than 40; otherwise, 
              these amounts will not be credited to your account balance, and we will not be 
              responsible for such deposits.)
            </p>
            <p className="text-sm leading-relaxed">
              2. All deposits must be made through the app. Do not transfer funds privately.
            </p>
            <p className="text-sm leading-relaxed">
              3. Please create a new account before each deposit; do not save your account and 
              reuse the same account for deposits.
            </p>
            <p className="text-sm leading-relaxed">
              4. If your deposit does not arrive within 10 minutes, please contact official customer 
              service for further assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recharge;

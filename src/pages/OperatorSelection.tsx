import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useLocation } from "react-router-dom";

const OperatorSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const amount = location.state?.amount || 0;
  
  const [operator, setOperator] = useState("");
  const [eWalletNumber, setEWalletNumber] = useState("");

  const handleSubmit = () => {
    if (!operator || eWalletNumber.length !== 9) {
      alert("Please select an operator and enter a valid 9-digit e-wallet number");
      return;
    }
    navigate('/payment-confirmation', { 
      state: { 
        amount, 
        eWalletNumber: "0" + eWalletNumber 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto bg-card rounded-lg shadow-lg p-6 space-y-6">
        {/* Important Reminder Header */}
        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded">
          <h2 className="font-bold text-foreground mb-2">Important Reminder</h2>
          <p className="text-sm text-foreground/80">
            When you completed the payment, please backfill the Txn ID (11 or 16 digits) here from MoMo or Vodafone (Telecel Play Ghana) such as:
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg p-6 space-y-4">
          <p className="text-sm font-semibold text-foreground">
            Please fill in the <span className="text-red-500">correct payment e-wallet number</span> to confirm your repayment.
          </p>
          <p className="text-sm text-foreground/80">
            If you ask someone else to repay on your behalf, please confirm that the{" "}
            <span className="text-red-500">payment e-wallet number is correct</span>.
          </p>

          {/* Operator Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Operator</label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mtn">MTN</SelectItem>
                <SelectItem value="telecel">Telecel</SelectItem>
                <SelectItem value="airteltigo">AirtelTigo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* E-wallet Number Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">E-wallet Number</label>
            <div className="flex items-center gap-1">
              <div className="flex h-10 items-center justify-center px-3 bg-muted rounded-l-md border border-r-0 border-input">
                <span className="text-sm font-medium">0</span>
              </div>
              <Input
                type="text"
                placeholder="Enter 9 digits"
                value={eWalletNumber}
                onChange={(e) => setEWalletNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                className="flex-1 rounded-l-none"
                maxLength={9}
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!operator || eWalletNumber.length !== 9}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            CONFIRMED THEN SUBMIT
          </Button>

          {/* Amount Display */}
          <div className="pt-4 space-y-2">
            <p className="text-sm text-foreground/80">The amount you should repay is:</p>
            <div className="flex items-center gap-2">
              <div className="bg-primary text-white px-3 py-1 rounded font-bold">
                GHS
              </div>
              <span className="text-2xl font-bold">{amount}</span>
              <button className="text-primary text-sm ml-auto">📋 Copy</button>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          If your payment completed, you can click the button to get the result. It may take a few minutes.
        </p>
      </div>
    </div>
  );
};

export default OperatorSelection;

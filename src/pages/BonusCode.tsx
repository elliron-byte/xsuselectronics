import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const BonusCode = () => {
  const navigate = useNavigate();
  const [bonusCode, setBonusCode] = useState("");

  const handleSubmit = () => {
    if (!bonusCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a bonus code",
        variant: "destructive"
      });
      return;
    }

    // TODO: Implement bonus code validation and redemption
    toast({
      title: "Success",
      description: "Bonus code submitted successfully!",
    });
    setBonusCode("");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Bonus Code</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Input Your Bonus Code
              </label>
              <Input
                type="text"
                placeholder="Enter bonus code"
                value={bonusCode}
                onChange={(e) => setBonusCode(e.target.value)}
                className="mb-4"
              />
            </div>
            <Button 
              onClick={handleSubmit}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Submit Bonus Code
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BonusCode;

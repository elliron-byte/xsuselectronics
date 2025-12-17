import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const BonusCode = () => {
  const navigate = useNavigate();
  const [bonusCode, setBonusCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async () => {
    if (!bonusCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a bonus code",
        variant: "destructive"
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "Please log in to redeem bonus codes",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('redeem_bonus_code', {
        p_user_id: userId,
        p_code: bonusCode.trim()
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; amount?: number };

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to redeem bonus code",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `GHS ${result.amount} has been added to your account!`,
      });
      setBonusCode("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to redeem bonus code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isLoading ? "Redeeming..." : "Submit Bonus Code"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BonusCode;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowDownToLine, Users, Calendar, Send, RotateCcw, Home as HomeIcon, Menu, User, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<"home" | "devices" | "team" | "profile">("home");
  const [userData, setUserData] = useState<{ phone: string; uniqueCode: string; balance: number } | null>(null);

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        navigate('/login');
        return;
      }

      setSession(currentSession);

      const { data } = await supabase
        .from('registered_users')
        .select('unique_code, balance')
        .eq('user_id', currentSession.user.id)
        .single();

      if (data) {
        setUserData({ 
          phone: currentSession.user.email || '',
          uniqueCode: data.unique_code || '00000',
          balance: Number(data.balance) || 20
        });
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const investments = [
    {
      id: 1,
      name: "Device 1",
      price: 60,
      priceDisplay: "60 Ghs",
      revenue: "30 Days",
      dailyEarnings: "9 Ghs",
      totalGain: "270 Ghs",
    },
    {
      id: 2,
      name: "Device 2",
      price: 110,
      priceDisplay: "110 Ghs",
      revenue: "30 Days",
      dailyEarnings: "20 Ghs",
      totalGain: "600 Ghs",
    },
    {
      id: 3,
      name: "Device 3",
      price: 220,
      priceDisplay: "220 Ghs",
      revenue: "30 Days",
      dailyEarnings: "27 Ghs",
      totalGain: "810 Ghs",
    },
    {
      id: 4,
      name: "Device 4",
      price: 400,
      priceDisplay: "400 Ghs",
      revenue: "30 Days",
      dailyEarnings: "40 Ghs",
      totalGain: "1200 Ghs",
    },
    {
      id: 5,
      name: "Device 5",
      price: 600,
      priceDisplay: "600 Ghs",
      revenue: "30 Days",
      dailyEarnings: "60 Ghs",
      totalGain: "1800 Ghs",
    },
  ];

  const handleInvest = async (investment: typeof investments[0]) => {
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to invest",
        variant: "destructive"
      });
      return;
    }

    const currentBalance = userData?.balance || 0;
    
    if (currentBalance < investment.price) {
      toast({
        title: "Insufficient balance",
        description: `You need GHS ${investment.price} to invest in this device. Your current balance is GHS ${currentBalance}`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if this is the user's first investment
      const { data: existingDevices } = await supabase
        .from('user_devices')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      const isFirstInvestment = !existingDevices || existingDevices.length === 0;

      // Get user phone for the device record
      const { data: userPhoneData } = await supabase
        .from('registered_users')
        .select('phone')
        .eq('user_id', session.user.id)
        .single();

      // Calculate new balance - deduct investment price and signup bonus (20 GHS) on first investment
      const signupBonusDeduction = isFirstInvestment ? 20 : 0;
      const newBalance = Math.max(0, currentBalance - investment.price - signupBonusDeduction);
      
      const { error: balanceError } = await supabase
        .from('registered_users')
        .update({ balance: newBalance })
        .eq('user_id', session.user.id);

      if (balanceError) throw balanceError;

      // Add device to user_devices
      const { error: deviceError } = await supabase
        .from('user_devices')
        .insert({
          user_id: session.user.id,
          user_phone: userPhoneData?.phone || '',
          device_name: investment.name,
          device_number: investment.id,
          product_price: investment.priceDisplay,
          daily_income: investment.dailyEarnings,
          total_income: investment.totalGain
        });

      if (deviceError) throw deviceError;

      // Update local state
      setUserData(prev => prev ? { ...prev, balance: newBalance } : null);

      toast({
        title: "Investment successful!",
        description: `You have successfully invested in ${investment.name}. Your new balance is GHS ${newBalance}`,
      });
    } catch (error) {
      console.error('Investment error:', error);
      toast({
        title: "Investment failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with green background */}
      <div className="bg-primary text-white px-4 pt-4 pb-6 rounded-b-3xl">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-xl font-bold">X</span>
            </div>
          </div>
          <div>
            <div className="text-xl font-bold">{userData?.uniqueCode || '00000'}</div>
            <div className="text-sm opacity-90">{userData?.phone || 'Loading...'}</div>
          </div>
        </div>

        {/* Balance Section */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-sm opacity-90 mb-1">Your Balance</div>
            <div className="text-2xl font-bold">GHS {userData?.balance || 20}</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90 mb-1">Total Income</div>
            <div className="text-2xl font-bold">Ghs 0</div>
          </div>
          <button onClick={() => window.location.reload()} className="p-2 bg-white/20 rounded-full">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-5 gap-3">
          <button className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs">Recharge</span>
          </button>
          <button onClick={() => navigate("/withdrawal")} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ArrowDownToLine className="w-6 h-6" />
            </div>
            <span className="text-xs">Withdraw</span>
          </button>
          <button onClick={() => navigate("/team")} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs">Team</span>
          </button>
          <button onClick={() => navigate("/devices")} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-xs">Daily Check In</span>
          </button>
          <button className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6" />
            </div>
            <span className="text-xs">Telegram</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="px-4 py-4">
        <h2 className="text-2xl font-bold">Offers</h2>
      </div>

      {/* Investment Cards */}
      <div className="flex-1 px-4 pb-20 space-y-4 overflow-y-auto">
        {investments.map((investment) => (
          <div key={investment.id} className="bg-white rounded-2xl p-4 shadow-sm border border-border">
            <div className="flex gap-4">
              {/* Logo */}
              <div className="w-16 h-16 flex-shrink-0">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white text-sm font-bold">X</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-3">{investment.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product Price</span>
                    <span className="font-semibold">{investment.priceDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-semibold">{investment.revenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Earnings</span>
                    <span className="font-semibold">{investment.dailyEarnings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Gain</span>
                    <span className="font-semibold">{investment.totalGain}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invest Button */}
            <Button 
              onClick={() => handleInvest(investment)}
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-white h-11 rounded-xl"
            >
              Invest Now
            </Button>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          <button
            onClick={() => setActiveNav("home")}
            className={`flex flex-col items-center gap-1 py-2 px-3 ${
              activeNav === "home" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>
          
          <button
            onClick={() => {
              setActiveNav("devices");
              navigate("/devices");
            }}
            className={`flex flex-col items-center gap-1 py-2 px-3 ${
              activeNav === "devices" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs">Devices</span>
          </button>

          {/* Center Action Button */}
          <button 
            onClick={() => window.location.reload()}
            className="w-14 h-14 -mt-8 bg-primary rounded-full flex items-center justify-center shadow-lg"
          >
            <RotateCcw className="w-7 h-7 text-white" />
          </button>

          <button
            onClick={() => {
              setActiveNav("team");
              navigate("/team");
            }}
            className={`flex flex-col items-center gap-1 py-2 px-3 ${
              activeNav === "team" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs">Team</span>
          </button>

          <button
            onClick={() => {
              setActiveNav("profile");
              navigate("/profile");
            }}
            className={`flex flex-col items-center gap-1 py-2 px-3 ${
              activeNav === "profile" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

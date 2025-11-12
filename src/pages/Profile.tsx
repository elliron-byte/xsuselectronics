import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Diamond, Wallet, Database, Shield, Home as HomeIcon, ShoppingCart, Users, User, Headphones } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<{ phone: string; uniqueCode: string; balance: number } | null>(null);
  const [totalRecharge, setTotalRecharge] = useState<number>(0);
  const [totalWithdraw, setTotalWithdraw] = useState<number>(0);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data } = await supabase
        .from('registered_users')
        .select('phone, unique_code, balance')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (data) {
        setUserData({
          phone: data.phone || '',
          uniqueCode: data.unique_code || '00000',
          balance: Number(data.balance) || 20
        });
      }

      // Fetch total recharge amount
      const { data: rechargeData } = await supabase
        .from('recharge_records')
        .select('amount')
        .eq('user_id', session.user.id);

      if (rechargeData) {
        const total = rechargeData.reduce((sum, record) => sum + Number(record.amount), 0);
        setTotalRecharge(total);
      }

      // Fetch total withdraw amount
      const { data: withdrawData } = await supabase
        .from('withdraw_records')
        .select('amount')
        .eq('user_id', session.user.id)
        .eq('status', 'successful');

      if (withdrawData) {
        const total = withdrawData.reduce((sum, record) => sum + Number(record.amount), 0);
        setTotalWithdraw(total);
      }
    };

    fetchUserData();
  }, [navigate]);

  const menuItems = [
    { icon: Diamond, label: "About Company", color: "text-primary", path: "/about" },
    { icon: Wallet, label: "Income Record", color: "text-primary", path: "/income-record" },
    { icon: Database, label: "Recharge Record", color: "text-primary", path: "/recharge-record" },
    { icon: Database, label: "Withdraw Record", color: "text-primary", path: "/withdraw-record" },
    { icon: Shield, label: "Bonus Code", color: "text-primary", path: "/bonus-code" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with green background */}
      <div className="bg-primary text-white px-4 pt-4 pb-6 rounded-b-3xl">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-2xl font-bold">X</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold">{userData?.uniqueCode || '00000'}</div>
            <div className="text-base opacity-90">{userData?.phone || '0000000000'}</div>
          </div>
        </div>

        {/* Account Balance Card */}
        <div className="bg-white rounded-2xl p-4 text-foreground">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Account Balance</div>
              <div className="text-3xl font-bold text-primary">GHS {userData?.balance || 20}</div>
            </div>
            <Button 
              onClick={() => navigate('/recharge')}
              className="bg-primary hover:bg-primary/90 text-white px-6 h-12 rounded-xl"
            >
              Recharge 🔔
            </Button>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="px-4 -mt-6 mb-6">
        <div className="bg-primary rounded-2xl p-6 text-white grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">GHS {userData?.balance || 20}</div>
            <div className="text-sm opacity-90">Balance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">GHS {totalRecharge}</div>
            <div className="text-sm opacity-90">Recharge</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">GHS {totalWithdraw}</div>
            <div className="text-sm opacity-90">Withdraw</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-4 pb-20">
        <div className="bg-white rounded-2xl overflow-hidden border border-border">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                  <span className="font-medium text-primary">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground"
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>
          
          <button
            onClick={() => navigate("/devices")}
            className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs">Devices</span>
          </button>

          {/* Center Action Button - Customer Service */}
          <button 
            onClick={() => navigate("/customer-service")}
            className="w-14 h-14 -mt-8 bg-primary rounded-full flex items-center justify-center shadow-lg"
          >
            <Headphones className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={() => navigate("/team")}
            className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs">Team</span>
          </button>

          <button
            className="flex flex-col items-center gap-1 py-2 px-3 text-primary"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

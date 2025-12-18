import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Copy, Home as HomeIcon, ShoppingCart, Users, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Team = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<{ uniqueCode: string; lv1Members: number } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data } = await supabase
        .from('registered_users')
        .select('unique_code')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        const { count } = await supabase
          .from('registered_users')
          .select('*', { count: 'exact', head: true })
          .eq('invitation_code', data.unique_code);

        setUserData({ 
          uniqueCode: data.unique_code || '00000',
          lv1Members: count || 0
        });
      }
    };

    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const teamLevels = [
    { level: "LV1", rebate: "30%", recharge: "GHS 0", members: userData?.lv1Members.toString() || "0", color: "bg-yellow-500" },
    { level: "LV2", rebate: "5%", recharge: "GHS 0", members: "0", color: "bg-gray-400" },
    { level: "LV3", rebate: "3%", recharge: "GHS 0", members: "0", color: "bg-orange-400" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-200 via-orange-100 to-yellow-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-300 to-orange-200 px-4 py-4 flex items-center gap-3">
        <button 
          onClick={() => navigate("/dashboard")}
          className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">Team</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 pb-24 space-y-4">
        {/* Invite Banner */}
        <div className="bg-gradient-to-br from-orange-200 to-pink-200 rounded-3xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Invite friends to<br />win cash
            </h2>
            <div className="bg-yellow-300 rounded-full px-4 py-2 inline-block mt-2">
              <p className="text-sm font-semibold text-foreground">
                Multiple rewards waiting for you to claim
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 opacity-50">
            <div className="text-6xl">🎁</div>
          </div>
        </div>

        {/* Invite Rewards Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-6 border-2 border-yellow-200">
          <h3 className="text-xl font-bold text-foreground mb-2">Invite rewards</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Invest together, get rich together
          </p>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">GHS 0</div>
              <div className="text-sm text-muted-foreground">Commission</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">{userData?.uniqueCode || '00000'}</div>
              <div className="text-sm text-muted-foreground">Invite Code</div>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(userData?.uniqueCode || '');
                toast.success("Invite code copied!");
              }}
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center"
            >
              <Copy className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Invite Link */}
          <div className="bg-white rounded-xl p-3 mb-6 border border-yellow-200">
            <div className="text-sm text-muted-foreground mb-1">Invite Link</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-sm font-medium text-foreground truncate">
                {`https://xsuselectronics.vercel.app/?ref=${userData?.uniqueCode || '00000'}`}
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`https://xsuselectronics.vercel.app/?ref=${userData?.uniqueCode || ''}`);
                  toast.success("Invite link copied!");
                }}
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0"
              >
                <Copy className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Team Level Section */}
          <div>
            <h4 className="text-lg font-bold text-foreground mb-3">Team Level</h4>
            <div className="space-y-3">
              {teamLevels.map((level) => (
                <div 
                  key={level.level}
                  className="bg-white rounded-2xl p-4 border-2 border-yellow-200 flex items-center gap-4"
                >
                  <div className={`w-14 h-14 ${level.color} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">{level.level}</span>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Rebate</div>
                      <div className="text-base font-bold text-foreground">{level.rebate}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Recharge</div>
                      <div className="text-base font-bold text-foreground">{level.recharge}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Members</div>
                      <div className="text-base font-bold text-foreground">{level.members}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs">Devices</span>
          </button>

          {/* Center Action Button */}
          <button className="w-14 h-14 -mt-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <div className="w-7 h-7 bg-white rounded-full" />
          </button>

          <button
            className="flex flex-col items-center gap-1 py-2 px-3 text-primary"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs">Team</span>
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Team;

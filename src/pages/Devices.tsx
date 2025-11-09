import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Users, User, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Devices = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [deviceTimers, setDeviceTimers] = useState<Record<string, string>>({});
  const [processingDevices, setProcessingDevices] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUserDevices();
    checkCheckInStatus();
  }, []);

  useEffect(() => {
    if (!canCheckIn) {
      const interval = setInterval(() => {
        updateTimeRemaining();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [canCheckIn]);

  useEffect(() => {
    if (devices.length > 0) {
      const interval = setInterval(() => {
        updateDeviceTimers();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [devices]);

  const checkCheckInStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('registered_users')
      .select('last_checkin_at')
      .eq('user_id', session.user.id)
      .single();

    if (data?.last_checkin_at) {
      const lastCheckIn = new Date(data.last_checkin_at);
      const now = new Date();
      const hoursSinceCheckIn = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCheckIn < 24) {
        setCanCheckIn(false);
        updateTimeRemaining();
      }
    }
  };

  const updateTimeRemaining = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('registered_users')
      .select('last_checkin_at')
      .eq('user_id', session.user.id)
      .single();

    if (data?.last_checkin_at) {
      const lastCheckIn = new Date(data.last_checkin_at);
      const nextCheckIn = new Date(lastCheckIn.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      const diff = nextCheckIn.getTime() - now.getTime();

      if (diff <= 0) {
        setCanCheckIn(true);
        setTimeRemaining("");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    }
  };

  const handleCheckIn = async () => {
    if (!canCheckIn) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data: userData } = await supabase
        .from('registered_users')
        .select('balance')
        .eq('user_id', session.user.id)
        .single();

      const currentBalance = Number(userData?.balance) || 0;
      const newBalance = currentBalance + 1;

      const { error } = await supabase
        .from('registered_users')
        .update({ 
          balance: newBalance,
          last_checkin_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast({
        title: "Daily check in successful",
        description: "Come back tomorrow",
      });

      setCanCheckIn(false);
      updateTimeRemaining();
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Check-in failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const updateDeviceTimers = async () => {
    const newTimers: Record<string, string> = {};
    const now = new Date().getTime();

    for (const device of devices) {
      const lastPayout = new Date(device.last_payout_at).getTime();
      const nextPayout = lastPayout + 24 * 60 * 60 * 1000;
      const diff = nextPayout - now;

      if (diff <= 0 && !processingDevices.has(device.id)) {
        // Timer expired, credit the daily income only once
        setProcessingDevices(prev => new Set(prev).add(device.id));
        await creditDailyIncome(device);
        newTimers[device.id] = "Crediting...";
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        newTimers[device.id] = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
    }

    setDeviceTimers(newTimers);
  };

  const creditDailyIncome = async (device: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get current balance
      const { data: userData } = await supabase
        .from('registered_users')
        .select('balance')
        .eq('user_id', session.user.id)
        .single();

      const currentBalance = Number(userData?.balance) || 0;
      const dailyIncome = parseFloat(device.daily_income.replace(/[^\d.-]/g, ''));
      const newBalance = currentBalance + dailyIncome;

      // Update balance
      await supabase
        .from('registered_users')
        .update({ balance: newBalance })
        .eq('user_id', session.user.id);

      // Update last payout time
      await supabase
        .from('user_devices')
        .update({ last_payout_at: new Date().toISOString() })
        .eq('id', device.id);

      // Log income record
      await supabase
        .from('income_records')
        .insert({
          user_id: session.user.id,
          device_id: device.id,
          device_name: device.device_name,
          amount: dailyIncome
        });

      toast({
        title: "Daily income credited",
        description: `${device.daily_income} added to your account`,
      });

      // Refresh devices and remove from processing set
      await fetchUserDevices();
      setProcessingDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(device.id);
        return newSet;
      });
    } catch (error) {
      console.error('Error crediting daily income:', error);
      setProcessingDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(device.id);
        return newSet;
      });
    }
  };

  const fetchUserDevices = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', session.user.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <h1 className="text-2xl font-bold">My Devices</h1>
      </div>

      {/* Daily Check In */}
      <div className="p-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">Daily Check In</h3>
                  <p className="text-sm text-muted-foreground">
                    {canCheckIn ? "Check in daily to earn rewards" : `Next check-in: ${timeRemaining}`}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleCheckIn}
                disabled={!canCheckIn}
                className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices List */}
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Purchased Devices</h2>
        
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading devices...</p>
        ) : devices.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="p-8">
              <p className="text-center text-muted-foreground">No devices have been bought</p>
            </CardContent>
          </Card>
        ) : (
          devices.map((device) => (
            <Card key={device.id} className="bg-card">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg text-foreground">{device.device_name}</h3>
                    <div className="bg-primary/10 px-3 py-1 rounded-lg">
                      <p className="text-sm font-mono font-semibold text-primary">
                        {deviceTimers[device.id] || "00:00:00"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Product Price</p>
                      <p className="font-semibold text-foreground">{device.product_price}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Daily Income</p>
                      <p className="font-semibold text-foreground">{device.daily_income}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Income</p>
                      <p className="font-semibold text-foreground">{device.total_income}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Purchased On</p>
                      <p className="font-semibold text-foreground">
                        {new Date(device.purchased_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          
          <button
            onClick={() => navigate("/devices")}
            className="flex flex-col items-center gap-1 text-primary"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Devices</span>
          </button>
          
          <button
            onClick={() => navigate("/team")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Team</span>
          </button>
          
          <button
            onClick={() => navigate("/profile")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Devices;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const RechargeRecord = () => {
  const navigate = useNavigate();
  const [rechargeRecords, setRechargeRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchRechargeRecords();
  }, []);

  const fetchRechargeRecords = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('recharge_records')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setRechargeRecords(data);
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
          <h1 className="text-xl font-bold">Recharge Record</h1>
        </div>
      </div>

      {/* Recharge Records */}
      <div className="p-4 space-y-3">
        {rechargeRecords.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No recharge records yet
            </CardContent>
          </Card>
        ) : (
          rechargeRecords.map((record) => (
            <Card key={record.id} className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-primary text-lg">
                      GHS {Number(record.amount).toFixed(2)} Recharged Successfully
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Previous Balance: GHS {Number(record.previous_balance).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      New Balance: GHS {Number(record.new_balance).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {format(new Date(record.created_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RechargeRecord;

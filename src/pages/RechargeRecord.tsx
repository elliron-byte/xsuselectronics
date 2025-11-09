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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('recharge_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setRechargeRecords(data || []);
    } catch (error) {
      console.error('Error fetching recharge records:', error);
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
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-lg font-bold text-primary">GHS {Number(record.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      record.status === 'successful' ? 'bg-green-100 text-green-800' :
                      record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status || 'pending'}
                    </span>
                  </div>
                  {record.transaction_id && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Transaction ID</span>
                      <span className="text-xs font-mono">{record.transaction_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Previous Balance</span>
                    <span>GHS {Number(record.previous_balance).toFixed(2)}</span>
                  </div>
                  {record.status === 'successful' && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">New Balance</span>
                      <span>GHS {Number(record.new_balance).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Date</span>
                    <span>{format(new Date(record.created_at), 'MMM dd, yyyy HH:mm')}</span>
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

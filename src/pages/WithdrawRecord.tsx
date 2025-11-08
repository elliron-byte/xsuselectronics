import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const WithdrawRecord = () => {
  const navigate = useNavigate();
  const [withdrawRecords, setWithdrawRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchWithdrawRecords();
  }, []);

  const fetchWithdrawRecords = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('withdraw_records')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setWithdrawRecords(data);
    }
  };

  const successfulWithdrawals = withdrawRecords.filter(r => r.status === 'successful');
  const pendingWithdrawals = withdrawRecords.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Withdraw Record</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Successful Withdrawals */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-foreground">Successful Withdrawals</h2>
          <div className="space-y-3">
            {successfulWithdrawals.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No successful withdrawals yet
                </CardContent>
              </Card>
            ) : (
              successfulWithdrawals.map((record) => (
                <Card key={record.id} className="border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">
                          GHS {Number(record.amount).toFixed(2)}
                        </div>
                        <div className="text-sm text-green-600">Successful</div>
                        <div className="text-xs text-muted-foreground mt-1">
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

        {/* Pending Withdrawals */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-foreground">Pending Withdrawals</h2>
          <div className="space-y-3">
            {pendingWithdrawals.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No pending withdrawals
                </CardContent>
              </Card>
            ) : (
              pendingWithdrawals.map((record) => (
                <Card key={record.id} className="border-orange-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-orange-500 mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">
                          GHS {Number(record.amount).toFixed(2)}
                        </div>
                        <div className="text-sm text-orange-600">Pending</div>
                        <div className="text-xs text-muted-foreground mt-1">
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
      </div>
    </div>
  );
};

export default WithdrawRecord;

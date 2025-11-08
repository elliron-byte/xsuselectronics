import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const IncomeRecord = () => {
  const navigate = useNavigate();
  const [incomeRecords, setIncomeRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchIncomeRecords();
  }, []);

  const fetchIncomeRecords = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('income_records')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setIncomeRecords(data);
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
          <h1 className="text-xl font-bold">Income Record</h1>
        </div>
      </div>

      {/* Income Records */}
      <div className="p-4 space-y-3">
        {incomeRecords.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No income records yet
            </CardContent>
          </Card>
        ) : (
          incomeRecords.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-foreground">{record.device_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(record.created_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                  <div className="text-primary font-bold text-lg">
                    +GHS {Number(record.amount).toFixed(2)}
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

export default IncomeRecord;

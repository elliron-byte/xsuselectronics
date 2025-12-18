import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AboutCompany = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from('about_content')
        .select('content')
        .limit(1)
        .single();

      if (data) {
        setContent(data.content);
      }
      setLoading(false);
    };

    fetchContent();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-4 flex items-center gap-3">
        <button 
          onClick={() => navigate("/profile")}
          className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold">About Company</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <div className="bg-white rounded-2xl p-6 border border-border">
          {loading ? (
            <p className="text-muted-foreground text-center">Loading...</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {content || "No content available."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutCompany;
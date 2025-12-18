import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminAboutContent = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contentId, setContentId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
    fetchContent();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      toast.error("Access denied. Admin privileges required.");
      navigate('/dashboard');
      return;
    }
  };

  const fetchContent = async () => {
    const { data } = await supabase
      .from('about_content')
      .select('id, content')
      .limit(1)
      .single();

    if (data) {
      setContent(data.content);
      setContentId(data.id);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (contentId) {
        const { error } = await supabase
          .from('about_content')
          .update({ 
            content, 
            updated_at: new Date().toISOString(),
            updated_by: session.user.id 
          })
          .eq('id', contentId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('about_content')
          .insert({ 
            content,
            updated_by: session.user.id 
          });

        if (error) throw error;
      }

      toast.success("About content saved successfully!");
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-4 flex items-center gap-3">
        <button 
          onClick={() => navigate("/admin")}
          className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold">Edit About Company</h1>
      </div>

      {/* Content */}
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>About Company Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground text-center">Loading...</p>
            ) : (
              <>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter information about your company..."
                  className="min-h-[300px] resize-y"
                />
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAboutContent;
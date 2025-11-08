import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Smartphone, Key } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    const validPrefixes = ['025', '024', '055', '054', '027', '026'];
    const hasValidPrefix = validPrefixes.some(prefix => formData.phone.startsWith(prefix));
    
    if (!hasValidPrefix) {
      toast.error("Invalid number");
      return;
    }

    // Check if phone number exists in database
    const { data: existingUser, error } = await supabase
      .from('registered_users')
      .select('*')
      .eq('phone', formData.phone)
      .single();

    if (error || !existingUser) {
      toast.error("Account not found. Please sign up first.");
      setTimeout(() => navigate("/"), 1500);
      return;
    }

    // Verify password matches
    if (existingUser.password !== formData.password) {
      toast.error("Incorrect password");
      return;
    }

    // Store phone in localStorage for session
    localStorage.setItem('userPhone', formData.phone);

    toast.success("Login successful!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />
        
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Phone Number</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-10 bg-input border-0 h-12"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10 pr-10 bg-input border-0 h-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base mt-6"
          >
            LOGIN
          </Button>

          {/* Register Link */}
          <div className="text-center pt-4">
            <Link to="/" className="text-primary text-sm hover:underline">
              Don't have account,register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

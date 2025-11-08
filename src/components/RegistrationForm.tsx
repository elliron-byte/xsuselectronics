import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Smartphone, Key } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const generateCaptcha = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const [formData, setFormData] = useState({
    phone: "",
    captcha: "",
    password: "",
    invitationCode: "",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCaptchaCode(generateCaptcha());
    }, 45000); // Change every 45 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      toast.error("Please agree to the User Agreement");
      return;
    }

    if (!formData.phone || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.phone.length !== 10 || !/^\d+$/.test(formData.phone)) {
      toast.error("Invalid number");
      return;
    }

    const validPrefixes = ['025', '024', '055', '054', '027', '026'];
    const hasValidPrefix = validPrefixes.some(prefix => formData.phone.startsWith(prefix));
    
    if (!hasValidPrefix) {
      toast.error("Invalid number");
      return;
    }

    if (formData.captcha !== captchaCode) {
      toast.error("Invalid captcha code");
      return;
    }

    // Check if phone number already exists
    const { data: existingUser } = await supabase
      .from('registered_users')
      .select('phone')
      .eq('phone', formData.phone)
      .single();

    if (existingUser) {
      toast.error("Account already exists. Please sign in.");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    // Generate unique code
    const { data: codeData } = await supabase.rpc('generate_unique_code');
    
    // Register new user
    const { error } = await supabase
      .from('registered_users')
      .insert([
        {
          phone: formData.phone,
          password: formData.password,
          invitation_code: formData.invitationCode || null,
          unique_code: codeData,
        }
      ]);

    if (error) {
      toast.error("Registration failed. Please try again.");
      return;
    }

    // Store phone in localStorage for session
    localStorage.setItem('userPhone', formData.phone);

    toast.success("Registration successful!");
    navigate("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      {/* Phone Number */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Phone Number</label>
        <div className="relative">
          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="tel"
            placeholder="Enter Your Mobile Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="pl-10 bg-input border-0 h-12"
          />
        </div>
      </div>

      {/* Captcha */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Captcha</label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter the Captcha"
            value={formData.captcha}
            onChange={(e) => setFormData({ ...formData, captcha: e.target.value })}
            className="bg-input border-0 h-12 flex-1"
          />
          <div className="bg-muted px-6 flex items-center justify-center rounded-md min-w-[100px]">
            <span className="text-foreground font-semibold text-lg">{captchaCode}</span>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter Your Password"
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

      {/* Invitation Code */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">invitation Code</label>
        <Input
          type="text"
          placeholder="Enter Your Referral Code"
          value={formData.invitationCode}
          onChange={(e) => setFormData({ ...formData, invitationCode: e.target.value })}
          className="bg-input border-0 h-12"
        />
      </div>

      {/* Agreement Checkbox */}
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="agreement"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked as boolean)}
        />
        <label
          htmlFor="agreement"
          className="text-sm text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I agree to the{" "}
          <a href="#" className="text-primary hover:underline">
            User Agreement
          </a>
          .
        </label>
      </div>

      {/* Register Button */}
      <Button
        type="submit"
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base mt-6"
      >
        REGISTER
      </Button>

      {/* Login Link */}
      <div className="text-center pt-4">
        <a href="/login" className="text-primary text-sm hover:underline">
          Already have an account? Sign in
        </a>
      </div>
    </form>
  );
};

export default RegistrationForm;

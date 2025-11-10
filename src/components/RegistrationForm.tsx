import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Smartphone, Key, RefreshCw, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { registrationSchema } from "@/lib/validationSchemas";
import { z } from "zod";

const generateCaptcha = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const [phonePrefix, setPhonePrefix] = useState("20");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
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

    // Validate with zod
    try {
      registrationSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          toast.error(err.message);
        });
        return;
      }
    }

    if (!agreed) {
      toast.error("Please agree to the terms");
      return;
    }

    if (formData.captcha !== captchaCode) {
      toast.error("Invalid verification code");
      setCaptchaCode(generateCaptcha());
      return;
    }

    try {
      const fullPhone = `0${phonePrefix}${phoneNumber}`;
      
      // Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            phone: fullPhone,
            invitation_code: formData.invitationCode || null
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      if (authData.user) {
        toast.success("Registration successful! Please check your email to verify your account.");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      {/* Phone Number */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Phone Number</label>
        <div className="flex items-center gap-1">
          <div className="flex h-12 items-center justify-center px-3 bg-input rounded-l-md">
            <span className="text-sm font-medium">0</span>
          </div>
          <Select value={phonePrefix} onValueChange={setPhonePrefix}>
            <SelectTrigger className="w-24 rounded-none h-12 bg-input border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="26">26</SelectItem>
              <SelectItem value="27">27</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="54">54</SelectItem>
              <SelectItem value="55">55</SelectItem>
              <SelectItem value="56">56</SelectItem>
              <SelectItem value="59">59</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="tel"
            placeholder="Enter 7 digits"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 7))}
            className="flex-1 rounded-l-none bg-input border-0 h-12"
            maxLength={7}
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="pl-10 bg-input border-0 h-12"
          />
        </div>
      </div>

      {/* Captcha */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Verification Code</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Enter code"
              value={formData.captcha}
              onChange={(e) => setFormData({ ...formData, captcha: e.target.value })}
              className="bg-input border-0 h-12"
            />
          </div>
          <div className="flex items-center gap-2 bg-input px-4 rounded-lg">
            <span className="text-lg font-bold tracking-wider">{captchaCode}</span>
            <button
              type="button"
              onClick={() => setCaptchaCode(generateCaptcha())}
              className="text-primary hover:text-primary/80"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
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

      {/* Agreement */}
      <div className="flex items-start gap-2 pt-2">
        <Checkbox
          id="terms"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked as boolean)}
        />
        <label
          htmlFor="terms"
          className="text-sm text-muted-foreground leading-tight cursor-pointer"
        >
          I have read and agree to the terms of service
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
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="text-primary text-sm hover:underline"
        >
          Already have an account? Login
        </button>
      </div>
    </form>
  );
};

export default RegistrationForm;

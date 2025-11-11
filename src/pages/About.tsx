import { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const About = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => navigate('/profile'), 300);
  };

  const handleTelegramClick = () => {
    navigate('/customer-service');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 text-white px-6 py-8 rounded-t-3xl">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-bold text-center tracking-wide">Notification</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4 text-foreground">
            <p className="text-lg font-semibold">
              Welcome to Xsus Electronics Investment Platform! Special notes:
            </p>

            <ol className="space-y-3 list-decimal list-inside text-base">
              <li>Registration Bonus: <span className="font-semibold">20 GHS</span></li>
              
              <li>Referral Commission: <span className="font-semibold">32% - 1% - 1%</span></li>
              
              <li>
                Minimum Deposit: <span className="font-semibold">40 GHS</span>, 
                Minimum Withdrawal: <span className="font-semibold">20 GHS</span>
              </li>
              
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0">🎁🎁</span>
                <span>After the product countdown ends, your investment funds will be automatically refunded to your wallet!</span>
              </li>
              
              <li>
                Withdrawal fee: <span className="font-semibold">15%</span> (Used for government fees and product maintenance)
              </li>
              
              <li>Join our official Telegram group to learn more about making money.</li>
            </ol>
          </div>

          {/* Telegram Button */}
          <Button
            onClick={handleTelegramClick}
            className="w-full mt-6 h-14 text-lg font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-2xl shadow-lg"
          >
            Join Telegram groups
          </Button>
        </div>
      </div>
    </div>
  );
};

export default About;

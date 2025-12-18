import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import customerServiceHero from "@/assets/customer-service-hero.png";
import telegramIcon from "@/assets/telegram-icon.png";

const CustomerService = () => {
  const navigate = useNavigate();

  const handleTelegram = () => {
    window.open('https://t.me/Xsus_Electronics', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Customer Service</h1>
      </div>

      {/* Hero Image */}
      <div className="w-full h-48 overflow-hidden">
        <img 
          src={customerServiceHero} 
          alt="Customer Service" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {/* Telegram Customer Service Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src={telegramIcon} alt="Telegram" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-bold mb-2">Telegram</h2>
          <p className="text-muted-foreground mb-4">Customer Service</p>
          
          <div className="bg-accent rounded-xl p-4 mb-4">
            <div className="text-3xl font-bold text-foreground mb-2">9:00-18:00</div>
            <div className="text-sm text-muted-foreground">Pickup hours: 24 hours</div>
            <div className="text-sm text-muted-foreground">Customer service hours: 9 a.m. - 18 p.m.</div>
          </div>
        </div>

        {/* Telegram Button */}
        <button
          onClick={handleTelegram}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-border flex items-center justify-between hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
              <img src={telegramIcon} alt="Telegram" className="w-full h-full object-cover" />
            </div>
            <span className="text-base font-medium">Telegram</span>
          </div>
          <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default CustomerService;

import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import customerServiceHero from "@/assets/customer-service-hero.png";

const CustomerService = () => {
  const navigate = useNavigate();

  const handleTelegramChannel = () => {
    window.open('https://t.me/+mP4vPu1xRT41YjA0', '_blank');
  };

  const handleTelegramGroup = () => {
    window.open('https://t.me/+SAm5glQ9ez1iNjE0', '_blank');
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
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.326.016.094.036.308.02.475z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Telegram</h2>
          <p className="text-muted-foreground mb-4">Customer Service</p>
          
          <div className="bg-accent rounded-xl p-4 mb-4">
            <div className="text-3xl font-bold text-foreground mb-2">9:00-18:00</div>
            <div className="text-sm text-muted-foreground">Pickup hours: 24 hours</div>
            <div className="text-sm text-muted-foreground">Customer service hours: 9 a.m. - 18 p.m.</div>
          </div>
        </div>

        {/* Telegram Channel Button */}
        <button
          onClick={handleTelegramChannel}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-border flex items-center justify-between hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.326.016.094.036.308.02.475z"/>
              </svg>
            </div>
            <span className="text-base font-medium">Telegram Channel</span>
          </div>
          <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
        </button>

        {/* Telegram Group Button */}
        <button
          onClick={handleTelegramGroup}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-border flex items-center justify-between hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.326.016.094.036.308.02.475z"/>
              </svg>
            </div>
            <span className="text-base font-medium">Telegram Group</span>
          </div>
          <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default CustomerService;

import Logo from "@/components/Logo";
import RegistrationForm from "@/components/RegistrationForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />
        <RegistrationForm />
      </div>
    </div>
  );
};

export default Index;

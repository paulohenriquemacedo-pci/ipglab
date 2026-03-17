import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import ProfileFormSteps from "@/components/ProfileFormSteps";

const Onboarding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center mb-8"><Logo /></div>
        <ProfileFormSteps onComplete={() => navigate("/dashboard")} />
        <footer className="mt-8 text-center text-sm text-muted-foreground font-sans">
          <a href="mailto:contato@institutopedragoiana.com.br" className="hover:text-foreground transition-colors">
            contato@institutopedragoiana.com.br
          </a>
        </footer>
      </div>
    </div>
  );
};

export default Onboarding;

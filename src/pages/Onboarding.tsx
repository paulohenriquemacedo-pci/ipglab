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
      </div>
    </div>
  );
};

export default Onboarding;

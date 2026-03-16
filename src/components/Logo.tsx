import logoIpg from "@/assets/logo-ipg.jpeg";

const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizes = { sm: "h-8", md: "h-10", lg: "h-16" };
  return (
    <div className="flex items-center gap-2">
      <img src={logoIpg} alt="Instituto Pedra Goiana" className={`${sizes[size]} w-auto object-contain`} />
      <span className={`font-semibold tracking-tight ${size === "lg" ? "text-xl" : size === "md" ? "text-lg" : "text-base"}`}>
        IPG-Lab
      </span>
    </div>
  );
};

export default Logo;

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Bot, CheckCircle, Download } from "lucide-react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";
import logoIpg from "@/assets/logo-ipg.jpeg";

const features = [
  { icon: FileText, title: "Análise de Editais", desc: "Upload do PDF do edital e extração automática de critérios, requisitos e prazos." },
  { icon: Bot, title: "Assistente IA Especializado", desc: "Chat guiado em 7 etapas para elaborar seu projeto com linguagem técnica precisa." },
  { icon: CheckCircle, title: "Verificação de Conformidade", desc: "Score de alinhamento entre seu projeto e os critérios do edital." },
  { icon: Download, title: "Exportação Profissional", desc: "Exporte em Word, PDF e planilha orçamentária formatados por edital." },
];

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/"><Logo size="sm" /></Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/login">Entrar</Link></Button>
            <Button asChild><Link to="/signup">Começar Grátis</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-4xl mx-auto px-6 py-24 md:py-32 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src={logoIpg} alt="Instituto Pedra Goiana" className="h-28 w-auto mx-auto mb-8 object-contain" />
            <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              Plataforma de Projetos Culturais com IA
            </div>
            <h1 className="text-4xl md:text-6xl tracking-tight leading-[1.1] mb-6">
              Elabore projetos culturais <span className="text-primary italic">com inteligência</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
              Transforme sua ideia artística em um projeto técnico robusto, conforme aos editais de fomento — 
              sem precisar de consultoria especializada.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-base px-8" asChild>
                <Link to="/signup">
                  Criar Meu Projeto <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-base px-8" asChild>
                <Link to="/login">Já tenho conta</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl mb-4">Como funciona</h2>
            <p className="text-muted-foreground text-lg font-sans max-w-xl mx-auto">
              Do edital ao projeto finalizado em poucas horas, com apoio de IA especializada no ecossistema cultural brasileiro.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold font-sans mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre o IPG */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-[280px_1fr] gap-10 items-start">
            <div className="flex flex-col items-center md:items-start">
              <img src={logoIpg} alt="Instituto Pedra Goiana" className="h-40 w-auto object-contain mb-4" />
              <p className="text-xs text-muted-foreground font-sans text-center md:text-left">
                Sede: Cidade de Goiás — GO<br />
                Fundado em setembro de 2025
              </p>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl mb-4">Sobre o Instituto Pedra Goiana</h2>
              <p className="text-muted-foreground text-base font-sans leading-relaxed mb-4">
                O <strong className="text-foreground">Instituto Pedra Goiana (IPG)</strong> é uma associação cultural civil de direito privado, sem fins lucrativos, com sede na histórica Cidade de Goiás — Patrimônio Mundial da UNESCO. Constituído em setembro de 2025, o IPG nasce da união de cineastas, jornalistas, produtores culturais e artistas plásticos goianos comprometidos com o desenvolvimento cultural do estado.
              </p>
              <p className="text-muted-foreground text-base font-sans leading-relaxed mb-4">
                O instituto tem por finalidade promover, desenvolver, apoiar, preservar e difundir atividades culturais, educacionais e de memória, abrangendo:
              </p>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground font-sans mb-6">
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />Produção audiovisual e cinematográfica</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />Produção e difusão literária</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />Produção musical e fonográfica</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />Teatro, dança e artes cênicas</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />Artes visuais, exposições e instalações</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />Formação e pesquisa em cultura</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />Preservação da memória cultural goiana</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />Gastronomia regional como expressão cultural</li>
              </ul>
              <p className="text-muted-foreground text-base font-sans leading-relaxed">
                A plataforma <strong className="text-foreground">IPG-Lab</strong> é uma iniciativa do instituto para democratizar o acesso aos instrumentos de fomento cultural no Brasil, permitindo que artistas e produtores de todo o país — especialmente de municípios fora dos grandes centros — elaborem projetos tecnicamente robustos com apoio de inteligência artificial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl mb-4">Pronto para começar?</h2>
          <p className="text-muted-foreground text-lg mb-8 font-sans">
            Cadastre-se gratuitamente e elabore seu primeiro projeto cultural com apoio de inteligência artificial.
          </p>
          <Button size="lg" className="text-base px-8" asChild>
            <Link to="/signup">Começar Agora — É Grátis <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground font-sans">
          <div className="flex items-center gap-2">
            <img src={logoIpg} alt="IPG" className="h-6 w-auto object-contain" />
            <span>Instituto Pedra Goiana © 2026</span>
          </div>
          <span>IPG-Lab — Projetos Culturais com IA</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

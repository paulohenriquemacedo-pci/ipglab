import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const STATES = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const LANGUAGES = ["Teatro","Música","Artes Visuais","Literatura","Audiovisual","Patrimônio Imaterial","Circo","Dança","Multidisciplinar"];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    person_type: "", cnpj: "", artistic_language: "", state: "", city: "",
    experience_level: "", bio: "",
  });
  const [referenceText, setReferenceText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({
        ...form,
        onboarding_completed: true,
      }).eq("user_id", user.id);
      if (error) throw error;

      if (referenceText.trim().length > 0) {
        await supabase.from("reference_texts").insert({
          user_id: user.id,
          title: "Texto de referência inicial",
          content: referenceText,
          word_count: referenceText.split(/\s+/).length,
        });
      }

      toast.success("Perfil completo!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center mb-8">
          <Logo />
        </div>

        <Progress value={progress} className="mb-6 h-2" />
        <p className="text-sm text-muted-foreground text-center mb-6">Etapa {step + 1} de {totalSteps}</p>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {step === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Seu perfil</CardTitle>
                  <CardDescription>Informações básicas sobre você ou sua organização</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de pessoa</Label>
                    <Select value={form.person_type} onValueChange={v => update("person_type", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.person_type === "PJ" && (
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => update("cnpj", e.target.value)} />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select value={form.state} onValueChange={v => update("state", v)}>
                        <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input placeholder="Sua cidade" value={form.city} onChange={e => update("city", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Sua arte</CardTitle>
                  <CardDescription>Conte-nos sobre sua atuação artística</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Linguagem artística principal</Label>
                    <Select value={form.artistic_language} onValueChange={v => update("artistic_language", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Experiência com editais</Label>
                    <Select value={form.experience_level} onValueChange={v => update("experience_level", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhuma">Nenhuma — Primeiro projeto</SelectItem>
                        <SelectItem value="basica">Básica — Já submeti 1-3 projetos</SelectItem>
                        <SelectItem value="avancada">Avançada — Experiência regular com editais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mini-bio / descrição</Label>
                    <Textarea placeholder="Fale um pouco sobre você e sua trajetória artística..." value={form.bio} onChange={e => update("bio", e.target.value)} rows={4} />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Sua voz artística</CardTitle>
                  <CardDescription>Cole aqui textos de sua autoria (releases, bios, projetos anteriores) para que a IA preserve seu estilo. Mínimo 500 palavras recomendado.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Cole aqui seus textos de referência..."
                    value={referenceText}
                    onChange={e => setReferenceText(e.target.value)}
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {referenceText.split(/\s+/).filter(Boolean).length} palavras
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={loading}>
              {loading ? "Salvando..." : "Finalizar"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

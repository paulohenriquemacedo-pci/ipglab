import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
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
    person_type: "", cnpj: "", razao_social: "",
    artistic_language: "", state: "", city: "",
    experience_level: "", bio: "",
    cpf: "", rg: "", rg_orgao: "", data_nascimento: "",
    email_contato: "", telefone: "",
    endereco: "", numero: "", complemento: "", bairro: "", cep: "",
    banco: "", agencia: "", conta_bancaria: "",
    comunidade_tradicional: "", genero: "", raca_cor_etnia: "",
    lgbtqiapn: false, pcd: false, pcd_tipo: "",
  });
  const [referenceText, setReferenceText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 6;
  const progress = ((step + 1) / totalSteps) * 100;

  const update = (key: string, val: string | boolean) => setForm(prev => ({ ...prev, [key]: val }));

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { lgbtqiapn, pcd, data_nascimento, ...rest } = form;
      const { error } = await supabase.from("profiles").update({
        ...rest,
        lgbtqiapn,
        pcd,
        data_nascimento: data_nascimento || null,
        onboarding_completed: true,
      } as any).eq("user_id", user.id);
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

  const canAdvance = () => {
    if (step === 0) return form.person_type && form.state && form.city;
    if (step === 1) return form.cpf;
    return true;
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

            {/* Step 0: Tipo e Localização */}
            {step === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Seu perfil</CardTitle>
                  <CardDescription>Informações básicas sobre você ou sua organização</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de pessoa *</Label>
                    <Select value={form.person_type} onValueChange={v => update("person_type", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.person_type === "PJ" && (
                    <>
                      <div className="space-y-2">
                        <Label>Razão Social</Label>
                        <Input placeholder="Razão social" value={form.razao_social} onChange={e => update("razao_social", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>CNPJ</Label>
                        <Input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => update("cnpj", e.target.value)} />
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Estado *</Label>
                      <Select value={form.state} onValueChange={v => update("state", v)}>
                        <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cidade *</Label>
                      <Input placeholder="Sua cidade" value={form.city} onChange={e => update("city", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 1: Documentos Pessoais */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Documentos pessoais</CardTitle>
                  <CardDescription>Dados exigidos pelo Anexo II do edital</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>CPF *</Label>
                    <Input placeholder="000.000.000-00" value={form.cpf} onChange={e => update("cpf", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>RG</Label>
                      <Input placeholder="Nº do RG" value={form.rg} onChange={e => update("rg", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Órgão expedidor</Label>
                      <Input placeholder="SSP/GO" value={form.rg_orgao} onChange={e => update("rg_orgao", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de nascimento</Label>
                      <Input type="date" value={form.data_nascimento} onChange={e => update("data_nascimento", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input placeholder="(62) 99999-0000" value={form.telefone} onChange={e => update("telefone", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail de contato</Label>
                    <Input type="email" placeholder="contato@email.com" value={form.email_contato} onChange={e => update("email_contato", e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Endereço */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Endereço</CardTitle>
                  <CardDescription>Endereço completo para inscrição no edital</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Logradouro</Label>
                    <Input placeholder="Rua, Avenida..." value={form.endereco} onChange={e => update("endereco", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Número</Label>
                      <Input placeholder="Nº" value={form.numero} onChange={e => update("numero", e.target.value)} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Complemento</Label>
                      <Input placeholder="Apto, Sala..." value={form.complemento} onChange={e => update("complemento", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bairro</Label>
                      <Input placeholder="Bairro" value={form.bairro} onChange={e => update("bairro", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>CEP</Label>
                      <Input placeholder="00000-000" value={form.cep} onChange={e => update("cep", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Dados Bancários e Autodeclarações */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Dados bancários e autodeclarações</CardTitle>
                  <CardDescription>Informações para pagamento e políticas afirmativas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Banco</Label>
                      <Input placeholder="Banco" value={form.banco} onChange={e => update("banco", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Agência</Label>
                      <Input placeholder="0000" value={form.agencia} onChange={e => update("agencia", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Conta</Label>
                      <Input placeholder="00000-0" value={form.conta_bancaria} onChange={e => update("conta_bancaria", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Gênero</Label>
                      <Select value={form.genero} onValueChange={v => update("genero", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                          <SelectItem value="nao_binario">Não-binário</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                          <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Raça/Cor/Etnia</Label>
                      <Select value={form.raca_cor_etnia} onValueChange={v => update("raca_cor_etnia", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="branca">Branca</SelectItem>
                          <SelectItem value="preta">Preta</SelectItem>
                          <SelectItem value="parda">Parda</SelectItem>
                          <SelectItem value="amarela">Amarela</SelectItem>
                          <SelectItem value="indigena">Indígena</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Comunidade tradicional (se aplicável)</Label>
                    <Input placeholder="Ex: Quilombola, Kalunga..." value={form.comunidade_tradicional} onChange={e => update("comunidade_tradicional", e.target.value)} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox checked={form.lgbtqiapn} onCheckedChange={v => update("lgbtqiapn", !!v)} id="lgbtqiapn" />
                    <Label htmlFor="lgbtqiapn" className="cursor-pointer">Pessoa LGBTQIAPN+</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox checked={form.pcd} onCheckedChange={v => update("pcd", !!v)} id="pcd" />
                    <Label htmlFor="pcd" className="cursor-pointer">Pessoa com deficiência (PcD)</Label>
                  </div>
                  {form.pcd && (
                    <div className="space-y-2">
                      <Label>Tipo de deficiência</Label>
                      <Input placeholder="Descreva o tipo" value={form.pcd_tipo} onChange={e => update("pcd_tipo", e.target.value)} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 4: Arte */}
            {step === 4 && (
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

            {/* Step 5: Texto de referência */}
            {step === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Sua voz artística</CardTitle>
                  <CardDescription>Cole aqui textos de sua autoria para que a IA preserve seu estilo. Mínimo 500 palavras recomendado.</CardDescription>
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
            <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
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

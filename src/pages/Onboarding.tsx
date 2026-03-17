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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const STATES = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const COMUNIDADES = [
  "Não pertenço a comunidade tradicional",
  "Povos Ciganos", "Comunidades Extrativistas", "Pescadores(as) Artesanais",
  "Comunidades Ribeirinhas", "Povos de Terreiro", "Comunidades Rurais",
  "Quilombolas", "Área periférica", "Indígenas",
];

const GENEROS = [
  "Mulher cisgênero", "Homem cisgênero", "Homem Transgênero",
  "Mulher Transgênero", "Pessoa não binária", "Não informar",
];

const LGBTQIAPN_OPCOES = [
  "Lésbica", "Gay", "Bissexual", "Transexual", "Queer",
  "Intersexo", "Assexual", "Pansexual", "Não binário",
  "+ outras identidades", "Não se aplica",
];

const RACAS = ["Branca", "Preta", "Parda", "Indígena", "Amarela"];

const PCD_TIPOS = ["Auditiva", "Física", "Intelectual", "Visual", "Múltipla"];

const FUNCOES = [
  "Artista, Artesão(a), Brincante, Criador(a) e afins",
  "Instrutor(a), oficineiro(a), educador(a) artístico(a)-cultural e afins",
  "Curador(a), Programador(a) e afins",
  "Produtor(a)", "Técnico(a)",
  "Consultor(a), Pesquisador(a) e afins",
  "Festeiro",
];

const PUBLICO_ALVO = [
  "Pessoas vítimas de violência", "Pessoas em situação de pobreza",
  "Pessoas em situação de rua", "Pessoas em restrição/privação de liberdade",
  "Pessoas com deficiência", "Pessoas em sofrimento físico e/ou psíquico",
  "Mulheres", "LGBTQIAPN+", "Povos e comunidades tradicionais",
  "Negros e/ou negras", "Ciganos", "Indígenas",
  "Não é voltada especificamente para um perfil", "Área periférica",
];

const ACESS_ARQ = [
  "Rotas acessíveis com espaço de manobra para cadeira de rodas",
  "Piso tátil", "Rampas", "Elevadores adequados para PcD",
  "Corrimãos e guarda-corpos", "Banheiros adaptados para PcD",
  "Vagas de estacionamento para PcD", "Assentos para pessoas obesas",
  "Iluminação adequada",
];

const ACESS_COM = [
  "Língua Brasileira de Sinais - Libras", "Sistema Braille",
  "Sinalização ou comunicação tátil", "Audiodescrição",
  "Legendas", "Linguagem simples", "Textos adaptados para leitores de tela",
];

const ACESS_ATI = [
  "Capacitação de equipes atuantes nos projetos culturais",
  "Contratação de profissionais com deficiência e especializados em acessibilidade",
  "Formação e sensibilização de agentes culturais e envolvidos",
  "Outras medidas de eliminação de atitudes capacitistas",
];

interface Membro { nome: string; cpf: string; }

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    person_type: "", full_name: "", nome_social: "",
    cpf: "", rg: "", rg_orgao: "", data_nascimento: "",
    email_contato: "", telefone: "",
    endereco: "", numero: "", complemento: "", bairro: "", cep: "",
    city: "", state: "",
    banco: "", agencia: "", conta_bancaria: "",
    categoria_inscricao: "",
    concorre_cotas: false, cota_tipo: "",
    comunidade_tradicional: "", comunidade_tradicional_outro: "",
    genero: "",
    lgbtqiapn_tipo: "",
    raca_cor_etnia: "",
    pcd: false, pcd_tipo: "",
    funcao_profissao: "", funcao_profissao_outro: "",
    bio: "",
    representa_coletivo: false,
    nome_grupo: "", ano_criacao_coletivo: "", qtd_pessoas_coletivo: "",
    perfil_publico: "",
    acao_cultural_publico: [] as string[],
    acessibilidade_arquitetonica: [] as string[],
    acessibilidade_comunicacional: [] as string[],
    acessibilidade_atitudinal: [] as string[],
    locais_execucao: "",
    trajetoria_acoes: "", trajetoria_inicio: "",
    trajetoria_impacto: "", trajetoria_outras_areas: "",
    // PJ fields
    razao_social: "", nome_fantasia: "", cnpj: "",
    num_representantes_legais: "",
    // Anexo VII
    tempo_residencia_municipio: "",
    testemunha_nome: "", testemunha_cpf: "", testemunha_rg: "",
    testemunha_telefone: "", testemunha_endereco: "",
    // Group
    funcao_no_grupo: "",
    experience_level: "", artistic_language: "",
  });
  const [membros, setMembros] = useState<Membro[]>([{ nome: "", cpf: "" }]);
  const [referenceText, setReferenceText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 9;
  const progress = ((step + 1) / totalSteps) * 100;

  const update = (key: string, val: string | boolean | string[]) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleArray = (key: string, value: string) => {
    const arr = (form as any)[key] as string[];
    if (arr.includes(value)) update(key, arr.filter(v => v !== value));
    else update(key, [...arr, value]);
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const comunidade = form.comunidade_tradicional === "Outro"
        ? form.comunidade_tradicional_outro
        : form.comunidade_tradicional;
      const funcao = form.funcao_profissao === "Outro"
        ? form.funcao_profissao_outro
        : form.funcao_profissao;

      const profileData: Record<string, any> = {
        full_name: form.full_name,
        nome_social: form.nome_social || null,
        person_type: form.person_type,
        cpf: form.cpf, rg: form.rg, rg_orgao: form.rg_orgao,
        data_nascimento: form.data_nascimento || null,
        email_contato: form.email_contato, telefone: form.telefone,
        endereco: form.endereco, numero: form.numero,
        complemento: form.complemento || null,
        bairro: form.bairro, cep: form.cep,
        city: form.city, state: form.state,
        banco: form.banco, agencia: form.agencia, conta_bancaria: form.conta_bancaria,
        categoria_inscricao: form.categoria_inscricao,
        concorre_cotas: form.concorre_cotas,
        cota_tipo: form.concorre_cotas ? form.cota_tipo : null,
        comunidade_tradicional: comunidade || null,
        genero: form.genero,
        lgbtqiapn: form.lgbtqiapn_tipo !== "Não se aplica" && form.lgbtqiapn_tipo !== "",
        lgbtqiapn_tipo: form.lgbtqiapn_tipo || null,
        raca_cor_etnia: form.raca_cor_etnia,
        pcd: form.pcd, pcd_tipo: form.pcd ? form.pcd_tipo : null,
        funcao_profissao: funcao,
        bio: form.bio,
        representa_coletivo: form.representa_coletivo,
        nome_grupo: form.representa_coletivo ? form.nome_grupo : null,
        funcao_no_grupo: form.representa_coletivo ? form.funcao_no_grupo : null,
        ano_criacao_coletivo: form.representa_coletivo ? form.ano_criacao_coletivo : null,
        qtd_pessoas_coletivo: form.representa_coletivo ? form.qtd_pessoas_coletivo : null,
        perfil_publico: form.perfil_publico || null,
        acao_cultural_publico: form.acao_cultural_publico.length > 0 ? form.acao_cultural_publico : null,
        acessibilidade_arquitetonica: form.acessibilidade_arquitetonica.length > 0 ? form.acessibilidade_arquitetonica : null,
        acessibilidade_comunicacional: form.acessibilidade_comunicacional.length > 0 ? form.acessibilidade_comunicacional : null,
        acessibilidade_atitudinal: form.acessibilidade_atitudinal.length > 0 ? form.acessibilidade_atitudinal : null,
        locais_execucao: form.locais_execucao || null,
        membros_coletivo: form.representa_coletivo ? membros.filter(m => m.nome) : null,
        trajetoria_acoes: form.trajetoria_acoes || null,
        trajetoria_inicio: form.trajetoria_inicio || null,
        trajetoria_impacto: form.trajetoria_impacto || null,
        trajetoria_outras_areas: form.trajetoria_outras_areas || null,
        tempo_residencia_municipio: form.tempo_residencia_municipio || null,
        testemunha_nome: form.testemunha_nome || null,
        testemunha_cpf: form.testemunha_cpf || null,
        testemunha_rg: form.testemunha_rg || null,
        testemunha_telefone: form.testemunha_telefone || null,
        testemunha_endereco: form.testemunha_endereco || null,
        artistic_language: form.artistic_language || null,
        experience_level: form.experience_level || null,
        onboarding_completed: true,
      };

      if (form.person_type === "PJ") {
        profileData.razao_social = form.razao_social;
        profileData.nome_fantasia = form.nome_fantasia;
        profileData.cnpj = form.cnpj;
        profileData.num_representantes_legais = form.num_representantes_legais;
      }

      const { error } = await supabase.from("profiles").update(profileData as any).eq("user_id", user.id);
      if (error) throw error;

      if (referenceText.trim().length > 0) {
        await supabase.from("reference_texts").insert({
          user_id: user.id, title: "Texto de referência inicial",
          content: referenceText, word_count: referenceText.split(/\s+/).length,
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
    if (step === 0) return form.person_type && form.categoria_inscricao;
    if (step === 1) return form.full_name && form.cpf;
    return true;
  };

  const addMembro = () => setMembros(p => [...p, { nome: "", cpf: "" }]);
  const removeMembro = (i: number) => setMembros(p => p.filter((_, idx) => idx !== i));
  const updateMembro = (i: number, key: keyof Membro, val: string) => {
    setMembros(p => p.map((m, idx) => idx === i ? { ...m, [key]: val } : m));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center mb-8"><Logo /></div>
        <Progress value={progress} className="mb-6 h-2" />
        <p className="text-sm text-muted-foreground text-center mb-6">Etapa {step + 1} de {totalSteps}</p>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

            {/* Step 0: Tipo + Categoria + Cotas */}
            {step === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Informações do Agente Cultural</CardTitle>
                  <CardDescription>Dados iniciais conforme Anexo II do edital</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Você é pessoa física ou pessoa jurídica? *</Label>
                    <RadioGroup value={form.person_type} onValueChange={v => update("person_type", v)} className="flex gap-6">
                      <div className="flex items-center gap-2"><RadioGroupItem value="PF" id="pf" /><Label htmlFor="pf">Pessoa Física</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="PJ" id="pj" /><Label htmlFor="pj">Pessoa Jurídica</Label></div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria a que vai concorrer *</Label>
                    <RadioGroup value={form.categoria_inscricao} onValueChange={v => update("categoria_inscricao", v)}>
                      <div className="flex items-center gap-2"><RadioGroupItem value="grupos_coletivos" id="cat1" /><Label htmlFor="cat1">Grupos e coletivos culturais</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="festas_populares" id="cat2" /><Label htmlFor="cat2">Festas Populares</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="blocos_carnaval" id="cat3" /><Label htmlFor="cat3">Blocos de Carnaval</Label></div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={form.concorre_cotas} onCheckedChange={v => update("concorre_cotas", !!v)} id="cotas" />
                      <Label htmlFor="cotas" className="cursor-pointer">Vai concorrer às cotas?</Label>
                    </div>
                    {form.concorre_cotas && (
                      <RadioGroup value={form.cota_tipo} onValueChange={v => update("cota_tipo", v)} className="ml-6 space-y-1">
                        <div className="flex items-center gap-2"><RadioGroupItem value="negra" id="cota1" /><Label htmlFor="cota1">Pessoa negra</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="indigena" id="cota2" /><Label htmlFor="cota2">Pessoa indígena</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="pcd" id="cota3" /><Label htmlFor="cota3">Pessoa com deficiência</Label></div>
                      </RadioGroup>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 1: Dados Pessoais */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">
                    {form.person_type === "PJ" ? "Inscrição para Pessoa Jurídica" : "Inscrição para Pessoa Física"}
                  </CardTitle>
                  <CardDescription>Dados pessoais conforme formulário do edital</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.person_type === "PJ" && (
                    <>
                      <div className="space-y-2"><Label>Razão Social *</Label><Input value={form.razao_social} onChange={e => update("razao_social", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Nome Fantasia</Label><Input value={form.nome_fantasia} onChange={e => update("nome_fantasia", e.target.value)} /></div>
                      <div className="space-y-2"><Label>CNPJ *</Label><Input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => update("cnpj", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Nº de representantes legais</Label><Input value={form.num_representantes_legais} onChange={e => update("num_representantes_legais", e.target.value)} /></div>
                    </>
                  )}
                  <div className="space-y-2"><Label>Nome Completo *</Label><Input value={form.full_name} onChange={e => update("full_name", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Nome social ou artístico (se houver)</Label><Input value={form.nome_social} onChange={e => update("nome_social", e.target.value)} /></div>
                  <div className="space-y-2"><Label>CPF *</Label><Input placeholder="000.000.000-00" value={form.cpf} onChange={e => update("cpf", e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>RG</Label><Input value={form.rg} onChange={e => update("rg", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Órgão expedidor</Label><Input placeholder="SSP/GO" value={form.rg_orgao} onChange={e => update("rg_orgao", e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Data de nascimento</Label><Input type="date" value={form.data_nascimento} onChange={e => update("data_nascimento", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Telefone</Label><Input placeholder="(62) 99999-0000" value={form.telefone} onChange={e => update("telefone", e.target.value)} /></div>
                  </div>
                  <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email_contato} onChange={e => update("email_contato", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Endereço completo</Label><Input value={form.endereco} onChange={e => update("endereco", e.target.value)} /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Nº</Label><Input value={form.numero} onChange={e => update("numero", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Complemento</Label><Input value={form.complemento} onChange={e => update("complemento", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Bairro</Label><Input value={form.bairro} onChange={e => update("bairro", e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>CEP</Label><Input placeholder="00000-000" value={form.cep} onChange={e => update("cep", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Cidade</Label><Input value={form.city} onChange={e => update("city", e.target.value)} /></div>
                    <div className="space-y-2">
                      <Label>UF</Label>
                      <Select value={form.state} onValueChange={v => update("state", v)}>
                        <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Dados Bancários */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Dados Bancários para Recebimento do Prêmio</CardTitle>
                  <CardDescription>Conta que receberá os recursos da premiação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Banco</Label><Input value={form.banco} onChange={e => update("banco", e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Agência</Label><Input value={form.agencia} onChange={e => update("agencia", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Conta</Label><Input value={form.conta_bancaria} onChange={e => update("conta_bancaria", e.target.value)} /></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Mini Currículo + Autodeclarações */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Mini Currículo e Autodeclarações</CardTitle>
                  <CardDescription>Informações exigidas pelo formulário de inscrição</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Mini Currículo</Label>
                    <Textarea placeholder="Escreva um resumo do seu currículo destacando as principais atuações culturais realizadas..." value={form.bio} onChange={e => update("bio", e.target.value)} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pertence a alguma comunidade tradicional?</Label>
                    <RadioGroup value={form.comunidade_tradicional} onValueChange={v => update("comunidade_tradicional", v)} className="space-y-1">
                      {COMUNIDADES.map(c => (
                        <div key={c} className="flex items-center gap-2">
                          <RadioGroupItem value={c} id={`com-${c}`} /><Label htmlFor={`com-${c}`} className="font-normal">{c}</Label>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="Outro" id="com-outro" /><Label htmlFor="com-outro" className="font-normal">Outro</Label>
                      </div>
                    </RadioGroup>
                    {form.comunidade_tradicional === "Outro" && (
                      <Input placeholder="Especifique..." value={form.comunidade_tradicional_outro} onChange={e => update("comunidade_tradicional_outro", e.target.value)} className="mt-2" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Gênero</Label>
                    <RadioGroup value={form.genero} onValueChange={v => update("genero", v)} className="grid grid-cols-2 gap-1">
                      {GENEROS.map(g => (
                        <div key={g} className="flex items-center gap-2">
                          <RadioGroupItem value={g} id={`gen-${g}`} /><Label htmlFor={`gen-${g}`} className="font-normal">{g}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: LGBTQIAPN+, Raça, PcD, Função */}
            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Autodeclarações (continuação)</CardTitle>
                  <CardDescription>Campos obrigatórios do Anexo II</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Pessoa LGBTQIAPN+?</Label>
                    <RadioGroup value={form.lgbtqiapn_tipo} onValueChange={v => update("lgbtqiapn_tipo", v)} className="grid grid-cols-2 gap-1">
                      {LGBTQIAPN_OPCOES.map(o => (
                        <div key={o} className="flex items-center gap-2">
                          <RadioGroupItem value={o} id={`lgb-${o}`} /><Label htmlFor={`lgb-${o}`} className="font-normal">{o}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Raça/cor/etnia</Label>
                    <RadioGroup value={form.raca_cor_etnia} onValueChange={v => update("raca_cor_etnia", v)} className="flex flex-wrap gap-4">
                      {RACAS.map(r => (
                        <div key={r} className="flex items-center gap-2">
                          <RadioGroupItem value={r} id={`raca-${r}`} /><Label htmlFor={`raca-${r}`} className="font-normal">{r}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Você é Pessoa com Deficiência – PcD?</Label>
                    <RadioGroup value={form.pcd ? "sim" : "nao"} onValueChange={v => update("pcd", v === "sim")} className="flex gap-6">
                      <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="pcd-s" /><Label htmlFor="pcd-s">Sim</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="pcd-n" /><Label htmlFor="pcd-n">Não</Label></div>
                    </RadioGroup>
                    {form.pcd && (
                      <RadioGroup value={form.pcd_tipo} onValueChange={v => update("pcd_tipo", v)} className="ml-6 space-y-1 mt-2">
                        {PCD_TIPOS.map(t => (
                          <div key={t} className="flex items-center gap-2">
                            <RadioGroupItem value={t} id={`pcdt-${t}`} /><Label htmlFor={`pcdt-${t}`} className="font-normal">{t}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Principal função/profissão no campo artístico e cultural</Label>
                    <RadioGroup value={form.funcao_profissao} onValueChange={v => update("funcao_profissao", v)} className="space-y-1">
                      {FUNCOES.map(f => (
                        <div key={f} className="flex items-center gap-2">
                          <RadioGroupItem value={f} id={`func-${f}`} /><Label htmlFor={`func-${f}`} className="font-normal text-sm">{f}</Label>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="Outro" id="func-outro" /><Label htmlFor="func-outro" className="font-normal">Outro</Label>
                      </div>
                    </RadioGroup>
                    {form.funcao_profissao === "Outro" && (
                      <Input placeholder="Especifique..." value={form.funcao_profissao_outro} onChange={e => update("funcao_profissao_outro", e.target.value)} className="mt-2" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Coletivo + Público */}
            {step === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Coletivo e Público-Alvo</CardTitle>
                  <CardDescription>Informações sobre representação de grupo e público</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Você está representando um coletivo (sem CNPJ)?</Label>
                    <RadioGroup value={form.representa_coletivo ? "sim" : "nao"} onValueChange={v => update("representa_coletivo", v === "sim")} className="flex gap-6">
                      <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="col-s" /><Label htmlFor="col-s">Sim</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="col-n" /><Label htmlFor="col-n">Não</Label></div>
                    </RadioGroup>
                  </div>
                  {form.representa_coletivo && (
                    <>
                      <div className="space-y-2"><Label>Nome do coletivo</Label><Input value={form.nome_grupo} onChange={e => update("nome_grupo", e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Ano de criação</Label><Input value={form.ano_criacao_coletivo} onChange={e => update("ano_criacao_coletivo", e.target.value)} /></div>
                        <div className="space-y-2"><Label>Nº de pessoas</Label><Input value={form.qtd_pessoas_coletivo} onChange={e => update("qtd_pessoas_coletivo", e.target.value)} /></div>
                      </div>
                      <div className="space-y-2"><Label>Sua função no grupo</Label><Input value={form.funcao_no_grupo} onChange={e => update("funcao_no_grupo", e.target.value)} /></div>
                      <div className="space-y-2">
                        <Label>Membros do coletivo (Nome e CPF)</Label>
                        {membros.map((m, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <Input placeholder="Nome" value={m.nome} onChange={e => updateMembro(i, "nome", e.target.value)} className="flex-1" />
                            <Input placeholder="CPF" value={m.cpf} onChange={e => updateMembro(i, "cpf", e.target.value)} className="w-40" />
                            {membros.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeMembro(i)}><Trash2 className="h-4 w-4" /></Button>}
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addMembro}><Plus className="h-4 w-4 mr-1" /> Adicionar membro</Button>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>Perfil do público atingido pelos projetos executados</Label>
                    <Textarea placeholder="Quem é o público dos seus projetos? Crianças, adultas, idosas? Fazem parte de alguma comunidade?" value={form.perfil_publico} onChange={e => update("perfil_publico", e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ação cultural voltada prioritariamente para:</Label>
                    <div className="grid grid-cols-1 gap-1">
                      {PUBLICO_ALVO.map(p => (
                        <div key={p} className="flex items-center gap-2">
                          <Checkbox checked={form.acao_cultural_publico.includes(p)} onCheckedChange={() => toggleArray("acao_cultural_publico", p)} id={`pub-${p}`} />
                          <Label htmlFor={`pub-${p}`} className="font-normal text-sm cursor-pointer">{p}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 6: Acessibilidade + Locais */}
            {step === 6 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Acessibilidade e Locais</CardTitle>
                  <CardDescription>Medidas de acessibilidade nos projetos executados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="font-semibold">Acessibilidade arquitetônica</Label>
                    {ACESS_ARQ.map(a => (
                      <div key={a} className="flex items-center gap-2">
                        <Checkbox checked={form.acessibilidade_arquitetonica.includes(a)} onCheckedChange={() => toggleArray("acessibilidade_arquitetonica", a)} id={`aarq-${a}`} />
                        <Label htmlFor={`aarq-${a}`} className="font-normal text-sm cursor-pointer">{a}</Label>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Acessibilidade comunicacional</Label>
                    {ACESS_COM.map(a => (
                      <div key={a} className="flex items-center gap-2">
                        <Checkbox checked={form.acessibilidade_comunicacional.includes(a)} onCheckedChange={() => toggleArray("acessibilidade_comunicacional", a)} id={`acom-${a}`} />
                        <Label htmlFor={`acom-${a}`} className="font-normal text-sm cursor-pointer">{a}</Label>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Acessibilidade atitudinal</Label>
                    {ACESS_ATI.map(a => (
                      <div key={a} className="flex items-center gap-2">
                        <Checkbox checked={form.acessibilidade_atitudinal.includes(a)} onCheckedChange={() => toggleArray("acessibilidade_atitudinal", a)} id={`aati-${a}`} />
                        <Label htmlFor={`aati-${a}`} className="font-normal text-sm cursor-pointer">{a}</Label>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Locais onde os projetos foram executados</Label>
                    <Textarea placeholder="Informe os espaços culturais e outros ambientes no município de Goiás..." value={form.locais_execucao} onChange={e => update("locais_execucao", e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tempo de residência no município de Goiás (anos)</Label>
                    <Input placeholder="Ex: 5" value={form.tempo_residencia_municipio} onChange={e => update("tempo_residencia_municipio", e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 7: Trajetória Cultural */}
            {step === 7 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Informações sobre Trajetória Cultural</CardTitle>
                  <CardDescription>Seção obrigatória do formulário de inscrição</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>2.1 Quais são as suas principais ações e atividades culturais realizadas?</Label>
                    <Textarea placeholder="Conte detalhadamente sobre as ações culturais que realiza, área ou segmento cultural, local das atividades..." value={form.trajetoria_acoes} onChange={e => update("trajetoria_acoes", e.target.value)} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>2.2 Como começou a sua trajetória cultural?</Label>
                    <Textarea placeholder="Descreva como e quando começou sua trajetória na cultura, onde iniciou seus projetos, há quanto tempo os desenvolve..." value={form.trajetoria_inicio} onChange={e => update("trajetoria_inicio", e.target.value)} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>2.3 Como as ações que você desenvolve transformam a realidade da sua comunidade?</Label>
                    <Textarea placeholder="Quem são as pessoas beneficiadas? Como suas ações impactam as pessoas ao redor? A comunidade participou como público ou trabalhou nos projetos?" value={form.trajetoria_impacto} onChange={e => update("trajetoria_impacto", e.target.value)} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>2.4 Você desenvolveu ações com outras esferas de conhecimento (educação, saúde, etc)?</Label>
                    <Textarea placeholder="Descreva se suas ações possuem relação com outras áreas além da cultura..." value={form.trajetoria_outras_areas} onChange={e => update("trajetoria_outras_areas", e.target.value)} rows={4} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 8: Testemunha (Anexo VII) + Texto referência */}
            {step === 8 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans text-xl">Dados complementares</CardTitle>
                  <CardDescription>Testemunha para Declaração de Residência (Anexo VII) e texto de referência</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="border rounded-lg p-4 space-y-3">
                    <Label className="font-semibold">Testemunha (Anexo VII – Declaração de Residência)</Label>
                    <div className="space-y-2"><Label>Nome da testemunha</Label><Input value={form.testemunha_nome} onChange={e => update("testemunha_nome", e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>CPF</Label><Input value={form.testemunha_cpf} onChange={e => update("testemunha_cpf", e.target.value)} /></div>
                      <div className="space-y-2"><Label>RG</Label><Input value={form.testemunha_rg} onChange={e => update("testemunha_rg", e.target.value)} /></div>
                    </div>
                    <div className="space-y-2"><Label>Telefone</Label><Input value={form.testemunha_telefone} onChange={e => update("testemunha_telefone", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Endereço</Label><Input value={form.testemunha_endereco} onChange={e => update("testemunha_endereco", e.target.value)} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Texto de referência (sua voz artística)</Label>
                    <Textarea placeholder="Cole aqui textos de sua autoria para que a IA preserve seu estilo. Mínimo 500 palavras recomendado." value={referenceText} onChange={e => setReferenceText(e.target.value)} rows={5} />
                    {referenceText && <p className="text-xs text-muted-foreground">{referenceText.split(/\s+/).filter(Boolean).length} palavras</p>}
                  </div>
                </CardContent>
              </Card>
            )}

          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
          </Button>
          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
              Próximo <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={loading}>
              {loading ? "Salvando..." : "Concluir Cadastro"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

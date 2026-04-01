import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, ArrowLeft, Plus, Trash2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const STATES = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const COMUNIDADES = [
  "Não pertenço a comunidade tradicional",
  "Comunidades Extrativistas", "Comunidades Ribeirinhas",
  "Comunidades Rurais", "Área periférica", "Indígenas",
  "Povos Ciganos", "Pescadores(as) Artesanais",
  "Povos de Terreiro", "Quilombolas",
];

const GENEROS = [
  "Mulher cisgênero", "Homem cisgênero", "Mulher Transgênero",
  "Homem Transgênero", "Pessoa Não Binária", "Não informar",
];

const LGBTQIAPN_OPCOES = [
  "Lésbica", "Gay", "Bissexual", "Transexual", "Queer",
  "Intersexo", "Assexual", "Pansexual", "Não binário",
  '"+" outras identidades e orientações sexuais não mencionadas na sigla.',
  "Não se aplica.",
];

const RACAS = ["Branca", "Preta", "Parda", "Indígena", "Amarela"];
const PCD_TIPOS = ["Auditiva", "Física", "Intelectual", "Múltipla", "Visual", "Outros"];

const ESCOLARIDADES = [
  "Não tenho Educação Formal", "Ensino Fundamental Incompleto", "Ensino Fundamental Completo",
  "Ensino Médio Incompleto", "Ensino Médio Completo", "Curso Técnico Completo",
  "Ensino Superior Incompleto", "Ensino Superior Completo", "Pós Graduação Incompleta", "Pós-Graduação Completa"
];

const RENDA_FAIXAS = [
  "Nenhuma renda.", "Até 1 salário mínimo", "De 1 a 3 salários mínimos",
  "De 3 a 5 salários mínimos", "De 5 a 8 salários mínimos",
  "De 8 a 10 salários mínimos", "Acima de 10 salários mínimos"
];

const PROGRAMAS_SOCIAIS = ["Não", "Bolsa família", "Benefício de Prestação Continuada"];

const FUNCOES = [
  "Artista, Artesão(a), Brincante, Criador(a) e afins.",
  "Instrutor(a), oficineiro(a), educador(a) artístico(a)-cultural e afins.",
  "Curador(a), Programador(a) e afins.",
  "Produtor(a)", "Gestor(a)", "Técnico(a)",
  "Consultor(a), Pesquisador(a) e afins.",
  "Festeiro",
];

const PUBLICO_ALVO = [
  "Pessoas vítimas de violência", "Pessoas em situação de pobreza",
  "Pessoas em situação de rua (moradores de rua)",
  "Pessoas em situação de restrição e privação de liberdade (população carcerária)",
  "Pessoas com deficiência", "Pessoas em sofrimento físico e/ou psíquico",
  "Mulheres", "LGBTQIAPN+", "Povos e comunidades tradicionais",
  "Negros e/ou negras", "Ciganos", "Indígenas",
  "Não é voltada especificamente para um perfil, é aberta para todos",
  "Área periférica",
];

const ACESS_ARQ = [
  "rotas acessíveis, com espaço de manobra para cadeira de rodas",
  "piso tátil", "rampas", "elevadores adequados para pessoas com deficiência",
  "corrimãos e guarda-corpos",
  "banheiros femininos e masculinos adaptados para pessoas com deficiência",
  "vagas de estacionamento para pessoas com deficiência",
  "assentos para pessoas obesas", "iluminação adequada",
];

const ACESS_COM = [
  "a Língua Brasileira de Sinais - Libras", "o sistema Braille",
  "o sistema de sinalização ou comunicação tátil", "a audiodescrição",
  "as legendas", "a linguagem simples", "textos adaptados para leitores de tela",
];

const ACESS_ATI = [
  "capacitação de equipes atuantes nos projetos culturais",
  "contratação de profissionais com deficiência e profissionais especializados em acessibilidade cultural",
  "formação e sensibilização de agentes culturais, público e todos os envolvidos na cadeia produtiva cultural",
  "outras medidas que visem a eliminação de atitudes capacitistas",
];

const CATEGORIAS = [
  { value: "grupos_coletivos", label: "Grupos e coletivos culturais" },
  { value: "festas_populares", label: "Festas populares" },
  { value: "blocos_carnaval", label: "Blocos de carnaval" },
];

interface Membro { nome: string; cpf: string; }

interface ProfileFormStepsProps {
  onComplete: () => void;
  embedded?: boolean;
}

const PROFILE_SUB_STEPS = [
  "Informações do Agente",
  "Dados Pessoais",
  "Dados Bancários",
  "Currículo e Perfil",
  "Autodeclarações",
  "Coletivo",
];

const ProfileFormSteps = ({ onComplete, embedded = false }: ProfileFormStepsProps) => {
  const [subStep, setSubStep] = useState(0);
  const [form, setForm] = useState({
    person_type: "", full_name: "", nome_social: "",
    cpf: "", rg: "", rg_orgao: "", data_nascimento: "",
    email_contato: "", telefone: "",
    endereco: "", numero: "", complemento: "", bairro: "", cep: "",
    city: "", state: "",
    banco: "", agencia: "", conta_bancaria: "", tipo_conta_bancaria: "",
    cnpj_mei: "",
    categoria_inscricao: "",
    concorre_cotas: false, cota_tipo: "",
    comunidade_tradicional: "", comunidade_tradicional_outro: "",
    genero: "", genero_outro: "",
    lgbtqiapn_tipo: "",
    raca_cor_etnia: "",
    pcd: false, pcd_tipo: "", pcd_tipo_outro: "",
    funcao_profissao: "", funcao_profissao_outro: "",
    escolaridade: "",
    renda_mensal: "",
    programa_social: "", programa_social_outro: "",
    bio: "",
    representa_coletivo: false,
    nome_grupo: "", ano_criacao_coletivo: "", qtd_pessoas_coletivo: "",
    perfil_publico: "",
    acao_cultural_publico: [] as string[], acao_cultural_publico_outro: "",
    acessibilidade_arquitetonica: [] as string[], acessibilidade_arq_outro: "",
    acessibilidade_comunicacional: [] as string[], acessibilidade_com_outro: "",
    acessibilidade_atitudinal: [] as string[],
    acessibilidade_descricao: "",
    locais_execucao: "",
    razao_social: "", nome_fantasia: "", cnpj: "",
    num_representantes_legais: "",
    tempo_residencia_municipio: "",
    testemunha_nome: "", testemunha_cpf: "", testemunha_rg: "",
    testemunha_telefone: "", testemunha_endereco: "",
    funcao_no_grupo: "",
  });
  const [membros, setMembros] = useState<Membro[]>([{ nome: "", cpf: "" }]);
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { user } = useAuth();

  const totalSubSteps = PROFILE_SUB_STEPS.length;

  // Load existing profile data
  useEffect(() => {
    if (!user || profileLoaded) return;
    const loadProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        setForm(prev => ({
          ...prev,
          full_name: data.full_name || "",
          nome_social: data.nome_social || "",
          person_type: data.person_type || "",
          cpf: data.cpf || "",
          rg: data.rg || "",
          rg_orgao: data.rg_orgao || "",
          data_nascimento: data.data_nascimento || "",
          email_contato: data.email_contato || "",
          telefone: data.telefone || "",
          endereco: data.endereco || "",
          numero: data.numero || "",
          complemento: data.complemento || "",
          bairro: data.bairro || "",
          cep: data.cep || "",
          city: data.city || "",
          state: data.state || "",
          banco: data.banco || "",
          agencia: data.agencia || "",
          conta_bancaria: data.conta_bancaria || "",
          tipo_conta_bancaria: data.tipo_conta_bancaria || "",
          cnpj_mei: data.cnpj_mei || "",
          categoria_inscricao: data.categoria_inscricao || "",
          concorre_cotas: data.concorre_cotas || false,
          cota_tipo: data.cota_tipo || "",
          comunidade_tradicional: data.comunidade_tradicional || "",
          genero: data.genero || "",
          lgbtqiapn_tipo: data.lgbtqiapn_tipo || "",
          raca_cor_etnia: data.raca_cor_etnia || "",
          pcd: data.pcd || false,
          pcd_tipo: data.pcd_tipo || "",
          funcao_profissao: data.funcao_profissao || "",
          escolaridade: data.escolaridade || "",
          renda_mensal: data.renda_mensal || "",
          programa_social: data.programa_social || "",
          
          bio: data.bio || "",
          representa_coletivo: data.representa_coletivo || false,
          nome_grupo: data.nome_grupo || "",
          ano_criacao_coletivo: data.ano_criacao_coletivo || "",
          qtd_pessoas_coletivo: data.qtd_pessoas_coletivo || "",
          perfil_publico: data.perfil_publico || "",
          acao_cultural_publico: data.acao_cultural_publico || [],
          acessibilidade_arquitetonica: data.acessibilidade_arquitetonica || [],
          acessibilidade_comunicacional: data.acessibilidade_comunicacional || [],
          acessibilidade_atitudinal: data.acessibilidade_atitudinal || [],
          acessibilidade_descricao: data.acessibilidade_descricao || "",
          locais_execucao: data.locais_execucao || "",
          razao_social: data.razao_social || "",
          nome_fantasia: data.nome_fantasia || "",
          cnpj: data.cnpj || "",
          num_representantes_legais: data.num_representantes_legais || "",
          tempo_residencia_municipio: data.tempo_residencia_municipio || "",
          testemunha_nome: data.testemunha_nome || "",
          testemunha_cpf: data.testemunha_cpf || "",
          testemunha_rg: data.testemunha_rg || "",
          testemunha_telefone: data.testemunha_telefone || "",
          testemunha_endereco: data.testemunha_endereco || "",
          funcao_no_grupo: data.funcao_no_grupo || "",
        }));
        if (data.membros_coletivo && Array.isArray(data.membros_coletivo) && (data.membros_coletivo as any[]).length > 0) {
          setMembros(data.membros_coletivo as unknown as Membro[]);
        }
      }
      setProfileLoaded(true);
    };
    loadProfile();
  }, [user, profileLoaded]);

  const update = (key: string, val: string | boolean | string[]) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleArray = (key: string, value: string) => {
    const arr = (form as any)[key] as string[];
    if (arr.includes(value)) update(key, arr.filter(v => v !== value));
    else update(key, [...arr, value]);
  };

  const addMembro = () => setMembros(p => [...p, { nome: "", cpf: "" }]);
  const removeMembro = (i: number) => setMembros(p => p.filter((_, idx) => idx !== i));
  const updateMembro = (i: number, key: keyof Membro, val: string) => {
    setMembros(p => p.map((m, idx) => idx === i ? { ...m, [key]: val } : m));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const comunidade = form.comunidade_tradicional === "Outro" ? form.comunidade_tradicional_outro : form.comunidade_tradicional;
      const funcao = form.funcao_profissao === "Outro" ? form.funcao_profissao_outro : form.funcao_profissao;
      const genero = form.genero === "Outro" ? form.genero_outro : form.genero;

      const profileData: Record<string, any> = {
        full_name: form.full_name, nome_social: form.nome_social || null,
        person_type: form.person_type, cpf: form.cpf, rg: form.rg, rg_orgao: form.rg_orgao,
        data_nascimento: form.data_nascimento || null,
        email_contato: form.email_contato, telefone: form.telefone,
        endereco: form.endereco, numero: form.numero, complemento: form.complemento || null,
        bairro: form.bairro, cep: form.cep, city: form.city, state: form.state,
        banco: form.banco, agencia: form.agencia, conta_bancaria: form.conta_bancaria,
        tipo_conta_bancaria: form.tipo_conta_bancaria || null, cnpj_mei: form.cnpj_mei || null,
        categoria_inscricao: form.categoria_inscricao,
        concorre_cotas: form.concorre_cotas,
        cota_tipo: form.concorre_cotas ? form.cota_tipo : null,
        comunidade_tradicional: comunidade || null, genero: genero,
        lgbtqiapn: form.lgbtqiapn_tipo !== "Não se aplica." && form.lgbtqiapn_tipo !== "",
        lgbtqiapn_tipo: form.lgbtqiapn_tipo || null,
        raca_cor_etnia: form.raca_cor_etnia,
        pcd: form.pcd,
        pcd_tipo: form.pcd ? (form.pcd_tipo === "Outro" ? form.pcd_tipo_outro : form.pcd_tipo) : null,
        funcao_profissao: funcao, bio: form.bio,
        representa_coletivo: form.representa_coletivo,
        nome_grupo: form.representa_coletivo ? form.nome_grupo : null,
        funcao_no_grupo: form.representa_coletivo ? form.funcao_no_grupo : null,
        ano_criacao_coletivo: form.representa_coletivo ? form.ano_criacao_coletivo : null,
        qtd_pessoas_coletivo: form.representa_coletivo ? form.qtd_pessoas_coletivo : null,
        tempo_residencia_municipio: form.tempo_residencia_municipio || null,
        escolaridade: form.escolaridade || null,
        renda_mensal: form.renda_mensal || null,
        programa_social: form.programa_social || null,
        programa_social_outro: form.programa_social === "Outros" ? form.programa_social_outro : null,
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
      toast.success("Dados cadastrais salvos!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  const canAdvanceSubStep = () => {
    if (subStep === 0) return form.person_type && form.categoria_inscricao;
    if (subStep === 1) return form.full_name && form.cpf;
    return true;
  };

  const renderSubStep = () => {
    switch (subStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Você é pessoa física ou pessoa jurídica? *</Label>
              <RadioGroup value={form.person_type} onValueChange={v => update("person_type", v)} className="flex gap-6">
                <div className="flex items-center gap-2"><RadioGroupItem value="PF" id="pf" /><Label htmlFor="pf">Pessoa Física</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="PJ" id="pj" /><Label htmlFor="pj">Pessoa Jurídica</Label></div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Escolha a categoria *</Label>
              <RadioGroup value={form.categoria_inscricao} onValueChange={v => update("categoria_inscricao", v)}>
                {CATEGORIAS.map(c => (
                  <div key={c.value} className="flex items-center gap-2"><RadioGroupItem value={c.value} id={`cat-${c.value}`} /><Label htmlFor={`cat-${c.value}`}>{c.label}</Label></div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Vai concorrer às cotas? *</Label>
              <RadioGroup value={form.concorre_cotas ? "sim" : "nao"} onValueChange={v => update("concorre_cotas", v === "sim")} className="flex gap-6">
                <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="cotas-s" /><Label htmlFor="cotas-s">Sim</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="cotas-n" /><Label htmlFor="cotas-n">Não</Label></div>
              </RadioGroup>
              {form.concorre_cotas && (
                <div className="space-y-2 ml-6">
                  <Label>Se sim. Qual?</Label>
                  <RadioGroup value={form.cota_tipo} onValueChange={v => update("cota_tipo", v)} className="space-y-1">
                    <div className="flex items-center gap-2"><RadioGroupItem value="negra" id="cota1" /><Label htmlFor="cota1">Pessoa negra</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="indigena" id="cota2" /><Label htmlFor="cota2">Pessoa indígena</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="pcd" id="cota3" /><Label htmlFor="cota3">Pessoa com deficiência</Label></div>
                  </RadioGroup>
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            {form.person_type === "PJ" && (
              <>
                <div className="space-y-2"><Label>Razão Social *</Label><Input value={form.razao_social} onChange={e => update("razao_social", e.target.value)} /></div>
                <div className="space-y-2"><Label>Nome Fantasia</Label><Input value={form.nome_fantasia} onChange={e => update("nome_fantasia", e.target.value)} /></div>
                <div className="space-y-2"><Label>CNPJ *</Label><Input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => update("cnpj", e.target.value)} /></div>
                <div className="space-y-2"><Label>Endereço da sede *</Label><Input value={form.endereco} onChange={e => update("endereco", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Cidade *</Label><Input value={form.city} onChange={e => update("city", e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Estado *</Label>
                    <Select value={form.state} onValueChange={v => update("state", v)}><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger><SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Número de representantes legais</Label><Input value={form.num_representantes_legais} onChange={e => update("num_representantes_legais", e.target.value)} /></div>
                <hr className="my-2" />
                <p className="text-sm font-semibold text-muted-foreground">Dados do Representante Legal</p>
              </>
            )}
            <div className="space-y-2"><Label>Nome Completo *</Label><Input value={form.full_name} onChange={e => update("full_name", e.target.value)} /></div>
            <div className="space-y-2"><Label>Nome artístico ou nome social (se houver)</Label><Input value={form.nome_social} onChange={e => update("nome_social", e.target.value)} /></div>
            <div className="space-y-2"><Label>CPF *</Label><Input placeholder="000.000.000-00" value={form.cpf} onChange={e => update("cpf", e.target.value)} /></div>
            {form.person_type === "PF" && (
              <div className="space-y-2"><Label>CNPJ (Se a inscrição for realizada em nome do MEI)</Label><Input placeholder="00.000.000/0001-00" value={form.cnpj_mei} onChange={e => update("cnpj_mei", e.target.value)} /></div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>RG *</Label><Input value={form.rg} onChange={e => update("rg", e.target.value)} /></div>
              <div className="space-y-2"><Label>Órgão expedidor</Label><Input placeholder="SSP/GO" value={form.rg_orgao} onChange={e => update("rg_orgao", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Data de nascimento *</Label><Input type="date" value={form.data_nascimento} onChange={e => update("data_nascimento", e.target.value)} /></div>
              <div className="space-y-2"><Label>Telefone/Whatsapp *</Label><Input placeholder="(62) 99999-0000" value={form.telefone} onChange={e => update("telefone", e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>E-mail *</Label><Input type="email" value={form.email_contato} onChange={e => update("email_contato", e.target.value)} /></div>
            {form.person_type === "PF" && (
              <>
                <div className="space-y-2"><Label>Endereço completo *</Label><Input value={form.endereco} onChange={e => update("endereco", e.target.value)} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>CEP *</Label><Input placeholder="00000-000" value={form.cep} onChange={e => update("cep", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Cidade *</Label><Input value={form.city} onChange={e => update("city", e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Estado *</Label>
                    <Select value={form.state} onValueChange={v => update("state", v)}><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger><SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Banco *</Label><Input value={form.banco} onChange={e => update("banco", e.target.value)} /></div>
            <div className="space-y-2"><Label>Agência *</Label><Input value={form.agencia} onChange={e => update("agencia", e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <RadioGroup value={form.tipo_conta_bancaria} onValueChange={v => update("tipo_conta_bancaria", v)} className="flex gap-6">
                <div className="flex items-center gap-2"><RadioGroupItem value="corrente" id="cc" /><Label htmlFor="cc">Conta Corrente</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="poupanca" id="cp" /><Label htmlFor="cp">Conta Poupança</Label></div>
              </RadioGroup>
            </div>
            <div className="space-y-2"><Label>Conta *</Label><Input value={form.conta_bancaria} onChange={e => update("conta_bancaria", e.target.value)} /></div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Mini Currículo *</Label>
              <p className="text-xs text-muted-foreground">Escreva um resumo do seu currículo destacando as principais atuações culturais realizadas.</p>
              <Textarea placeholder="Descreva suas principais atuações culturais..." value={form.bio} onChange={e => update("bio", e.target.value)} rows={5} />
            </div>
            <div className="space-y-2">
              <Label>Pertence a alguma comunidade tradicional? *</Label>
              <RadioGroup value={form.comunidade_tradicional} onValueChange={v => update("comunidade_tradicional", v)} className="space-y-1">
                {COMUNIDADES.map(c => (
                  <div key={c} className="flex items-center gap-2"><RadioGroupItem value={c} id={`com-${c}`} /><Label htmlFor={`com-${c}`} className="font-normal">{c}</Label></div>
                ))}
                <div className="flex items-center gap-2"><RadioGroupItem value="Outro" id="com-outro" /><Label htmlFor="com-outro" className="font-normal">Outro</Label></div>
              </RadioGroup>
              {form.comunidade_tradicional === "Outro" && <Input placeholder="Especifique..." value={form.comunidade_tradicional_outro} onChange={e => update("comunidade_tradicional_outro", e.target.value)} className="mt-2" />}
            </div>
            <div className="space-y-2">
              <Label>Gênero *</Label>
              <RadioGroup value={form.genero} onValueChange={v => update("genero", v)} className="grid grid-cols-2 gap-1">
                {GENEROS.map(g => (
                  <div key={g} className="flex items-center gap-2"><RadioGroupItem value={g} id={`gen-${g}`} /><Label htmlFor={`gen-${g}`} className="font-normal">{g}</Label></div>
                ))}
                <div className="flex items-center gap-2"><RadioGroupItem value="Outro" id="gen-outro" /><Label htmlFor="gen-outro" className="font-normal">Outro</Label></div>
              </RadioGroup>
              {form.genero === "Outro" && <Input placeholder="Especifique..." value={form.genero_outro} onChange={e => update("genero_outro", e.target.value)} className="mt-2" />}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Pessoa LGBTQIAPN+? *</Label>
              <RadioGroup value={form.lgbtqiapn_tipo} onValueChange={v => update("lgbtqiapn_tipo", v)} className="grid grid-cols-2 gap-1">
                {LGBTQIAPN_OPCOES.map(o => (
                  <div key={o} className="flex items-center gap-2"><RadioGroupItem value={o} id={`lgb-${o}`} /><Label htmlFor={`lgb-${o}`} className="font-normal text-sm">{o}</Label></div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Raça, cor ou etnia *</Label>
              <RadioGroup value={form.raca_cor_etnia} onValueChange={v => update("raca_cor_etnia", v)} className="flex flex-wrap gap-4">
                {RACAS.map(r => (
                  <div key={r} className="flex items-center gap-2"><RadioGroupItem value={r} id={`raca-${r}`} /><Label htmlFor={`raca-${r}`} className="font-normal">{r}</Label></div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Você é uma Pessoa com Deficiência – PcD? *</Label>
              <RadioGroup value={form.pcd ? "sim" : "nao"} onValueChange={v => update("pcd", v === "sim")} className="flex gap-6">
                <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="pcd-s" /><Label htmlFor="pcd-s">Sim</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="pcd-n" /><Label htmlFor="pcd-n">Não</Label></div>
              </RadioGroup>
              {form.pcd && (
                <div className="space-y-2 ml-6">
                  <Label>Qual tipo de deficiência?</Label>
                  <RadioGroup value={form.pcd_tipo} onValueChange={v => update("pcd_tipo", v)} className="space-y-1">
                    {PCD_TIPOS.map(t => (
                      <div key={t} className="flex items-center gap-2"><RadioGroupItem value={t} id={`pcdt-${t}`} /><Label htmlFor={`pcdt-${t}`} className="font-normal">{t}</Label></div>
                    ))}
                    <div className="flex items-center gap-2"><RadioGroupItem value="Outro" id="pcdt-outro" /><Label htmlFor="pcdt-outro" className="font-normal">Outro</Label></div>
                  </RadioGroup>
                  {form.pcd_tipo === "Outro" && <Input placeholder="Especifique..." value={form.pcd_tipo_outro} onChange={e => update("pcd_tipo_outro", e.target.value)} className="mt-2" />}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Qual a sua principal função/profissão no campo artístico e cultural? *</Label>
              <RadioGroup value={form.funcao_profissao} onValueChange={v => update("funcao_profissao", v)} className="space-y-1">
                {FUNCOES.map(f => (
                  <div key={f} className="flex items-center gap-2"><RadioGroupItem value={f} id={`func-${f}`} /><Label htmlFor={`func-${f}`} className="font-normal text-sm">{f}</Label></div>
                ))}
                <div className="flex items-center gap-2"><RadioGroupItem value="Outro" id="func-outro" /><Label htmlFor="func-outro" className="font-normal">Outro</Label></div>
              </RadioGroup>
              {form.funcao_profissao === "Outro" && <Input placeholder="Especifique..." value={form.funcao_profissao_outro} onChange={e => update("funcao_profissao_outro", e.target.value)} className="mt-2" />}
            </div>
            
            <div className="space-y-2">
              <Label>Qual o seu grau de escolaridade? *</Label>
              <RadioGroup value={form.escolaridade} onValueChange={v => update("escolaridade", v)} className="flex flex-col gap-1">
                {ESCOLARIDADES.map(e => (
                  <div key={e} className="flex items-center gap-2"><RadioGroupItem value={e} id={`esc-${e}`} /><Label htmlFor={`esc-${e}`} className="font-normal text-sm">{e}</Label></div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Qual a sua renda mensal fixa individual (últimos 3 meses)? *</Label>
              <RadioGroup value={form.renda_mensal} onValueChange={v => update("renda_mensal", v)} className="flex flex-col gap-1">
                {RENDA_FAIXAS.map(r => (
                  <div key={r} className="flex items-center gap-2"><RadioGroupItem value={r} id={`renda-${r}`} /><Label htmlFor={`renda-${r}`} className="font-normal text-sm">{r}</Label></div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Você é beneficiário de algum programa social? *</Label>
              <RadioGroup value={form.programa_social} onValueChange={v => update("programa_social", v)} className="flex flex-col gap-1">
                {PROGRAMAS_SOCIAIS.map(p => (
                  <div key={p} className="flex items-center gap-2"><RadioGroupItem value={p} id={`prog-${p}`} /><Label htmlFor={`prog-${p}`} className="font-normal text-sm">{p}</Label></div>
                ))}
                <div className="flex items-center gap-2"><RadioGroupItem value="Outros" id="prog-outro" /><Label htmlFor="prog-outro" className="font-normal text-sm">Outros</Label></div>
              </RadioGroup>
              {form.programa_social === "Outros" && <Input placeholder="Especifique..." value={form.programa_social_outro} onChange={e => update("programa_social_outro", e.target.value)} className="mt-2" />}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Você está representando um coletivo (sem CNPJ)? *</Label>
              <RadioGroup value={form.representa_coletivo ? "sim" : "nao"} onValueChange={v => update("representa_coletivo", v === "sim")} className="flex gap-6">
                <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="col-s" /><Label htmlFor="col-s">Sim</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="col-n" /><Label htmlFor="col-n">Não</Label></div>
              </RadioGroup>
            </div>
            {form.representa_coletivo && (
              <>
                <div className="space-y-2"><Label>Nome do coletivo</Label><Input value={form.nome_grupo} onChange={e => update("nome_grupo", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Ano de Criação</Label><Input value={form.ano_criacao_coletivo} onChange={e => update("ano_criacao_coletivo", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Quantas pessoas?</Label><Input value={form.qtd_pessoas_coletivo} onChange={e => update("qtd_pessoas_coletivo", e.target.value)} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Membros do coletivo (nome e CPF)</Label>
                  {membros.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input placeholder="Nome completo" value={m.nome} onChange={e => updateMembro(i, "nome", e.target.value)} className="flex-1" />
                      <Input placeholder="CPF" value={m.cpf} onChange={e => updateMembro(i, "cpf", e.target.value)} className="w-40" />
                      {membros.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeMembro(i)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addMembro}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={embedded ? "" : "space-y-4"}>
      {/* Sub-step navigation pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {PROFILE_SUB_STEPS.map((name, i) => (
          <button
            key={i}
            onClick={() => setSubStep(i)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              subStep === i
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {i + 1}. {name}
          </button>
        ))}
      </div>

      {/* Sub-step content */}
      <div className="overflow-y-auto max-h-[60vh] pr-2">
        <AnimatePresence mode="wait">
          <motion.div key={subStep} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
            {renderSubStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sub-step navigation */}
      <div className="flex justify-between pt-4 border-t border-border mt-4">
        <Button variant="outline" size="sm" onClick={() => setSubStep(s => s - 1)} disabled={subStep === 0}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        {subStep < totalSubSteps - 1 ? (
          <Button size="sm" onClick={() => setSubStep(s => s + 1)} disabled={!canAdvanceSubStep()}>
            Próximo <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleSaveProfile} disabled={loading}>
            {loading ? "Salvando..." : (
              <><CheckCircle className="h-4 w-4 mr-1" /> Salvar Dados Cadastrais</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileFormSteps;

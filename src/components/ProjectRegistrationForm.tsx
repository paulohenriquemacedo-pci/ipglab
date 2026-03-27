import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, ArrowLeft, Plus, Trash2, CheckCircle, Save } from "lucide-react";
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
const PCD_TIPOS = ["Auditiva", "Física", "Intelectual", "Múltipla", "Visual"];

const FUNCOES = [
  "Artista, Artesão(a), Brincante, Criador(a) e afins.",
  "Instrutor(a), oficineiro(a), educador(a) artístico(a)-cultural e afins.",
  "Curador(a), Programador(a) e afins.",
  "Produtor(a)", "Gestor(a)", "Técnico(a)",
  "Consultor(a), Pesquisador(a) e afins.",
  "Festeiro",
];

const ESCOLARIDADES = [
  "Não tenho Educação Formal", "Ensino Fundamental Incompleto",
  "Ensino Fundamental Completo", "Ensino Médio Incompleto",
  "Ensino Médio Completo", "Curso Técnico Completo",
  "Ensino Superior Incompleto", "Ensino Superior Completo",
  "Pós Graduação Incompleta", "Pós-Graduação Completa",
];

const RENDAS = [
  "Nenhuma renda", "Até 1 salário mínimo",
  "De 1 a 3 salários mínimos", "De 3 a 5 salários mínimos",
  "De 5 a 8 salários mínimos", "De 8 a 10 salários mínimos",
  "Acima de 10 salários mínimos",
];

const PROGRAMAS_SOCIAIS = ["Não", "Bolsa família", "Benefício de Prestação Continuada"];

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

// Categorias por tipo de edital
const CATEGORIAS_PREMIACAO = [
  { value: "grupos_coletivos", label: "Grupos e coletivos culturais" },
  { value: "festas_populares", label: "Festas populares" },
  { value: "blocos_carnaval", label: "Blocos de carnaval" },
];

const CATEGORIAS_FOMENTO = [
  { grupo: "Artes Visuais", items: ["Criação ou exposição artística", "Fotografia", "Arte Urbana", "Performances artísticas"] },
  { grupo: "Artesanato", items: ["Barro / argila / pedra sabão / trabalho manual"] },
  { grupo: "Educação Patrimonial", items: ["Oficinas/ fomento a pesquisas exploratórias / mapeamentos"] },
  { grupo: "Gastronomia", items: ["Gastronomia tradicional / releituras de prato / receitas tradicionais"] },
  { grupo: "Leitura, escrita e oralidade", items: ["Vocalização", "Editoração", "Produção de audiolivros, podcasts literários e literatura sonora"] },
  { grupo: "Cultura Popular", items: ["Dança popular em grupo / grupos de capoeira", "Recolhas de narrativas de histórias, lendas populares e das memórias de pessoas do município"] },
  { grupo: "Música", items: ["Instrumentos", "Apresentação musical de dupla", "Apresentação musical de bandas, grupos e corais", "Circulação, produção e difusão musical"] },
];

// Cotas PF vs PJ
const COTAS_PF = [
  { value: "negra", label: "Pessoa negra" },
  { value: "indigena", label: "Pessoa indígena" },
  { value: "pcd", label: "Pessoa com deficiência" },
];

const COTAS_PJ = [
  { value: "pj_socios", label: "I – PJ em que mais da metade dos(as) sócios são pessoas negras, indígenas ou com deficiência" },
  { value: "pj_lideranca", label: "II – PJ ou coletivos com pessoas negras, indígenas ou com deficiência em posições de liderança" },
  { value: "pj_equipe", label: "III – PJ ou coletivos com equipe majoritariamente composta por pessoas negras, indígenas ou com deficiência" },
];

interface Membro { nome: string; cpf: string; }

interface ProjectRegistrationFormProps {
  projectId: string;
  editalType: string; // "premiacao" | "fomento"
  onComplete: () => void;
  onCancel?: () => void;
}

type FormState = Record<string, any>;

function getSubSteps(editalType: string) {
  if (editalType === "fomento") {
    return [
      "Tipo de Proponente",
      "Dados Pessoais",
      "Dados Bancários",
      "Mini Currículo e Perfil",
      "Autodeclarações",
      "Escolaridade e Renda",
      "Coletivo e Categoria",
      "Público-Alvo e Acessibilidade",
      "Residência e Testemunha",
    ];
  }
  // premiacao
  return [
    "Tipo de Proponente",
    "Dados Pessoais",
    "Dados Bancários",
    "Mini Currículo e Perfil",
    "Autodeclarações",
    "Coletivo e Público-Alvo",
    "Acessibilidade e Locais",
    "Dados Complementares",
  ];
}

const ProjectRegistrationForm = ({ projectId, editalType, onComplete, onCancel }: ProjectRegistrationFormProps) => {
  const [subStep, setSubStep] = useState(0);
  const [form, setForm] = useState<FormState>({
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
    escolaridade: "", renda_mensal: "", programa_social: "", programa_social_outro: "",
    funcao_profissao: "", funcao_profissao_outro: "",
    bio: "",
    representa_coletivo: false,
    nome_grupo: "", ano_criacao_coletivo: "", qtd_pessoas_coletivo: "",
    perfil_publico: "",
    acao_cultural_publico: [] as string[],
    acessibilidade_arquitetonica: [] as string[],
    acessibilidade_comunicacional: [] as string[],
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const { user } = useAuth();

  const SUB_STEPS = getSubSteps(editalType);
  const totalSubSteps = SUB_STEPS.length;

  // Load existing registration or pre-fill from profile
  useEffect(() => {
    if (!user || dataLoaded) return;
    const load = async () => {
      // Check if registration already exists for this project
      const { data: reg } = await supabase
        .from("project_registrations")
        .select("*")
        .eq("project_id", projectId)
        .single();

      if (reg) {
        // Load existing registration
        const fields = Object.keys(form);
        const loaded: FormState = { ...form };
        for (const key of fields) {
          if ((reg as any)[key] !== undefined && (reg as any)[key] !== null) {
            loaded[key] = (reg as any)[key];
          }
        }
        setForm(loaded);
        if (reg.membros_coletivo && Array.isArray(reg.membros_coletivo) && (reg.membros_coletivo as any[]).length > 0) {
          setMembros(reg.membros_coletivo as unknown as Membro[]);
        }
      } else {
        // Pre-fill from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (profile) {
          setForm(prev => ({
            ...prev,
            full_name: profile.full_name || "",
            nome_social: profile.nome_social || "",
            cpf: profile.cpf || "",
            rg: profile.rg || "",
            rg_orgao: profile.rg_orgao || "",
            data_nascimento: profile.data_nascimento || "",
            email_contato: profile.email_contato || "",
            telefone: profile.telefone || "",
            endereco: profile.endereco || "",
            numero: profile.numero || "",
            complemento: profile.complemento || "",
            bairro: profile.bairro || "",
            cep: profile.cep || "",
            city: profile.city || "",
            state: profile.state || "",
            banco: profile.banco || "",
            agencia: profile.agencia || "",
            conta_bancaria: profile.conta_bancaria || "",
            tipo_conta_bancaria: profile.tipo_conta_bancaria || "",
            person_type: profile.person_type || "",
            razao_social: profile.razao_social || "",
            nome_fantasia: profile.nome_fantasia || "",
            cnpj: profile.cnpj || "",
          }));
        }
      }
      setDataLoaded(true);
    };
    load();
  }, [user, dataLoaded, projectId]);

  const update = (key: string, val: string | boolean | string[]) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleArray = (key: string, value: string) => {
    const arr = (form[key] as string[]) || [];
    if (arr.includes(value)) update(key, arr.filter(v => v !== value));
    else update(key, [...arr, value]);
  };

  const addMembro = () => setMembros(p => [...p, { nome: "", cpf: "" }]);
  const removeMembro = (i: number) => setMembros(p => p.filter((_, idx) => idx !== i));
  const updateMembro = (i: number, key: keyof Membro, val: string) => {
    setMembros(p => p.map((m, idx) => idx === i ? { ...m, [key]: val } : m));
  };

  const handleSave = async (andContinue = false) => {
    if (!user) return;
    setLoading(true);
    try {
      const comunidade = form.comunidade_tradicional === "Outro" ? form.comunidade_tradicional_outro : form.comunidade_tradicional;
      const funcao = form.funcao_profissao === "Outro" ? form.funcao_profissao_outro : form.funcao_profissao;
      const genero = form.genero === "Outro" ? form.genero_outro : form.genero;
      const programaSocial = form.programa_social === "Outro" ? form.programa_social_outro : form.programa_social;

      const regData: Record<string, any> = {
        project_id: projectId,
        user_id: user.id,
        person_type: form.person_type,
        full_name: form.full_name, nome_social: form.nome_social || null,
        cpf: form.cpf, rg: form.rg, rg_orgao: form.rg_orgao,
        data_nascimento: form.data_nascimento || null,
        email_contato: form.email_contato, telefone: form.telefone,
        endereco: form.endereco, numero: form.numero, complemento: form.complemento || null,
        bairro: form.bairro, cep: form.cep, city: form.city, state: form.state,
        banco: form.banco, agencia: form.agencia, conta_bancaria: form.conta_bancaria,
        tipo_conta_bancaria: form.tipo_conta_bancaria || null,
        cnpj_mei: form.cnpj_mei || null,
        categoria_inscricao: form.categoria_inscricao,
        concorre_cotas: form.concorre_cotas,
        cota_tipo: form.concorre_cotas ? form.cota_tipo : null,
        comunidade_tradicional: comunidade || null,
        genero: genero,
        lgbtqiapn: form.lgbtqiapn_tipo !== "Não se aplica." && form.lgbtqiapn_tipo !== "",
        lgbtqiapn_tipo: form.lgbtqiapn_tipo || null,
        raca_cor_etnia: form.raca_cor_etnia,
        pcd: form.pcd,
        pcd_tipo: form.pcd ? (form.pcd_tipo === "Outro" ? form.pcd_tipo_outro : form.pcd_tipo) : null,
        escolaridade: form.escolaridade || null,
        renda_mensal: form.renda_mensal || null,
        programa_social: programaSocial || null,
        funcao_profissao: funcao, bio: form.bio,
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
        acessibilidade_descricao: form.acessibilidade_descricao || null,
        locais_execucao: form.locais_execucao || null,
        membros_coletivo: form.representa_coletivo ? membros.filter(m => m.nome) : null,
        tempo_residencia_municipio: form.tempo_residencia_municipio || null,
        testemunha_nome: form.testemunha_nome || null,
        testemunha_cpf: form.testemunha_cpf || null,
        testemunha_rg: form.testemunha_rg || null,
        testemunha_telefone: form.testemunha_telefone || null,
        testemunha_endereco: form.testemunha_endereco || null,
      };

      if (form.person_type === "PJ") {
        regData.razao_social = form.razao_social;
        regData.nome_fantasia = form.nome_fantasia;
        regData.cnpj = form.cnpj;
        regData.num_representantes_legais = form.num_representantes_legais;
      }

      // Upsert - insert or update
      const { data: existing } = await supabase
        .from("project_registrations")
        .select("id")
        .eq("project_id", projectId)
        .single();

      let error;
      if (existing) {
        // Remove key fields from update payload to avoid conflicts
        const { project_id: _pid, user_id: _uid, ...updateData } = regData;
        const result = await supabase.from("project_registrations").update(updateData as any).eq("id", existing.id);
        error = result.error;
        console.log("Update result:", result);
      } else {
        const result = await supabase.from("project_registrations").insert(regData as any);
        error = result.error;
        console.log("Insert result:", result);
      }

      if (error) {
        console.error("Save error:", error);
        throw error;
      }
      
      // Also update profile with basic info (name, etc) for convenience
      await supabase.from("profiles").update({
        full_name: form.full_name,
        person_type: form.person_type,
        onboarding_completed: true,
      } as any).eq("user_id", user.id);

      toast.success("Dados cadastrais salvos para este projeto!");
      if (andContinue) onComplete();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar dados cadastrais");
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = () => {
    if (subStep === 0) return !!form.person_type;
    if (subStep === 1) return !!form.full_name && !!form.cpf;
    return true;
  };

  // ===== RENDER STEP FUNCTIONS =====

  const renderTipoProponente = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Você é pessoa física ou pessoa jurídica? *</Label>
        <RadioGroup value={form.person_type} onValueChange={v => update("person_type", v)} className="flex gap-6">
          <div className="flex items-center gap-2"><RadioGroupItem value="PF" id="pf" /><Label htmlFor="pf">Pessoa Física</Label></div>
          <div className="flex items-center gap-2"><RadioGroupItem value="PJ" id="pj" /><Label htmlFor="pj">Pessoa Jurídica</Label></div>
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
              {(form.person_type === "PJ" && editalType === "fomento" ? COTAS_PJ : COTAS_PF).map(c => (
                <div key={c.value} className="flex items-center gap-2">
                  <RadioGroupItem value={c.value} id={`cota-${c.value}`} />
                  <Label htmlFor={`cota-${c.value}`} className="font-normal text-sm">{c.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </div>
    </div>
  );

  const renderDadosPessoais = () => (
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
      <div className="space-y-2"><Label>Nome artístico ou nome social</Label><Input value={form.nome_social} onChange={e => update("nome_social", e.target.value)} /></div>
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

  const renderDadosBancarios = () => (
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

  const renderMiniCurriculo = () => (
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

  const renderAutodeclaracoes = () => (
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
    </div>
  );

  // === Fomento-specific steps ===
  const renderEscolaridadeRenda = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Qual o seu grau de escolaridade? *</Label>
        <RadioGroup value={form.escolaridade} onValueChange={v => update("escolaridade", v)} className="space-y-1">
          {ESCOLARIDADES.map(e => (
            <div key={e} className="flex items-center gap-2"><RadioGroupItem value={e} id={`esc-${e}`} /><Label htmlFor={`esc-${e}`} className="font-normal text-sm">{e}</Label></div>
          ))}
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>Qual a sua renda mensal fixa individual (média mensal bruta aproximada) nos últimos 3 meses? *</Label>
        <RadioGroup value={form.renda_mensal} onValueChange={v => update("renda_mensal", v)} className="space-y-1">
          {RENDAS.map(r => (
            <div key={r} className="flex items-center gap-2"><RadioGroupItem value={r} id={`renda-${r}`} /><Label htmlFor={`renda-${r}`} className="font-normal text-sm">{r}</Label></div>
          ))}
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>Você é beneficiário de algum programa social? *</Label>
        <RadioGroup value={form.programa_social} onValueChange={v => update("programa_social", v)} className="space-y-1">
          {PROGRAMAS_SOCIAIS.map(p => (
            <div key={p} className="flex items-center gap-2"><RadioGroupItem value={p} id={`prog-${p}`} /><Label htmlFor={`prog-${p}`} className="font-normal text-sm">{p}</Label></div>
          ))}
          <div className="flex items-center gap-2"><RadioGroupItem value="Outro" id="prog-outro" /><Label htmlFor="prog-outro" className="font-normal">Outro</Label></div>
        </RadioGroup>
        {form.programa_social === "Outro" && <Input placeholder="Especifique..." value={form.programa_social_outro} onChange={e => update("programa_social_outro", e.target.value)} className="mt-2" />}
      </div>
    </div>
  );

  const renderColetivoCategoria = () => (
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

      {/* Categoria - diferente por edital */}
      <div className="space-y-2">
        <Label className="font-semibold">Escolha a categoria a que vai concorrer *</Label>
        {editalType === "fomento" ? (
          <div className="space-y-3">
            {CATEGORIAS_FOMENTO.map(cat => (
              <div key={cat.grupo}>
                <p className="text-sm font-semibold text-muted-foreground mb-1">{cat.grupo}</p>
                <RadioGroup value={form.categoria_inscricao} onValueChange={v => update("categoria_inscricao", v)} className="space-y-1 ml-3">
                  {cat.items.map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <RadioGroupItem value={item} id={`cat-${item}`} />
                      <Label htmlFor={`cat-${item}`} className="font-normal text-sm">{item}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        ) : (
          <RadioGroup value={form.categoria_inscricao} onValueChange={v => update("categoria_inscricao", v)}>
            {CATEGORIAS_PREMIACAO.map(c => (
              <div key={c.value} className="flex items-center gap-2"><RadioGroupItem value={c.value} id={`cat-${c.value}`} /><Label htmlFor={`cat-${c.value}`}>{c.label}</Label></div>
            ))}
          </RadioGroup>
        )}
      </div>
    </div>
  );

  const renderPublicoAcessibilidade = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Perfil do público atingido *</Label>
        <Textarea placeholder="Descreva o perfil do público..." value={form.perfil_publico} onChange={e => update("perfil_publico", e.target.value)} rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Ação cultural voltada para algum destes perfis? *</Label>
        <div className="grid grid-cols-1 gap-1">
          {PUBLICO_ALVO.map(p => (
            <div key={p} className="flex items-center gap-2">
              <Checkbox checked={form.acao_cultural_publico.includes(p)} onCheckedChange={() => toggleArray("acao_cultural_publico", p)} id={`pub-${p}`} />
              <Label htmlFor={`pub-${p}`} className="font-normal text-sm cursor-pointer">{p}</Label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-semibold">Acessibilidade arquitetônica:</Label>
        {ACESS_ARQ.map(a => (
          <div key={a} className="flex items-center gap-2">
            <Checkbox checked={form.acessibilidade_arquitetonica.includes(a)} onCheckedChange={() => toggleArray("acessibilidade_arquitetonica", a)} id={`aarq-${a}`} />
            <Label htmlFor={`aarq-${a}`} className="font-normal text-sm cursor-pointer">{a}</Label>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label className="font-semibold">Acessibilidade comunicacional:</Label>
        {ACESS_COM.map(a => (
          <div key={a} className="flex items-center gap-2">
            <Checkbox checked={form.acessibilidade_comunicacional.includes(a)} onCheckedChange={() => toggleArray("acessibilidade_comunicacional", a)} id={`acom-${a}`} />
            <Label htmlFor={`acom-${a}`} className="font-normal text-sm cursor-pointer">{a}</Label>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label className="font-semibold">Acessibilidade atitudinal:</Label>
        {ACESS_ATI.map(a => (
          <div key={a} className="flex items-center gap-2">
            <Checkbox checked={form.acessibilidade_atitudinal.includes(a)} onCheckedChange={() => toggleArray("acessibilidade_atitudinal", a)} id={`aati-${a}`} />
            <Label htmlFor={`aati-${a}`} className="font-normal text-sm cursor-pointer">{a}</Label>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label>Como essas medidas serão implementadas?</Label>
        <Textarea placeholder="Descreva como as medidas de acessibilidade serão implementadas..." value={form.acessibilidade_descricao} onChange={e => update("acessibilidade_descricao", e.target.value)} rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Local onde o projeto será executado *</Label>
        <Textarea placeholder="Informe os espaços culturais e ambientes..." value={form.locais_execucao} onChange={e => update("locais_execucao", e.target.value)} rows={3} />
      </div>
    </div>
  );

  const renderResidenciaTestemunha = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Tempo de residência no município de Goiás</Label>
        <Input placeholder="Ex: 5 anos" value={form.tempo_residencia_municipio} onChange={e => update("tempo_residencia_municipio", e.target.value)} />
      </div>
      <div className="border rounded-lg p-4 space-y-3">
        <Label className="font-semibold">Testemunha (Declaração de Residência)</Label>
        <div className="space-y-2"><Label>Nome da testemunha</Label><Input value={form.testemunha_nome} onChange={e => update("testemunha_nome", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>CPF</Label><Input value={form.testemunha_cpf} onChange={e => update("testemunha_cpf", e.target.value)} /></div>
          <div className="space-y-2"><Label>RG</Label><Input value={form.testemunha_rg} onChange={e => update("testemunha_rg", e.target.value)} /></div>
        </div>
        <div className="space-y-2"><Label>Telefone</Label><Input value={form.testemunha_telefone} onChange={e => update("testemunha_telefone", e.target.value)} /></div>
        <div className="space-y-2"><Label>Endereço</Label><Input value={form.testemunha_endereco} onChange={e => update("testemunha_endereco", e.target.value)} /></div>
      </div>
    </div>
  );

  // Premiação-specific: Coletivo + Público
  const renderColetivoPublicoPremiacao = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Escolha a categoria *</Label>
        <RadioGroup value={form.categoria_inscricao} onValueChange={v => update("categoria_inscricao", v)}>
          {CATEGORIAS_PREMIACAO.map(c => (
            <div key={c.value} className="flex items-center gap-2"><RadioGroupItem value={c.value} id={`cat-${c.value}`} /><Label htmlFor={`cat-${c.value}`}>{c.label}</Label></div>
          ))}
        </RadioGroup>
      </div>
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
            <Label>Membros do coletivo</Label>
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
      <div className="space-y-2">
        <Label>Perfil do público atingido *</Label>
        <Textarea placeholder="Descreva o perfil do público..." value={form.perfil_publico} onChange={e => update("perfil_publico", e.target.value)} rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Ação cultural voltada para algum destes perfis? *</Label>
        <div className="grid grid-cols-1 gap-1">
          {PUBLICO_ALVO.map(p => (
            <div key={p} className="flex items-center gap-2">
              <Checkbox checked={form.acao_cultural_publico.includes(p)} onCheckedChange={() => toggleArray("acao_cultural_publico", p)} id={`pub-${p}`} />
              <Label htmlFor={`pub-${p}`} className="font-normal text-sm cursor-pointer">{p}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Premiação: Acessibilidade + Locais
  const renderAcessibilidadeLocais = () => (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">Marque quais medidas de acessibilidade foram implementadas nos projetos.</p>
      <div className="space-y-2">
        <Label className="font-semibold">Acessibilidade arquitetônica:</Label>
        {ACESS_ARQ.map(a => (
          <div key={a} className="flex items-center gap-2">
            <Checkbox checked={form.acessibilidade_arquitetonica.includes(a)} onCheckedChange={() => toggleArray("acessibilidade_arquitetonica", a)} id={`aarq-${a}`} />
            <Label htmlFor={`aarq-${a}`} className="font-normal text-sm cursor-pointer">{a}</Label>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label className="font-semibold">Acessibilidade comunicacional:</Label>
        {ACESS_COM.map(a => (
          <div key={a} className="flex items-center gap-2">
            <Checkbox checked={form.acessibilidade_comunicacional.includes(a)} onCheckedChange={() => toggleArray("acessibilidade_comunicacional", a)} id={`acom-${a}`} />
            <Label htmlFor={`acom-${a}`} className="font-normal text-sm cursor-pointer">{a}</Label>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label className="font-semibold">Acessibilidade atitudinal:</Label>
        {ACESS_ATI.map(a => (
          <div key={a} className="flex items-center gap-2">
            <Checkbox checked={form.acessibilidade_atitudinal.includes(a)} onCheckedChange={() => toggleArray("acessibilidade_atitudinal", a)} id={`aati-${a}`} />
            <Label htmlFor={`aati-${a}`} className="font-normal text-sm cursor-pointer">{a}</Label>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label>Como essas medidas foram implementadas? *</Label>
        <Textarea placeholder="Descreva..." value={form.acessibilidade_descricao} onChange={e => update("acessibilidade_descricao", e.target.value)} rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Locais onde os projetos foram executados *</Label>
        <Textarea placeholder="Informe os espaços culturais..." value={form.locais_execucao} onChange={e => update("locais_execucao", e.target.value)} rows={3} />
      </div>
    </div>
  );

  // Premiação: Dados complementares (residência + testemunha)
  const renderDadosComplementares = () => renderResidenciaTestemunha();

  // ===== STEP RENDERING =====
  const renderStep = () => {
    if (editalType === "fomento") {
      switch (subStep) {
        case 0: return renderTipoProponente();
        case 1: return renderDadosPessoais();
        case 2: return renderDadosBancarios();
        case 3: return renderMiniCurriculo();
        case 4: return renderAutodeclaracoes();
        case 5: return renderEscolaridadeRenda();
        case 6: return renderColetivoCategoria();
        case 7: return renderPublicoAcessibilidade();
        case 8: return renderResidenciaTestemunha();
        default: return null;
      }
    }
    // premiacao
    switch (subStep) {
      case 0: return renderTipoProponente();
      case 1: return renderDadosPessoais();
      case 2: return renderDadosBancarios();
      case 3: return renderMiniCurriculo();
      case 4: return renderAutodeclaracoes();
      case 5: return renderColetivoPublicoPremiacao();
      case 6: return renderAcessibilidadeLocais();
      case 7: return renderDadosComplementares();
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 mb-4">
        {SUB_STEPS.map((name, i) => (
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

      <div className="overflow-y-auto max-h-[60vh] pr-2">
        <AnimatePresence mode="wait">
          <motion.div key={subStep} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between pt-4 border-t border-border mt-4">
        <div className="flex gap-2">
          {onCancel && subStep === 0 && (
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setSubStep(s => s - 1)} disabled={subStep === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleSave(false)} disabled={loading}>
            {loading ? "Salvando..." : (
              <><Save className="h-4 w-4 mr-1" /> Salvar Rascunho</>
            )}
          </Button>
          {subStep < totalSubSteps - 1 ? (
            <Button size="sm" onClick={() => setSubStep(s => s + 1)} disabled={!canAdvance()}>
              Próximo <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : (
                <><CheckCircle className="h-4 w-4 mr-1" /> Salvar e Continuar</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectRegistrationForm;

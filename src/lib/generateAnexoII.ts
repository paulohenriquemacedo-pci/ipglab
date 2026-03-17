import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

export interface ProfileData {
  full_name?: string | null;
  nome_social?: string | null;
  person_type?: string | null;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  rg?: string | null;
  rg_orgao?: string | null;
  data_nascimento?: string | null;
  email_contato?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  banco?: string | null;
  agencia?: string | null;
  conta_bancaria?: string | null;
  categoria_inscricao?: string | null;
  concorre_cotas?: boolean | null;
  cota_tipo?: string | null;
  comunidade_tradicional?: string | null;
  genero?: string | null;
  lgbtqiapn?: boolean | null;
  lgbtqiapn_tipo?: string | null;
  raca_cor_etnia?: string | null;
  pcd?: boolean | null;
  pcd_tipo?: string | null;
  funcao_profissao?: string | null;
  bio?: string | null;
  representa_coletivo?: boolean | null;
  nome_grupo?: string | null;
  funcao_no_grupo?: string | null;
  ano_criacao_coletivo?: string | null;
  qtd_pessoas_coletivo?: string | null;
  perfil_publico?: string | null;
  acao_cultural_publico?: string[] | null;
  acessibilidade_arquitetonica?: string[] | null;
  acessibilidade_comunicacional?: string[] | null;
  acessibilidade_atitudinal?: string[] | null;
  locais_execucao?: string | null;
  membros_coletivo?: any[] | null;
  trajetoria_acoes?: string | null;
  trajetoria_inicio?: string | null;
  trajetoria_impacto?: string | null;
  trajetoria_outras_areas?: string | null;
  num_representantes_legais?: string | null;
  tempo_residencia_municipio?: string | null;
  testemunha_nome?: string | null;
  testemunha_cpf?: string | null;
  testemunha_rg?: string | null;
  testemunha_telefone?: string | null;
  testemunha_endereco?: string | null;
  artistic_language?: string | null;
  experience_level?: string | null;
}

const val = (v: string | null | undefined | boolean) => {
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  return v || "_______________";
};

const FONT = "Arial";
const PAGE_MARGIN = { top: 1134, bottom: 1134, left: 1134, right: 1134 };

function p(text: string, opts?: { bold?: boolean; size?: number; align?: typeof AlignmentType[keyof typeof AlignmentType]; spacing?: { before?: number; after?: number } }) {
  return new Paragraph({
    alignment: opts?.align || AlignmentType.LEFT,
    spacing: opts?.spacing || { after: 100 },
    children: [new TextRun({ text, bold: opts?.bold, size: opts?.size || 20, font: FONT })],
  });
}

function checkbox(label: string, checked: boolean) {
  return p(`(${checked ? "X" : "  "}) ${label}`);
}

function sectionHeader(text: string) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 300, after: 150 },
    shading: { fill: "D9E2F3" },
    children: [new TextRun({ text, bold: true, size: 22, font: FONT })],
  });
}

function field(label: string, value: string) {
  return p(`${label}: ${value}`, { spacing: { after: 80 } });
}

const CATEGORIAS: Record<string, string> = {
  grupos_coletivos: "Grupos e coletivos culturais",
  festas_populares: "Festas Populares",
  blocos_carnaval: "Blocos de Carnaval",
};

const COTAS: Record<string, string> = {
  negra: "Pessoa negra",
  indigena: "Pessoa indígena",
  pcd: "Pessoa com deficiência",
};

export async function generateAnexoII(profile: ProfileData) {
  const isPJ = profile.person_type === "PJ";
  const enderecoCompleto = [
    profile.endereco, profile.numero, profile.complemento,
    profile.bairro, profile.city, profile.state, profile.cep
  ].filter(Boolean).join(", ");

  const children: Paragraph[] = [];

  // Title
  children.push(
    p("EDITAL DE CHAMAMENTO PÚBLICO N° 02, DE 06 DE MARÇO DE 2026.", { bold: true, size: 24, align: AlignmentType.CENTER, spacing: { after: 100 } }),
    p('EDITAL MARIA ABADIA PEREIRA DA SILVA "BADIINHA"', { bold: true, size: 22, align: AlignmentType.CENTER, spacing: { after: 100 } }),
    p("PREMIAÇÃO PARA GRUPOS E ESPAÇOS ARTÍSTICO-CULTURAIS COM RECURSOS DA PNAB", { size: 18, align: AlignmentType.CENTER, spacing: { after: 100 } }),
    p("ANEXO II – FORMULÁRIO DE INSCRIÇÃO", { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 300 } }),
  );

  // Section 1: Informações do agente cultural
  children.push(sectionHeader("1. INFORMAÇÕES DO AGENTE CULTURAL"));
  children.push(
    p(`Pessoa: ${isPJ ? "( ) Pessoa Física    (X) Pessoa Jurídica" : "(X) Pessoa Física    ( ) Pessoa Jurídica"}`),
  );

  // Dados bancários
  children.push(
    p("", { spacing: { before: 200 } }),
    p("DADOS BANCÁRIOS PARA RECEBIMENTO DO PRÊMIO", { bold: true, spacing: { after: 100 } }),
    field("Banco", val(profile.banco)),
    field("Agência", val(profile.agencia)),
    field("Conta", val(profile.conta_bancaria)),
  );

  // Cotas
  children.push(
    p("", { spacing: { before: 150 } }),
    p(`Vai concorrer às cotas? ${profile.concorre_cotas ? "(X) Sim  ( ) Não" : "( ) Sim  (X) Não"}`),
  );
  if (profile.concorre_cotas) {
    children.push(
      checkbox("Pessoa negra", profile.cota_tipo === "negra"),
      checkbox("Pessoa indígena", profile.cota_tipo === "indigena"),
      checkbox("Pessoa com deficiência", profile.cota_tipo === "pcd"),
    );
  }

  // Categoria
  children.push(
    p("", { spacing: { before: 150 } }),
    p("Escolha a categoria a que vai concorrer:", { bold: true }),
    checkbox("Grupos e coletivos culturais", profile.categoria_inscricao === "grupos_coletivos"),
    checkbox("Festas Populares", profile.categoria_inscricao === "festas_populares"),
    checkbox("Blocos de Carnaval", profile.categoria_inscricao === "blocos_carnaval"),
  );

  // Section: Inscrição PF ou PJ
  if (isPJ) {
    children.push(sectionHeader("INSCRIÇÃO PARA PESSOA JURÍDICA"));
    children.push(
      field("Razão Social", val(profile.razao_social)),
      field("Nome fantasia", val(profile.nome_fantasia)),
      field("CNPJ", val(profile.cnpj)),
      field("Endereço da sede", enderecoCompleto || "_______________"),
      field("Cidade", val(profile.city)),
      field("Estado", val(profile.state)),
      field("Número de representantes legais", val(profile.num_representantes_legais)),
      field("Nome do representante legal", val(profile.full_name)),
      field("CPF do representante legal", val(profile.cpf)),
      field("E-mail do representante legal", val(profile.email_contato)),
      field("Telefone do representante legal", val(profile.telefone)),
    );
  } else {
    children.push(sectionHeader("INSCRIÇÃO PARA PESSOA FÍSICA"));
    children.push(
      field("Nome Completo", val(profile.full_name)),
      field("Nome social ou artístico", val(profile.nome_social)),
      field("CPF", val(profile.cpf)),
      field("RG", val(profile.rg)),
      field("Órgão expedidor", val(profile.rg_orgao)),
      field("Data de nascimento", val(profile.data_nascimento)),
      field("E-mail", val(profile.email_contato)),
      field("Telefone", val(profile.telefone)),
      field("Endereço completo", enderecoCompleto || "_______________"),
      field("CEP", val(profile.cep)),
      field("Cidade", val(profile.city)),
      field("UF", val(profile.state)),
    );
  }

  // Mini currículo
  children.push(
    p("", { spacing: { before: 200 } }),
    p("Mini Currículo:", { bold: true }),
    p(val(profile.bio)),
  );

  // Comunidade tradicional
  const comunidades = [
    "Não pertenço a comunidade tradicional", "Povos Ciganos", "Comunidades Extrativistas",
    "Pescadores(as) Artesanais", "Comunidades Ribeirinhas", "Povos de Terreiro",
    "Comunidades Rurais", "Quilombolas", "Área periférica", "Indígenas",
  ];
  children.push(
    p("", { spacing: { before: 150 } }),
    p("Pertence a alguma comunidade tradicional?", { bold: true }),
    ...comunidades.map(c => checkbox(c, profile.comunidade_tradicional === c)),
  );

  // Gênero
  const generos = ["Mulher cisgênero", "Homem cisgênero", "Homem Transgênero", "Mulher Transgênero", "Pessoa não binária", "Não informar"];
  children.push(
    p("", { spacing: { before: 150 } }),
    p("Gênero:", { bold: true }),
    ...generos.map(g => checkbox(g, profile.genero === g)),
  );

  // LGBTQIAPN+
  const lgbtOpcoes = ["Lésbica", "Gay", "Bissexual", "Transexual", "Queer", "Intersexo", "Assexual", "Pansexual", "Não binário", "+ outras identidades", "Não se aplica"];
  children.push(
    p("", { spacing: { before: 150 } }),
    p("Pessoa LGBTQIAPN+?", { bold: true }),
    ...lgbtOpcoes.map(o => checkbox(o, profile.lgbtqiapn_tipo === o)),
  );

  // Raça
  const racas = ["Branca", "Preta", "Parda", "Indígena", "Amarela"];
  children.push(
    p("", { spacing: { before: 150 } }),
    p("Raça/cor/etnia:", { bold: true }),
    ...racas.map(r => checkbox(r, profile.raca_cor_etnia === r)),
  );

  // PcD
  const pcdTipos = ["Auditiva", "Física", "Intelectual", "Visual", "Múltipla"];
  children.push(
    p("", { spacing: { before: 150 } }),
    p(`Você é Pessoa com Deficiência – PcD? ${profile.pcd ? "(X) Sim  ( ) Não" : "( ) Sim  (X) Não"}`, { bold: true }),
  );
  if (profile.pcd) {
    children.push(
      p("Qual tipo de deficiência?", { bold: true }),
      ...pcdTipos.map(t => checkbox(t, profile.pcd_tipo === t)),
    );
  }

  // Função
  const funcoes = [
    "Artista, Artesão(a), Brincante, Criador(a) e afins",
    "Instrutor(a), oficineiro(a), educador(a) artístico(a)-cultural e afins",
    "Curador(a), Programador(a) e afins",
    "Produtor(a)", "Técnico(a)",
    "Consultor(a), Pesquisador(a) e afins", "Festeiro",
  ];
  children.push(
    p("", { spacing: { before: 150 } }),
    p("Qual a sua principal função/profissão no campo artístico e cultural?", { bold: true }),
    ...funcoes.map(f => checkbox(f, profile.funcao_profissao === f)),
  );

  // Coletivo
  children.push(
    p("", { spacing: { before: 200 } }),
    p(`Você está representando um coletivo (sem CNPJ)? ${profile.representa_coletivo ? "(X) Sim  ( ) Não" : "( ) Sim  (X) Não"}`, { bold: true }),
  );
  if (profile.representa_coletivo) {
    children.push(
      field("Nome do coletivo", val(profile.nome_grupo)),
      field("Ano de Criação", val(profile.ano_criacao_coletivo)),
      field("Quantas pessoas fazem parte", val(profile.qtd_pessoas_coletivo)),
    );
  }

  // Perfil do público
  children.push(
    p("", { spacing: { before: 150 } }),
    p("Perfil do público que é atingido pelos projetos executados:", { bold: true }),
    p(val(profile.perfil_publico)),
  );

  // Ação cultural - público alvo
  const publicoAlvo = [
    "Pessoas vítimas de violência", "Pessoas em situação de pobreza",
    "Pessoas em situação de rua", "Pessoas em restrição/privação de liberdade",
    "Pessoas com deficiência", "Pessoas em sofrimento físico e/ou psíquico",
    "Mulheres", "LGBTQIAPN+", "Povos e comunidades tradicionais",
    "Negros e/ou negras", "Ciganos", "Indígenas",
    "Não é voltada especificamente para um perfil", "Área periférica",
  ];
  children.push(
    p("", { spacing: { before: 150 } }),
    p("Sua ação cultural é voltada prioritariamente para:", { bold: true }),
    ...publicoAlvo.map(pa => checkbox(pa, (profile.acao_cultural_publico || []).includes(pa))),
  );

  // Acessibilidade
  const acessArq = [
    "Rotas acessíveis com espaço de manobra para cadeira de rodas",
    "Piso tátil", "Rampas", "Elevadores adequados para PcD",
    "Corrimãos e guarda-corpos", "Banheiros adaptados para PcD",
    "Vagas de estacionamento para PcD", "Assentos para pessoas obesas",
    "Iluminação adequada",
  ];
  const acessCom = [
    "Língua Brasileira de Sinais - Libras", "Sistema Braille",
    "Sinalização ou comunicação tátil", "Audiodescrição",
    "Legendas", "Linguagem simples", "Textos adaptados para leitores de tela",
  ];
  const acessAti = [
    "Capacitação de equipes atuantes nos projetos culturais",
    "Contratação de profissionais com deficiência e especializados em acessibilidade",
    "Formação e sensibilização de agentes culturais e envolvidos",
    "Outras medidas de eliminação de atitudes capacitistas",
  ];

  children.push(
    p("", { spacing: { before: 200 } }),
    p("Medidas de acessibilidade empregadas nos projetos executados:", { bold: true }),
    p("Acessibilidade arquitetônica:", { bold: true, spacing: { before: 100 } }),
    ...acessArq.map(a => checkbox(a, (profile.acessibilidade_arquitetonica || []).includes(a))),
    p("Acessibilidade comunicacional:", { bold: true, spacing: { before: 100 } }),
    ...acessCom.map(a => checkbox(a, (profile.acessibilidade_comunicacional || []).includes(a))),
    p("Acessibilidade atitudinal:", { bold: true, spacing: { before: 100 } }),
    ...acessAti.map(a => checkbox(a, (profile.acessibilidade_atitudinal || []).includes(a))),
  );

  // Locais
  children.push(
    p("", { spacing: { before: 150 } }),
    p("Locais onde os projetos foram executados:", { bold: true }),
    p(val(profile.locais_execucao)),
  );

  // Membros do coletivo
  if (profile.representa_coletivo && profile.membros_coletivo && profile.membros_coletivo.length > 0) {
    children.push(
      p("", { spacing: { before: 150 } }),
      p("Nome completo e CPF das pessoas que compõem o coletivo:", { bold: true }),
      ...profile.membros_coletivo.map((m: any) => p(`${m.nome || "___"} — CPF: ${m.cpf || "___"}`)),
    );
  }

  // Trajetória cultural
  children.push(
    sectionHeader("2. INFORMAÇÕES SOBRE TRAJETÓRIA CULTURAL"),
    p("2.1 Quais são as suas principais ações e atividades culturais realizadas?", { bold: true, spacing: { before: 150 } }),
    p(val(profile.trajetoria_acoes)),
    p("2.2 Como começou a sua trajetória cultural?", { bold: true, spacing: { before: 150 } }),
    p(val(profile.trajetoria_inicio)),
    p("2.3 Como as ações que você desenvolve transformam a realidade da sua comunidade?", { bold: true, spacing: { before: 150 } }),
    p(val(profile.trajetoria_impacto)),
    p("2.4 Você desenvolveu ações com outras esferas de conhecimento (educação, saúde, etc)?", { bold: true, spacing: { before: 150 } }),
    p(val(profile.trajetoria_outras_areas)),
  );

  // Documentação obrigatória
  children.push(
    sectionHeader("3. DOCUMENTAÇÃO OBRIGATÓRIA"),
    p("Junte documentos que comprovem a sua atuação cultural, tais como cartazes, folders, reportagens, certificados, premiações, entre outros."),
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Anexo_II_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

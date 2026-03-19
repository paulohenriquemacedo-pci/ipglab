import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import type { ProfileData } from "./generateAnexoII";

// Extended profile data for Octo Marques (includes new fields)
export interface OctoMarquesProfileData extends ProfileData {
  escolaridade?: string | null;
  renda_mensal?: string | null;
  programa_social?: string | null;
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

function editalHeader() {
  return [
    p("EDITAL DE CHAMAMENTO PÚBLICO Nº 01, DE 06 DE MARÇO DE 2026.", { bold: true, size: 24, align: AlignmentType.CENTER, spacing: { after: 100 } }),
    p('"EDITAL OCTO MARQUES 110 ANOS"', { bold: true, size: 22, align: AlignmentType.CENTER, spacing: { after: 100 } }),
  ];
}

function signature(name: string) {
  return [
    new Paragraph({ spacing: { before: 600 }, children: [] }),
    p("Goiás, _____ de _______________ de 2026.", { align: AlignmentType.LEFT }),
    new Paragraph({ spacing: { before: 300 }, children: [] }),
    p("NOME", { bold: true }),
    p(val(name), { spacing: { after: 200 } }),
    p("ASSINATURA DO(A) DECLARANTE", { bold: true }),
    p("________________________________________", { spacing: { after: 200 } }),
  ];
}

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };

async function saveDoc(doc: Document, filename: string) {
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

// ===== Shared fields between PF and PJ =====
function buildComunidadeTradicional(profile: OctoMarquesProfileData): Paragraph[] {
  const comunidades = [
    "Não pertenço a comunidade tradicional",
    "Comunidades Extrativistas", "Comunidades Ribeirinhas",
    "Comunidades Rurais", "Área periférica", "Indígenas",
    "Povos Ciganos", "Pescadores(as) Artesanais",
    "Povos de Terreiro", "Quilombolas",
  ];
  const result = [
    p("Pertence a alguma comunidade tradicional?", { bold: true, spacing: { before: 150 } }),
    ...comunidades.map(c => checkbox(c, profile.comunidade_tradicional === c)),
  ];
  if (profile.comunidade_tradicional && !comunidades.includes(profile.comunidade_tradicional)) {
    result.push(checkbox(`Outra: ${profile.comunidade_tradicional}`, true));
  }
  return result;
}

function buildGenero(profile: OctoMarquesProfileData): Paragraph[] {
  const generos = ["Mulher cisgênero", "Homem cisgênero", "Mulher Transgênero", "Homem Transgênero", "Pessoa Não Binária", "Não informar"];
  const result = [
    p("Gênero:", { bold: true, spacing: { before: 150 } }),
    ...generos.map(g => checkbox(g, profile.genero === g)),
  ];
  if (profile.genero && !generos.includes(profile.genero)) {
    result.push(checkbox(`Outro: ${profile.genero}`, true));
  }
  return result;
}

function buildLGBTQIAPN(profile: OctoMarquesProfileData): Paragraph[] {
  const opcoes = [
    "Lésbica", "Gay", "Bissexual", "Transexual", "Queer",
    "Intersexo", "Assexual", "Pansexual", "Não binário",
    '"+" outras identidades e orientações sexuais não mencionadas na sigla.',
    "Não se aplica.",
  ];
  return [
    p("Pessoa LGBTQIAPN+?", { bold: true, spacing: { before: 150 } }),
    ...opcoes.map(o => checkbox(o, profile.lgbtqiapn_tipo === o)),
  ];
}

function buildRaca(profile: OctoMarquesProfileData): Paragraph[] {
  const racas = ["Branca", "Preta", "Parda", "Indígena", "Amarela"];
  return [
    p("Raça, cor ou etnia:", { bold: true, spacing: { before: 150 } }),
    ...racas.map(r => checkbox(r, profile.raca_cor_etnia === r)),
  ];
}

function buildPCD(profile: OctoMarquesProfileData): Paragraph[] {
  const pcdTipos = ["Auditiva", "Física", "Intelectual", "Múltipla", "Visual"];
  const result = [
    p(`Você é uma Pessoa com Deficiência – PcD? ${profile.pcd ? "(X) Sim  ( ) Não" : "( ) Sim  (X) Não"}`, { bold: true, spacing: { before: 150 } }),
  ];
  if (profile.pcd) {
    result.push(
      p("Caso tenha marcado \"sim\", qual tipo de deficiência?", { bold: true }),
      ...pcdTipos.map(t => checkbox(t, profile.pcd_tipo === t)),
    );
    if (profile.pcd_tipo && !pcdTipos.includes(profile.pcd_tipo)) {
      result.push(checkbox(`Outro: ${profile.pcd_tipo}`, true));
    }
  }
  return result;
}

function buildEscolaridade(profile: OctoMarquesProfileData): Paragraph[] {
  const niveis = [
    "Não tenho Educação Formal", "Ensino Fundamental Incompleto",
    "Ensino Fundamental Completo", "Ensino Médio Incompleto",
    "Ensino Médio Completo", "Curso Técnico Completo",
    "Ensino Superior Incompleto", "Ensino Superior Completo",
    "Pós Graduação Incompleta", "Pós-Graduação Completa",
  ];
  return [
    p("Qual o seu grau de escolaridade?", { bold: true, spacing: { before: 150 } }),
    ...niveis.map(n => checkbox(n, profile.escolaridade === n)),
  ];
}

function buildRenda(profile: OctoMarquesProfileData): Paragraph[] {
  const faixas = [
    "Nenhuma renda", "Até 1 salário mínimo",
    "De 1 a 3 salários mínimos", "De 3 a 5 salários mínimos",
    "De 5 a 8 salários mínimos", "De 8 a 10 salários mínimos",
    "Acima de 10 salários mínimos",
  ];
  return [
    p("Qual a sua renda mensal fixa individual (média mensal bruta aproximada) nos últimos 3 meses?", { bold: true, spacing: { before: 150 } }),
    ...faixas.map(f => checkbox(f, profile.renda_mensal === f)),
  ];
}

function buildProgramaSocial(profile: OctoMarquesProfileData): Paragraph[] {
  const programas = ["Não", "Bolsa família", "Benefício de Prestação Continuada"];
  const result = [
    p("Você é beneficiário de algum programa social?", { bold: true, spacing: { before: 150 } }),
    ...programas.map(pg => checkbox(pg, profile.programa_social === pg)),
  ];
  if (profile.programa_social && !programas.includes(profile.programa_social)) {
    result.push(checkbox(`Outro: ${profile.programa_social}`, true));
  }
  return result;
}

function buildCotas(profile: OctoMarquesProfileData, isPJ: boolean): Paragraph[] {
  const result = [
    p(`Vai concorrer às cotas? ${profile.concorre_cotas ? "(X) Sim  ( ) Não" : "( ) Sim  (X) Não"}`, { bold: true, spacing: { before: 150 } }),
  ];
  if (profile.concorre_cotas) {
    if (isPJ) {
      result.push(
        p("Se sim. Qual?", { bold: true }),
        checkbox("I – Pessoas jurídicas em que mais da metade dos(as) sócios são pessoas negras, indígenas ou com deficiência", profile.cota_tipo === "pj_socios"),
        checkbox("II – Pessoas jurídicas ou grupos e coletivos sem CNPJ que possuam pessoas negras, indígenas ou com deficiência em posições de liderança no projeto cultural", profile.cota_tipo === "pj_lideranca"),
        checkbox("III – Pessoas jurídicas ou coletivos sem CNPJ que possuam equipe do projeto cultural majoritariamente composta por pessoas negras, indígenas ou com deficiência", profile.cota_tipo === "pj_equipe"),
      );
    } else {
      result.push(
        p("Se sim. Qual?", { bold: true }),
        checkbox("Pessoa negra", profile.cota_tipo === "negra"),
        checkbox("Pessoa indígena", profile.cota_tipo === "indigena"),
        checkbox("Pessoa com deficiência", profile.cota_tipo === "pcd"),
      );
    }
  }
  return result;
}

function buildFuncaoProfissao(profile: OctoMarquesProfileData): Paragraph[] {
  const funcoes = [
    "Artista, Artesão(a), Brincante, Criador(a) e afins.",
    "Instrutor(a), oficineiro(a), educador(a) artístico(a)-cultural e afins.",
    "Curador(a), Programador(a) e afins.",
    "Produtor(a)", "Gestor(a)", "Técnico(a)",
    "Consultor(a), Pesquisador(a) e afins.",
  ];
  const result = [
    p("Qual a sua principal função/profissão no campo artístico e cultural?", { bold: true, spacing: { before: 150 } }),
    ...funcoes.map(f => checkbox(f, profile.funcao_profissao === f)),
  ];
  if (profile.funcao_profissao && !funcoes.includes(profile.funcao_profissao)) {
    result.push(checkbox(`Outro: ${profile.funcao_profissao}`, true));
  }
  return result;
}

function buildColetivo(profile: OctoMarquesProfileData): Paragraph[] {
  const result = [
    p(`Você está representando um coletivo (sem CNPJ)? ${profile.representa_coletivo ? "(X) Sim  ( ) Não" : "( ) Sim  (X) Não"}`, { bold: true, spacing: { before: 200 } }),
  ];
  if (profile.representa_coletivo) {
    result.push(
      field("Nome do coletivo", val(profile.nome_grupo)),
      field("Ano de Criação", val(profile.ano_criacao_coletivo)),
      field("Quantas pessoas fazem parte do coletivo", val(profile.qtd_pessoas_coletivo)),
    );
    if (profile.membros_coletivo && profile.membros_coletivo.length > 0) {
      result.push(p("Nome completo e CPF das pessoas que compõem o coletivo:", { bold: true }));
      for (const m of profile.membros_coletivo as any[]) {
        result.push(p(`${m.nome || "___"} — CPF: ${m.cpf || "___"}`));
      }
    }
  }
  return result;
}

function buildCategoria(profile: OctoMarquesProfileData): Paragraph[] {
  const categorias = [
    { grupo: "Artes Visuais", items: ["Criação ou exposição artística", "Fotografia", "Arte Urbana", "Performances artísticas"] },
    { grupo: "Artesanato", items: ["Barro / argila / pedra sabão / trabalho manual"] },
    { grupo: "Educação Patrimonial", items: ["Oficinas/ fomento a pesquisas exploratórias / mapeamentos"] },
    { grupo: "Gastronomia", items: ["Gastronomia tradicional / releituras de prato / receitas tradicionais"] },
    { grupo: "Leitura, escrita e oralidade", items: ["Vocalização", "Editoração", "Produção de audiolivros, podcasts literários e literatura sonora"] },
    { grupo: "Cultura Popular", items: ["Dança popular em grupo / grupos de capoeira", "Recolhas de narrativas de histórias, lendas populares e das memórias de pessoas do município"] },
    { grupo: "Música", items: ["Instrumentos", "Apresentação musical de dupla", "Apresentação musical de bandas, grupos e corais", "Circulação, produção e difusão musical"] },
  ];
  const result = [
    p("Escolha a categoria a que vai concorrer:", { bold: true, spacing: { before: 200 } }),
  ];
  for (const cat of categorias) {
    result.push(p(cat.grupo, { bold: true, size: 18, spacing: { before: 100 } }));
    for (const item of cat.items) {
      result.push(checkbox(item, profile.categoria_inscricao === item));
    }
  }
  return result;
}

function buildPublicoAlvo(profile: OctoMarquesProfileData): Paragraph[] {
  const publicoAlvo = [
    "Pessoas vítimas de violência", "Pessoas em situação de pobreza",
    "Pessoas em situação de rua (moradores de rua)",
    "Pessoas em situação de restrição e privação de liberdade (população carcerária)",
    "Pessoas com deficiência", "Pessoas em sofrimento físico e/ou psíquico",
    "Mulheres", "LGBTQIAPN+", "Povos e comunidades tradicionais",
    "Negros e/ou negras", "Ciganos", "Indígenas",
    "Não é voltada especificamente para um perfil, é aberta para todos",
    "Área periférica",
  ];
  return [
    p("Sua ação cultural é voltada prioritariamente para algum destes perfis de público?", { bold: true, spacing: { before: 150 } }),
    ...publicoAlvo.map(pa => checkbox(pa, (profile.acao_cultural_publico || []).includes(pa))),
  ];
}

function buildAcessibilidade(profile: OctoMarquesProfileData): Paragraph[] {
  const acessArq = [
    "rotas acessíveis, com espaço de manobra para cadeira de rodas",
    "piso tátil", "rampas", "elevadores adequados para pessoas com deficiência",
    "corrimãos e guarda-corpos",
    "banheiros femininos e masculinos adaptados para pessoas com deficiência",
    "vagas de estacionamento para pessoas com deficiência",
    "assentos para pessoas obesas", "iluminação adequada",
  ];
  const acessCom = [
    "a Língua Brasileira de Sinais - Libras", "o sistema Braille",
    "o sistema de sinalização ou comunicação tátil", "a audiodescrição",
    "as legendas", "a linguagem simples", "textos adaptados para leitores de tela",
  ];
  const acessAti = [
    "capacitação de equipes atuantes nos projetos culturais",
    "contratação de profissionais com deficiência e profissionais especializados em acessibilidade cultural",
    "formação e sensibilização de agentes culturais, público e todos os envolvidos na cadeia produtiva cultural",
    "outras medidas que visem a eliminação de atitudes capacitistas",
  ];
  const result = [
    p("Medidas de acessibilidade empregadas no projeto", { bold: true, spacing: { before: 200 } }),
    p("Acessibilidade arquitetônica:", { bold: true, spacing: { before: 100 } }),
    ...acessArq.map(a => checkbox(a, (profile.acessibilidade_arquitetonica || []).includes(a))),
    p("Acessibilidade comunicacional:", { bold: true, spacing: { before: 100 } }),
    ...acessCom.map(a => checkbox(a, (profile.acessibilidade_comunicacional || []).includes(a))),
    p("Acessibilidade atitudinal:", { bold: true, spacing: { before: 100 } }),
    ...acessAti.map(a => checkbox(a, (profile.acessibilidade_atitudinal || []).includes(a))),
  ];
  if (profile.acessibilidade_descricao) {
    result.push(
      p("Informe como essas medidas de acessibilidade serão implementadas:", { bold: true, spacing: { before: 150 } }),
      p(profile.acessibilidade_descricao),
    );
  }
  return result;
}

// ===== ANEXO II-A: Pessoa Física =====
export async function generateAnexoIIA(profile: OctoMarquesProfileData) {
  const enderecoCompleto = [
    profile.endereco, profile.numero, profile.complemento,
    profile.bairro, profile.city, profile.state, profile.cep
  ].filter(Boolean).join(", ");

  const children: Paragraph[] = [];

  // Header
  children.push(
    ...editalHeader(),
    p("ANEXO II – A", { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 100 } }),
    p("FORMULÁRIO DE INSCRIÇÃO", { bold: true, size: 24, align: AlignmentType.CENTER, spacing: { after: 80 } }),
    p("PESSOA FÍSICA, MEI OU GRUPO E COLETIVO SEM PERSONALIDADE JURÍDICA (SEM CNPJ)", { size: 18, align: AlignmentType.CENTER, spacing: { after: 300 } }),
  );

  // 1. Dados do Agente Cultural
  children.push(sectionHeader("1. DADOS DO(A) AGENTE CULTURAL"));
  children.push(
    field("Nome Completo", val(profile.full_name)),
    field("Nome artístico ou nome social", val(profile.nome_social)),
    field("CPF", val(profile.cpf)),
  );
  if (profile.cnpj_mei) {
    children.push(field("CNPJ (MEI)", val(profile.cnpj_mei)));
  }
  children.push(
    field("RG", val(profile.rg)),
    field("Data de nascimento", val(profile.data_nascimento)),
    field("E-mail", val(profile.email_contato)),
    field("Telefone/Whatsapp/Telegram", val(profile.telefone)),
    field("Endereço completo", enderecoCompleto || "_______________"),
    field("CEP", val(profile.cep)),
    field("Cidade", val(profile.city)),
    field("Estado", val(profile.state)),
  );

  // Mini currículo
  children.push(
    p("Mini Currículo:", { bold: true, spacing: { before: 200 } }),
    p("(Escreva aqui um resumo do seu currículo destacando as principais atuações culturais realizadas.)", { size: 18 }),
    p(val(profile.bio)),
  );

  // Comunidade, gênero, LGBTQIAPN+, raça, PcD
  children.push(...buildComunidadeTradicional(profile));
  children.push(...buildGenero(profile));
  children.push(...buildLGBTQIAPN(profile));
  children.push(...buildRaca(profile));
  children.push(...buildPCD(profile));
  children.push(...buildEscolaridade(profile));
  children.push(...buildRenda(profile));
  children.push(...buildProgramaSocial(profile));
  children.push(...buildCotas(profile, false));
  children.push(...buildFuncaoProfissao(profile));
  children.push(...buildColetivo(profile));

  // 2. Dados do Projeto (campos em branco para preenchimento)
  children.push(sectionHeader("2. DADOS DO PROJETO"));
  children.push(
    field("Nome do Projeto", "_______________"),
  );
  children.push(...buildCategoria(profile));
  children.push(
    p("Descrição do projeto:", { bold: true, spacing: { before: 200 } }),
    p("(Na descrição, você deve apresentar informações gerais sobre o seu projeto.)"),
    p(""),
    p("Objetivos do projeto:", { bold: true, spacing: { before: 200 } }),
    p("(Informe o que você pretende alcançar com a realização do projeto. Proponha entre três e cinco objetivos.)"),
    p(""),
    p("Metas:", { bold: true, spacing: { before: 200 } }),
    p("(Detalhe os objetivos em pequenas ações quantificáveis.)"),
    p(""),
    p("Perfil do público a ser atingido pelo projeto:", { bold: true, spacing: { before: 200 } }),
    p(""),
  );

  children.push(...buildPublicoAlvo(profile));
  children.push(...buildAcessibilidade(profile));

  children.push(
    p("Local onde o projeto será executado:", { bold: true, spacing: { before: 200 } }),
    p(val(profile.locais_execucao)),
    p("Previsão do período de execução do projeto:", { bold: true, spacing: { before: 200 } }),
    field("Data de início", "_______________"),
    field("Data final", "_______________"),
    p("Equipe:", { bold: true, spacing: { before: 200 } }),
    p("(Informe quais são os profissionais que atuarão no projeto.)"),
    p(""),
    p("Cronograma de Execução:", { bold: true, spacing: { before: 200 } }),
    p("(Descreva os passos a serem seguidos para execução do projeto.)"),
    p(""),
    p("Estratégia de divulgação:", { bold: true, spacing: { before: 200 } }),
    p("(Apresente os meios que serão utilizados para divulgar o projeto.)"),
    p(""),
  );

  // 3. Planilha Orçamentária
  children.push(sectionHeader("3. PLANILHA ORÇAMENTÁRIA"));
  children.push(
    p("Preencha a tabela informando todas as despesas indicando as metas/etapas às quais elas estão relacionadas."),
    p(""),
  );

  // 4. Documentos Complementares
  children.push(sectionHeader("4. DOCUMENTOS COMPLEMENTARES"));
  children.push(
    p("Caso queira, junte documentos que auxiliam na análise do seu projeto e da sua equipe técnica."),
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Anexo_IIA_OctoMarques_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

// ===== ANEXO II-B: Pessoa Jurídica =====
export async function generateAnexoIIB(profile: OctoMarquesProfileData) {
  const enderecoSede = [
    profile.endereco, profile.numero, profile.complemento,
    profile.bairro
  ].filter(Boolean).join(", ");

  const children: Paragraph[] = [];

  children.push(
    ...editalHeader(),
    p("ANEXO II – B", { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 100 } }),
    p("FORMULÁRIO DE INSCRIÇÃO", { bold: true, size: 24, align: AlignmentType.CENTER, spacing: { after: 80 } }),
    p("PESSOA JURÍDICA (COM OU SEM FINS LUCRATIVOS)", { size: 18, align: AlignmentType.CENTER, spacing: { after: 300 } }),
  );

  // 1. Dados do Agente Cultural (PJ)
  children.push(sectionHeader("1. DADOS DO(A) AGENTE CULTURAL"));
  children.push(
    field("Razão Social", val(profile.razao_social)),
    field("Nome Fantasia", val(profile.nome_fantasia)),
    field("CNPJ", val(profile.cnpj)),
    field("Endereço da sede", enderecoSede || "_______________"),
    field("Bairro", val(profile.bairro)),
    field("Cidade/Estado", `${val(profile.city)} / ${val(profile.state)}`),
    field("CEP", val(profile.cep)),
    field("Nome do representante legal", val(profile.full_name)),
    field("Nº de representantes legais", val(profile.num_representantes_legais)),
    field("CPF do representante legal", val(profile.cpf)),
    field("E-mail do representante legal", val(profile.email_contato)),
    field("Telefone/Whatsapp/Telegram do representante legal", val(profile.telefone)),
  );

  // Mini currículo
  children.push(
    p("Mini Currículo:", { bold: true, spacing: { before: 200 } }),
    p(val(profile.bio)),
  );

  // Campos do representante legal (prefixed "do(a) representante legal")
  children.push(...buildComunidadeTradicional(profile));
  children.push(...buildGenero(profile));
  children.push(...buildLGBTQIAPN(profile));
  children.push(...buildRaca(profile));
  children.push(...buildPCD(profile));
  children.push(...buildEscolaridade(profile));
  children.push(...buildCotas(profile, true));
  children.push(...buildFuncaoProfissao(profile));

  // 2. Dados do Projeto
  children.push(sectionHeader("2. DADOS DO PROJETO"));
  children.push(field("Nome do Projeto", "_______________"));
  children.push(...buildCategoria(profile));
  children.push(
    p("Descrição do projeto:", { bold: true, spacing: { before: 200 } }),
    p(""),
    p("Objetivos do projeto:", { bold: true, spacing: { before: 200 } }),
    p(""),
    p("Metas:", { bold: true, spacing: { before: 200 } }),
    p(""),
    p("Perfil do público a ser atingido pelo projeto:", { bold: true, spacing: { before: 200 } }),
    p(""),
  );
  children.push(...buildPublicoAlvo(profile));
  children.push(...buildAcessibilidade(profile));
  children.push(
    p("Local onde o projeto será executado:", { bold: true, spacing: { before: 200 } }),
    p(val(profile.locais_execucao)),
    field("Data de início", "_______________"),
    field("Data final", "_______________"),
    p("Equipe:", { bold: true, spacing: { before: 200 } }),
    p(""),
    p("Cronograma de Execução:", { bold: true, spacing: { before: 200 } }),
    p(""),
    p("Estratégia de divulgação:", { bold: true, spacing: { before: 200 } }),
    p(""),
  );

  // 3. Planilha Orçamentária
  children.push(sectionHeader("3. PLANILHA ORÇAMENTÁRIA"));
  children.push(p("Preencha a tabela informando todas as despesas."), p(""));

  // 4. Documentos Complementares
  children.push(sectionHeader("4. DOCUMENTOS COMPLEMENTARES"));
  children.push(p("Caso queira, junte documentos que auxiliem na análise do seu projeto e da sua equipe técnica."));

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Anexo_IIB_OctoMarques_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

// ===== ANEXO VI – Declaração de Representação de Grupo ou Coletivo =====
export async function generateAnexoVI_OctoMarques(profile: OctoMarquesProfileData) {
  const membros = (profile.membros_coletivo || []) as { nome: string; cpf: string; rg?: string; rg_orgao?: string; data_nascimento?: string }[];

  const memberRows = membros.filter(m => m.nome).map(m =>
    new TableRow({
      children: [
        new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: `Nome: ${m.nome}`, size: 18, font: FONT })] })] }),
        new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: `RG: ${m.rg || "___"}  Órgão: ${m.rg_orgao || "___"}`, size: 18, font: FONT })] })] }),
      ],
    })
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        ...editalHeader(),
        p("ANEXO VI", { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 100 } }),
        p("DECLARAÇÃO DE REPRESENTAÇÃO DE GRUPO OU COLETIVO", { bold: true, size: 22, align: AlignmentType.CENTER, spacing: { after: 300 } }),
        p("Observação: Essa declaração deve ser preenchida somente por proponentes que sejam um grupo ou coletivo sem personalidade jurídica, ou seja, sem CNPJ.", { size: 18, spacing: { after: 200 } }),
        field("Grupo artístico", val(profile.nome_grupo)),
        field("Nome do representante integrante do grupo ou coletivo artístico", val(profile.full_name)),
        field("RG", val(profile.rg)),
        field("CPF", val(profile.cpf)),
        field("E-mail", val(profile.email_contato)),
        field("Telefone", val(profile.telefone)),
        p("", { spacing: { before: 200 } }),
        p(`Os(As) declarantes abaixo-assinados(as), integrantes do grupo artístico ${val(profile.nome_grupo)}, elegem a pessoa indicada no campo "REPRESENTANTE" como único(a) representante neste edital, conferindo-lhe poderes para cumprir todos os procedimentos exigidos nas etapas do edital, inclusive assinatura do Termo de Execução Cultural, troca de comunicações, podendo assumir compromissos, obrigações, receber pagamentos e dar quitação, renunciar direitos e qualquer outro ato relacionado ao referido edital.`),
        p("", { spacing: { before: 200 } }),
        p("Integrantes do coletivo:", { bold: true }),
        ...membros.filter(m => m.nome).map(m =>
          p(`Nome: ${m.nome} | RG: ${m.rg || "___"} | CPF: ${m.cpf || "___"} | Nasc.: ${m.data_nascimento || "___"}`)
        ),
        ...signature(val(profile.full_name)),
      ],
    }],
  });
  await saveDoc(doc, `Anexo_VI_Coletivo_OctoMarques_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

// ===== ANEXO VII – Declaração Étnico-Racial =====
export async function generateAnexoVII_OctoMarques(profile: OctoMarquesProfileData) {
  const raca = profile.raca_cor_etnia || "";
  const isNegro = ["Preta", "Parda"].includes(raca);
  const isIndigena = raca === "Indígena";
  let tipoDeclarado = "_______________";
  if (isNegro) tipoDeclarado = "NEGRO(A)";
  else if (isIndigena) tipoDeclarado = "INDÍGENA";

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        ...editalHeader(),
        p("ANEXO VII", { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 100 } }),
        p("DECLARAÇÃO ÉTNICO-RACIAL", { bold: true, size: 24, align: AlignmentType.CENTER, spacing: { after: 80 } }),
        p("PARA AGENTES CULTURAIS CONCORRENTES ÀS COTAS ÉTNICO-RACIAIS - NEGROS(AS) E INDÍGENAS", { size: 18, align: AlignmentType.CENTER, spacing: { after: 300 } }),
        p(`Eu, ${val(profile.full_name)}, CPF nº ${val(profile.cpf)}, RG nº ${val(profile.rg)}, DECLARO para fins de participação no Edital nº 01/2026 – Octo Marques 110 Anos, que sou ${tipoDeclarado}.`),
        p("", { spacing: { before: 200 } }),
        p("Por ser verdade, assino a presente declaração e estou ciente de que a apresentação de declaração falsa pode acarretar desclassificação do edital e aplicação de sanções criminais."),
        ...signature(val(profile.full_name)),
      ],
    }],
  });
  await saveDoc(doc, `Anexo_VII_EtnicoRacial_OctoMarques_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

// ===== ANEXO VIII – Declaração de Pessoa com Deficiência =====
export async function generateAnexoVIII_OctoMarques(profile: OctoMarquesProfileData) {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        ...editalHeader(),
        p("ANEXO VIII", { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 100 } }),
        p("DECLARAÇÃO DE PESSOA COM DEFICIÊNCIA", { bold: true, size: 24, align: AlignmentType.CENTER, spacing: { after: 80 } }),
        p("PARA AGENTES CULTURAIS CONCORRENTES ÀS COTAS DESTINADAS A PESSOAS COM DEFICIÊNCIA", { size: 18, align: AlignmentType.CENTER, spacing: { after: 300 } }),
        p(`Eu, ${val(profile.full_name)}, CPF nº ${val(profile.cpf)}, RG nº ${val(profile.rg)}, DECLARO para fins de participação no Edital nº 01/2026 – Octo Marques 110 Anos, que sou pessoa com deficiência. Envio, em anexo, documento comprobatório.`),
        p("", { spacing: { before: 200 } }),
        p("Por ser verdade, assino a presente declaração e estou ciente de que a apresentação de declaração falsa pode acarretar desclassificação do edital e aplicação de sanções criminais."),
        ...signature(val(profile.full_name)),
      ],
    }],
  });
  await saveDoc(doc, `Anexo_VIII_PcD_OctoMarques_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

// ===== ANEXO IX – Declaração de Residência =====
export async function generateAnexoIX_OctoMarques(profile: OctoMarquesProfileData) {
  const enderecoCompleto = [
    profile.endereco, profile.numero, profile.complemento,
    profile.bairro, profile.city, profile.state, profile.cep
  ].filter(Boolean).join(", ");

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        ...editalHeader(),
        p("ANEXO IX", { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 100 } }),
        p("DECLARAÇÃO DE RESIDÊNCIA", { bold: true, size: 24, align: AlignmentType.CENTER, spacing: { after: 300 } }),
        p(`Eu, ${val(profile.full_name)}, CPF nº ${val(profile.cpf)}, RG nº ${val(profile.rg)}, residente e domiciliado(a) ${enderecoCompleto || "_______________"}, declaro para os devidos fins, que resido, no mínimo, há 2 (dois) anos no Município de Goiás. Por ser expressão da verdade, firmo a presente declaração.`),
        p("", { spacing: { before: 300 } }),
        p("Testemunha", { bold: true }),
        field("Nome", val(profile.testemunha_nome)),
        p(`CPF: ${val(profile.testemunha_cpf)}    RG: ${val(profile.testemunha_rg)}    Telefone: ${val(profile.testemunha_telefone)}`),
        field("Endereço", val(profile.testemunha_endereco)),
        ...signature(val(profile.full_name)),
      ],
    }],
  });
  await saveDoc(doc, `Anexo_IX_Residencia_OctoMarques_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

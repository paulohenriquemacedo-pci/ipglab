import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

export interface ProfileData {
  full_name?: string | null;
  person_type?: string | null;
  razao_social?: string | null;
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
  comunidade_tradicional?: string | null;
  genero?: string | null;
  raca_cor_etnia?: string | null;
  lgbtqiapn?: boolean | null;
  pcd?: boolean | null;
  pcd_tipo?: string | null;
  artistic_language?: string | null;
  bio?: string | null;
  nome_grupo?: string | null;
  funcao_no_grupo?: string | null;
  tempo_residencia_municipio?: string | null;
}

const val = (v: string | null | undefined | boolean) => {
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  return v || "_______________";
};

const PAGE_MARGIN = { top: 1134, bottom: 1134, left: 1134, right: 1134 };
const FONT = "Arial";

function p(text: string, opts?: { bold?: boolean; size?: number; align?: typeof AlignmentType[keyof typeof AlignmentType]; spacing?: { before?: number; after?: number } }) {
  return new Paragraph({
    alignment: opts?.align || AlignmentType.JUSTIFIED,
    spacing: opts?.spacing || { after: 120 },
    children: [new TextRun({ text, bold: opts?.bold, size: opts?.size || 22, font: FONT })],
  });
}

function title(text: string) {
  return p(text, { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 200 } });
}

function subtitle(text: string) {
  return p(text, { size: 22, align: AlignmentType.CENTER, spacing: { after: 400 } });
}

function signature(name: string) {
  return [
    new Paragraph({ spacing: { before: 800 }, children: [] }),
    p("________________________________________", { align: AlignmentType.CENTER }),
    p(name || "Nome do Agente Cultural", { align: AlignmentType.CENTER, spacing: { after: 100 } }),
    p("CPF: _______________", { align: AlignmentType.CENTER }),
    new Paragraph({ spacing: { before: 300 }, children: [] }),
    p("Cidade de Goiás, _____ de _______________ de ________", { align: AlignmentType.CENTER }),
  ];
}

async function saveDoc(doc: Document, filename: string) {
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

// ===== ANEXO IV – Declaração de Representação de Grupo/Coletivo =====
export async function generateAnexoIV(profile: ProfileData) {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        title("ANEXO IV – DECLARAÇÃO DE REPRESENTAÇÃO DE GRUPO/COLETIVO"),
        subtitle('Edital de Premiação "Badiinha" – PNAB Cidade de Goiás'),

        p(`Eu, ${val(profile.full_name)}, portador(a) do CPF nº ${val(profile.cpf)}, RG nº ${val(profile.rg)}, expedido por ${val(profile.rg_orgao)}, residente e domiciliado(a) em ${val(profile.endereco)}, ${val(profile.numero)}, ${val(profile.bairro)}, ${val(profile.city)} – ${val(profile.state)}, CEP ${val(profile.cep)}, DECLARO, para os devidos fins, que sou representante legítimo(a) do grupo/coletivo cultural denominado:`),

        p(val(profile.nome_grupo), { bold: true, size: 24, align: AlignmentType.CENTER, spacing: { before: 300, after: 300 } }),

        p(`Exercendo a função de ${val(profile.funcao_no_grupo)} no referido grupo/coletivo.`),

        p("Declaro ainda que fui escolhido(a) pelos demais integrantes do grupo/coletivo para representá-lo(a) junto ao Edital de Premiação \"Badiinha\" – PNAB Cidade de Goiás, estando autorizado(a) a assinar documentos, receber premiação e praticar todos os atos necessários à participação no referido edital.", { spacing: { before: 200 } }),

        p("Declaro, sob as penas da lei, que as informações prestadas são verdadeiras e assumo inteira responsabilidade pelas mesmas.", { spacing: { before: 200 } }),

        ...signature(val(profile.full_name)),
      ],
    }],
  });
  await saveDoc(doc, `Anexo_IV_Representacao_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

// ===== ANEXO V – Declaração Étnico-Racial =====
export async function generateAnexoV(profile: ProfileData) {
  const raca = profile.raca_cor_etnia || "";
  const isNegro = ["preta", "parda"].includes(raca.toLowerCase());
  const isIndigena = raca.toLowerCase() === "indigena" || raca.toLowerCase() === "indígena";

  let declaracaoTipo = "_______________";
  if (isNegro) declaracaoTipo = "pessoa negra (preta/parda)";
  else if (isIndigena) declaracaoTipo = "pessoa indígena";

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        title("ANEXO V – AUTODECLARAÇÃO ÉTNICO-RACIAL"),
        subtitle('Edital de Premiação "Badiinha" – PNAB Cidade de Goiás'),

        p(`Eu, ${val(profile.full_name)}, portador(a) do CPF nº ${val(profile.cpf)}, RG nº ${val(profile.rg)}, expedido por ${val(profile.rg_orgao)}, DECLARO, para os devidos fins de participação no Edital de Premiação "Badiinha" – PNAB Cidade de Goiás, que me autodeclaro como:`),

        p(declaracaoTipo, { bold: true, size: 24, align: AlignmentType.CENTER, spacing: { before: 300, after: 300 } }),

        ...(profile.comunidade_tradicional ? [
          p(`Pertencente à comunidade tradicional: ${val(profile.comunidade_tradicional)}.`, { spacing: { before: 200 } }),
        ] : []),

        p("Declaro que estou ciente de que, caso seja constatada falsidade na presente declaração, estarei sujeito(a) às penalidades legais, inclusive a desclassificação do processo seletivo e restituição de valores eventualmente recebidos.", { spacing: { before: 200 } }),

        p("A presente declaração é feita de livre e espontânea vontade, e é verdadeira, sob as penas da lei.", { spacing: { before: 200 } }),

        ...signature(val(profile.full_name)),
      ],
    }],
  });
  await saveDoc(doc, `Anexo_V_Etnico_Racial_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

// ===== ANEXO VI – Declaração de Pessoa com Deficiência =====
export async function generateAnexoVI(profile: ProfileData) {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        title("ANEXO VI – DECLARAÇÃO DE PESSOA COM DEFICIÊNCIA (PcD)"),
        subtitle('Edital de Premiação "Badiinha" – PNAB Cidade de Goiás'),

        p(`Eu, ${val(profile.full_name)}, portador(a) do CPF nº ${val(profile.cpf)}, RG nº ${val(profile.rg)}, expedido por ${val(profile.rg_orgao)}, DECLARO, para os devidos fins de participação no Edital de Premiação "Badiinha" – PNAB Cidade de Goiás, que sou pessoa com deficiência, conforme descrito abaixo:`),

        p(`Tipo de deficiência: ${val(profile.pcd_tipo)}`, { bold: true, spacing: { before: 300, after: 300 } }),

        p("Declaro que a deficiência informada não me impede de exercer as atividades culturais relacionadas à minha inscrição no presente edital.", { spacing: { before: 200 } }),

        p("Declaro estar ciente de que poderei ser convocado(a) para avaliação por equipe multiprofissional designada pela Secretaria Municipal de Cultura, Esporte, Lazer e Juventude de Goiás, para fins de comprovação da deficiência declarada.", { spacing: { before: 200 } }),

        p("Declaro, sob as penas da lei, que as informações prestadas nesta declaração são verdadeiras e assumo inteira responsabilidade pelas mesmas.", { spacing: { before: 200 } }),

        ...signature(val(profile.full_name)),
      ],
    }],
  });
  await saveDoc(doc, `Anexo_VI_PcD_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

// ===== ANEXO VII – Declaração de Residência =====
export async function generateAnexoVII(profile: ProfileData) {
  const enderecoCompleto = [
    profile.endereco, profile.numero, profile.complemento,
    profile.bairro, profile.city, profile.state, profile.cep
  ].filter(Boolean).join(", ");

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        title("ANEXO VII – DECLARAÇÃO DE RESIDÊNCIA"),
        subtitle('Edital de Premiação "Badiinha" – PNAB Cidade de Goiás'),

        p(`Eu, ${val(profile.full_name)}, portador(a) do CPF nº ${val(profile.cpf)}, RG nº ${val(profile.rg)}, expedido por ${val(profile.rg_orgao)}, DECLARO, para os devidos fins de comprovação junto ao Edital de Premiação "Badiinha" – PNAB Cidade de Goiás, que resido no seguinte endereço:`),

        p(enderecoCompleto || "_______________", { bold: true, spacing: { before: 300, after: 300 } }),

        p(`Declaro que resido no Município de Goiás – GO há ${val(profile.tempo_residencia_municipio)} anos, atendendo ao requisito mínimo de 02 (dois) anos de residência exigido pelo edital.`, { spacing: { before: 200 } }),

        p("Declaro estar ciente de que a falsidade da presente declaração pode implicar em sanções penais, cíveis e administrativas, previstas na legislação vigente, além da desclassificação do processo seletivo e restituição de valores eventualmente recebidos.", { spacing: { before: 200 } }),

        p("A presente declaração é feita de livre e espontânea vontade, e é verdadeira, sob as penas da lei.", { spacing: { before: 200 } }),

        ...signature(val(profile.full_name)),
      ],
    }],
  });
  await saveDoc(doc, `Anexo_VII_Residencia_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

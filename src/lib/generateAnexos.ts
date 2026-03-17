import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import type { ProfileData } from "./generateAnexoII";

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
  return p(text, { bold: true, size: 24, align: AlignmentType.CENTER, spacing: { after: 100 } });
}

function editalHeader() {
  return [
    title("EDITAL DE CHAMAMENTO PÚBLICO N° 02, DE 06 DE MARÇO DE 2026."),
    title('EDITAL MARIA ABADIA PEREIRA DA SILVA "BADIINHA"'),
    p("PREMIAÇÃO PARA GRUPOS E ESPAÇOS ARTÍSTICO-CULTURAIS COM RECURSOS DA PNAB (LEI Nº 14.399/2022)", { size: 18, align: AlignmentType.CENTER, spacing: { after: 200 } }),
  ];
}

function signature(name: string) {
  return [
    new Paragraph({ spacing: { before: 600 }, children: [] }),
    p("NOME", { bold: true, align: AlignmentType.LEFT }),
    p(val(name), { align: AlignmentType.LEFT, spacing: { after: 300 } }),
    p("ASSINATURA DO DECLARANTE", { bold: true, align: AlignmentType.LEFT }),
    p("________________________________________", { align: AlignmentType.LEFT, spacing: { after: 200 } }),
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    p("Goiás, _____ de _______________ de 2026.", { align: AlignmentType.LEFT }),
  ];
}

async function saveDoc(doc: Document, filename: string) {
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };

// ===== ANEXO IV – Declaração de Representação de Grupo ou Coletivo =====
export async function generateAnexoIV(profile: ProfileData) {
  const membros = (profile.membros_coletivo || []) as { nome: string; cpf: string }[];

  const tableRows = [
    new TableRow({
      children: ["NOME DO INTEGRANTE", "CPF", "TELEFONE", "ASSINATURAS"].map(text =>
        new TableCell({
          borders,
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, font: FONT })] })],
        })
      ),
    }),
    ...membros.filter(m => m.nome).map(m =>
      new TableRow({
        children: [
          m.nome, m.cpf || "___", "_______________", ""
        ].map(text =>
          new TableCell({
            borders,
            children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: FONT })] })],
          })
        ),
      })
    ),
    // Empty row for additional entries
    new TableRow({
      children: ["", "", "", ""].map(text =>
        new TableCell({
          borders,
          children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: FONT })] })],
        })
      ),
    }),
  ];

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        ...editalHeader(),
        p("ANEXO IV", { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 100 } }),
        p("DECLARAÇÃO DE REPRESENTAÇÃO DE GRUPO OU COLETIVO ARTÍSTICO-CULTURAL", { bold: true, size: 22, align: AlignmentType.CENTER, spacing: { after: 300 } }),

        p(`GRUPO ARTÍSTICO: ${val(profile.nome_grupo)}`, { bold: true, spacing: { after: 150 } }),
        p(`NOME DO REPRESENTANTE INTEGRANTE DO GRUPO OU COLETIVO ARTÍSTICO: ${val(profile.full_name)}`, { spacing: { after: 150 } }),

        p("DADOS PESSOAIS DO REPRESENTANTE LEGAL:", { bold: true, spacing: { before: 200, after: 100 } }),
        p(`IDENTIDADE: ${val(profile.rg)}`),
        p(`CPF: ${val(profile.cpf)}`),
        p(`E-MAIL: ${val(profile.email_contato)}`),
        p(`TELEFONE: ${val(profile.telefone)}`),

        p("", { spacing: { before: 200 } }),
        p(`Os declarantes abaixo-assinados, integrantes do grupo artístico ${val(profile.nome_grupo)}, elegem a pessoa indicada no campo "REPRESENTANTE" como único representante neste edital, outorgando-lhe poderes para fazer cumprir todos os procedimentos exigidos nas etapas do edital, inclusive assinatura de recibo, troca de comunicações, podendo assumir compromissos, obrigações, transigir, receber pagamentos e dar quitação, renunciar direitos e qualquer outro ato relacionado ao referido edital. Os declarantes informam que não incorrem em quaisquer das vedações do item de participação previstas no edital.`),

        p("", { spacing: { before: 200 } }),
        new Table({
          width: { size: 10000, type: WidthType.DXA },
          rows: tableRows,
        }),

        ...signature(val(profile.full_name)),
      ],
    }],
  });
  await saveDoc(doc, `Anexo_IV_Representacao_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

// ===== ANEXO V – Declaração Étnico-Racial =====
// (Note: The official document labels this as "ANEXO VI" but it's the 5th attachment)
export async function generateAnexoV(profile: ProfileData) {
  const raca = profile.raca_cor_etnia || "";
  const isNegro = ["Preta", "Parda"].includes(raca);
  const isIndigena = raca === "Indígena";

  let tipoDeclarado = "_______________";
  if (isNegro) tipoDeclarado = "pessoa NEGRA";
  else if (isIndigena) tipoDeclarado = "pessoa INDÍGENA";

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        ...editalHeader(),
        p("ANEXO V – DECLARAÇÃO ÉTNICO-RACIAL", { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 200 } }),
        p("(Para agentes culturais optantes pelas cotas étnico-raciais – pessoas negras ou pessoas indígenas)", { size: 18, align: AlignmentType.CENTER, spacing: { after: 300 } }),

        p(`Eu, ${val(profile.full_name)}, CPF nº ${val(profile.cpf)}, RG nº ${val(profile.rg)}, DECLARO para fins de participação no Edital Maria Abadia Pereira da Silva "Badiinha" que sou ${tipoDeclarado}.`),

        p("", { spacing: { before: 200 } }),
        p("Por ser verdade, assino a presente declaração e estou ciente de que a apresentação de declaração falsa pode acarretar desclassificação do edital e aplicação de sanções criminais."),

        ...signature(val(profile.full_name)),
      ],
    }],
  });
  await saveDoc(doc, `Anexo_V_Etnico_Racial_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

// ===== ANEXO VI – Declaração Pessoa com Deficiência =====
export async function generateAnexoVI(profile: ProfileData) {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        ...editalHeader(),
        p("ANEXO VI – DECLARAÇÃO PESSOA COM DEFICIÊNCIA", { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 200 } }),
        p("(Para agentes culturais concorrentes às cotas destinadas a pessoas com deficiência)", { size: 18, align: AlignmentType.CENTER, spacing: { after: 300 } }),

        p(`Eu, ${val(profile.full_name)}, CPF nº ${val(profile.cpf)}, RG nº ${val(profile.rg)}, DECLARO para fins de participação no Edital 02/2026 Maria Abadia Pereira da Silva "Badiinha" que sou pessoa com deficiência.`),

        p("", { spacing: { before: 200 } }),
        p("Por ser verdade, assino a presente declaração e estou ciente de que a apresentação de declaração falsa pode acarretar desclassificação do edital e aplicação de sanções criminais."),

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

  // Testemunha table
  const testemunhaContent = [
    p("Testemunha", { bold: true, spacing: { before: 300, after: 100 } }),
    p(`Nome: ${val(profile.testemunha_nome)}`),
    p(`CPF: ${val(profile.testemunha_cpf)}    RG: ${val(profile.testemunha_rg)}    Telefone: ${val(profile.testemunha_telefone)}`),
    p(`Endereço: ${val(profile.testemunha_endereco)}`),
  ];

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        ...editalHeader(),
        p("ANEXO VII", { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 100 } }),
        p("DECLARAÇÃO DE RESIDÊNCIA", { bold: true, size: 24, align: AlignmentType.CENTER, spacing: { after: 300 } }),

        p(`Eu, ${val(profile.full_name)}, CPF nº ${val(profile.cpf)}, RG nº ${val(profile.rg)}, residente e domiciliado(a) ${enderecoCompleto || "_______________"}, declaro para os devidos fins, que resido, no mínimo, há 2 (dois) anos no Município de Goiás. Por ser expressão da verdade, firmo a presente declaração.`),

        ...testemunhaContent,

        ...signature(val(profile.full_name)),
      ],
    }],
  });
  await saveDoc(doc, `Anexo_VII_Residencia_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

// ===== ANEXO IX – Declaração de Indicação/Nomeação de Festeiro =====
export async function generateAnexoIX(profile: ProfileData) {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children: [
        ...editalHeader(),
        p("ANEXO IX", { bold: true, size: 28, align: AlignmentType.CENTER, spacing: { after: 100 } }),
        p("DECLARAÇÃO DE INDICAÇÃO/NOMEAÇÃO DE FESTEIRO", { bold: true, size: 22, align: AlignmentType.CENTER, spacing: { after: 300 } }),

        p(`Declaramos, para os devidos fins, que ${val(profile.full_name)}, portador(a) do RG nº ${val(profile.rg)} e CPF nº ${val(profile.cpf)}, foi indicado(a)/nomeado(a) para exercer a função de Festeiro(a) da festividade de _______________, a realizar-se em _______________, no período de _______________.`),

        p("", { spacing: { before: 200 } }),
        p("E, para constar, firmamos a presente declaração juntamente com as testemunhas abaixo assinadas."),

        p("", { spacing: { before: 200 } }),
        p("Goiás, _____ de _______________ de 2026.", { align: AlignmentType.LEFT }),

        new Paragraph({ spacing: { before: 600 }, children: [] }),
        p("________________________________________", { align: AlignmentType.CENTER }),
        p("Festeiro(a) Nomeado(a)", { align: AlignmentType.CENTER, spacing: { after: 400 } }),

        p("________________________________________", { align: AlignmentType.CENTER }),
        p("Declarante/Responsável pela Nomeação", { align: AlignmentType.CENTER, spacing: { after: 400 } }),

        p("Testemunhas:", { bold: true, spacing: { before: 300, after: 150 } }),

        p("Nome: _______________________________________________"),
        p("CPF: ________________________________________________"),
        p("Assinatura da testemunha 1: __________________________", { spacing: { after: 300 } }),

        p("Nome: _______________________________________________"),
        p("CPF: ________________________________________________"),
        p("Assinatura da testemunha 2: __________________________"),
      ],
    }],
  });
  await saveDoc(doc, `Anexo_IX_Festeiro_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

interface ProfileData {
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
}

const val = (v: string | null | undefined | boolean) => {
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  return v || "_______________";
};

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };

function row(label: string, value: string, colSpan = 1) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 3200, type: WidthType.DXA },
        borders,
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: "Arial" })] })],
      }),
      new TableCell({
        width: { size: 6800, type: WidthType.DXA },
        borders,
        columnSpan: colSpan,
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: "Arial" })] })],
      }),
    ],
  });
}

function headerRow(text: string) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 10000, type: WidthType.DXA },
        columnSpan: 2,
        borders,
        shading: { fill: "D9E2F3" },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true, size: 22, font: "Arial" })],
        })],
      }),
    ],
  });
}

export async function generateAnexoII(profile: ProfileData) {
  const enderecoCompleto = [
    profile.endereco, profile.numero, profile.complemento, profile.bairro,
    profile.city, profile.state, profile.cep
  ].filter(Boolean).join(", ");

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "ANEXO II – FORMULÁRIO DE INSCRIÇÃO", bold: true, size: 28, font: "Arial" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: 'Edital de Premiação "Badiinha" – PNAB Cidade de Goiás', size: 22, font: "Arial" })],
        }),

        new Table({
          width: { size: 10000, type: WidthType.DXA },
          rows: [
            headerRow("1. DADOS DO AGENTE CULTURAL"),
            row("Tipo", profile.person_type === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"),
            row("Nome completo", val(profile.full_name)),
            ...(profile.person_type === "PJ" ? [
              row("Razão Social", val(profile.razao_social)),
              row("CNPJ", val(profile.cnpj)),
            ] : []),
            row("CPF", val(profile.cpf)),
            row("RG", `${val(profile.rg)} — Órgão: ${val(profile.rg_orgao)}`),
            row("Data de nascimento", val(profile.data_nascimento)),
            row("E-mail", val(profile.email_contato)),
            row("Telefone", val(profile.telefone)),

            headerRow("2. ENDEREÇO"),
            row("Endereço completo", enderecoCompleto || "_______________"),

            headerRow("3. DADOS BANCÁRIOS"),
            row("Banco", val(profile.banco)),
            row("Agência", val(profile.agencia)),
            row("Conta", val(profile.conta_bancaria)),

            headerRow("4. AUTODECLARAÇÕES"),
            row("Gênero", val(profile.genero)),
            row("Raça/Cor/Etnia", val(profile.raca_cor_etnia)),
            row("Comunidade tradicional", val(profile.comunidade_tradicional)),
            row("LGBTQIAPN+", val(profile.lgbtqiapn)),
            row("Pessoa com deficiência", val(profile.pcd)),
            ...(profile.pcd ? [row("Tipo de deficiência", val(profile.pcd_tipo))] : []),

            headerRow("5. ATUAÇÃO ARTÍSTICA"),
            row("Linguagem artística", val(profile.artistic_language)),
            row("Mini-bio", val(profile.bio)),
          ],
        }),

        new Paragraph({ spacing: { before: 600 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "________________________________________", size: 20, font: "Arial" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Assinatura do Agente Cultural", size: 20, font: "Arial" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `Cidade de Goiás, _____ de _______________ de ________`, size: 20, font: "Arial" })],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Anexo_II_${(profile.full_name || "agente").replace(/\s+/g, "_")}.docx`);
}

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface BudgetItem {
  descricao: string;
  justificativa: string;
  unidade: string;
  valor_unitario: number;
  quantidade: number;
  referencia_preco: string;
}

export function generateBudgetXlsx(items: BudgetItem[]) {
  const header = [
    "DESCRIÇÃO DO ITEM",
    "JUSTIFICATIVA",
    "UNIDADE DE MEDIDA",
    "VALOR UNITÁRIO",
    "QNTD.",
    "VALOR TOTAL",
    "REFERÊNCIA (OPCIONAL)",
  ];

  const rows: any[][] = [];

  // 6 empty rows to match original spacing
  for (let i = 0; i < 6; i++) rows.push([]);

  rows.push(header);

  let totalGeral = 0;

  for (const item of items) {
    const valorTotal = item.quantidade * item.valor_unitario;
    totalGeral += valorTotal;
    rows.push([
      item.descricao || "",
      item.justificativa || "",
      item.unidade || "",
      item.valor_unitario || 0,
      item.quantidade || 0,
      valorTotal,
      item.referencia_preco || "",
    ]);
  }

  // Fill remaining rows to match original (up to ~35 data rows)
  const remaining = Math.max(0, 35 - items.length);
  for (let i = 0; i < remaining; i++) {
    rows.push(["", "", "", "", "", 0, ""]);
  }

  // TOTAL row
  rows.push(["TOTAL", "", "", "", "", totalGeral, ""]);
  rows.push([]);
  rows.push([]);
  rows.push(["ATENÇÃO: A PLANILHA POSSUI AUTOSSOMA E DEVE SER IMPRESSA EM ORIENTAÇÃO PAISAGEM"]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws["!cols"] = [
    { wch: 30 }, // Descrição
    { wch: 40 }, // Justificativa
    { wch: 18 }, // Unidade
    { wch: 15 }, // Valor Unit
    { wch: 8 },  // Qtd
    { wch: 15 }, // Valor Total
    { wch: 20 }, // Referência
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Planilha1");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, "Planilha_Orcamentaria.xlsx");
}
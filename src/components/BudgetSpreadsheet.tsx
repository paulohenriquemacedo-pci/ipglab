import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateBudgetXlsx } from "@/lib/generateBudgetXlsx";

interface BudgetItem {
  id: string;
  descricao: string;
  justificativa: string;
  unidade: string;
  valor_unitario: number;
  quantidade: number;
  referencia_preco: string;
}

interface BudgetSpreadsheetProps {
  projectId: string;
  maxBudget?: number | null;
  editalType?: string;
  stepNumber?: number;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function createEmptyBudgetItem(): BudgetItem {
  return {
    id: generateId(),
    descricao: "",
    justificativa: "",
    unidade: "",
    valor_unitario: 0,
    quantidade: 1,
    referencia_preco: "",
  };
}

function normalizeBudgetItem(item: Partial<BudgetItem>): BudgetItem {
  return {
    id: item.id || generateId(),
    descricao: item.descricao || "",
    justificativa: item.justificativa || "",
    unidade: item.unidade || "",
    valor_unitario: typeof item.valor_unitario === "number" && Number.isFinite(item.valor_unitario) ? item.valor_unitario : 0,
    quantidade: typeof item.quantidade === "number" && Number.isFinite(item.quantidade) ? item.quantidade : 1,
    referencia_preco: item.referencia_preco || "",
  };
}

function parseBudgetItems(content: string | null): BudgetItem[] {
  if (!content) return [createEmptyBudgetItem()];

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => normalizeBudgetItem(item));
    }
  } catch {
    // Ignore invalid JSON and start with an empty row.
  }

  return [createEmptyBudgetItem()];
}

function hasBudgetDraft(items: BudgetItem[]) {
  return items.some((item) =>
    item.descricao.trim().length > 0 ||
    item.justificativa.trim().length > 0 ||
    item.referencia_preco.trim().length > 0 ||
    item.valor_unitario > 0
  );
}

const BudgetSpreadsheet = ({ projectId, maxBudget, editalType, stepNumber = 11 }: BudgetSpreadsheetProps) => {
  const [items, setItems] = useState<BudgetItem[]>(() => [createEmptyBudgetItem()]);
  const [saving, setSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const skipNextAutoSaveRef = useRef(true);

  void editalType;

  useEffect(() => {
    let isMounted = true;
    skipNextAutoSaveRef.current = true;
    setHasLoaded(false);

    const load = async () => {
      const { data, error } = await supabase
        .from("project_sections")
        .select("content")
        .eq("project_id", projectId)
        .eq("step_number", stepNumber)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("BudgetSpreadsheet load error:", error);
        setItems([createEmptyBudgetItem()]);
        setHasLoaded(true);
        return;
      }

      setItems(parseBudgetItems(data?.content ?? null));
      setHasLoaded(true);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [projectId, stepNumber]);

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyBudgetItem()]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: string | number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const saveBudget = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!hasLoaded) return false;

    setSaving(true);

    try {
      const content = JSON.stringify(items);
      const is_completed = items.some((item) => item.descricao.trim().length > 0 && item.valor_unitario > 0);

      const { data: existingSection, error: selectError } = await supabase
        .from("project_sections")
        .select("id")
        .eq("project_id", projectId)
        .eq("step_number", stepNumber)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existingSection?.id) {
        const { data: updatedSection, error: updateError } = await supabase
          .from("project_sections")
          .update({ content, is_completed })
          .eq("id", existingSection.id)
          .select("id")
          .maybeSingle();

        if (updateError) throw updateError;
        if (!updatedSection) throw new Error("Nenhum registro foi atualizado na planilha orçamentária.");
      } else {
        const { data: insertedSection, error: insertError } = await supabase
          .from("project_sections")
          .insert({
            project_id: projectId,
            step_number: stepNumber,
            step_name: "Planilha Orçamentária",
            content,
            is_completed,
          })
          .select("id")
          .maybeSingle();

        if (insertError) throw insertError;
        if (!insertedSection) throw new Error("Nenhum registro foi criado para a planilha orçamentária.");
      }

      if (!silent) {
        toast.success("Planilha orçamentária salva!");
      }

      return true;
    } catch (error) {
      console.error("BudgetSpreadsheet save error:", error);
      toast.error("Erro ao salvar planilha");
      return false;
    } finally {
      setSaving(false);
    }
  }, [hasLoaded, items, projectId, stepNumber]);

  useEffect(() => {
    if (!hasLoaded) return;

    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }

    if (!hasBudgetDraft(items)) return;

    const timer = setTimeout(() => {
      void saveBudget({ silent: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasLoaded, items, saveBudget]);

  const total = items.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0);
  const isOverBudget = maxBudget ? total > maxBudget : false;
  const budgetPercent = maxBudget ? (total / maxBudget) * 100 : 0;
  const formatCurrency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Planilha Orçamentária</h3>
          <p className="text-sm text-muted-foreground">
            Preencha os itens conforme o modelo oficial. A planilha possui autossoma.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => generateBudgetXlsx(items)} size="sm" variant="ghost" disabled={!hasLoaded || items.length === 0}>
            <Download className="mr-1 h-4 w-4" /> Baixar .xlsx
          </Button>
          <Button onClick={() => void saveBudget()} disabled={saving || !hasLoaded} size="sm" variant="outline">
            <Save className="mr-1 h-4 w-4" /> Salvar
          </Button>
        </div>
      </div>

      {maxBudget && (
        <Card className={isOverBudget ? "border-destructive" : ""}>
          <CardContent className="px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Limite do edital</span>
              <span className="text-sm">{formatCurrency(maxBudget)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${isOverBudget ? "bg-destructive" : budgetPercent > 80 ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOverBudget ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Acima do limite!</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Dentro do limite</span>
                  </>
                )}
              </div>
              <span className={`text-sm font-semibold ${isOverBudget ? "text-destructive" : ""}`}>
                {formatCurrency(total)} ({budgetPercent.toFixed(1)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="hidden gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-[1fr_1fr_100px_100px_80px_100px_100px_40px]">
          <span>Descrição do Item</span>
          <span>Justificativa</span>
          <span>Unid. Medida</span>
          <span>Valor Unit.</span>
          <span>Qtd.</span>
          <span>Valor Total</span>
          <span>Referência</span>
          <span></span>
        </div>

        {items.map((item) => (
          <Card key={item.id} className="p-3">
            <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[1fr_1fr_100px_100px_80px_100px_100px_40px]">
              <Input
                value={item.descricao}
                onChange={(event) => updateItem(item.id, "descricao", event.target.value)}
                placeholder="Ex: Fotógrafo"
                className="h-9 text-sm"
              />

              <Input
                value={item.justificativa}
                onChange={(event) => updateItem(item.id, "justificativa", event.target.value)}
                placeholder="Justificativa do item"
                className="h-9 text-sm"
              />

              <Input
                value={item.unidade}
                onChange={(event) => updateItem(item.id, "unidade", event.target.value)}
                placeholder="Serviço"
                className="h-9 text-sm"
              />

              <Input
                type="number"
                min={0}
                step={0.01}
                value={item.valor_unitario || ""}
                onChange={(event) => updateItem(item.id, "valor_unitario", parseFloat(event.target.value) || 0)}
                placeholder="R$ 0,00"
                className="h-9 text-sm"
              />

              <Input
                type="number"
                min={1}
                value={item.quantidade}
                onChange={(event) => updateItem(item.id, "quantidade", parseInt(event.target.value, 10) || 0)}
                className="h-9 text-sm"
              />

              <div className="flex items-center h-9 px-2 text-sm font-medium bg-muted rounded-md">
                {formatCurrency(item.quantidade * item.valor_unitario)}
              </div>

              <Input
                value={item.referencia_preco}
                onChange={(event) => updateItem(item.id, "referencia_preco", event.target.value)}
                placeholder="(opcional)"
                className="h-9 text-sm"
              />

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.id)}
                disabled={items.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addItem} className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Adicionar Item
      </Button>

      <Card>
        <CardContent className="px-4 py-3">
          <div className="flex justify-between text-sm font-semibold">
            <span>TOTAL</span>
            <span className={isOverBudget ? "text-destructive" : ""}>{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetSpreadsheet;

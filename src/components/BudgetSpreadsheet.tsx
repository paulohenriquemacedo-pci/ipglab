import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BudgetItem {
  id: string;
  categoria: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  justificativa: string;
  referencia_preco: string;
}

interface BudgetSpreadsheetProps {
  projectId: string;
  maxBudget?: number | null;
  editalType?: string;
}

const CATEGORIAS_ORCAMENTO = [
  "Cachê artístico",
  "Serviços técnicos",
  "Material de consumo",
  "Transporte",
  "Alimentação",
  "Hospedagem",
  "Divulgação",
  "Locação de equipamentos",
  "Locação de espaço",
  "Figurino/Adereços",
  "Cenografia",
  "Produção audiovisual",
  "Impressão/Gráfica",
  "Encargos/Impostos",
  "Outros",
];

const UNIDADES = ["Unidade", "Hora", "Diária", "Mês", "Serviço", "Kit", "Lote", "Pessoa"];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const BudgetSpreadsheet = ({ projectId, maxBudget, editalType }: BudgetSpreadsheetProps) => {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Load saved budget from project_sections
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("project_sections")
        .select("content")
        .eq("project_id", projectId)
        .eq("step_number", 6)
        .single();
      if (data?.content) {
        try {
          const parsed = JSON.parse(data.content);
          if (Array.isArray(parsed)) setItems(parsed);
        } catch { /* not JSON, ignore */ }
      }
      if (items.length === 0) {
        setItems([{ id: generateId(), categoria: "", descricao: "", unidade: "Unidade", quantidade: 1, valor_unitario: 0, justificativa: "", referencia_preco: "" }]);
      }
    };
    load();
  }, [projectId]);

  const addItem = () => {
    setItems(prev => [...prev, { id: generateId(), categoria: "", descricao: "", unidade: "Unidade", quantidade: 1, valor_unitario: 0, justificativa: "", referencia_preco: "" }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const total = items.reduce((sum, i) => sum + (i.quantidade * i.valor_unitario), 0);
  const isOverBudget = maxBudget ? total > maxBudget : false;
  const budgetPercent = maxBudget ? (total / maxBudget) * 100 : 0;

  const saveBudget = useCallback(async () => {
    setSaving(true);
    try {
      await supabase
        .from("project_sections")
        .update({
          content: JSON.stringify(items),
          is_completed: items.length > 0 && items.some(i => i.descricao && i.valor_unitario > 0),
        })
        .eq("project_id", projectId)
        .eq("step_number", 6);
      toast.success("Planilha orçamentária salva!");
    } catch {
      toast.error("Erro ao salvar planilha");
    } finally {
      setSaving(false);
    }
  }, [items, projectId]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (items.length > 0 && items.some(i => i.descricao)) {
        saveBudget();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [items]);

  const formatCurrency = (val: number) => val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Group items by category for summary
  const categoryTotals = items.reduce<Record<string, number>>((acc, item) => {
    if (item.categoria) {
      acc[item.categoria] = (acc[item.categoria] || 0) + item.quantidade * item.valor_unitario;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      {/* Budget summary header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Planilha Orçamentária</h3>
          <p className="text-sm text-muted-foreground">
            Adicione os itens de despesa do projeto. Os valores devem ser condizentes com as práticas de mercado.
          </p>
        </div>
        <Button onClick={saveBudget} disabled={saving} size="sm" variant="outline">
          <Save className="h-4 w-4 mr-1" /> Salvar
        </Button>
      </div>

      {/* Budget limit indicator */}
      {maxBudget && (
        <Card className={isOverBudget ? "border-destructive" : ""}>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Limite do edital</span>
              <span className="text-sm">{formatCurrency(maxBudget)}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOverBudget ? "bg-destructive" : budgetPercent > 80 ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {isOverBudget ? (
                  <><AlertTriangle className="h-4 w-4 text-destructive" /><span className="text-sm text-destructive font-medium">Acima do limite!</span></>
                ) : (
                  <><CheckCircle className="h-4 w-4 text-primary" /><span className="text-sm text-muted-foreground">Dentro do limite</span></>
                )}
              </div>
              <span className={`text-sm font-semibold ${isOverBudget ? "text-destructive" : ""}`}>
                {formatCurrency(total)} ({budgetPercent.toFixed(1)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items table */}
      <div className="space-y-3">
        {/* Header */}
        <div className="hidden md:grid md:grid-cols-[180px_1fr_100px_80px_120px_40px] gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          <span>Categoria</span>
          <span>Descrição</span>
          <span>Unidade</span>
          <span>Qtd.</span>
          <span>Valor Unit.</span>
          <span></span>
        </div>

        {items.map((item, idx) => (
          <Card key={item.id} className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_100px_80px_120px_40px] gap-2 items-center">
              <Select value={item.categoria} onValueChange={v => updateItem(item.id, "categoria", v)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_ORCAMENTO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Input
                value={item.descricao}
                onChange={e => updateItem(item.id, "descricao", e.target.value)}
                placeholder="Descrição do item"
                className="text-sm h-9"
              />

              <Select value={item.unidade} onValueChange={v => updateItem(item.id, "unidade", v)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min={1}
                value={item.quantidade}
                onChange={e => updateItem(item.id, "quantidade", parseInt(e.target.value) || 0)}
                className="text-sm h-9"
              />

              <Input
                type="number"
                min={0}
                step={0.01}
                value={item.valor_unitario || ""}
                onChange={e => updateItem(item.id, "valor_unitario", parseFloat(e.target.value) || 0)}
                placeholder="R$ 0,00"
                className="text-sm h-9"
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
            <div className="text-right mt-1 md:hidden">
              <span className="text-xs text-muted-foreground">Subtotal: </span>
              <span className="text-sm font-medium">{formatCurrency(item.quantidade * item.valor_unitario)}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground font-semibold">Justificativa e Especificidade</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Por que este item é essencial para o projeto?"
                  value={item.justificativa || ""}
                  onChange={e => updateItem(item.id, "justificativa", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground font-semibold">Referência de Preço</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Ex: Tabela SATED, Pesquisa de Mercado, Link..."
                  value={item.referencia_preco || ""}
                  onChange={e => updateItem(item.id, "referencia_preco", e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addItem} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Adicionar Item
      </Button>

      {/* Category summary */}
      {Object.keys(categoryTotals).length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Resumo por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {Object.entries(categoryTotals).map(([cat, val]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{cat}</span>
                  <span className="font-medium">{formatCurrency(val)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                <span>TOTAL GERAL</span>
                <span className={isOverBudget ? "text-destructive" : ""}>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetSpreadsheet;

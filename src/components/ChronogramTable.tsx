import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChronogramItem {
  id: string;
  data_inicial: string;
  data_final: string;
  atividade: string;
  etapa: string;
}

interface ChronogramTableProps {
  projectId: string;
}

const ETAPAS = ["Pré-Produção", "Produção", "Pós-Produção", "Outra"];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const ChronogramTable = ({ projectId }: ChronogramTableProps) => {
  const [items, setItems] = useState<ChronogramItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("project_sections")
        .select("content")
        .eq("project_id", projectId)
        .eq("step_number", 5) // Shared save for step 5
        .single();
      
      if (data?.content) {
        try {
          const parsed = JSON.parse(data.content);
          if (parsed && Array.isArray(parsed.chronogram)) {
            setItems(parsed.chronogram);
          } else if (Array.isArray(parsed)) {
            // Legacy/fallback
            setItems(parsed);
          }
        } catch { /* not JSON */ }
      }
      if (items.length === 0) {
        setItems([{ id: generateId(), data_inicial: "", data_final: "", atividade: "", etapa: "Pré-Produção" }]);
      }
    };
    load();
  }, [projectId]);

  const saveChronogram = useCallback(async () => {
    setSaving(true);
    try {
      // Fetch existing content to merge with TeamTable data if present
      const { data: existingData } = await supabase
        .from("project_sections")
        .select("content")
        .eq("project_id", projectId)
        .eq("step_number", 5)
        .single();

      let parsedContent: any = {};
      try {
        if (existingData?.content) parsedContent = JSON.parse(existingData.content);
      } catch { }

      parsedContent.chronogram = items;

      await supabase
        .from("project_sections")
        .update({
          content: JSON.stringify(parsedContent),
          is_completed: items.length > 0 && items.some(i => i.atividade.length > 0),
        })
        .eq("project_id", projectId)
        .eq("step_number", 5);
      
      toast.success("Cronograma salvo com sucesso!");
    } catch {
      toast.error("Erro ao salvar cronograma");
    } finally {
      setSaving(false);
    }
  }, [items, projectId]);

  // Auto-save periodically
  useEffect(() => {
    const timer = setTimeout(() => {
      if (items.length > 0 && items.some(i => i.atividade)) {
        saveChronogram();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [items, saveChronogram]);

  const addItem = () => {
    setItems(prev => [...prev, { id: generateId(), data_inicial: "", data_final: "", atividade: "", etapa: "Pré-Produção" }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ChronogramItem, value: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Plano de Trabalho - Cronograma</CardTitle>
        <Button onClick={saveChronogram} disabled={saving} size="sm" variant="outline" className="h-8">
          <Save className="h-4 w-4 mr-1" /> Salvar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="hidden md:grid md:grid-cols-[1fr_130px_130px_1fr_40px] gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            <span>Atividade/Ação</span>
            <span>Data Inicial</span>
            <span>Data Final</span>
            <span>Etapa</span>
            <span></span>
          </div>

          {items.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_130px_130px_1fr_40px] gap-2 items-center border-b md:border-b-0 pb-3 md:pb-0">
              <Input
                value={item.atividade}
                onChange={e => updateItem(item.id, "atividade", e.target.value)}
                placeholder="Ex: Reserva de pautas, Contratação..."
                className="text-sm h-9"
              />
              <Input
                type="date"
                value={item.data_inicial}
                onChange={e => updateItem(item.id, "data_inicial", e.target.value)}
                className="text-sm h-9"
              />
               <Input
                type="date"
                value={item.data_final}
                onChange={e => updateItem(item.id, "data_final", e.target.value)}
                className="text-sm h-9"
              />
              <Select value={item.etapa} onValueChange={v => updateItem(item.id, "etapa", v)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ETAPAS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeItem(item.id)}
                disabled={items.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addItem} className="w-full h-8 mt-2" size="sm">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Atividade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChronogramTable;

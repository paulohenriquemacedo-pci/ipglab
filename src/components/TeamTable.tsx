import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TeamItem {
  id: string;
  nome: string;
  identificacao: string; // CPF or CNPJ
  funcao: string;
  curriculo: string; // Resumo ou link
}

interface TeamTableProps {
  projectId: string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const TeamTable = ({ projectId }: TeamTableProps) => {
  const [items, setItems] = useState<TeamItem[]>([]);
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
          if (parsed && Array.isArray(parsed.team)) {
            setItems(parsed.team);
          }
        } catch { /* not JSON */ }
      }
      if (items.length === 0) {
        setItems([{ id: generateId(), nome: "", identificacao: "", funcao: "", curriculo: "" }]);
      }
    };
    load();
  }, [projectId]);

  const saveTeam = useCallback(async () => {
    setSaving(true);
    try {
      // Fetch existing content to merge with ChronogramTable data
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

      parsedContent.team = items;

      await supabase
        .from("project_sections")
        .update({
          content: JSON.stringify(parsedContent),
          is_completed: items.length > 0 && items.some(i => i.nome.length > 0 && i.funcao.length > 0),
        })
        .eq("project_id", projectId)
        .eq("step_number", 5);
      
      toast.success("Equipe salva com sucesso!");
    } catch {
      toast.error("Erro ao salvar equipe");
    } finally {
      setSaving(false);
    }
  }, [items, projectId]);

  // Auto-save periodically
  useEffect(() => {
    const timer = setTimeout(() => {
      if (items.length > 0 && items.some(i => i.nome)) {
        saveTeam();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [items, saveTeam]);

  const addItem = () => {
    setItems(prev => [...prev, { id: generateId(), nome: "", identificacao: "", funcao: "", curriculo: "" }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof TeamItem, value: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Equipe do Projeto</CardTitle>
        <Button onClick={saveTeam} disabled={saving} size="sm" variant="outline" className="h-8">
          <Save className="h-4 w-4 mr-1" /> Salvar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="hidden md:grid md:grid-cols-[1fr_130px_1fr_1fr_40px] gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            <span>Nome Completo</span>
            <span>CPF / CNPJ</span>
            <span>Função do Projeto</span>
            <span>Link do Currículo/Portfólio</span>
            <span></span>
          </div>

          {items.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_130px_1fr_1fr_40px] gap-2 items-center border-b md:border-b-0 pb-3 md:pb-0">
              <Input
                value={item.nome}
                onChange={e => updateItem(item.id, "nome", e.target.value)}
                placeholder="Nome do integrante"
                className="text-sm h-9"
              />
              <Input
                value={item.identificacao}
                onChange={e => updateItem(item.id, "identificacao", e.target.value)}
                placeholder="000.000.000-00"
                className="text-sm h-9"
              />
              <Input
                value={item.funcao}
                onChange={e => updateItem(item.id, "funcao", e.target.value)}
                placeholder="Ex: Diretor Geral, Produtor..."
                className="text-sm h-9"
              />
              <Input
                value={item.curriculo}
                onChange={e => updateItem(item.id, "curriculo", e.target.value)}
                placeholder="Link pro portfólio (Drive/Site)"
                className="text-sm h-9"
              />
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
            <Plus className="h-4 w-4 mr-2" /> Adicionar Integrante
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamTable;

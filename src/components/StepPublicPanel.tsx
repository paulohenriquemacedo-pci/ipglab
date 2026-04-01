import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const PUBLICO_ALVO = [
  "Pessoas vítimas de violência", "Pessoas em situação de pobreza",
  "Pessoas em situação de rua (moradores de rua)",
  "Pessoas em situação de restrição e privação de liberdade (população carcerária)",
  "Pessoas com deficiência", "Pessoas em sofrimento físico e/ou psíquico",
  "Mulheres", "LGBTQIAPN+", "Povos e comunidades tradicionais",
  "Negros e/ou negras", "Ciganos", "Indígenas",
  "Não é voltada especificamente para um perfil, é aberta para todos",
  "Área periférica", "Outros"
];

export default function StepPublicPanel({ projectId }: { projectId: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("project_registrations")
        .select("acao_cultural_publico")
        .eq("project_id", projectId)
        .single();
      
      if (data?.acao_cultural_publico) {
        setSelected(data.acao_cultural_publico as string[]);
      }
      setLoading(false);
    };
    fetch();
  }, [projectId]);

  const toggle = async (item: string) => {
    const newSelected = selected.includes(item)
      ? selected.filter(i => i !== item)
      : [...selected, item];
    
    setSelected(newSelected);

    const { error } = await supabase
      .from("project_registrations")
      .upsert({ project_id: projectId, acao_cultural_publico: newSelected.length > 0 ? newSelected : null } as any, { onConflict: "project_id" });
    
    if (error) {
      toast.error("Erro ao salvar público-alvo.");
    }
  };

  if (loading) return null;

  return (
    <Card className="mt-4 border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <Label className="font-semibold text-primary mb-3 block">Classificação exigida pela PNAB</Label>
        <p className="text-xs text-muted-foreground mb-4">
          Marque abaixo se a ação principal da sua proposta é especificamente voltada para algum destes perfis (de acordo com o formulário oficial):
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {PUBLICO_ALVO.map(p => (
            <div key={p} className="flex items-center gap-2">
              <Checkbox checked={selected.includes(p)} onCheckedChange={() => toggle(p)} id={`pub-${p}`} />
              <Label htmlFor={`pub-${p}`} className="font-normal text-sm cursor-pointer">{p}</Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

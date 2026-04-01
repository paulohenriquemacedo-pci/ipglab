import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const FONTES_RECURSO = [
  "Apoio financeiro municipal", "Apoio financeiro estadual",
  "Recursos de Lei de Incentivo Municipal", "Recursos de Lei de Incentivo Estadual",
  "Recursos de Lei de Incentivo Federal", "Patrocínio privado direto",
  "Patrocínio de instituição internacional", "Doações de Pessoas Físicas",
  "Doações de Empresas", "Cobrança de ingressos", "Outros"
];

export default function StepFundingPanel({ projectId }: { projectId: string }) {
  const [possuiFontes, setPossuiFontes] = useState<boolean>(false);
  const [fontes, setFontes] = useState<string[]>([]);
  const [fontesDetalhe, setFontesDetalhe] = useState("");
  const [prevVenda, setPrevVenda] = useState<boolean>(false);
  const [vendaDetalhe, setVendaDetalhe] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("project_registrations")
        .select("*")
        .eq("project_id", projectId)
        .single();
      
      if (data) {
        setPossuiFontes(data.possui_fontes_recurso || false);
        setFontes((data.fontes_recurso_tipos as string[]) || []);
        setFontesDetalhe(data.fontes_recurso_detalhe || "");
        setPrevVenda(data.prev_venda_ingressos || false);
        setVendaDetalhe(data.prev_venda_ingressos_detalhe || "");
      }
      setLoading(false);
    };
    fetch();
  }, [projectId]);

  const saveToDb = async (payload: any) => {
    const { error } = await supabase.from("project_registrations").upsert({ project_id: projectId, ...payload } as any, { onConflict: "project_id" });
    if (error) toast.error("Erro ao salvar fontes de recurso.");
  };

  const toggleFonte = async (item: string) => {
    const newArr = fontes.includes(item) ? fontes.filter(i => i !== item) : [...fontes, item];
    setFontes(newArr);
    saveToDb({ fontes_recurso_tipos: newArr.length > 0 ? newArr : null });
  };

  if (loading) return null;

  return (
    <Card className="mt-4 border-primary/20 bg-primary/5">
      <CardContent className="pt-6 space-y-8">
        <div className="space-y-4">
          <Label className="font-semibold text-lg text-primary block">O projeto possui recursos financeiros de outras fontes?</Label>
          <RadioGroup 
            value={possuiFontes ? "sim" : "nao"} 
            onValueChange={v => {
              const val = v === "sim";
              setPossuiFontes(val);
              saveToDb({ possui_fontes_recurso: val });
            }} 
            className="flex gap-6"
          >
            <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="rec-s" /><Label htmlFor="rec-s">Sim</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="rec-n" /><Label htmlFor="rec-n">Não, projeto não possui outras fontes</Label></div>
          </RadioGroup>
          
          {possuiFontes && (
            <div className="space-y-3 mt-4 ml-6 pl-4 border-l-2 border-primary/20">
              <Label className="font-semibold">Quais?</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FONTES_RECURSO.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Checkbox checked={fontes.includes(f)} onCheckedChange={() => toggleFonte(f)} id={`fonte-${f}`} />
                    <Label htmlFor={`fonte-${f}`} className="font-normal text-sm cursor-pointer">{f}</Label>
                  </div>
                ))}
              </div>
              <div className="pt-2 space-y-2">
                <Label>Especifique os valores estimados de cada fonte assinalada e onde serão empregados:</Label>
                <Textarea 
                  placeholder="Descreva..." 
                  value={fontesDetalhe} 
                  onChange={e => {
                    setFontesDetalhe(e.target.value);
                    saveToDb({ fontes_recurso_detalhe: e.target.value });
                  }} 
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Label className="font-semibold text-lg text-primary block">Haverá previsão de venda de ingressos ou produtos culturais?</Label>
          <RadioGroup 
            value={prevVenda ? "sim" : "nao"} 
            onValueChange={v => {
              const val = v === "sim";
              setPrevVenda(val);
              saveToDb({ prev_venda_ingressos: val });
            }} 
            className="flex gap-6"
          >
            <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="ing-s" /><Label htmlFor="ing-s">Sim</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="ing-n" /><Label htmlFor="ing-n">Não</Label></div>
          </RadioGroup>
          
          {prevVenda && (
            <div className="mt-4 ml-6 pl-4 border-l-2 border-primary/20 space-y-2">
              <Label className="font-semibold">Detalhe as categorias, valores e estratégias de venda e gratuidade:</Label>
              <Textarea 
                placeholder="Valores dos ingressos/produtos, estimativa..." 
                value={vendaDetalhe} 
                onChange={e => {
                  setVendaDetalhe(e.target.value);
                  saveToDb({ prev_venda_ingressos_detalhe: e.target.value });
                }} 
                rows={3} 
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

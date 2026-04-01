import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const ACESS_ARQ = ["Rampas", "Elevadores", "Piso Tátil", "Sanitários Adaptados", "Outros"];
const ACESS_COM = ["Linguagem Brasileira de Sinais -Libras", "Sistema Braille", "Audiodescrição", "Site Acessível", "Textos em Formatos Acessíveis", "Outros"];
const ACESS_ATI = ["Atendimento Prioritário às Pessoas com Deficiência", "Não se Aplica", "Outros"];

export default function StepAcessibilityPanel({ projectId }: { projectId: string }) {
  const [arq, setArq] = useState<string[]>([]);
  const [com, setCom] = useState<string[]>([]);
  const [ati, setAti] = useState<string[]>([]);
  const [locais, setLocais] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("project_registrations")
        .select("acessibilidade_arquitetonica, acessibilidade_comunicacional, acessibilidade_atitudinal, locais_execucao")
        .eq("project_id", projectId)
        .single();
      
      if (data) {
        setArq((data.acessibilidade_arquitetonica as string[]) || []);
        setCom((data.acessibilidade_comunicacional as string[]) || []);
        setAti((data.acessibilidade_atitudinal as string[]) || []);
        setLocais(data.locais_execucao || "");
      }
      setLoading(false);
    };
    fetch();
  }, [projectId]);

  const toggle = async (type: "arq"|"com"|"ati", item: string) => {
    const isArq = type === "arq";
    const isCom = type === "com";
    
    let current = isArq ? arq : (isCom ? com : ati);
    const newArr = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    
    if (isArq) setArq(newArr);
    if (isCom) setCom(newArr);
    if (!isArq && !isCom) setAti(newArr);

    const payload: any = { project_id: projectId };
    if (isArq) payload.acessibilidade_arquitetonica = newArr.length > 0 ? newArr : null;
    if (isCom) payload.acessibilidade_comunicacional = newArr.length > 0 ? newArr : null;
    if (!isArq && !isCom) payload.acessibilidade_atitudinal = newArr.length > 0 ? newArr : null;

    const { error } = await supabase.from("project_registrations").upsert(payload, { onConflict: "project_id" });
    if (error) toast.error("Erro ao salvar acessibilidade.");
  };

  const saveLocais = async (v: string) => {
    setLocais(v);
    const { error } = await supabase.from("project_registrations").upsert({ project_id: projectId, locais_execucao: v || null } as any, { onConflict: "project_id" });
    if (error) toast.error("Erro ao salvar locais.");
  }

  if (loading) return null;

  return (
    <Card className="mt-6 border-primary/20 bg-primary/5">
      <CardContent className="pt-4 space-y-6">
        <div>
          <Label className="font-semibold text-primary block mb-3">Requisitos de Acessibilidade (Lei 13.146/2015)</Label>
          <p className="text-xs text-muted-foreground mb-4">
            Além da descrição narrativa feita pela IA, marque os dados obrigatórios sobre que tipo de acessibilidade o projeto disporá.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label className="font-semibold">Acessibilidade Arquitetônica:</Label>
          <div className="grid grid-cols-2 gap-2">
            {ACESS_ARQ.map(a => (
              <div key={a} className="flex items-center gap-2">
                <Checkbox checked={arq.includes(a)} onCheckedChange={() => toggle("arq", a)} id={`arq-${a}`} />
                <Label htmlFor={`arq-${a}`} className="font-normal text-sm cursor-pointer">{a}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Acessibilidade Comunicacional:</Label>
          <div className="grid grid-cols-2 gap-2">
            {ACESS_COM.map(a => (
              <div key={a} className="flex items-center gap-2">
                <Checkbox checked={com.includes(a)} onCheckedChange={() => toggle("com", a)} id={`com-${a}`} />
                <Label htmlFor={`com-${a}`} className="font-normal text-sm cursor-pointer">{a}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Acessibilidade Atitudinal:</Label>
          <div className="grid grid-cols-2 gap-2">
            {ACESS_ATI.map(a => (
              <div key={a} className="flex items-center gap-2">
                <Checkbox checked={ati.includes(a)} onCheckedChange={() => toggle("ati", a)} id={`ati-${a}`} />
                <Label htmlFor={`ati-${a}`} className="font-normal text-sm cursor-pointer">{a}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <Label className="font-semibold">Quais serão os Locais de Execução (Endereços exatos)?</Label>
          <Textarea 
            placeholder="Descreva aqui o(s) ambiente(s) do evento e verifique se eles atendem à acessibilidade informada."
            value={locais}
            onChange={(e) => saveLocais(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

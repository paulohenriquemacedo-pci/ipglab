import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const ACESS_ARQ = ["Rampas", "Elevadores", "Piso Tátil", "Sanitários Adaptados", "Outros"];
const ACESS_COM = ["Linguagem Brasileira de Sinais -Libras", "Sistema Braille", "Audiodescrição", "Site Acessível", "Textos em Formatos Acessíveis", "Outros"];
const ACESS_ATI = ["Atendimento Prioritário às Pessoas com Deficiência", "Não se Aplica", "Outros"];

type RegistrationPatch = {
  acessibilidade_arquitetonica?: string[] | null;
  acessibilidade_comunicacional?: string[] | null;
  acessibilidade_atitudinal?: string[] | null;
  locais_execucao?: string | null;
};

const normalizeArray = (value: string[]) => (value.length > 0 ? value : null);
const normalizeText = (value: string) => (value.trim() ? value : null);

export default function StepAcessibilityPanel({ projectId }: { projectId: string }) {
  const [arq, setArq] = useState<string[]>([]);
  const [com, setCom] = useState<string[]>([]);
  const [ati, setAti] = useState<string[]>([]);
  const [locais, setLocais] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasRegistration, setHasRegistration] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      const user = authData.user;

      if (authError || !user) {
        console.error("[StepAcessibilityPanel] auth.getUser failed", authError);
        if (isMounted) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("project_registrations")
        .select("project_id, acessibilidade_arquitetonica, acessibilidade_comunicacional, acessibilidade_atitudinal, locais_execucao")
        .eq("project_id", projectId)
        .maybeSingle();

      if (!isMounted) return;

      setUserId(user.id);

      if (error) {
        console.error("[StepAcessibilityPanel] failed to load registration", error);
        toast.error("Não foi possível carregar os dados de acessibilidade.");
      }

      setHasRegistration(!!data);
      setArq((data?.acessibilidade_arquitetonica as string[]) || []);
      setCom((data?.acessibilidade_comunicacional as string[]) || []);
      setAti((data?.acessibilidade_atitudinal as string[]) || []);
      setLocais(data?.locais_execucao || "");
      setLoading(false);
    };

    init();

    return () => {
      isMounted = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [projectId]);

  const persistRegistration = async (patch: RegistrationPatch) => {
    if (!userId || !projectId) {
      return { error: new Error("Missing user/project") };
    }

    const payload = {
      ...("acessibilidade_arquitetonica" in patch ? { acessibilidade_arquitetonica: patch.acessibilidade_arquitetonica ?? null } : {}),
      ...("acessibilidade_comunicacional" in patch ? { acessibilidade_comunicacional: patch.acessibilidade_comunicacional ?? null } : {}),
      ...("acessibilidade_atitudinal" in patch ? { acessibilidade_atitudinal: patch.acessibilidade_atitudinal ?? null } : {}),
      ...("locais_execucao" in patch ? { locais_execucao: patch.locais_execucao ?? null } : {}),
    };

    if (hasRegistration) {
      const { error, data } = await supabase
        .from("project_registrations")
        .update({ ...payload, updated_at: new Date().toISOString() } as any)
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .select("project_id")
        .maybeSingle();

      if (error) return { error };
      if (data) return { error: null };
    }

    const { error } = await supabase.from("project_registrations").insert({
      project_id: projectId,
      user_id: userId,
      acessibilidade_arquitetonica: "acessibilidade_arquitetonica" in patch ? patch.acessibilidade_arquitetonica ?? null : normalizeArray(arq),
      acessibilidade_comunicacional: "acessibilidade_comunicacional" in patch ? patch.acessibilidade_comunicacional ?? null : normalizeArray(com),
      acessibilidade_atitudinal: "acessibilidade_atitudinal" in patch ? patch.acessibilidade_atitudinal ?? null : normalizeArray(ati),
      locais_execucao: "locais_execucao" in patch ? patch.locais_execucao ?? null : normalizeText(locais),
    } as any);

    if (!error) setHasRegistration(true);
    return { error };
  };

  const toggle = async (type: "arq" | "com" | "ati", item: string) => {
    const isArq = type === "arq";
    const isCom = type === "com";

    const previousArq = arq;
    const previousCom = com;
    const previousAti = ati;

    const current = isArq ? arq : isCom ? com : ati;
    const newArr = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];

    const nextArq = isArq ? newArr : arq;
    const nextCom = isCom ? newArr : com;
    const nextAti = !isArq && !isCom ? newArr : ati;

    setArq(nextArq);
    setCom(nextCom);
    setAti(nextAti);

    const { error } = await persistRegistration({
      acessibilidade_arquitetonica: normalizeArray(nextArq),
      acessibilidade_comunicacional: normalizeArray(nextCom),
      acessibilidade_atitudinal: normalizeArray(nextAti),
    });

    if (error) {
      console.error("[StepAcessibilityPanel] failed to save accessibility", error);
      setArq(previousArq);
      setCom(previousCom);
      setAti(previousAti);
      toast.error("Erro ao salvar acessibilidade.");
    }
  };

  const saveLocais = (value: string) => {
    setLocais(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const { error } = await persistRegistration({ locais_execucao: normalizeText(value) });

      if (error) {
        console.error("[StepAcessibilityPanel] failed to save locais_execucao", error);
        toast.error("Erro ao salvar locais.");
      }
    }, 500);
  };

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
            {ACESS_ARQ.map((a) => (
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
            {ACESS_COM.map((a) => (
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
            {ACESS_ATI.map((a) => (
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

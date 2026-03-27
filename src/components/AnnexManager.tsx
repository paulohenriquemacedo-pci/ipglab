import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Badiinha annexes
import { generateAnexoII } from "@/lib/generateAnexoII";
import { generateAnexoIV, generateAnexoV, generateAnexoVI, generateAnexoVII } from "@/lib/generateAnexos";
// Octo Marques annexes
import {
  generateAnexoIIA, generateAnexoIIB,
  generateAnexoVI_OctoMarques, generateAnexoVII_OctoMarques,
  generateAnexoVIII_OctoMarques, generateAnexoIX_OctoMarques,
} from "@/lib/generateAnexosOctoMarques";

interface AnnexDef {
  id: string;
  label: string;
  description: string;
  generator: (profile: any) => Promise<void>;
  required: boolean;
}

const ANNEXES_PREMIACAO: AnnexDef[] = [
  { id: "anexo-ii", label: "Anexo II", description: "Formulário de Inscrição", generator: generateAnexoII, required: true },
  { id: "anexo-iv", label: "Anexo IV", description: "Representação de Grupo/Coletivo", generator: generateAnexoIV, required: false },
  { id: "anexo-v", label: "Anexo V", description: "Autodeclaração Étnico-Racial", generator: generateAnexoV, required: false },
  { id: "anexo-vi", label: "Anexo VI", description: "Declaração PcD", generator: generateAnexoVI, required: false },
  { id: "anexo-vii", label: "Anexo VII", description: "Declaração de Residência", generator: generateAnexoVII, required: true },
];

const ANNEXES_FOMENTO_PF: AnnexDef[] = [
  { id: "anexo-iia", label: "Anexo II-A", description: "Inscrição PF/MEI/Coletivo", generator: generateAnexoIIA, required: true },
  { id: "anexo-vi-om", label: "Anexo VI", description: "Declaração Coletivo sem CNPJ", generator: generateAnexoVI_OctoMarques, required: false },
  { id: "anexo-vii-om", label: "Anexo VII", description: "Declaração Étnico-Racial", generator: generateAnexoVII_OctoMarques, required: false },
  { id: "anexo-viii-om", label: "Anexo VIII", description: "Declaração PcD", generator: generateAnexoVIII_OctoMarques, required: false },
  { id: "anexo-ix-om", label: "Anexo IX", description: "Declaração de Residência", generator: generateAnexoIX_OctoMarques, required: true },
];

const ANNEXES_FOMENTO_PJ: AnnexDef[] = [
  { id: "anexo-iib", label: "Anexo II-B", description: "Inscrição Pessoa Jurídica", generator: generateAnexoIIB, required: true },
  { id: "anexo-vi-om", label: "Anexo VI", description: "Declaração Coletivo sem CNPJ", generator: generateAnexoVI_OctoMarques, required: false },
  { id: "anexo-vii-om", label: "Anexo VII", description: "Declaração Étnico-Racial", generator: generateAnexoVII_OctoMarques, required: false },
  { id: "anexo-viii-om", label: "Anexo VIII", description: "Declaração PcD", generator: generateAnexoVIII_OctoMarques, required: false },
  { id: "anexo-ix-om", label: "Anexo IX", description: "Declaração de Residência", generator: generateAnexoIX_OctoMarques, required: true },
];

interface AnnexManagerProps {
  projectId: string;
  editalType: string;
}

const AnnexManager = ({ projectId, editalType }: AnnexManagerProps) => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [personType, setPersonType] = useState<string | null>(null);
  const { user } = useAuth();

  // Determine which annexes to show
  const getAnnexes = (): AnnexDef[] => {
    if (editalType === "premiacao") return ANNEXES_PREMIACAO;
    if (personType === "PJ") return ANNEXES_FOMENTO_PJ;
    return ANNEXES_FOMENTO_PF;
  };

  const getRegistrationData = async () => {
    if (!user) return null;
    const { data } = await supabase
      .from("project_registrations")
      .select("*")
      .eq("project_id", projectId)
      .single();
    if (data) {
      if (!personType) setPersonType((data as any).person_type);
      return data as any;
    }
    // Fallback to profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    return profile as any;
  };

  const handleDownload = async (annex: AnnexDef) => {
    setDownloading(annex.id);
    try {
      const data = await getRegistrationData();
      if (!data) { toast.error("Dados cadastrais não encontrados"); return; }
      await annex.generator(data);
      toast.success(`${annex.label} gerado com sucesso!`);
    } catch {
      toast.error(`Erro ao gerar ${annex.label}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    const data = await getRegistrationData();
    if (!data) { toast.error("Dados cadastrais não encontrados"); setDownloadingAll(false); return; }
    
    const annexes = getAnnexes();
    let success = 0;
    for (const annex of annexes) {
      try { await annex.generator(data); success++; } catch { toast.error(`Erro: ${annex.label}`); }
    }
    if (success > 0) toast.success(`${success} anexos gerados com sucesso!`);
    setDownloadingAll(false);
  };

  const annexes = getAnnexes();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Anexos e Declarações</h3>
          <p className="text-sm text-muted-foreground">
            Gere e baixe os documentos obrigatórios preenchidos com seus dados cadastrais.
          </p>
        </div>
        <Button onClick={handleDownloadAll} disabled={downloadingAll}>
          {downloadingAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Baixar Todos
        </Button>
      </div>

      <div className="grid gap-3">
        {annexes.map(annex => (
          <Card key={annex.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="flex items-center justify-between py-4 px-5">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{annex.label}</span>
                    {annex.required && <Badge variant="outline" className="text-[10px]">Obrigatório</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{annex.description}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(annex)}
                disabled={downloading === annex.id}
              >
                {downloading === annex.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                Baixar .docx
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnnexManager;

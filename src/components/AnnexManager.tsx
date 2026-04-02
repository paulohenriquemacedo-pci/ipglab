import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2 } from "lucide-react";
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
import type { ProjectDataForAnexo } from "@/lib/generateAnexosOctoMarques";
import { generateBudgetXlsx } from "@/lib/generateBudgetXlsx";

interface AnnexDef {
  id: string;
  label: string;
  description: string;
  generator: (profile: any, projectData?: ProjectDataForAnexo) => Promise<void>;
  required: boolean;
  needsProjectData?: boolean;
}

const ANNEXES_PREMIACAO: AnnexDef[] = [
  { id: "anexo-ii", label: "Anexo II", description: "Formulário de Inscrição", generator: generateAnexoII, required: true },
  { id: "anexo-iv", label: "Anexo IV", description: "Representação de Grupo/Coletivo", generator: generateAnexoIV, required: false },
  { id: "anexo-v", label: "Anexo V", description: "Autodeclaração Étnico-Racial", generator: generateAnexoV, required: false },
  { id: "anexo-vi", label: "Anexo VI", description: "Declaração PcD", generator: generateAnexoVI, required: false },
  { id: "anexo-vii", label: "Anexo VII", description: "Declaração de Residência", generator: generateAnexoVII, required: true },
];

const ANNEXES_FOMENTO_PF: AnnexDef[] = [
  { id: "anexo-iia", label: "Anexo II-A", description: "Inscrição PF/MEI/Coletivo (com dados do projeto)", generator: generateAnexoIIA, required: true, needsProjectData: true },
  { id: "planilha-orc", label: "Planilha Orçamentária", description: "Planilha de custos do projeto (.xlsx)", generator: async () => {}, required: true, needsProjectData: true },
  { id: "anexo-vi-om", label: "Anexo VI", description: "Declaração Coletivo sem CNPJ", generator: generateAnexoVI_OctoMarques, required: false },
  { id: "anexo-vii-om", label: "Anexo VII", description: "Declaração Étnico-Racial", generator: generateAnexoVII_OctoMarques, required: false },
  { id: "anexo-viii-om", label: "Anexo VIII", description: "Declaração PcD", generator: generateAnexoVIII_OctoMarques, required: false },
  { id: "anexo-ix-om", label: "Anexo IX", description: "Declaração de Residência", generator: generateAnexoIX_OctoMarques, required: true },
];

const ANNEXES_FOMENTO_PJ: AnnexDef[] = [
  { id: "anexo-iib", label: "Anexo II-B", description: "Inscrição Pessoa Jurídica (com dados do projeto)", generator: generateAnexoIIB, required: true, needsProjectData: true },
  { id: "planilha-orc", label: "Planilha Orçamentária", description: "Planilha de custos do projeto (.xlsx)", generator: async () => {}, required: true, needsProjectData: true },
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

  // Fetch project data (all sections + budget + team + chronogram) for Anexo II integration
  const getProjectData = async (): Promise<ProjectDataForAnexo> => {
    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", projectId)
      .single();

    const { data: sections } = await supabase
      .from("project_sections")
      .select("step_number, step_name, content")
      .eq("project_id", projectId)
      .order("step_number");

    const { data: regData } = await supabase
      .from("project_registrations")
      .select("locais_execucao, estrategia_divulgacao, fontes_recurso_tipos, fontes_recurso_detalhe, possui_fontes_recurso, prev_venda_ingressos, prev_venda_ingressos_detalhe")
      .eq("project_id", projectId)
      .single();

    // Budget is stored in step 11 content as JSON array
    let budgetItems: any[] = [];
    const budgetSection = sections?.find(s => s.step_number === 11);
    if (budgetSection?.content) {
      try {
        const parsed = JSON.parse(budgetSection.content);
        if (Array.isArray(parsed)) budgetItems = parsed;
      } catch { /* ignore */ }
    }

    // Team is stored in step 7 content as JSON { team: [...] }
    let teamMembers: any[] = [];
    const teamSection = sections?.find(s => s.step_number === 7);
    if (teamSection?.content) {
      try {
        const parsed = JSON.parse(teamSection.content);
        teamMembers = parsed?.team || (Array.isArray(parsed) ? parsed : []);
      } catch { /* ignore */ }
    }

    // Chronogram is stored in step 8 content as JSON { chronogram: [...] }
    let chronogramItems: any[] = [];
    const chronoSection = sections?.find(s => s.step_number === 8);
    if (chronoSection?.content) {
      try {
        const parsed = JSON.parse(chronoSection.content);
        chronogramItems = parsed?.chronogram || (Array.isArray(parsed) ? parsed : []);
      } catch { /* ignore */ }
    }

    // Period is stored in step 6 content as JSON { dataInicio, dataFinal }
    let dataInicio = "";
    let dataFinal = "";
    const periodSection = sections?.find(s => s.step_number === 6);
    if (periodSection?.content) {
      try {
        const parsed = JSON.parse(periodSection.content);
        dataInicio = parsed?.dataInicio || "";
        dataFinal = parsed?.dataFinal || "";
      } catch { /* ignore */ }
    }

    // Strategy is stored in step 9 content as plain text
    const strategySection = sections?.find(s => s.step_number === 9);

    return {
      title: project?.title || undefined,
      sections: sections?.filter(s => s.step_number <= 4 && s.content) || [],
      budgetItems,
      teamMembers,
      chronogramItems,
      estrategiaDivulgacao: strategySection?.content || (regData as any)?.estrategia_divulgacao || "",
      fontesRecursoTipos: (regData as any)?.fontes_recurso_tipos || [],
      fontesRecursoDetalhe: (regData as any)?.fontes_recurso_detalhe || "",
      possuiFontesRecurso: (regData as any)?.possui_fontes_recurso || false,
      prevVendaIngressos: (regData as any)?.prev_venda_ingressos || false,
      prevVendaIngressosDetalhe: (regData as any)?.prev_venda_ingressos_detalhe || "",
      dataInicio,
      dataFinal,
      locaisExecucao: (regData as any)?.locais_execucao || "",
    };
  };

  const handleDownload = async (annex: AnnexDef) => {
    setDownloading(annex.id);
    try {
      // Special handling for budget spreadsheet
      if (annex.id === "planilha-orc") {
        const projectData = await getProjectData();
        generateBudgetXlsx(projectData.budgetItems || []);
        toast.success("Planilha Orçamentária gerada com sucesso!");
        setDownloading(null);
        return;
      }

      const data = await getRegistrationData();
      if (!data) { toast.error("Dados cadastrais não encontrados"); return; }

      if (annex.needsProjectData) {
        const projectData = await getProjectData();
        await annex.generator(data, projectData);
      } else {
        await annex.generator(data);
      }
      toast.success(`${annex.label} gerado com sucesso!`);
    } catch (err) {
      console.error("Annex generation error:", err);
      toast.error(`Erro ao gerar ${annex.label}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    const data = await getRegistrationData();
    if (!data) { toast.error("Dados cadastrais não encontrados"); setDownloadingAll(false); return; }

    const projectData = await getProjectData();
    const annexes = getAnnexes();
    let success = 0;
    for (const annex of annexes) {
      try {
        if (annex.needsProjectData) {
          await annex.generator(data, projectData);
        } else {
          await annex.generator(data);
        }
        success++;
      } catch { toast.error(`Erro: ${annex.label}`); }
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
            Gere e baixe os documentos obrigatórios preenchidos com seus dados cadastrais e do projeto.
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

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Calendar, MapPin, Award, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Edital {
  id: string;
  name: string;
  description: string | null;
  instrument_type: string;
  state: string | null;
  deadline: string | null;
  max_budget: number | null;
  active: boolean;
}

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEdital: (editalId: string, editalName: string) => void;
  loading: boolean;
}

const EDITAL_STEPS: Record<string, { step_number: number; step_name: string }[]> = {
  // Badiinha edital - steps based on the actual form fields
  premiacao: [
    { step_number: 1, step_name: "Dados do Agente Cultural" },
    { step_number: 2, step_name: "Categoria e Cotas" },
    { step_number: 3, step_name: "Mini Currículo e Atuação" },
    { step_number: 4, step_name: "Público e Comunidade" },
    { step_number: 5, step_name: "Acessibilidade" },
    { step_number: 6, step_name: "Portfólio e Comprovações" },
    { step_number: 7, step_name: "Revisão e Declarações" },
  ],
  // Default steps for other editals
  default: [
    { step_number: 1, step_name: "Ideia Central" },
    { step_number: 2, step_name: "Contextualização Sociocultural" },
    { step_number: 3, step_name: "Objetivos" },
    { step_number: 4, step_name: "Metodologia e Ações" },
    { step_number: 5, step_name: "Cronograma" },
    { step_number: 6, step_name: "Equipe" },
    { step_number: 7, step_name: "Contrapartidas" },
  ],
};

export function getStepsForEdital(instrumentType: string | null): { step_number: number; step_name: string }[] {
  if (instrumentType && EDITAL_STEPS[instrumentType]) {
    return EDITAL_STEPS[instrumentType];
  }
  return EDITAL_STEPS.default;
}

// Step prompts for the AI assistant per edital type
export const STEP_PROMPTS_PREMIACAO: Record<number, { name: string; prompt: string }> = {
  1: {
    name: "Dados do Agente Cultural",
    prompt: "Ajude o agente cultural a preencher seus dados pessoais ou jurídicos. Pergunte se é pessoa física ou jurídica, colete nome, CPF/CNPJ, endereço, dados bancários e informações de contato.",
  },
  2: {
    name: "Categoria e Cotas",
    prompt: "Ajude a escolher a categoria de inscrição (Grupos e coletivos culturais, Festas Populares ou Blocos de Carnaval) e se deseja concorrer às cotas (pessoa negra, indígena ou PcD). Explique as vagas e valores de cada categoria.",
  },
  3: {
    name: "Mini Currículo e Atuação",
    prompt: "Ajude a elaborar o mini currículo do agente cultural, destacando as principais atuações culturais realizadas nos últimos 2 anos. Este é um critério importante de seleção (Critério A - 20 pontos).",
  },
  4: {
    name: "Público e Comunidade",
    prompt: "Ajude a descrever o perfil do público atingido pelos projetos e a contribuição do agente à comunidade. Estes são critérios de seleção importantes: integração com outras áreas (30pts), contribuição a populações vulneráveis (15pts) e contribuição à comunidade (15pts).",
  },
  5: {
    name: "Acessibilidade",
    prompt: "Ajude a descrever as medidas de acessibilidade empregadas nos projetos (arquitetônica, comunicacional e atitudinal). Este é o Critério F de seleção (10 pontos). Inclua medidas como Libras, audiodescrição, rampas, etc.",
  },
  6: {
    name: "Portfólio e Comprovações",
    prompt: "Ajude a organizar o portfólio com registros que comprovem os últimos 2 anos de atuação: fotos, vídeos, material gráfico, postagens em redes sociais, relatórios. Descreva também o diálogo com o patrimônio cultural (Critério E - 10pts).",
  },
  7: {
    name: "Revisão e Declarações",
    prompt: "Ajude a revisar toda a inscrição e verificar se todas as declarações necessárias foram preenchidas: declaração étnico-racial (se for concorrer a cotas), declaração de representação de grupo (se coletivo sem CNPJ), declaração de residência e declaração PcD (se aplicável).",
  },
};

export const STEP_PROMPTS_DEFAULT: Record<number, { name: string; prompt: string }> = {
  1: { name: "Ideia Central", prompt: "Descreva sua ideia de projeto cultural. Qual é o conceito central? O que te motiva a realizá-lo?" },
  2: { name: "Contextualização", prompt: "Conte sobre o contexto sociocultural do seu projeto. Onde ele se insere? Qual a relevância para a comunidade?" },
  3: { name: "Objetivos", prompt: "Quais são os objetivos do seu projeto? Liste o objetivo geral e os específicos." },
  4: { name: "Metodologia", prompt: "Descreva a metodologia e as ações do projeto. Como ele será executado na prática?" },
  5: { name: "Cronograma", prompt: "Descreva o cronograma do projeto. Qual o período de execução e as principais etapas?" },
  6: { name: "Equipe", prompt: "Quem faz parte da equipe? Descreva os principais profissionais envolvidos e suas funções." },
  7: { name: "Contrapartidas", prompt: "Quais são as contrapartidas do projeto? Que benefícios ele oferece à sociedade?" },
};

const instrumentLabels: Record<string, string> = {
  premiacao: "Premiação",
  fomento: "Fomento",
  apoio: "Apoio",
};

const NewProjectDialog = ({ open, onOpenChange, onSelectEdital, loading }: NewProjectDialogProps) => {
  const [editais, setEditais] = useState<Edital[]>([]);
  const [loadingEditais, setLoadingEditais] = useState(true);

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      setLoadingEditais(true);
      const { data } = await supabase
        .from("editais")
        .select("id, name, description, instrument_type, state, deadline, max_budget, active")
        .order("name");
      setEditais(data || []);
      setLoadingEditais(false);
    };
    fetch();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Novo Projeto</DialogTitle>
          <DialogDescription>
            Selecione o edital de lei de incentivo para o qual deseja elaborar seu projeto.
          </DialogDescription>
        </DialogHeader>

        {loadingEditais ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {editais.map((edital) => (
              <Card
                key={edital.id}
                className={`transition-all ${
                  edital.active
                    ? "hover:border-primary/50 hover:shadow-md cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-sm leading-tight">{edital.name}</h3>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {instrumentLabels[edital.instrument_type] || edital.instrument_type}
                        </Badge>
                        {!edital.active && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            <Lock className="h-3 w-3 mr-1" /> Em breve
                          </Badge>
                        )}
                      </div>

                      {edital.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {edital.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {edital.state && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {edital.state}
                          </span>
                        )}
                        {edital.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Até{" "}
                            {new Date(edital.deadline).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        {edital.max_budget && (
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3" /> R${" "}
                            {edital.max_budget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      disabled={!edital.active || loading}
                      onClick={() => onSelectEdital(edital.id, edital.name)}
                      className="shrink-0"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-1" /> Iniciar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;

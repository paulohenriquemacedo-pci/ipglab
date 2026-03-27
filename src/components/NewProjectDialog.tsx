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
    { step_number: 1, step_name: "Principais ações culturais" },
    { step_number: 2, step_name: "Início da trajetória" },
    { step_number: 3, step_name: "Impacto na comunidade" },
    { step_number: 4, step_name: "Ações interdisciplinares" },
    { step_number: 5, step_name: "Upload de documentos" },
    { step_number: 6, step_name: "Revisão e Declarações" },
  ],
  // Fomento edital (Octo Marques) - based on criteria and plan de trabalho
  fomento: [
    { step_number: 1, step_name: "Descrição do Projeto" },
    { step_number: 2, step_name: "Atuação Cultural e Integração" },
    { step_number: 3, step_name: "Impacto Social e Comunitário" },
    { step_number: 4, step_name: "Patrimônio e Acessibilidade" },
    { step_number: 5, step_name: "Cronograma e Equipe" },
    { step_number: 6, step_name: "Planilha Orçamentária" },
    { step_number: 7, step_name: "Anexos e Declarações" },
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
    name: "Principais ações culturais",
    prompt: "Ajude o agente cultural a descrever suas principais ações e atividades culturais realizadas. Pergunte em que área ou segmento cultural atua, em que local realiza suas atividades. Este é o critério A de seleção (20 pontos - Relevância da trajetória do agente cultural).",
  },
  2: {
    name: "Início da trajetória",
    prompt: "Ajude a descrever como e quando começou a trajetória cultural do agente, informando onde seus projetos foram iniciados e há quanto tempo os desenvolve. Este é o critério A de seleção (20 pontos).",
  },
  3: {
    name: "Impacto na comunidade",
    prompt: "Ajude a descrever quem são as pessoas beneficiadas direta ou indiretamente pelas atividades, e como as ações impactam e beneficiam as pessoas ao redor. Destaque se a comunidade participou enquanto público ou também trabalhou nos projetos. Critérios: Contribuição a populações vulneráveis (15pts), Contribuição à comunidade (15pts).",
  },
  4: {
    name: "Ações interdisciplinares",
    prompt: "Ajude a descrever se as ações e atividades possuem relação com outras áreas além da cultura, tais como educação, saúde, esporte, assistência social. Este é o Critério B de seleção (30 pontos - Integração do projeto com outras esferas da vida social).",
  },
  5: {
    name: "Upload de documentos",
    prompt: "Nesta etapa, o agente deve fazer upload dos documentos comprobatórios: currículo/portfólio, comprovante de endereço, declaração de residência (Anexo VII), e opcionalmente: declaração étnico-racial (Anexo V), declaração PcD (Anexo VI), declaração de representação de grupo (Anexo IV).",
  },
  6: {
    name: "Revisão e Declarações",
    prompt: "Ajude a revisar toda a inscrição e verificar se todas as declarações necessárias foram preenchidas. Verifique a consistência dos dados e se todos os documentos obrigatórios foram anexados.",
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

export const STEP_PROMPTS_FOMENTO: Record<number, { name: string; prompt: string }> = {
  1: {
    name: "Descrição do Projeto",
    prompt: "Ajude o agente cultural a descrever seu projeto cultural. Pergunte: qual é a ideia central do projeto? Em qual categoria pretende inscrever (Artes Visuais/Cênicas/Urbanas, Artesanato, Audiovisual, Cultura Popular, Educação Patrimonial, Gastronomia, Leitura/Escrita/Oralidade, ou Música)? Qual subcategoria específica? Qual o objetivo principal?",
  },
  2: {
    name: "Atuação Cultural e Integração",
    prompt: "Ajude a descrever a atuação cultural do proponente e como o projeto se integra com outras esferas. Critério A (20pts): Reconhecida atuação na categoria cultural inscrita. Critério B (30pts): Integração e inovação com outras esferas como educação, saúde, meio ambiente, assistência social. Pergunte sobre experiência prévia, projetos realizados e como este projeto dialoga com outras áreas além da cultura.",
  },
  3: {
    name: "Impacto Social e Comunitário",
    prompt: "Ajude a descrever o impacto social e comunitário do projeto. Critério C (15pts): Contribuição a populações em situação de vulnerabilidade social (idosos, crianças, pessoas negras, etc). Critério D (15pts): Contribuição à comunidade em que atua (ações dentro da comunidade, contratação de profissionais locais). Pergunte: quem serão os beneficiários diretos? Como o projeto impacta a comunidade? Há envolvimento de populações vulneráveis?",
  },
  4: {
    name: "Patrimônio e Acessibilidade",
    prompt: "Ajude a descrever como o projeto dialoga com o patrimônio cultural e promove acessibilidade. Critério E (10pts): Diálogo e ações com o patrimônio cultural e educação patrimonial. Critério F (10pts): Acessibilidade a pessoas com mobilidade reduzida ou deficiência (auditiva, visual, motora, intelectual ou múltipla). Pergunte sobre medidas de acessibilidade arquitetônica, comunicacional e atitudinal previstas.",
  },
  5: {
    name: "Plano de Trabalho e Orçamento",
    prompt: "Ajude a elaborar o plano de trabalho e a planilha orçamentária do projeto. Pergunte: quais são as atividades/ações previstas? Quais são os custos estimados por item (materiais, serviços, cachês, transporte, alimentação, divulgação)? O valor total deve ser compatível com o valor máximo da categoria escolhida. Os valores devem ser condizentes com as práticas de mercado.",
  },
  6: {
    name: "Cronograma e Equipe",
    prompt: "Ajude a elaborar o cronograma de execução e descrever a equipe do projeto. Execução até 31/03/2027. Pergunte: quais são as etapas e seus prazos? Quem compõe a equipe e qual a função de cada pessoa? Há contratação de profissionais da comunidade? Descreva as metas e resultados esperados para cada etapa.",
  },
  7: {
    name: "Documentos e Revisão",
    prompt: "Ajude a revisar toda a inscrição e verificar os documentos necessários: Formulário de inscrição/Plano de trabalho (Anexo II), planilha orçamentária, autodeclaração étnico-racial (se concorrer a cotas), declaração PcD (se aplicável), declaração de representação de grupo (se coletivo sem CNPJ). Verifique se o projeto atende a todos os critérios de seleção e se os bônus de pontuação aplicáveis foram considerados.",
  },
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

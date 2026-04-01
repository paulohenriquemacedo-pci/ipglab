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
  // Fomento edital (Octo Marques) - espelhamento do Anexo II
  fomento: [
    { step_number: 1, step_name: "Descrição do projeto" },
    { step_number: 2, step_name: "Objetivos do projeto" },
    { step_number: 3, step_name: "Metas" },
    { step_number: 4, step_name: "Perfil do público" },
    { step_number: 5, step_name: "Acessibilidade" },
    { step_number: 6, step_name: "Período de execução" },
    { step_number: 7, step_name: "Equipe" },
    { step_number: 8, step_name: "Cronograma de Execução" },
    { step_number: 9, step_name: "Estratégia de divulgação" },
    { step_number: 10, step_name: "Fontes de recurso e venda" },
    { step_number: 11, step_name: "Planilha Orçamentária" },
    { step_number: 12, step_name: "Anexos e Declarações" },
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

// System instructions vs User-facing descriptions
export const STEP_PROMPTS_FOMENTO: Record<number, { name: string; description?: string; prompt: string }> = {
  1: {
    name: "Descrição do Projeto",
    description: "Na descrição, você deve apresentar informações gerais sobre o seu projeto. Algumas perguntas orientadoras: O que você realizará com o projeto? Por que ele é importante para a sociedade? Conte sobre o contexto de realização.",
    prompt: "Ajude o agente cultural a descrever seu projeto cultural. Pergunte: o que você realizará com o projeto? Por que ele é importante para a sociedade? Conte sobre o contexto de realização.",
  },
  2: {
    name: "Objetivos do projeto",
    description: "Neste campo, você deve propor objetivos para o seu projeto, ou seja, deve informar o que você pretende alcançar com a realização do projeto. É importante que você seja breve e proponha entre três e cinco objetivos.",
    prompt: "Apoie na escrita dos objetivos do projeto. O que pretende alcançar? Seja breve, sugerindo um objetivo geral e entre três a cinco objetivos específicos fáceis de visualizar.",
  },
  3: {
    name: "Metas",
    description: "Neste espaço, é necessário detalhar os objetivos em pequenas ações e/ou resultados que sejam quantificáveis. Por exemplo: Realização de 02 oficinas de artes circenses; Confecção de 80 figurinos; 120 pessoas idosas beneficiadas.",
    prompt: "Detalhe os objetivos em metas: pequenas ações e resultados quantificáveis (ex: 2 oficinas, confecção de 80 figurinos, 120 pessoas idosas beneficiadas). Peça os números das atividades e crie o texto-base.",
  },
  4: {
    name: "Perfil do público",
    description: "Preencha aqui informações sobre as pessoas que serão beneficiadas ou participarão do seu projeto. Perguntas orientadoras: Quem vai ser o público do seu projeto? Essas pessoas são crianças, adultas e/ou idosas? Elas fazem parte de alguma comunidade? Qual a escolaridade delas? Elas moram em qual local, bairro e/ou região? No caso de públicos digitais, qual o perfil das pessoas a que seu projeto se direciona?",
    prompt: "Ajude a descrever quem será o público atingido. Crianças, adultos, idosos? Qual comunidade, escolaridade, bairro? Se digital, qual o perfil? Sugira perguntas para formatar essa visão do público.",
  },
  5: {
    name: "Acessibilidade",
    description: "Informe como essas medidas de acessibilidade serão implementadas ou disponibilizadas de acordo com o projeto proposto.",
    prompt: "Apoie o agente a pensar em como as medidas de Acessibilidade (Arquitetônica, Comunicacional e Atitudinal) obrigatórias em leis de incentivo serão garantidas ou disponibilizadas neste projeto na prática.",
  },
  6: {
    name: "Período de execução do projeto",
    description: "Informe abaixo a previsão do período de execução do projeto.",
    prompt: "Formulário rápido para indicação estruturada da Data de Início e da Data Final do projeto (prazo limite março/2027).",
  },
  7: {
    name: "Equipe",
    description: "Informe quais são os profissionais que atuarão no projeto, preenchendo o quadro abaixo.",
    prompt: "Formulário estruturado (tabela) com Nome, Identificação, Função e Currículo de todos os profissionais que atuarão no projeto.",
  },
  8: {
    name: "Cronograma de Execução",
    description: "Descreva os passos a serem seguidos para execução do projeto.",
    prompt: "Grade contendo os passos lógicos, Atividades/Ações e Datas de início/fim divididas entre Pré-Produção, Produção e Pós-Produção.",
  },
  9: {
    name: "Estratégia de divulgação",
    description: "Apresente os meios que serão utilizados para divulgar o projeto. Ex.: impulsionamento em redes sociais.",
    prompt: "Onde o projeto será divulgado? Impulsionamento nas redes sociais, panfletos, rádio? Ajude a descrever explicitamente os meios na resposta final.",
  },
  10: {
    name: "Projeto possui outras fontes de recursos?",
    description: "Informe se o projeto prevê apoio financeiro, tais como cobrança de ingressos, patrocínio e/ou outras fontes de financiamento. Caso positivo, informe a previsão de valores e onde serão empregados no projeto.",
    prompt: "Painel de marcações e valores caso haja patrocínios privados/públicos complementares ou política de cobrança de ingressos com seus respectivos valores.",
  },
  11: {
    name: "Planilha Orçamentária",
    description: "Preencha as informações detalhadas de custos para o seu projeto com justificativas de preço.",
    prompt: "Preencha a planilha orçamentária com os itens de despesa, acompanhados de suas devidas Justificativas e Referências de preço mercadológicas.",
  },
  12: {
    name: "Anexos e Declarações",
    description: "Gere e baixe a cópia final e assine os documentos de acordo com a exigência do edital.",
    prompt: "Gere e assine o Anexo II final consolidado da proposta, e faça upload do restante da documentação exigida.",
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

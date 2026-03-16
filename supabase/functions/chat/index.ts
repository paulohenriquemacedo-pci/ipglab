import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STEP_PROMPTS_DEFAULT: Record<number, string> = {
  1: "Você está ajudando o proponente a elaborar a IDEIA CENTRAL do projeto cultural. Ajude a articular o conceito, motivação e essência artística do projeto. Gere um rascunho estruturado com: título provisório, sinopse do projeto (200-400 palavras), justificativa artística e relevância cultural.",
  2: "Você está ajudando a elaborar a CONTEXTUALIZAÇÃO SOCIOCULTURAL. Ajude o proponente a descrever o contexto territorial, social e cultural onde o projeto se insere, sua relevância comunitária e como dialoga com o cenário cultural local/regional.",
  3: "Você está ajudando a elaborar os OBJETIVOS. Ajude a formular um objetivo geral claro e 3-5 objetivos específicos mensuráveis, alinhados à proposta do projeto e aos critérios típicos de editais de fomento cultural.",
  4: "Você está ajudando a elaborar a METODOLOGIA E AÇÕES. Descreva as etapas de execução, atividades principais, estratégias pedagógicas ou artísticas, e como cada ação contribui para os objetivos.",
  5: "Você está ajudando a elaborar o CRONOGRAMA. Organize as atividades em um cronograma de execução com meses, fases e entregas. Seja realista com prazos.",
  6: "Você está ajudando a elaborar a seção de EQUIPE. Descreva os profissionais necessários, suas funções, qualificações e contribuição para o projeto.",
  7: "Você está ajudando a elaborar as CONTRAPARTIDAS. Descreva os benefícios que o projeto oferece à sociedade: acessibilidade, formação, democratização cultural, legado.",
};

const STEP_PROMPTS_PREMIACAO: Record<number, string> = {
  1: `Você está ajudando o agente cultural a preencher os DADOS DO AGENTE CULTURAL para o Edital de Premiação "Badiinha" (PNAB Cidade de Goiás).
Colete as seguintes informações:
- Tipo: Pessoa Física ou Jurídica
- Nome completo / Razão social
- CPF/CNPJ
- RG e órgão expedidor
- Data de nascimento
- E-mail e telefone
- Endereço completo com CEP
- Dados bancários (agência, conta, banco)
- Comunidade tradicional (se aplicável)
- Gênero, raça/cor/etnia
- Se é pessoa LGBTQIAPN+ e/ou PcD
Ajude a organizar essas informações de forma clara e estruturada.`,

  2: `Você está ajudando a escolher a CATEGORIA E COTAS para o Edital de Premiação "Badiinha".
Categorias disponíveis:
- Grupos e coletivos culturais (10 vagas, R$ 3.606,84 por vaga)
- Festas Populares (8 vagas, R$ 3.306,27 por vaga) 
- Blocos de Carnaval (4 vagas, R$ 2.404,56 por vaga)

Cotas disponíveis: 25% pessoas negras, 10% indígenas, 5% PcD.
Quem opta por cotas concorre também na ampla concorrência.
Ajude o proponente a escolher a melhor categoria e se deve concorrer às cotas.`,

  3: `Você está ajudando a elaborar o MINI CURRÍCULO E HISTÓRICO DE ATUAÇÃO do agente cultural.
Este é o Critério A de seleção (20 pontos): "Reconhecida atuação na categoria cultural inscrito(a)".
O currículo deve:
- Destacar as principais atuações culturais realizadas nos últimos 2 anos
- Demonstrar experiência e relevância na categoria escolhida
- Incluir eventos, apresentações, oficinas, produções realizadas
- Mencionar prêmios, reconhecimentos, participações em editais anteriores
Gere um texto profissional mas que preserve a voz do agente cultural.`,

  4: `Você está ajudando a descrever o PÚBLICO E CONTRIBUIÇÃO À COMUNIDADE.
Critérios de seleção relevantes:
- Critério B (30pts): Integração e inovação com outras esferas (cultura+educação, cultura+saúde, cultura+meio ambiente)
- Critério C (15pts): Contribuição a populações vulneráveis (idosos, crianças, pessoas negras, etc.)
- Critério D (15pts): Contribuição à comunidade (ações, contratação local, etc.)

Ajude a descrever:
- Perfil do público atingido (faixa etária, localização, perfil socioeconômico)
- Como o trabalho cultural se integra com outras áreas
- Impacto social nas comunidades atendidas`,

  5: `Você está ajudando a descrever as MEDIDAS DE ACESSIBILIDADE dos projetos culturais.
Este é o Critério F de seleção (10 pontos).
Categorias de acessibilidade conforme IN MINC nº 10/2023:

Acessibilidade arquitetônica: rotas acessíveis, piso tátil, rampas, elevadores, banheiros adaptados, etc.
Acessibilidade comunicacional: Libras, Braille, audiodescrição, legendas, linguagem simples, leitores de tela.
Acessibilidade atitudinal: capacitação de equipes, contratação de profissionais com deficiência, formação e sensibilização.

Ajude o agente a identificar e descrever as medidas já implementadas ou planejadas.`,

  6: `Você está ajudando a organizar o PORTFÓLIO E COMPROVAÇÕES de atuação cultural.
O portfólio deve reunir registros dos últimos 2 anos:
- Fotos de eventos, apresentações, oficinas
- Vídeos de atividades culturais
- Material gráfico (cartazes, folders, programas)
- Postagens em redes sociais
- Relatórios de atividades
- Matérias em jornais/mídia

Critério E (10pts): Diálogo com patrimônio cultural e educação patrimonial.
Ajude a descrever como o trabalho cultural dialoga com o patrimônio cultural de Goiás.`,

  7: `Você está ajudando na REVISÃO FINAL E DECLARAÇÕES da inscrição.
Verifique se todas as declarações necessárias estão preenchidas:
- Declaração étnico-racial (Anexo V) - se concorrer a cotas para negros/indígenas
- Declaração PcD (Anexo VI) - se concorrer a cotas para pessoas com deficiência
- Declaração de representação de grupo (Anexo IV) - se coletivo sem CNPJ
- Declaração de residência (Anexo VII) - comprovando 2+ anos no Município de Goiás
- Declaração de indicação de festeiro (Anexo IX) - se categoria Festas Populares

Faça uma revisão completa de todas as etapas e aponte possíveis melhorias.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, step_name, step_number, edital_type, edital_briefing } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const stepPrompts = edital_type === "premiacao" ? STEP_PROMPTS_PREMIACAO : STEP_PROMPTS_DEFAULT;
    const editalContext = edital_briefing
      ? `\n\nCONTEXTO DO EDITAL:\n${edital_briefing}`
      : "";

    const systemPrompt = `Você é um consultor especializado em elaboração de projetos culturais para editais de fomento no Brasil. 
Seu tom é acessível mas tecnicamente preciso. Responda sempre em português brasileiro.
Você conhece profundamente: Lei Rouanet, PROAC, PNAB, Funarte, FAC-DF, FAC-GO/Goyazes, e editais estaduais/municipais.

ETAPA ATUAL: ${step_name} (${step_number}/7)
${stepPrompts[step_number] || ""}
${editalContext}

DIRETRIZES:
- Gere textos técnicos mas que preservem a voz artística do proponente
- Use linguagem adequada para editais de fomento cultural
- Seja específico e evite generalizações
- Ofereça sugestões de melhoria quando relevante
- Se o proponente der informações insuficientes, faça perguntas direcionadas
- Formate o texto de forma clara com parágrafos e, quando apropriado, listas
- Quando aplicável, mencione os critérios de seleção e como maximizar a pontuação`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

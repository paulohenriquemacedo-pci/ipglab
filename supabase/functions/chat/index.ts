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
  1: `Você está ajudando o agente cultural a descrever suas PRINCIPAIS AÇÕES CULTURAIS para o Edital de Premiação "Badiinha" (PNAB Cidade de Goiás).

IMPORTANTE: Você deve FAZER PERGUNTAS ao usuário para coletar informações. Não invente dados.

Quando o usuário entrar nesta etapa, comece perguntando:
"Olá! Vamos começar a construir o texto sobre suas principais ações culturais. Me conte: em qual área ou segmento cultural você atua? (Ex: música, dança, teatro, artesanato, festas populares, etc.)"

Após a resposta, pergunte sobre:
- Quais são as principais atividades que realiza (apresentações, oficinas, eventos, etc.)
- Onde realiza essas atividades (bairros, espaços culturais, escolas, praças)
- Com que frequência realiza essas atividades
- Há quanto tempo desenvolve esse trabalho

Quando tiver informações suficientes, gere um RASCUNHO de texto estruturado (200-400 palavras) e peça aprovação do usuário.
Este é o Critério A de seleção (20 pontos - Relevância da trajetória do agente cultural).`,

  2: `Você está ajudando a descrever o INÍCIO DA TRAJETÓRIA cultural do agente para o Edital "Badiinha".

IMPORTANTE: Faça perguntas para coletar as informações. Não invente dados.

Comece perguntando:
"Agora vamos falar sobre como começou sua trajetória cultural. Me conte: como e quando você começou a se envolver com atividades culturais?"

Após a resposta, explore:
- O que motivou o início da trajetória
- Quais foram as primeiras atividades realizadas
- Como evoluiu ao longo do tempo
- Quais foram os marcos mais importantes

Quando tiver informações suficientes, gere um RASCUNHO e peça aprovação.
Este é o Critério A de seleção (20 pontos).`,

  3: `Você está ajudando a descrever o IMPACTO NA COMUNIDADE para o Edital "Badiinha".

IMPORTANTE: Faça perguntas para coletar as informações.

Comece perguntando:
"Vamos falar sobre o impacto do seu trabalho cultural na comunidade. Quem são as pessoas que participam ou são beneficiadas pelas suas atividades?"

Após a resposta, explore:
- Quantas pessoas são impactadas direta e indiretamente
- Como as ações beneficiam as pessoas ao redor
- Se a comunidade participa como público ou também trabalha nos projetos
- Se atende populações vulneráveis (idosos, crianças, pessoas em situação de vulnerabilidade)
- Exemplos concretos de impacto

Quando tiver informações suficientes, gere um RASCUNHO e peça aprovação.
Critérios: Contribuição a populações vulneráveis (15pts), Contribuição à comunidade (15pts).`,

  4: `Você está ajudando a descrever as AÇÕES INTERDISCIPLINARES para o Edital "Badiinha".

IMPORTANTE: Faça perguntas para coletar as informações.

Comece perguntando:
"Suas atividades culturais têm relação com outras áreas além da cultura? Por exemplo: educação, saúde, esporte, meio ambiente, assistência social?"

Após a resposta, explore:
- Como a cultura se integra com essas outras áreas
- Exemplos concretos de projetos interdisciplinares
- Parcerias com escolas, postos de saúde, associações
- Resultados alcançados nessas interações

Quando tiver informações suficientes, gere um RASCUNHO e peça aprovação.
Critério B (30 pontos - Integração do projeto com outras esferas da vida social).`,

  5: `Você está ajudando com o UPLOAD DE DOCUMENTOS para o Edital "Badiinha".

Explique ao usuário quais documentos são necessários:
- Currículo ou portfólio com registros dos últimos 2 anos
- Comprovante de endereço
- Declaração de residência (Anexo VII) - mínimo 2 anos no Município de Goiás
- Declaração étnico-racial (Anexo V) - se concorrer a cotas para negros/indígenas  
- Declaração PcD (Anexo VI) - se concorrer a cotas para PcD
- Declaração de representação de grupo (Anexo IV) - se coletivo sem CNPJ

Ajude o usuário a organizar e verificar se tem todos os documentos necessários.`,

  6: `Você está ajudando na REVISÃO FINAL E DECLARAÇÕES da inscrição para o Edital "Badiinha".

Faça uma revisão completa:
- Verifique se todas as seções anteriores foram preenchidas
- Confirme se as declarações necessárias foram providenciadas
- Aponte possíveis melhorias nos textos
- Verifique consistência dos dados

Pergunte se o usuário gostaria de revisar alguma seção específica.`,
};

const STEP_PROMPTS_FOMENTO: Record<number, string> = {
  1: `Você está ajudando o agente cultural a elaborar a DESCRIÇÃO DO PROJETO para o Edital "Octo Marques 110 Anos" (Fomento PNAB - Município de Goiás/GO).
Pergunte em qual das 8 categorias pretende inscrever: I-Artes Visuais/Urbanas/Cênicas, II-Artesanato, III-Audiovisual, IV-Cultura Popular, V-Educação Patrimonial, VI-Gastronomia, VII-Leitura/Escrita/Oralidade, VIII-Música.
Ajude a articular a ideia central, objetivos e justificativa do projeto. O texto deve ser claro e demonstrar relevância cultural.`,
  2: `Você está ajudando a elaborar a seção de ATUAÇÃO CULTURAL E INTEGRAÇÃO.
Critério A (20pts): Reconhecida atuação na categoria cultural inscrita - pergunte sobre experiência, projetos anteriores, tempo de atuação.
Critério B (30pts - maior peso!): Integração e inovação com outras esferas como educação, saúde, meio ambiente, assistência social. Pergunte como o projeto dialoga com estas áreas.`,
  3: `Você está ajudando a elaborar a seção de IMPACTO SOCIAL E COMUNITÁRIO.
Critério C (15pts): Contribuição a populações em vulnerabilidade social (idosos, crianças, pessoas negras, etc).
Critério D (15pts): Contribuição à comunidade (ações comunitárias, contratação de profissionais locais).
Pergunte: quem são os beneficiários? Como o projeto transforma a realidade local?`,
  4: `Você está ajudando a elaborar a seção de PATRIMÔNIO E ACESSIBILIDADE.
Critério E (10pts): Diálogo com patrimônio cultural material e imaterial e educação patrimonial.
Critério F (10pts): Acessibilidade - medidas para pessoas com mobilidade reduzida ou deficiência (auditiva, visual, motora, intelectual, múltipla).
Pergunte sobre medidas de acessibilidade arquitetônica, comunicacional e atitudinal previstas no projeto.`,
  5: `Você está ajudando a elaborar o PLANO DE TRABALHO E ORÇAMENTO.
Ajude a detalhar as atividades/ações do projeto e construir a planilha orçamentária.
O valor deve ser compatível com o máximo da categoria. Os valores devem ser condizentes com o mercado.
Pergunte item a item: materiais, serviços, cachês, transporte, alimentação, divulgação, etc.`,
  6: `Você está ajudando a elaborar o CRONOGRAMA E EQUIPE.
O projeto deve ser executado até 31/03/2027.
Ajude a organizar as atividades em etapas com prazos realistas.
Pergunte sobre a equipe: profissionais envolvidos, funções, qualificações. Valorize contratação de profissionais da comunidade.`,
  7: `Você está ajudando na etapa de DOCUMENTOS E REVISÃO FINAL.
Verifique se todos os documentos necessários foram providenciados:
- Formulário de inscrição/Plano de trabalho (Anexo II)
- Planilha orçamentária
- Autodeclaração étnico-racial (se concorrer a cotas: 25% negros, 10% indígenas, 5% PcD)
- Declaração de representação de grupo (se coletivo sem CNPJ)
Revise a consistência geral da proposta e os bônus de pontuação aplicáveis (mulher 0,5pt, LGBTQIAPN+ 0,5pt, quilombola 0,5pt, rural/distrito 1pt, periferia 1pt).`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, step_name, step_number, edital_type, edital_briefing, auto_start } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let stepPrompts: Record<number, string>;
    if (edital_type === "premiacao") stepPrompts = STEP_PROMPTS_PREMIACAO;
    else if (edital_type === "fomento") stepPrompts = STEP_PROMPTS_FOMENTO;
    else stepPrompts = STEP_PROMPTS_DEFAULT;
    
    const editalContext = edital_briefing
      ? `\n\nCONTEXTO DO EDITAL:\n${edital_briefing}`
      : "";

    const autoStartInstruction = auto_start
      ? "\n\nINSTRUÇÃO ESPECIAL: O usuário acabou de entrar nesta etapa. Faça a primeira pergunta de forma acolhedora para começar a coletar as informações. NÃO gere texto sem antes perguntar. Apenas faça a pergunta inicial."
      : "";

    const systemPrompt = `Você é um consultor especializado em elaboração de projetos culturais para editais de fomento no Brasil. 
Seu tom é acolhedor, acessível e tecnicamente preciso. Responda sempre em português brasileiro.
Você conhece profundamente: Lei Rouanet, PROAC, PNAB, Funarte, FAC-DF, FAC-GO/Goyazes, e editais estaduais/municipais.

ETAPA ATUAL: ${step_name} (${step_number})
${stepPrompts[step_number] || ""}
${editalContext}
${autoStartInstruction}

DIRETRIZES:
- SEMPRE faça perguntas ao usuário para coletar informações antes de gerar textos
- Preserve a voz e identidade do agente cultural nos textos gerados
- Use linguagem adequada para editais de fomento cultural
- Seja específico e evite generalizações
- Quando tiver informações suficientes, gere um RASCUNHO e peça aprovação do usuário
- Se o usuário aprovar, formate como texto final
- Se o usuário quiser ajustar, faça as modificações solicitadas
- Formate o texto de forma clara com parágrafos
- Quando aplicável, mencione os critérios de seleção e como maximizar a pontuação`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
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

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Send, CheckCircle, Loader2, Edit3, Bot, User, ThumbsUp, ClipboardCopy, AlertCircle } from "lucide-react";
import logoIpg from "@/assets/logo-ipg.jpeg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  STEP_PROMPTS_PREMIACAO,
  STEP_PROMPTS_DEFAULT,
  STEP_PROMPTS_FOMENTO,
} from "@/components/NewProjectDialog";
import ProjectRegistrationForm from "@/components/ProjectRegistrationForm";
import TransitionDialog from "@/components/TransitionDialog";

interface Section {
  id: string;
  step_number: number;
  step_name: string;
  content: string | null;
  ai_draft: string | null;
  is_completed: boolean;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const ProjectWizard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [edital, setEdital] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState<Set<number>>(new Set());
  const [finalResponse, setFinalResponse] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentSection = sections.find(s => s.step_number === currentStep);
  const totalSteps = sections.length + 1;
  const completedSteps = sections.filter(s => s.is_completed).length + (profileCompleted ? 1 : 0);
  const progress = (completedSteps / totalSteps) * 100;

  const getStepInfo = (stepNum: number) => {
    if (stepNum === 0) return { name: "Dados Cadastrais", prompt: "Preencha seus dados pessoais, bancários e perfil socioidentitário conforme o formulário de inscrição." };
    const instrumentType = edital?.instrument_type;
    if (instrumentType === "premiacao" && STEP_PROMPTS_PREMIACAO[stepNum]) return STEP_PROMPTS_PREMIACAO[stepNum];
    if (instrumentType === "fomento" && STEP_PROMPTS_FOMENTO[stepNum]) return STEP_PROMPTS_FOMENTO[stepNum];
    if (STEP_PROMPTS_DEFAULT[stepNum]) return STEP_PROMPTS_DEFAULT[stepNum];
    const section = sections.find(s => s.step_number === stepNum);
    return { name: section?.step_name || `Etapa ${stepNum}`, prompt: "" };
  };

  useEffect(() => {
    const load = async () => {
      const { data: proj } = await supabase.from("projects").select("*").eq("id", id).single();
      if (!proj) { navigate("/dashboard"); return; }
      setProject(proj);
      setProjectTitle(proj.title);

      if (proj.edital_id) {
        const { data: ed } = await supabase.from("editais").select("*").eq("id", proj.edital_id).single();
        if (ed) setEdital(ed);
      }

      const { data: secs } = await supabase.from("project_sections").select("*").eq("project_id", id).order("step_number");
      if (secs) setSections(secs);

      // Check if project has registration data
      const { data: reg } = await supabase
        .from("project_registrations")
        .select("id")
        .eq("project_id", id)
        .single();
      if (reg) {
        setProfileCompleted(true);
        setCurrentStep(1);
      }
    };
    load();
  }, [id]);

  // Load chat messages when step changes
  useEffect(() => {
    if (currentStep === 0) return;
    setFinalResponse("");
    const loadChat = async () => {
      const { data: msgs } = await supabase.from("chat_messages").select("*").eq("project_id", id).eq("step_number", currentStep).order("created_at");
      if (msgs && msgs.length > 0) {
        setChatMessages(msgs.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
      } else {
        setChatMessages([]);
      }
    };
    if (id) loadChat();
  }, [currentStep, id]);

  // Auto-trigger AI first question when entering a new step with no messages
  useEffect(() => {
    if (currentStep === 0 || isStreaming || !id || !edital) return;
    if (autoTriggered.has(currentStep)) return;
    if (chatMessages.length > 0) return;

    // Small delay to ensure chat loaded
    const timer = setTimeout(() => {
      triggerAutoQuestion();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentStep, chatMessages, edital, isStreaming, autoTriggered]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const triggerAutoQuestion = async () => {
    if (!id || isStreaming) return;

    setAutoTriggered(prev => new Set(prev).add(currentStep));
    setIsStreaming(true);

    const stepInfo = getStepInfo(currentStep);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const autoPrompt = `O usuário acabou de entrar na etapa "${stepInfo.name}". Faça a primeira pergunta para começar a coletar as informações necessárias. Seja acolhedor e direto.`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: autoPrompt }],
          step_name: stepInfo.name,
          step_number: currentStep,
          project_id: id,
          edital_type: edital?.instrument_type || "default",
          edital_briefing: edital?.briefing || "",
          auto_start: true,
        }),
      });

      if (!resp.ok) {
        setIsStreaming(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let assistantSoFar = "";
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setChatMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [{ role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantSoFar) {
        await supabase.from("chat_messages").insert({
          project_id: id, step_number: currentStep, role: "assistant", content: assistantSoFar,
        });
      }
    } catch (err) {
      console.error("Auto-question error:", err);
    } finally {
      setIsStreaming(false);
    }
  };

  const sendMessage = useCallback(async () => {
    const trimmed = userInput.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: ChatMsg = { role: "user", content: trimmed };
    setChatMessages(prev => [...prev, userMsg]);
    setUserInput("");
    setIsStreaming(true);

    await supabase.from("chat_messages").insert({
      project_id: id, step_number: currentStep, role: "user", content: trimmed,
    });

    const stepInfo = getStepInfo(currentStep);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const allMessages = [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          step_name: stepInfo.name,
          step_number: currentStep,
          project_id: id,
          edital_type: edital?.instrument_type || "default",
          edital_briefing: edital?.briefing || "",
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) { toast.error("Limite de requisições excedido. Tente novamente em instantes."); setIsStreaming(false); return; }
        if (resp.status === 402) { toast.error("Créditos insuficientes."); setIsStreaming(false); return; }
        throw new Error("Erro na resposta da IA");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let assistantSoFar = "";
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setChatMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantSoFar) {
        await supabase.from("chat_messages").insert({
          project_id: id, step_number: currentStep, role: "assistant", content: assistantSoFar,
        });
        await supabase.from("project_sections").update({ ai_draft: assistantSoFar }).eq("project_id", id).eq("step_number", currentStep);
        setSections(prev => prev.map(s => s.step_number === currentStep ? { ...s, ai_draft: assistantSoFar } : s));
      }
    } catch (err) {
      toast.error("Erro ao comunicar com a IA. Tente novamente.");
    } finally {
      setIsStreaming(false);
    }
  }, [userInput, isStreaming, chatMessages, currentStep, id, edital]);

  // Map step numbers to profile trajectory fields
  const STEP_TO_PROFILE_FIELD: Record<number, string> = {
    1: "trajetoria_acoes",
    2: "trajetoria_inicio",
    3: "trajetoria_impacto",
    4: "trajetoria_outras_areas",
  };

  const approveFinalResponse = async () => {
    const text = finalResponse.trim();
    if (!text || !id || !currentSection) {
      toast.error("Cole a resposta final no campo antes de aprovar.");
      return;
    }

    // Save to project_sections
    await supabase.from("project_sections").update({
      content: text, ai_draft: text, is_completed: true,
    }).eq("project_id", id).eq("step_number", currentStep);
    setSections(prev => prev.map(s => s.step_number === currentStep ? { ...s, content: text, ai_draft: text, is_completed: true } : s));

    // Also save to profile trajectory field if applicable
    const profileField = STEP_TO_PROFILE_FIELD[currentStep];
    if (profileField) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ [profileField]: text }).eq("user_id", user.id);
      }
    }

    toast.success(`✅ "${getStepInfo(currentStep).name}" aprovada e salva no formulário!`);
  };

  const acceptDraft = async () => {
    if (!currentSection?.ai_draft) return;
    setEditContent(currentSection.ai_draft);
    setEditMode(true);
  };

  const saveSectionContent = async () => {
    await supabase.from("project_sections").update({
      content: editContent, is_completed: true,
    }).eq("project_id", id).eq("step_number", currentStep);
    setSections(prev => prev.map(s => s.step_number === currentStep ? { ...s, content: editContent, is_completed: true } : s));
    setEditMode(false);

    // Also save to profile trajectory field
    const profileField = STEP_TO_PROFILE_FIELD[currentStep];
    if (profileField) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ [profileField]: editContent }).eq("user_id", user.id);
      }
    }

    toast.success(`${getStepInfo(currentStep).name} salva!`);
  };

  const updateTitle = async () => {
    await supabase.from("projects").update({ title: projectTitle }).eq("id", id);
  };

  const handleProfileComplete = () => {
    setProfileCompleted(true);
    setShowTransition(true);
  };

  const handleTransitionContinue = () => {
    setShowTransition(false);
    setCurrentStep(1);
  };

  const stepInfo = getStepInfo(currentStep);
  const maxProjectStep = sections.length > 0 ? Math.max(...sections.map(s => s.step_number)) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Transition Dialog */}
      <TransitionDialog open={showTransition} onContinue={handleTransitionContinue} />

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Projetos
            </Button>
            <Input
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              onBlur={updateTitle}
              className="border-none bg-transparent font-semibold text-base w-64 focus-visible:ring-1"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{completedSteps}/{totalSteps} etapas</span>
            <Progress value={progress} className="w-24 h-2" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border p-4 hidden lg:block">
          {edital && (
            <div className="mb-4 pb-4 border-b border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Edital</p>
              <p className="text-xs font-medium leading-tight">{edital.name}</p>
            </div>
          )}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Etapas</h3>
          <nav className="space-y-1">
            {/* Step 0: Profile */}
            <button
              onClick={() => { setCurrentStep(0); setEditMode(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                currentStep === 0 ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
              }`}
            >
              {profileCompleted ? (
                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate">Dados Cadastrais</span>
            </button>

            {/* Project steps */}
            {sections.map(s => {
              const isCurrent = currentStep === s.step_number;
              const isCompleted = s.is_completed;
              return (
                <button
                  key={s.step_number}
                  onClick={() => { setCurrentStep(s.step_number); setEditMode(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                    isCurrent ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  ) : (
                    <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      isCurrent ? "border-primary text-primary" : "border-muted-foreground/30 text-muted-foreground"
                    }`}>{s.step_number}</span>
                  )}
                  <span className="truncate">{s.step_name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Step header */}
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {currentStep === 0 ? "Dados do Agente" : `Etapa ${currentStep}`}
              </Badge>
              {currentStep === 0 && profileCompleted && <Badge className="bg-success text-success-foreground text-xs">Concluída</Badge>}
              {currentStep > 0 && currentSection?.is_completed && <Badge className="bg-success text-success-foreground text-xs">Concluída</Badge>}
            </div>
            <h2 className="text-xl font-sans font-semibold">{stepInfo.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{stepInfo.prompt}</p>
          </div>

          {/* Step 0: Profile Form */}
          {currentStep === 0 ? (
            <div className="flex-1 overflow-y-auto p-6">
              <ProfileFormSteps onComplete={handleProfileComplete} embedded />
            </div>
          ) : editMode ? (
            <div className="flex-1 p-6 flex flex-col">
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="flex-1 min-h-[300px] text-sm leading-relaxed"
                placeholder="Edite o conteúdo desta seção..."
              />
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                <Button onClick={saveSectionContent}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Salvar Seção
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.length === 0 && !isStreaming && (
                  <div className="text-center py-12">
                    <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Preparando as perguntas para esta etapa...
                    </p>
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mt-3 text-primary" />
                  </div>
                )}
                <AnimatePresence>
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted border border-border"
                      }`}>
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                            <img src={logoIpg} alt="IPG" className="h-3 w-3 object-contain" /> Assistente IA
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {msg.role === "assistant" && currentStep >= 1 && currentStep <= 4 && !isStreaming && i === chatMessages.length - 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3 gap-2 text-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              setFinalResponse(msg.content);
                              toast.success("Resposta copiada para o campo de resposta final!");
                            }}
                          >
                            <ClipboardCopy className="h-3.5 w-3.5" /> Copiar para resposta final
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isStreaming && chatMessages.length > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Resposta Final Field */}
              {currentStep >= 1 && currentStep <= 4 && !currentSection?.is_completed && (
                <div className="px-6 py-4 border-t border-border bg-accent/30">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Importante:</strong> Copie a resposta da IA que deseja utilizar no campo abaixo. Você pode editá-la antes de aprovar. <strong>Somente o texto deste campo será incluído no formulário de inscrição (Anexo II).</strong>
                    </p>
                  </div>
                  <Textarea
                    value={finalResponse}
                    onChange={e => setFinalResponse(e.target.value)}
                    placeholder="Cole aqui a resposta final que deseja incluir no formulário de inscrição..."
                    rows={4}
                    className="resize-none text-sm mb-3"
                  />
                  <Button
                    onClick={approveFinalResponse}
                    disabled={!finalResponse.trim()}
                    className="gap-2"
                  >
                    <ThumbsUp className="h-4 w-4" /> Aprovar resposta final e salvar no formulário
                  </Button>
                </div>
              )}

              {currentSection?.is_completed && (
                <div className="px-6 py-3 border-t border-border bg-accent/20 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Etapa aprovada e salva no formulário.</span>
                </div>
              )}




              <div className="border-t border-border p-4">
                <div className="flex gap-3">
                  <Textarea
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Responda à pergunta ou peça ajuda ao assistente..."
                    rows={2}
                    className="resize-none text-sm"
                    disabled={isStreaming}
                  />
                  <Button onClick={sendMessage} disabled={isStreaming || !userInput.trim()} className="self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step navigation */}
          <div className="border-t border-border px-6 py-3 flex justify-between">
            <Button variant="outline" size="sm" disabled={currentStep === 0} onClick={() => { setCurrentStep(s => s - 1); setEditMode(false); }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={currentStep === maxProjectStep} onClick={() => { setCurrentStep(s => s + 1); setEditMode(false); }}>
              Próxima <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectWizard;

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Send, CheckCircle, Loader2, Edit3, Bot, User } from "lucide-react";
import logoIpg from "@/assets/logo-ipg.jpeg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  STEP_PROMPTS_PREMIACAO,
  STEP_PROMPTS_DEFAULT,
} from "@/components/NewProjectDialog";
import ProfileFormSteps from "@/components/ProfileFormSteps";

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
  const [currentStep, setCurrentStep] = useState(0); // Start at 0 for profile
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [profileCompleted, setProfileCompleted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentSection = sections.find(s => s.step_number === currentStep);
  const totalSteps = sections.length + 1; // +1 for profile step
  const completedSteps = sections.filter(s => s.is_completed).length + (profileCompleted ? 1 : 0);
  const progress = (completedSteps / totalSteps) * 100;

  const getStepInfo = (stepNum: number) => {
    if (stepNum === 0) return { name: "Dados Cadastrais", prompt: "Preencha seus dados pessoais, bancários e perfil socioidentitário conforme o formulário de inscrição." };
    const instrumentType = edital?.instrument_type;
    if (instrumentType === "premiacao" && STEP_PROMPTS_PREMIACAO[stepNum]) return STEP_PROMPTS_PREMIACAO[stepNum];
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

      // Check if profile is already completed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("onboarding_completed").eq("user_id", user.id).single();
        if (profile?.onboarding_completed) {
          setProfileCompleted(true);
          setCurrentStep(1); // Skip to first project step if profile done
        }
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (currentStep === 0) return;
    const loadChat = async () => {
      const { data: msgs } = await supabase.from("chat_messages").select("*").eq("project_id", id).eq("step_number", currentStep).order("created_at");
      if (msgs) setChatMessages(msgs.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
      else setChatMessages([]);
    };
    if (id) loadChat();
  }, [currentStep, id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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
    toast.success(`${getStepInfo(currentStep).name} salva!`);
  };

  const updateTitle = async () => {
    await supabase.from("projects").update({ title: projectTitle }).eq("id", id);
  };

  const handleProfileComplete = () => {
    setProfileCompleted(true);
    setCurrentStep(1);
  };

  const stepInfo = getStepInfo(currentStep);
  const maxProjectStep = sections.length > 0 ? Math.max(...sections.map(s => s.step_number)) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                {chatMessages.length === 0 && (
                  <div className="text-center py-12">
                    <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Descreva sua ideia e o assistente IA vai ajudá-lo a elaborar esta seção.
                    </p>
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
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isStreaming && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {currentSection?.ai_draft && !currentSection?.is_completed && (
                <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center gap-3">
                  <Button size="sm" onClick={acceptDraft}>
                    <Edit3 className="h-4 w-4 mr-2" /> Revisar e Editar Rascunho
                  </Button>
                  <span className="text-xs text-muted-foreground">Revise o rascunho gerado pela IA antes de salvar</span>
                </div>
              )}

              <div className="border-t border-border p-4">
                <div className="flex gap-3">
                  <Textarea
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Descreva sua ideia ou peça ajuda ao assistente..."
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

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, LogOut, Clock, Download, ChevronDown, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import NewProjectDialog, { getStepsForEdital } from "@/components/NewProjectDialog";
import ProjectRegistrationForm from "@/components/ProjectRegistrationForm";
import { generateAnexoII } from "@/lib/generateAnexoII";
import { generateAnexoIV, generateAnexoV, generateAnexoVI, generateAnexoVII } from "@/lib/generateAnexos";
import {
  generateAnexoIIA, generateAnexoIIB,
  generateAnexoVI_OctoMarques, generateAnexoVII_OctoMarques,
  generateAnexoVIII_OctoMarques, generateAnexoIX_OctoMarques,
} from "@/lib/generateAnexosOctoMarques";

interface Project {
  id: string;
  title: string;
  status: string;
  conformity_score: number | null;
  created_at: string;
  updated_at: string;
  edital_id: string | null;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho", in_progress: "Em elaboração", completed: "Concluído",
  submitted: "Submetido", approved: "Aprovado",
};

const statusColors: Record<string, string> = {
  draft: "secondary", in_progress: "default", completed: "default",
  submitted: "outline", approved: "default",
};

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Registration flow state
  const [regProjectId, setRegProjectId] = useState<string | null>(null);
  const [regEditalType, setRegEditalType] = useState<string>("premiacao");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const deleteProject = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("projects").delete().eq("id", deleteId);
    if (error) toast.error("Erro ao deletar projeto");
    else {
      setProjects(prev => prev.filter(p => p.id !== deleteId));
      toast.success("Projeto deletado");
    }
    setDeleteId(null);
  };

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) toast.error("Erro ao carregar projetos");
      else setProjects(data || []);
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const createProject = async (editalId: string, editalName: string) => {
    setCreating(true);
    try {
      const { data: edital } = await supabase
        .from("editais")
        .select("instrument_type")
        .eq("id", editalId)
        .single();

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user!.id,
          title: `Projeto - ${editalName}`,
          edital_id: editalId,
        })
        .select()
        .single();
      if (error) { toast.error("Erro ao criar projeto"); return; }

      const steps = getStepsForEdital(edital?.instrument_type || null);
      const sections = steps.map(s => ({ ...s, project_id: data.id }));
      await supabase.from("project_sections").insert(sections);

      // Open registration form instead of navigating directly
      setDialogOpen(false);
      setRegEditalType(edital?.instrument_type || "premiacao");
      setRegProjectId(data.id);
    } finally {
      setCreating(false);
    }
  };

  const handleRegistrationComplete = () => {
    const projectId = regProjectId;
    setRegProjectId(null);
    if (projectId) navigate(`/project/${projectId}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getRegistrationData = async (projectId?: string) => {
    if (!user) return null;
    // Try project-specific registration first
    if (projectId) {
      const { data } = await supabase
        .from("project_registrations")
        .select("*")
        .eq("project_id", projectId)
        .single();
      if (data) return data as any;
    }
    // Fallback to profile
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (error || !data) {
      toast.error("Erro ao carregar dados. Complete seu cadastro primeiro.");
      return null;
    }
    return data as any;
  };

  const handleDownloadAnexo = async (generator: (p: any) => Promise<void>, label: string) => {
    const profile = await getRegistrationData();
    if (!profile) return;
    try {
      await generator(profile);
      toast.success(`${label} gerado com sucesso!`);
    } catch {
      toast.error("Erro ao gerar documento");
    }
  };

  const handleDownloadAll = async () => {
    const profile = await getRegistrationData();
    if (!profile) return;
    const generators = [
      { fn: generateAnexoII, label: "Anexo II" },
      { fn: generateAnexoIV, label: "Anexo IV" },
      { fn: generateAnexoV, label: "Anexo V" },
      { fn: generateAnexoVI, label: "Anexo VI" },
      { fn: generateAnexoVII, label: "Anexo VII" },
    ];
    let success = 0;
    for (const gen of generators) {
      try { await gen.fn(profile); success++; } catch { toast.error(`Erro ao gerar ${gen.label}`); }
    }
    if (success > 0) toast.success(`${success} anexos gerados com sucesso!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl mb-1">Meus Projetos</h1>
            <p className="text-muted-foreground">Gerencie seus projetos culturais</p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" /> Anexos <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuItem disabled className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Edital Badiinha (Premiação)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadAll} className="font-semibold">
                  <Download className="h-4 w-4 mr-2" /> Baixar todos (Badiinha)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadAnexo(generateAnexoII, "Anexo II")}>
                  <FileText className="h-4 w-4 mr-2" /> Anexo II – Formulário de Inscrição
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadAnexo(generateAnexoIV, "Anexo IV")}>
                  <FileText className="h-4 w-4 mr-2" /> Anexo IV – Representação de Grupo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadAnexo(generateAnexoV, "Anexo V")}>
                  <FileText className="h-4 w-4 mr-2" /> Anexo V – Autodeclaração Étnico-Racial
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadAnexo(generateAnexoVI, "Anexo VI")}>
                  <FileText className="h-4 w-4 mr-2" /> Anexo VI – Declaração PcD
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadAnexo(generateAnexoVII, "Anexo VII")}>
                  <FileText className="h-4 w-4 mr-2" /> Anexo VII – Declaração de Residência
                </DropdownMenuItem>
                <div className="h-px bg-border my-2" />
                <DropdownMenuItem disabled className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Edital Octo Marques (Fomento)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadAnexo(generateAnexoIIA, "Anexo II-A")}>
                  <FileText className="h-4 w-4 mr-2" /> Anexo II-A – Inscrição PF/MEI/Coletivo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadAnexo(generateAnexoIIB, "Anexo II-B")}>
                  <FileText className="h-4 w-4 mr-2" /> Anexo II-B – Inscrição Pessoa Jurídica
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadAnexo(generateAnexoVI_OctoMarques, "Anexo VI")}>
                  <FileText className="h-4 w-4 mr-2" /> Anexo VI – Declaração Coletivo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadAnexo(generateAnexoVII_OctoMarques, "Anexo VII")}>
                  <FileText className="h-4 w-4 mr-2" /> Anexo VII – Declaração Étnico-Racial
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadAnexo(generateAnexoVIII_OctoMarques, "Anexo VIII")}>
                  <FileText className="h-4 w-4 mr-2" /> Anexo VIII – Declaração PcD
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadAnexo(generateAnexoIX_OctoMarques, "Anexo IX")}>
                  <FileText className="h-4 w-4 mr-2" /> Anexo IX – Declaração de Residência
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Novo Projeto
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader><div className="h-5 bg-muted rounded w-3/4" /><div className="h-4 bg-muted rounded w-1/2 mt-2" /></CardHeader>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold font-sans mb-2">Nenhum projeto ainda</h3>
              <p className="text-muted-foreground mb-6">Comece a elaborar seu primeiro projeto cultural com IA</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Criar Primeiro Projeto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <div key={p.id} className="relative group">
                <Link to={`/project/${p.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="font-sans text-base pr-8">{p.title}</CardTitle>
                        <Badge variant={statusColors[p.status] as any}>{statusLabels[p.status]}</Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                      </CardDescription>
                    </CardHeader>
                    {p.conformity_score !== null && (
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">Conformidade:</div>
                          <Badge variant={p.conformity_score >= 75 ? "default" : "secondary"}>
                            {p.conformity_score}%
                          </Badge>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </Link>
                <Button
                  variant="ghost" size="icon"
                  className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(p.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelectEdital={createProject}
        loading={creating}
      />

      {/* Registration Form Dialog */}
      <Dialog open={!!regProjectId} onOpenChange={(open) => { if (!open) setRegProjectId(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Dados Cadastrais do Proponente</DialogTitle>
            <DialogDescription>
              Preencha os dados do proponente para este projeto. Esses dados serão usados para gerar os anexos automaticamente.
            </DialogDescription>
          </DialogHeader>
          {regProjectId && (
            <ProjectRegistrationForm
              projectId={regProjectId}
              editalType={regEditalType}
              onComplete={handleRegistrationComplete}
              onCancel={() => setRegProjectId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O projeto e todos os seus dados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground font-sans">
          <a href="mailto:contato@institutopedragoiana.com.br" className="hover:text-foreground transition-colors">
            contato@institutopedragoiana.com.br
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;

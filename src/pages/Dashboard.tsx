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

interface Project {
  id: string;
  title: string;
  status: string;
  conformity_score: number | null;
  created_at: string;
  updated_at: string;
  edital_id: string | null;
  project_registrations?: { full_name: string } | { full_name: string }[];
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
        .select("*, project_registrations(full_name)")
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
      const { data: edital, error: editalError } = await supabase
        .from("editais")
        .select("instrument_type")
        .eq("id", editalId)
        .single();
      
      console.log("Creating project for edital:", editalId, "instrument_type:", edital?.instrument_type);

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user!.id,
          title: `Projeto - ${editalName}`,
          edital_id: editalId,
        })
        .select()
        .single();

      if (error) { 
        console.error("Error creating project:", error);
        toast.error("Erro ao criar projeto: " + error.message); 
        return; 
      }

      const steps = getStepsForEdital(edital?.instrument_type || null);
      console.log("Steps to insert:", steps.length, steps);
      
      const sections = steps.map(s => ({ 
        project_id: data.id,
        step_number: s.step_number,
        step_name: s.step_name
      }));

      const { error: sectionsError } = await supabase.from("project_sections").insert(sections);
      
      if (sectionsError) {
        console.error("Error creating sections:", sectionsError);
        toast.error("Erro ao configurar as etapas do projeto: " + sectionsError.message);
      }

      // Open registration form instead of navigating directly
      setDialogOpen(false);
      setRegEditalType(edital?.instrument_type || "premiacao");
      setRegProjectId(data.id);
    } catch (err: any) {
      console.error("Unexpected error in createProject:", err);
      toast.error("Erro inesperado: " + err.message);
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
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo Projeto
          </Button>
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
            {projects.map(p => {
              const isDefaultTitle = p.title.startsWith("Projeto - Edital");
              const regs = p.project_registrations;
              const propName = regs ? (Array.isArray(regs) ? regs[0]?.full_name : regs.full_name) : null;
              
              const displayTitle = !isDefaultTitle && p.title.trim() !== "" ? p.title : (propName || "Projeto Sem Título");
              const displaySubtitle = !isDefaultTitle ? (propName ? `Prop: ${propName}` : "Proponente pendente") : p.title;

              return (
                <div key={p.id} className="relative group">
                  <Link to={`/project/${p.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex flex-col gap-1 pr-4">
                            <CardTitle className="font-sans text-base leading-tight line-clamp-2">{displayTitle}</CardTitle>
                            <div className="text-sm font-medium text-muted-foreground line-clamp-2">{displaySubtitle}</div>
                          </div>
                          <Badge variant={statusColors[p.status] as any} className="shrink-0">{statusLabels[p.status]}</Badge>
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
              );
            })}
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

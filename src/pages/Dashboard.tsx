import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, LogOut, Clock, Download, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import NewProjectDialog, { getStepsForEdital } from "@/components/NewProjectDialog";
import { generateAnexoII } from "@/lib/generateAnexoII";
import { generateAnexoIV, generateAnexoV, generateAnexoVI, generateAnexoVII } from "@/lib/generateAnexos";

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
  draft: "Rascunho",
  in_progress: "Em elaboração",
  completed: "Concluído",
  submitted: "Submetido",
  approved: "Aprovado",
};

const statusColors: Record<string, string> = {
  draft: "secondary",
  in_progress: "default",
  completed: "default",
  submitted: "outline",
  approved: "default",
};

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
      // Get edital info to determine steps
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
      navigate(`/project/${data.id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getProfile = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (error || !data) {
      toast.error("Erro ao carregar perfil. Complete seu cadastro primeiro.");
      return null;
    }
    return data as any;
  };

  const handleDownloadAnexo = async (generator: (p: any) => Promise<void>, label: string) => {
    const profile = await getProfile();
    if (!profile) return;
    try {
      await generator(profile);
      toast.success(`${label} gerado com sucesso!`);
    } catch {
      toast.error("Erro ao gerar documento");
    }
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
            <Button variant="outline" onClick={handleDownloadAnexoII}>
              <Download className="h-4 w-4 mr-2" /> Anexo II
            </Button>
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
              <Link key={p.id} to={`/project/${p.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="font-sans text-base">{p.title}</CardTitle>
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
    </div>
  );
};

export default Dashboard;

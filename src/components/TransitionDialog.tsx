import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, ArrowRight } from "lucide-react";

interface TransitionDialogProps {
  open: boolean;
  onContinue: () => void;
}

const TransitionDialog = ({ open, onContinue }: TransitionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-7 w-7 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-lg">
            Dados cadastrais salvos com sucesso!
          </DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed mt-2">
            Agora vamos partir para o preenchimento das informações sobre a sua{" "}
            <strong>trajetória cultural</strong> e projetos desenvolvidos. Essas informações
            serão estruturadas pela IA e anexadas ao formulário de inscrição.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2 mt-2">
          <p className="font-medium text-foreground">Como funciona:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>A IA fará perguntas sobre cada item da sua trajetória</li>
            <li>Responda com suas informações e experiências</li>
            <li>A IA vai estruturar o texto para o formulário</li>
            <li>Você revisa e aprova antes de avançar</li>
          </ul>
        </div>

        <Button onClick={onContinue} className="w-full mt-4">
          Começar <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TransitionDialog;

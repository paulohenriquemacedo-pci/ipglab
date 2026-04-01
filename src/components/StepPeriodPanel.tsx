import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function StepPeriodPanel({ initialValue, onChange }: { initialValue: string, onChange: (val: string) => void }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    if (initialValue) {
      const match = initialValue.match(/Data Início: (.*)\nData Final: (.*)/);
      if (match) {
        setStart(match[1]);
        setEnd(match[2]);
      } else {
        setStart(initialValue);
      }
    }
  }, [initialValue]);

  const handleChange = (type: "start" | "end", val: string) => {
    let newStart = start;
    let newEnd = end;
    if (type === "start") {
      newStart = val;
      setStart(val);
    } else {
      newEnd = val;
      setEnd(val);
    }
    onChange(`Data Início: ${newStart}\nData Final: ${newEnd}`);
  };

  return (
    <Card className="mt-4 border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="font-semibold">Data de Início do Projeto</Label>
            <Input 
              type="date" 
              value={start} 
              onChange={e => handleChange("start", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Data Final do Projeto</Label>
            <Input 
              type="date" 
              value={end} 
              onChange={e => handleChange("end", e.target.value)} 
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Atenção: Conforme o Edital Octo Marques, o prazo limite para encerramento do projeto é 31/03/2027.
        </p>
      </CardContent>
    </Card>
  );
}

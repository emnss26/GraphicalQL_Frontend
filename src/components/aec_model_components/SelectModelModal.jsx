import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function SelectModelsModal({ models = [], open, onClose, onSave }) {
  const [selected, setSelected] = useState([]);


  const handleToggle = (modelId) => {
    setSelected((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleSave = () => {
    onSave(selected);
    setSelected([]);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecciona los modelos a analizar</DialogTitle>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto space-y-2 py-4">
          {models.length ? models.map((model) => (
            <label key={model.id} className="flex items-center gap-3 cursor-pointer hover:bg-accent px-2 rounded py-1">
              <Checkbox
                checked={selected.includes(model.id)}
                onCheckedChange={() => handleToggle(model.id)}
                className="mr-2"
                id={model.id}
              />
              <span className="font-medium">{model.name}</span>
            </label>
          )) : (
            <span className="text-gray-500">No hay modelos para seleccionar.</span>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-[rgb(170,32,47)] text-white"
            disabled={selected.length === 0}
            onClick={handleSave}
          >
            Guardar selección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
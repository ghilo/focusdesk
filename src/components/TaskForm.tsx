"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { X, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import clsx from "clsx";
import { Priority, Task } from "@/types";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultProjectId?: string;
  defaultClientId?: string;
}

export default function TaskForm({ isOpen, onClose, taskToEdit, defaultProjectId, defaultClientId }: TaskFormProps) {
  const { addTask, updateTask, deleteTask, projects, clients, addProject, addClient } = useStore();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [projectId, setProjectId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const [newProjectName, setNewProjectName] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setPriority(taskToEdit.priority);
        setProjectId(taskToEdit.projectId || "");
        setClientId(taskToEdit.clientId || "");
        
        if (taskToEdit.dueDate) {
          const d = new Date(taskToEdit.dueDate);
          const tzoffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
          const localISOTime = new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
          setDueDate(localISOTime);
        } else {
          setDueDate("");
        }
        
        setNotes(taskToEdit.notes || "");
      } else {
        setTitle("");
        setPriority("medium");
        setProjectId(defaultProjectId || "");
        setClientId(defaultClientId || "");
        setDueDate("");
        setNotes("");
      }
      setError("");
      setNewProjectName("");
      setNewClientName("");
    }
  }, [isOpen, taskToEdit, defaultProjectId, defaultClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    if (!clientId) {
      setError("Veuillez sélectionner un client pour cette tâche.");
      return;
    }
    if (!projectId) {
      setError("Veuillez sélectionner un projet pour cette tâche.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalClientId = clientId;
      if (clientId === "NEW" && newClientName.trim()) {
        const newId = crypto.randomUUID();
        await addClient({ id: newId, name: newClientName.trim() });
        finalClientId = newId;
      }

      let finalProjectId = projectId;
      if (projectId === "NEW" && newProjectName.trim()) {
        const newId = crypto.randomUUID();
        await addProject({ 
          id: newId, 
          name: newProjectName.trim(), 
          clientId: finalClientId && finalClientId !== "NEW" ? finalClientId : null 
        });
        finalProjectId = newId;
      }

      const taskData = {
        title: title.trim(),
        priority,
        projectId: finalProjectId && finalProjectId !== "NEW" ? finalProjectId : null,
        clientId: finalClientId && finalClientId !== "NEW" ? finalClientId : null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        notes: notes.trim() || undefined,
      };

      if (taskToEdit) {
        await updateTask(taskToEdit.id, taskData);
      } else {
        await addTask(taskData);
      }
      
      onClose();
    } catch {
      setError("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-surface-container/95 backdrop-blur-xl border-l border-white/5 z-50 p-6 overflow-y-auto animate-slide-in-right shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">{taskToEdit ? "Modifier la Tâche" : "Nouvelle Tâche"}</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Titre <span className="text-danger">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder="Que devez-vous faire ?"
              className="w-full bg-surface-highest/80 border border-transparent rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              autoFocus
            />
            {error && <p className="text-danger text-sm mt-1">{error}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Priorité</label>
            <div className="flex bg-surface-highest p-1 rounded-xl">
              {(["high", "medium", "low"] as Priority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={clsx(
                    "flex-1 py-2.5 text-sm font-medium rounded-lg capitalize transition-all duration-300",
                    priority === p
                      ? "bg-gradient-to-br from-primary-dim to-primary text-white shadow-[0_0_16px_rgba(186,158,255,0.2)]"
                      : "text-zinc-500 hover:text-white"
                  )}
                >
                  {p === "high" ? "Haute" : p === "medium" ? "Moyenne" : "Basse"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Client <span className="text-danger">*</span></label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-surface-highest/80 border border-transparent rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer transition-all"
            >
              <option value="">Aucun client</option>
              {clients
                .filter(c => !c.archived || c.id === clientId)
                .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="NEW">+ Créer un client</option>
            </select>
            {clientId === "NEW" && (
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nom du nouveau client..."
                className="w-full bg-surface border border-primary/50 mt-2 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Projet <span className="text-danger">*</span></label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-surface-highest/80 border border-transparent rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer transition-all"
            >
              <option value="">Aucun projet</option>
              {projects
                .filter(p => !clientId || clientId === "NEW" || p.clientId === clientId || !p.clientId)
                .filter(p => {
                  if (p.id === projectId) return true; 
                  const client = clients.find(c => c.id === p.clientId);
                  return !client?.archived;
                })
                .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              <option value="NEW">+ Créer un projet</option>
            </select>
            {projectId === "NEW" && (
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Nom du nouveau projet..."
                className="w-full bg-surface border border-primary/50 mt-2 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Date et heure d&apos;échéance</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-surface-highest/80 border border-transparent rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none [&::-webkit-calendar-picker-indicator]:invert-[1] [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 cursor-pointer transition-all"
              />
              <CalendarIcon className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Détails supplémentaires..."
              rows={4}
              className="w-full bg-surface-highest/80 border border-transparent rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder-zinc-600 transition-all"
            />
          </div>

          <div className="pt-6 flex gap-3">
            {taskToEdit && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Voulez-vous vraiment supprimer cette tâche ? Action irréversible.")) {
                    deleteTask(taskToEdit.id);
                    onClose();
                  }
                }}
                className="py-3 px-4 flex items-center justify-center rounded-xl text-zinc-400 hover:text-danger hover:bg-danger/10 transition-colors focus:outline-none"
                title="Supprimer la tâche"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-surfaceHov hover:bg-zinc-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx("flex-1 py-3 px-4 rounded-xl font-medium text-white shadow-lg transition-all duration-300", isSubmitting ? "bg-primary-dim/50 cursor-not-allowed" : "bg-gradient-to-br from-primary-dim to-primary hover:shadow-[0_0_24px_rgba(186,158,255,0.25)] hover:scale-[1.02]")}
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

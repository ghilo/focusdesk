"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import { Plus, ChevronDown, ChevronUp, ArrowLeft, Edit2 } from "lucide-react";
import { Task } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { tasks, projects, clients, completeTask, uncompleteTask, reorderTasks, updateProject, fetchData } =
    useStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const project = projects.find((p) => p.id === projectId);
  const client = project ? clients.find((c) => c.id === project.clientId) : undefined;

  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const activeTasks = projectTasks
    .filter((t) => t.status === "active")
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.order - b.order;
    });
  const doneTasks = projectTasks
    .filter((t) => t.status === "done")
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());

  const total = projectTasks.length;
  const progress = total === 0 ? 0 : Math.round((doneTasks.length / total) * 100);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      reorderTasks(active.id as string, over.id as string);
    }
  };

  const startEditingName = () => {
    if (!project) return;
    setEditName(project.name);
    setIsEditingName(true);
  };

  const saveEditName = () => {
    if (editName.trim() && project) {
      updateProject(project.id, { name: editName.trim() });
    }
    setIsEditingName(false);
  };

  if (!project) {
    return (
      <div className="max-w-5xl mx-auto py-6 px-4 md:px-8">
        <p className="text-zinc-500 dark:text-zinc-400">Projet introuvable.</p>
        <button onClick={() => router.push("/projects")} className="mt-4 text-primary hover:text-primary-hover font-medium">
          ← Retour aux projets
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-foreground transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Tous les projets
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  autoFocus
                  className="bg-surface border border-primary/50 rounded-xl px-4 py-2 text-foreground text-3xl font-bold w-full outline-none focus:ring-2 focus:ring-primary"
                />
                <button onClick={saveEditName} className="text-primary font-medium hover:text-primary-hover px-3 py-2 whitespace-nowrap">OK</button>
                <button onClick={() => setIsEditingName(false)} className="text-zinc-500 hover:text-foreground px-2 py-2">Annuler</button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group">
                <h1
                  className="text-3xl font-bold tracking-tight cursor-text"
                  onDoubleClick={startEditingName}
                  title="Double-cliquez pour renommer"
                >
                  {project.name}
                </h1>
                <button
                  onClick={startEditingName}
                  className="text-zinc-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-primary/10"
                  title="Renommer le projet"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            {client && <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">@{client.name}</p>}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {doneTasks.length} / {total} tâche{total !== 1 ? "s" : ""} terminée{doneTasks.length !== 1 ? "s" : ""}
            </span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task list */}
      {activeTasks.length === 0 && (!showDone || doneTasks.length === 0) ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
          <p className="text-zinc-500 font-medium">Aucune tâche pour ce projet.</p>
          <button
            onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
            className="mt-4 text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Créer la première tâche
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTasks.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={activeTasks} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {activeTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      project={project}
                      client={client}
                      onComplete={completeTask}
                      onUncomplete={uncompleteTask}
                      onClick={() => { setEditingTask(task); setIsFormOpen(true); }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {doneTasks.length > 0 && (
            <div className="pt-6 pb-2">
              <button
                onClick={() => setShowDone(!showDone)}
                className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-foreground transition-colors"
              >
                {showDone ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                <span className="font-medium">Tâches terminées ({doneTasks.length})</span>
              </button>

              {showDone && (
                <div className="mt-4 space-y-3 opacity-80">
                  {doneTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      project={project}
                      client={client}
                      onComplete={completeTask}
                      onUncomplete={uncompleteTask}
                      onClick={() => { setEditingTask(task); setIsFormOpen(true); }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
        className="fixed bottom-24 md:bottom-10 right-6 md:right-10 w-14 h-14 bg-primary text-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-[#7C3AED] hover:scale-105 transition-all z-10"
      >
        <Plus className="w-6 h-6" />
      </button>

      <TaskForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setTimeout(() => setEditingTask(null), 300); }}
        taskToEdit={editingTask}
        defaultProjectId={projectId}
        defaultClientId={project.clientId ?? undefined}
      />
    </div>
  );
}

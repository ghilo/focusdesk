import { create } from "zustand";
import { Task, Project, Client } from "../types";

interface StoreState {
  tasks: Task[];
  projects: Project[];
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  
  addTask: (task: Omit<Task, "id" | "status" | "order" | "createdAt" | "completedAt">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  uncompleteTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (activeId: string, overId: string) => Promise<void>;

  addProject: (project: Omit<Project, "id" | "createdAt"> & { id?: string }) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addClient: (client: Omit<Client, "id" | "createdAt"> & { id?: string }) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export const useStore = create<StoreState>()((set, get) => ({
  tasks: [],
  projects: [],
  clients: [],
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [tasksRes, projectsRes, clientsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects"),
        fetch("/api/clients"),
      ]);

      if (!tasksRes.ok || !projectsRes.ok || !clientsRes.ok) throw new Error("Failed to fetch data");

      const tasks = await tasksRes.json();
      const projects = await projectsRes.json();
      const clients = await clientsRes.json();

      set({ tasks, projects, clients, isLoading: false });
    } catch {
      set({ error: "Failed to load data", isLoading: false });
    }
  },

  addTask: async (taskData) => {
    const { tasks } = get();
    const newOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.order)) + 1 : 0;
    
    // Optimistic UI Update
    const tempId = crypto.randomUUID();
    const newTask: Task = {
      ...taskData,
      id: tempId,
      status: "active",
      order: newOrder,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    set({ tasks: [...tasks, newTask] });

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!response.ok) throw new Error("Failed to create task");
      
      const savedTask = await response.json();
      // Replace temp task with DB task
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === tempId ? savedTask : t)),
      }));
    } catch {
      // Revert optimistic update on error
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== tempId) }));
      console.error("error");
    }
  },

  updateTask: async (id, updates) => {
    // Optimistic UI Update
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
    }));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch {
       console.error("error");
       get().fetchData(); // Reload from DB to fix out of sync state
    }
  },

  completeTask: async (id) => {
    const completedAt = new Date().toISOString();
    // Optimistic Update
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, status: "done", completedAt } : task
      ),
    }));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done", completedAt }),
      });
    } catch {
      console.error("error");
      get().fetchData();
    }
  },

  uncompleteTask: async (id) => {
    const state = get();
    const taskToUncomplete = state.tasks.find((t) => t.id === id);

    if (taskToUncomplete?.clientId) {
      const client = state.clients.find((c) => c.id === taskToUncomplete.clientId);
      if (client?.archived) {
        const confirmUnarchive = window.confirm(
          "Le client associé à cette tâche est archivé. Voulez-vous le désarchiver pour restaurer la tâche ?"
        );
        if (!confirmUnarchive) return;

        // Optimistic UI for Client
        set((s) => ({
          clients: s.clients.map((c) => (c.id === client.id ? { ...c, archived: false } : c)),
        }));
        
        // API Update for Client
        fetch(`/api/clients/${client.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: false }),
        }).catch(() => get().fetchData());
      }
    }
    
    // Optimistic Update Task
    set((s) => ({
      tasks: s.tasks.map((task) =>
        task.id === id ? { ...task, status: "active", completedAt: null } : task
      ),
    }));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active", completedAt: null }),
      });
    } catch {
      console.error("error");
      get().fetchData();
    }
  },

  deleteTask: async (id) => {
    // Optimistic deletion
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));

    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    } catch {
      console.error("error");
      get().fetchData();
    }
  },

  reorderTasks: async (activeId, overId) => {
    // Optimistic reorder
    const oldState = [...get().tasks];
    set((state) => {
      const oldIndex = state.tasks.findIndex((t) => t.id === activeId);
      const newIndex = state.tasks.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;

      const newTasks = [...state.tasks];
      const [movedTask] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, movedTask);
      
      const reorderedTasks = newTasks.map((t, index) => ({ ...t, order: index }));
      return { tasks: reorderedTasks };
    });

    try {
       // Save to DB by updating order of all changed tasks sequentially
       // For a production app you would create a batch update route, but this works for now
       await Promise.all(
          get().tasks.map((task) => 
            fetch(`/api/tasks/${task.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order: task.order }),
            })
          )
       );
    } catch {
      console.error("Failed to reorder in DB");
      set({ tasks: oldState }); // Rollback
    }
  },

  addProject: async (projectData) => {
    const tempId = projectData.id || crypto.randomUUID();
    const newProject = {
      ...projectData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };
    
    set((state) => ({ projects: [...state.projects, newProject] }));

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const savedProject = await res.json();
      set((state) => ({
        projects: state.projects.map((p) => (p.id === tempId ? savedProject : p)),
      }));
    } catch {
      set((state) => ({ projects: state.projects.filter((p) => p.id !== tempId) }));
    }
  },

  updateProject: async (id, updates) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, ...updates } : project
      ),
    }));
    try {
      await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch { get().fetchData(); }
  },

  deleteProject: async (id) => {
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
      tasks: state.tasks.map((task) => (task.projectId === id ? { ...task, projectId: null } : task)),
    }));
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
    } catch { get().fetchData(); }
  },

  addClient: async (clientData) => {
     const tempId = clientData.id || crypto.randomUUID();
     const newClient = {
      ...clientData,
      id: tempId,
      createdAt: new Date().toISOString(),
      archived: clientData.archived || false,
    };
    set((state) => ({ clients: [...state.clients, newClient] }));

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      if (!res.ok) throw new Error("Failed to create client");
      const savedClient = await res.json();
      set((state) => ({
        clients: state.clients.map((c) => (c.id === tempId ? savedClient : c)),
      }));
    } catch {
      set((state) => ({ clients: state.clients.filter((c) => c.id !== tempId) }));
    }
  },

  updateClient: async (id, updates) => {
    set((state) => ({
      clients: state.clients.map((client) =>
        client.id === id ? { ...client, ...updates } : client
      ),
    }));
    try {
      await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch { get().fetchData(); }
  },

  deleteClient: async (id) => {
    set((state) => ({
      clients: state.clients.filter((client) => client.id !== id),
      tasks: state.tasks.filter((task) => task.clientId !== id),
      projects: state.projects.filter((proj) => proj.clientId !== id),
    }));
    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
    } catch { get().fetchData(); }
  },
}));

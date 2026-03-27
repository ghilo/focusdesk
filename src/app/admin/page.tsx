import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldAlert, Users, FolderKanban, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  // STRICT SECURE CHECK
  if (session?.user?.email !== "yahiaoui.aghiles@gmail.com") {
    redirect("/");
  }

  // Fetch all users with their stats
  const users = await prisma.user.findMany({
    include: {
      projects: true,
      tasks: true,
      clients: true,
    },
    orderBy: { email: "asc" },
  });

  const totalUsers = users.length;
  const totalProjects = users.reduce((acc, user) => acc + user.projects.length, 0);
  const totalTasks = users.reduce((acc, user) => acc + user.tasks.length, 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 pt-16 md:pt-12 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-4 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-white mb-2">
              Panneau d&apos;Administration
            </h1>
            <p className="text-zinc-500 font-medium">
              Accès ultra restreint. Supervision de tous les utilisateurs et de leurs données.
            </p>
          </div>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-surface-container rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Utilisateurs</h3>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-4xl font-display font-bold text-white tracking-tight">{totalUsers}</p>
        </div>
        <div className="bg-surface-container rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Projets Globaux</h3>
            <FolderKanban className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-4xl font-display font-bold text-white tracking-tight">{totalProjects}</p>
        </div>
        <div className="bg-surface-container rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Tâches Globales</h3>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-4xl font-display font-bold text-white tracking-tight">{totalTasks}</p>
        </div>
      </div>

      {/* Users List */}
      <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
        Détail des Utilisateurs
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {users.map((user) => {
          const activeTasks = user.tasks.filter((t) => t.status === "active").length;
          const completedTasks = user.tasks.filter((t) => t.status === "done").length;
          
          return (
            <div key={user.id} className="bg-surface-container rounded-[24px] p-6 border border-white/5 relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-6">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name || "User"} className="w-12 h-12 rounded-full border border-white/10" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-surface-highest flex items-center justify-center text-white font-bold text-lg border border-white/10">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{user.name || "Sans nom"}</h3>
                  <p className="text-sm text-zinc-400 truncate">{user.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-highest/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-display font-bold text-white">{user.projects.length}</span>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mt-1">Projets</span>
                </div>
                <div className="bg-surface-highest/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-display font-bold text-white">{user.clients.length}</span>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mt-1">Clients</span>
                </div>
                <div className="bg-surface-highest/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-display font-bold text-emerald-400">{completedTasks}</span>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mt-1">Tâches Finies</span>
                </div>
                <div className="bg-surface-highest/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-display font-bold text-primary">{activeTasks}</span>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mt-1">Tâches Actives</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

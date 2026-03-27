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
            <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground mb-2">
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
        <div className="bg-surface-container rounded-3xl p-6 border border-foreground/5 border-opacity-10 dark:border-opacity-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Utilisateurs</h3>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-4xl font-display font-bold text-foreground tracking-tight">{totalUsers}</p>
        </div>
        <div className="bg-surface-container rounded-3xl p-6 border border-foreground/5 border-opacity-10 dark:border-opacity-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Projets Globaux</h3>
            <FolderKanban className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-4xl font-display font-bold text-foreground tracking-tight">{totalProjects}</p>
        </div>
        <div className="bg-surface-container rounded-3xl p-6 border border-foreground/5 border-opacity-10 dark:border-opacity-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Tâches Globales</h3>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-4xl font-display font-bold text-foreground tracking-tight">{totalTasks}</p>
        </div>
      </div>

      {/* Users List */}
      <h2 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
        Annuaire des Utilisateurs
      </h2>
      
      <div className="bg-surface-container rounded-2xl border border-foreground/5 border-opacity-10 dark:border-opacity-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-foreground/5 border-opacity-10 dark:border-opacity-5 bg-surface-highest/30">
                <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Utilisateur</th>
                <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-zinc-500 uppercase text-center">Projets</th>
                <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-zinc-500 uppercase text-center">Clients</th>
                <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-zinc-500 uppercase text-center">Tâches Actives</th>
                <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-zinc-500 uppercase text-center">Tâches Finies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5 divide-opacity-10 dark:divide-opacity-5">
              {users.map((user) => {
                const activeTasks = user.tasks.filter((t) => t.status === "active").length;
                const completedTasks = user.tasks.filter((t) => t.status === "done").length;
                
                return (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* User Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.image} alt={user.name || "User"} className="w-10 h-10 rounded-full border border-foreground/10 border-opacity-10 dark:border-opacity-10" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-surface-highest flex items-center justify-center text-foreground font-bold text-sm border border-foreground/10 border-opacity-10 dark:border-opacity-10">
                            {user.email?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{user.name || "Sans nom"}</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Projects */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1 rounded-full">
                        {user.projects.length}
                      </span>
                    </td>

                    {/* Clients */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-purple-500/10 text-purple-400 text-xs font-bold px-3 py-1 rounded-full">
                        {user.clients.length}
                      </span>
                    </td>

                    {/* Active Tasks */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                        {activeTasks}
                      </span>
                    </td>

                    {/* Completed Tasks */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
                        {completedTasks}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

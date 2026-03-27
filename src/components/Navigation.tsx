"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, FolderKanban, Users, Settings, LogOut, HelpCircle, Plus } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "TABLEAU DE BORD", icon: LayoutDashboard },
  { href: "/projects", label: "PROJETS", icon: FolderKanban },
  { href: "/clients", label: "CLIENTS", icon: Users },
  { href: "/settings", label: "PARAMÈTRES", icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <nav className="w-full md:w-64 bg-background flex flex-col fixed md:relative bottom-0 md:bottom-auto z-40 h-16 md:h-full border-t md:border-t-0 md:border-r border-white/5">
      
      {/* Brand Logo Menu */}
      <div className="hidden md:flex flex-col gap-1 p-8 mb-4">
        <span className="font-display font-bold text-2xl tracking-tight text-white leading-none">FocusDesk</span>
        <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Freelance Cockpit</span>
      </div>

      {/* Main Links */}
      <div className="flex-1 flex flex-row md:flex-col items-center md:items-stretch justify-around md:justify-start px-2 md:px-0 gap-1 md:gap-2">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-4 px-3 py-2 md:px-8 md:py-3.5 transition-all duration-300 relative rounded-lg md:rounded-none md:mx-0 mx-2",
                isActive
                  ? "bg-surface-container text-white font-bold"
                  : "text-zinc-500 font-medium hover:text-white"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive ? "text-primary" : "")} />
              <span className="hidden md:inline text-xs tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="hidden md:flex flex-col mt-auto pb-4">
        <div className="px-6 mb-8 mt-4">
          <Link href="/projects?new=true" className="w-full bg-primary hover:bg-primary-hover text-surface-highest font-extrabold tracking-wide py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
            <Plus className="w-5 h-5 stroke-[2.5]" /> NOUVEAU PROJET
          </Link>
        </div>
        
        <div className="flex flex-col gap-1">
          <Link href="/help" className="flex items-center gap-4 px-8 py-3 text-zinc-500 hover:text-white font-medium transition-colors">
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs tracking-wide">AIDE</span>
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-4 px-8 py-3 text-zinc-500 hover:text-white font-medium transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs tracking-wide">DÉCONNEXION</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

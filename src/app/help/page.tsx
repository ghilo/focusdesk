import { Wrench, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
      <div className="bg-surface-container border border-foreground/5 border-opacity-10 dark:border-opacity-5 p-8 rounded-full mb-8 relative shadow-2xl">
        <Wrench className="w-16 h-16 text-primary" />
        <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full animate-ping" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight">
        L&apos;aide est en chemin !
      </h1>
      
      <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-md text-lg md:text-xl leading-relaxed mb-10">
        Le centre de support technique et les tutoriels sont actuellement <span className="text-primary font-bold">en développement</span>. Revenez très bientôt ! 🚀
      </p>

      <Link 
        href="/"
        className="flex items-center gap-2 bg-foreground/5 bg-opacity-5 dark:bg-opacity-5 hover:bg-foreground/10 bg-opacity-5 dark:bg-opacity-10 text-foreground px-6 py-3 rounded-full font-bold transition-all border border-foreground/10 border-opacity-10 dark:border-opacity-10"
      >
        <ArrowLeft className="w-5 h-5" /> Retour au tableau de bord
      </Link>
    </div>
  );
}

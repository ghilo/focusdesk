import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { telegramChatId } = await req.json();

    if (!telegramChatId) {
      return NextResponse.json({ error: "Aucun Chat ID fourni pour le test." }, { status: 400 });
    }

    const { sendTelegramNotification } = await import("@/lib/telegram");
    
    const success = await sendTelegramNotification(
      telegramChatId,
      `🎉 <b>Succès du test !</b>\n\nVotre connexion avec FocusDesk fonctionne parfaitement. Vous êtes prêt(e) à recevoir vos notifications !`
    );

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Échec de l'envoi. Avez-vous cliqué sur 'Démarrer' avec le bot sur Telegram ?" }, { status: 400 });
    }

  } catch {
    return NextResponse.json({ error: "Erreur lors du test." }, { status: 500 });
  }
}

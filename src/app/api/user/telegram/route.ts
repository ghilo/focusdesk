import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { telegramChatId } = await req.json();

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { telegramChatId: telegramChatId || null },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du Chat ID Telegram", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { telegramChatId: true },
    });

    return NextResponse.json({ telegramChatId: user?.telegramChatId || "" });
  } catch (error) {
    console.error("Erreur lors de la récupération du Chat ID Telegram", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

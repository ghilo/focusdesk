export async function sendTelegramNotification(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN is not defined in environment variables. Notification not sent.");
    throw new Error("TELEGRAM_BOT_TOKEN est introuvable sur Vercel (Environnements).");
  }

  if (!chatId) {
    console.warn("No Chat ID provided. Notification not sent.");
    throw new Error("Chat ID manquant.");
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to send Telegram message:", errorData);
      throw new Error(errorData.description || "Telegram API Error");
    }

    return true;
  } catch (error: any) {
    console.error("Error sending Telegram message:", error);
    throw error;
  }
}

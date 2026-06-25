import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  
  // Rate limit check using the default 'api' config limits
  const rateLimit = await checkRateLimit(ip, "api");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "RATE_LIMIT_EXCEEDED" },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "API_KEY_MISSING" },
      { status: 400 }
    );
  }

  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: "Некорректная история сообщений." },
        { status: 400 }
      );
    }

    // Filter out the static introductory greeting from the history sent to Gemini API
    let cleanMessages = messages;
    if (
      cleanMessages.length > 0 &&
      cleanMessages[0].sender === "ai" &&
      cleanMessages[0].text.includes("Привет! Я Rates AI")
    ) {
      cleanMessages = cleanMessages.slice(1);
    }

    // Merge consecutive messages from the same sender to ensure strict alternating roles
    const mergedMessages: { role: "user" | "model"; text: string }[] = [];
    for (const msg of cleanMessages) {
      const role = msg.sender === "ai" ? "model" : "user";
      const text = msg.text?.trim() || "";
      if (!text) continue;

      if (
        mergedMessages.length > 0 &&
        mergedMessages[mergedMessages.length - 1].role === role
      ) {
        // Append to the last message's text
        mergedMessages[mergedMessages.length - 1].text += "\n" + text;
      } else {
        mergedMessages.push({ role, text });
      }
    }

    // Gemini API requires the conversation to start with a "user" turn.
    if (mergedMessages.length > 0 && mergedMessages[0].role === "model") {
      mergedMessages.shift();
    }

    if (mergedMessages.length === 0) {
      return NextResponse.json(
        { success: false, error: "История сообщений пуста." },
        { status: 400 }
      );
    }

    const formattedContents = mergedMessages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: formattedContents,
          systemInstruction: {
            parts: [
              {
                text:
                  "Ты — Rates AI Ассистент, продвинутый искусственный интеллект (модель Gemini 2.5 Flash), интегрированный в социальную сеть Rates.\n\n" +
                  "Твои основные характеристики:\n" +
                  "1. Роль: Отвечать на любые вопросы пользователя, помогать с функциями платформы Rates и вести интересную беседу.\n" +
                  "2. Контекст платформы:\n" +
                  "   - Темы оформления: Доступны 6 тем (Midnight Neon, Classic Light, Emerald Oasis, Sakura Dream, Cyberpunk 2076, Nordic Slate).\n" +
                  "   - Звуки: Интерактивный звуковой синтезатор на базе Web Audio API, воспроизводит звуки при лайках, сообщениях и кликах.\n" +
                  "   - Другие функции: Соавторские посты (Collabs), Суперлайки с анимациями брызг на холсте (Super Likes), Музыкальный плеер в профиле, Близкие друзья (Close Friends) для историй, Список просмотров историй, Истории с кастомным временем истечения (от 1 минуты до 7 дней) и Расшифровка голосовых сообщений (Speech-to-Text).\n" +
                  "3. Стиль ответов: Дружелюбный, вежливый, информативный, живой. Пиши структурированно, используй уместные эмодзи.\n" +
                  "4. Форматирование: ВСЕГДА используй синтаксис Markdown (жирный шрифт, списки, абзацы) для выделения важных деталей, чтобы текст было приятно читать. Не используй HTML-теги.\n" +
                  "5. Язык: Всегда отвечай на русском языке.",
              },
            ],
          },
          generationConfig: {
            maxOutputTokens: 1200,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error Response:", errText);
      return NextResponse.json(
        { success: false, error: "Ошибка получения ответа от ИИ сервиса." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      return NextResponse.json(
        { success: false, error: "Пустой ответ от ИИ." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      text: replyText,
    });
  } catch (error) {
    console.error("Error in AI API route:", error);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера при обработке запроса ИИ." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  return NextResponse.json({
    success: true,
    hasKey: !!apiKey,
  });
}


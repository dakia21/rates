"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, CheckCircle2, Circle, ExternalLink, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Создайте проект Supabase",
    description: "Бесплатный аккаунт на supabase.com → New Project → выберите регион и пароль БД.",
    link: "https://supabase.com/dashboard",
    linkText: "Открыть Supabase Dashboard",
  },
  {
    title: "Выполните SQL-схему",
    description: "В проекте: SQL Editor → New query → вставьте содержимое файла supabase/schema.sql → Run.",
    code: "supabase/schema.sql",
  },
  {
    title: "Создайте Storage buckets",
    description: "Storage → New bucket (Public): avatars, banners, videos, thumbnails, messages, voice",
  },
  {
    title: "Скопируйте API-ключи",
    description: "Project Settings → API → скопируйте Project URL и anon public key, а также service_role key.",
    link: "https://supabase.com/dashboard/project/_/settings/api",
    linkText: "API Settings",
  },
  {
    title: "Заполните .env.local",
    description: "В папке rates откройте .env.local и вставьте реальные значения:",
    env: `NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
JWT_SECRET=любая-случайная-строка-32-символа
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000`,
  },
  {
    title: "Отключите подтверждение email (для разработки)",
    description: "Authentication → Providers → Email → выключите «Confirm email». Иначе после регистрации нужно подтверждать почту.",
  },
  {
    title: "Перезапустите сервер",
    description: "Остановите npm run dev (Ctrl+C) и запустите снова: npm run dev",
  },
];

export default function SetupPage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/register")
      .then((r) => r.json())
      .then((d) => setConfigured(d.configured))
      .catch(() => setConfigured(false));
  }, []);

  const copyEnv = () => {
    navigator.clipboard.writeText(steps[4].env || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Настройка базы данных</h1>
        <p className="text-muted-foreground mt-2">
          Rates использует Supabase. Без него регистрация и вход не работают.
        </p>
      </div>

      {configured === true && (
        <Card className="mb-6 border-green-500/30 bg-green-500/10">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-semibold">Supabase подключён!</p>
              <p className="text-sm opacity-80">Можно регистрироваться и пользоваться приложением.</p>
            </div>
          </div>
          <Link href="/register" className="inline-block mt-4">
            <Button>Перейти к регистрации</Button>
          </Link>
        </Card>
      )}

      {configured === false && (
        <Card className="mb-6 border-yellow-500/30 bg-yellow-500/10">
          <p className="font-semibold text-yellow-700 dark:text-yellow-400">
            База данных не подключена
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Сейчас в .env.local стоят заглушки (placeholder). Выполните шаги ниже.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {steps.map((step, i) => (
          <Card key={i} className="!p-5">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full gradient-bg text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                {i < steps.length - 1 && <div className="w-px flex-1 bg-border mt-2 min-h-[20px]" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>

                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-rates-500 hover:underline mt-2"
                  >
                    {step.linkText}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {step.code && (
                  <code className="block mt-2 text-xs bg-secondary px-3 py-2 rounded-lg">{step.code}</code>
                )}

                {step.env && (
                  <div className="relative mt-3">
                    <pre className="text-xs bg-secondary p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">{step.env}</pre>
                    <button
                      onClick={copyEnv}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-background/80 hover:bg-background"
                      title="Копировать"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/login">
          <Button variant="ghost">← Назад к входу</Button>
        </Link>
      </div>
    </div>
  );
}

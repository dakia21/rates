"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { registerSchema } from "@/lib/validations/schemas";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    displayName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [dbConfigured, setDbConfigured] = useState<boolean | null>(null);
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/register")
      .then((r) => r.json())
      .then((d) => setDbConfigured(d.configured))
      .catch(() => setDbConfigured(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (dbConfigured === false) {
      toast("Сначала настройте базу данных Supabase", "error");
      router.push("/setup");
      return;
    }

    const email = `${form.username.trim()}@rates.com`;
    const parsed = registerSchema.safeParse({ ...form, email });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, form.password, form.username, form.displayName);
    if (error) {
      toast(error, "error");
      if (error.includes("не подключена") || error.includes("Supabase") || error.includes(".env.local")) {
        router.push("/setup");
      }
      setLoading(false);
      return;
    }
    toast("Аккаунт создан!", "success");
    router.push("/login");
  };

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast(error, "error");
  };

  return (
    <Card className="animate-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">R</span>
        </div>
        <h1 className="text-2xl font-bold">Создать аккаунт</h1>
        <p className="text-muted-foreground mt-2">Присоединяйтесь к Rates</p>
      </div>

      {dbConfigured === false && (
        <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">База данных не настроена</p>
            <p className="text-xs text-muted-foreground mt-1">
              Регистрация не будет работать без Supabase.{" "}
              <Link href="/setup" className="text-rates-500 underline">
                Настроить за 5 минут →
              </Link>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="displayName"
          label="Имя"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          error={errors.displayName}
          placeholder="Ваше имя"
        />
        <Input
          id="username"
          label="Имя пользователя"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
          error={errors.username}
          placeholder="username"
        />
        <Input
          id="password"
          label="Пароль"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          placeholder="Минимум 8 символов"
        />
        <Button type="submit" className="w-full" loading={loading}>
          Зарегистрироваться
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-card text-muted-foreground">или</span>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={handleGoogle}>
        Регистрация через Google
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-rates-500 font-medium hover:underline">
          Войти
        </Link>
      </p>
    </Card>
  );
}

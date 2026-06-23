# Rates — Социальная сеть нового поколения

Гибрид Telegram и TikTok: общайтесь в чатах и смотрите короткие видео в одном приложении.

## Технологии

- **Next.js 15** — App Router, Server Components, API Routes
- **React 19** + **TypeScript**
- **Tailwind CSS** — Glassmorphism, тёмная/светлая тема
- **Supabase** — Auth, PostgreSQL, Storage
- **Socket.IO** — Real-time чаты, онлайн-статус, typing indicators
- **PWA** — Установка на устройство

## Структура проекта

```
rates/
├── public/
│   ├── icons/              # PWA иконки
│   ├── manifest.json       # PWA манифест
│   └── robots.txt
├── server/
│   └── socket-server.ts    # Socket.IO сервер (порт 3001)
├── src/
│   ├── app/
│   │   ├── (auth)/         # Страницы авторизации
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/         # Основное приложение
│   │   │   ├── feed/       # Видео-лента
│   │   │   ├── messages/   # Чаты
│   │   │   ├── channels/   # Каналы
│   │   │   ├── groups/     # Группы
│   │   │   ├── profile/    # Профили
│   │   │   ├── search/     # Поиск
│   │   │   ├── notifications/
│   │   │   ├── settings/
│   │   │   └── upload/
│   │   ├── admin/          # Админ-панель
│   │   ├── api/            # REST API
│   │   └── auth/callback/  # OAuth callback
│   ├── components/
│   │   ├── ui/             # UI-компоненты
│   │   ├── feed/           # Видео-лента
│   │   ├── chat/           # Чаты
│   │   ├── profile/        # Профиль
│   │   └── layout/         # Навигация
│   ├── contexts/           # React Context
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Утилиты, Supabase, JWT, Rate Limit
│   └── types/              # TypeScript типы
├── supabase/
│   └── schema.sql          # SQL схема базы данных
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── .env.example
```

## Установка и запуск

### 1. Клонирование и зависимости

```bash
cd rates
npm install
```

### 2. Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Перейдите в **SQL Editor** и выполните содержимое файла `supabase/schema.sql`
3. Создайте Storage buckets в **Storage**:
   - `avatars` (public)
   - `banners` (public)
   - `videos` (public)
   - `thumbnails` (public)
   - `messages` (public)
   - `voice` (public)
4. В **Authentication → Providers** включите **Email** и **Google**
5. Для Google OAuth добавьте redirect URL: `http://localhost:3000/auth/callback`

### 3. Переменные окружения

```bash
cp .env.example .env.local
```

Заполните `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-random-secret-min-32-chars
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Сгенерировать JWT_SECRET:

```bash
openssl rand -base64 32
```

### 4. Запуск

```bash
npm run dev
```

Приложение запустится на:
- **Frontend**: http://localhost:3000
- **Socket.IO**: http://localhost:3001

### 5. Создание администратора

После регистрации первого пользователя, в Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE username = 'your_username';
```

## Функции

| Модуль | Возможности |
|--------|-------------|
| **Авторизация** | Регистрация, вход, Google OAuth, профиль, аватар, баннер |
| **Лента** | Вертикальные видео, автовоспроизведение, лайки, комментарии, репосты |
| **Сообщения** | Личные чаты, фото/видео/файлы, голосовые, онлайн-статус, typing |
| **Каналы** | Создание, подписчики, посты, закреплённые сообщения |
| **Группы** | Создание, роли (owner/admin/moderator/member), чат группы |
| **Профиль** | Аватар, баннер, подписчики, видео, статистика |
| **Поиск** | Пользователи, каналы, группы, видео |
| **Уведомления** | Сообщения, лайки, подписки, комментарии |
| **Админ** | Управление пользователями, жалобы, модерация контента |
| **Безопасность** | Rate limiting, JWT, валидация Zod, RLS |

## Production

```bash
npm run build
npm start
```

Для production задайте переменные окружения на хостинге и убедитесь, что Socket.IO сервер доступен по `NEXT_PUBLIC_SOCKET_URL`.

## Лицензия

MIT

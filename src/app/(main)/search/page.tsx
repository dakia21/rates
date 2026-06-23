"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, User, Radio, Users, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect } from "react";
import type { SearchResults } from "@/types";

const tabs = [
  { id: "all", label: "Все", icon: Search },
  { id: "users", label: "Люди", icon: User },
  { id: "channels", label: "Каналы", icon: Radio },
  { id: "groups", label: "Группы", icon: Users },
  { id: "videos", label: "Видео", icon: Play },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${type}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setResults(d.data);
        setLoading(false);
      });
  }, [debouncedQuery, type]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Поиск</h1>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск пользователей, каналов, групп, видео..."
        className="mb-4"
      />

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setType(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              type === tab.id
                ? "gradient-bg text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <Spinner className="py-8" />}

      {results && !loading && (
        <div className="space-y-6">
          {results.users.length > 0 && (type === "all" || type === "users") && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">Пользователи</h2>
              <div className="space-y-2">
                {results.users.map((user) => (
                  <Link key={user.id} href={`/profile/${user.username}`}>
                    <Card className="!p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatar_url} alt={user.display_name} size="md" />
                        <div>
                          <p className="font-medium">{user.display_name}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.channels.length > 0 && (type === "all" || type === "channels") && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">Каналы</h2>
              <div className="space-y-2">
                {results.channels.map((channel) => (
                  <Link key={channel.id} href={`/channels/${channel.id}`}>
                    <Card className="!p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar src={channel.avatar_url} alt={channel.name} size="md" />
                        <div>
                          <p className="font-medium">{channel.name}</p>
                          <p className="text-sm text-muted-foreground">@{channel.username}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.groups.length > 0 && (type === "all" || type === "groups") && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">Группы</h2>
              <div className="space-y-2">
                {results.groups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.id}`}>
                    <Card className="!p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar src={group.avatar_url} alt={group.name} size="md" />
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-muted-foreground">{group.members_count} участников</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.videos.length > 0 && (type === "all" || type === "videos") && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">Видео</h2>
              <div className="grid grid-cols-2 gap-3">
                {results.videos.map((video) => (
                  <Link key={video.id} href={`/feed?video=${video.id}`}>
                    <Card className="!p-0 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                      <div className="aspect-[9/16] bg-secondary relative">
                        {video.thumbnail_url && (
                          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium truncate">{video.title}</p>
                        <p className="text-xs text-muted-foreground">@{video.profile?.username}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.users.length === 0 &&
            results.channels.length === 0 &&
            results.groups.length === 0 &&
            results.videos.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Ничего не найдено</p>
            )}
        </div>
      )}
    </div>
  );
}

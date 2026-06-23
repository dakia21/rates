"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatRelativeTime } from "@/lib/utils/format";
import { useToast } from "@/components/ui/toast";
import type { Report } from "@/types";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setReports(d.data);
        setLoading(false);
      });
  }, []);

  const handleReview = async (reportId: string, status: string, banUser?: boolean, reportedUserId?: string) => {
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: reportId, status, ban_user: banUser, reported_user_id: reportedUserId }),
    });
    if ((await res.json()).success) {
      toast("Жалоба обработана", "success");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Link href="/admin" className="btn-ghost inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Link>
      <h1 className="text-2xl font-bold mb-6">Жалобы</h1>

      {reports.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-muted-foreground">Нет активных жалоб</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="warning">{report.type}</Badge>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(report.created_at)}</span>
                  </div>
                  <p className="text-sm">{report.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    От: {report.reporter?.display_name}
                    {report.reported_user && ` → ${report.reported_user.display_name}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleReview(report.id, "dismissed")}>
                    Отклонить
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      handleReview(report.id, "resolved", true, report.reported_user_id || undefined)
                    }
                  >
                    Заблокировать
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

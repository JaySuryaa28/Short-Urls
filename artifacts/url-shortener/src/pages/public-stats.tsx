import { useParams } from "wouter";
import { Link2, BarChart3, Calendar, MousePointerClick } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetPublicStats, getGetPublicStatsQueryKey } from "@workspace/api-client-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

export default function PublicStats() {
  const params = useParams<{ shortCode: string }>();
  const shortCode = params.shortCode ?? "";

  const { data, isLoading, error } = useGetPublicStats(shortCode, {
    query: {
      enabled: !!shortCode,
      queryKey: getGetPublicStatsQueryKey(shortCode),
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center">
          <Link2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-xl font-semibold mb-2">Link not found</h1>
          <p className="text-muted-foreground text-sm">This link doesn't exist or is private.</p>
        </div>
      </div>
    );
  }

  const chartData = data.dailyClicks.map((d) => ({
    date: d.date,
    clicks: d.clicks,
    label: (() => {
      try {
        return format(parseISO(d.date), "MMM d");
      } catch {
        return d.date;
      }
    })(),
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">LinkSnap</span>
          <span className="text-muted-foreground text-sm mx-2">/</span>
          <span className="text-sm font-mono text-muted-foreground">{shortCode}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            {data.title ?? shortCode}
          </h1>
          <p className="text-muted-foreground text-sm">Public link statistics</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card data-testid="stat-total-clicks">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <MousePointerClick className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.totalClicks.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-created-at">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(() => {
                      try {
                        return format(new Date(data.createdAt), "MMM d");
                      } catch {
                        return "—";
                      }
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground">Created</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="chart-daily-clicks">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Clicks over time (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No click data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(246, 80%, 60%)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(246, 80%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220,13%,91%)", fontSize: 12 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(246, 80%, 60%)"
                    strokeWidth={2}
                    fill="url(#colorClicks)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

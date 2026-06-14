import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import {
  ArrowLeft,
  BarChart3,
  MousePointerClick,
  Users,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Globe,
  QrCode,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import AppLayout from "@/components/app-layout";
import {
  useGetAnalytics,
  getGetAnalyticsQueryKey,
  useGetDailyClicks,
  getGetDailyClicksQueryKey,
  useGetAnalyticsBreakdown,
  getGetAnalyticsBreakdownQueryKey,
} from "@workspace/api-client-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { BreakdownItem } from "@workspace/api-client-react";

const COLORS = [
  "hsl(246, 80%, 60%)",
  "hsl(199, 89%, 48%)",
  "hsl(160, 60%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(330, 70%, 55%)",
];

function BreakdownChart({
  title,
  data,
}: {
  title: string;
  data: BreakdownItem[];
}) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
            No data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={50}
                innerRadius={30}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                wrapperStyle={{
                  maxWidth: "220px",
                  overflow: "hidden",
                }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(220,13%,91%)",
                  fontSize: 12,
                  maxWidth: "220px",
                  wordBreak: "break-word",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5 min-w-0 overflow-hidden">
            {data.slice(0, 5).map((item, i) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span
                    className="text-xs text-foreground block max-w-[120px] truncate"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium">{item.count}</span>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const { data: analytics, isLoading: analyticsLoading } = useGetAnalytics(id, {
    query: { enabled: !!id, queryKey: getGetAnalyticsQueryKey(id) },
  });
  const { data: dailyData, isLoading: dailyLoading } = useGetDailyClicks(id, {
    query: { enabled: !!id, queryKey: getGetDailyClicksQueryKey(id) },
  });
  const { data: breakdown, isLoading: breakdownLoading } =
    useGetAnalyticsBreakdown(id, {
      query: { enabled: !!id, queryKey: getGetAnalyticsBreakdownQueryKey(id) },
    });

  const shortLink = analytics
    ? `${window.location.origin}/r/${analytics.shortCode}`
    : "";

  const handleCopy = async () => {
    if (!shortLink) return;
    await navigator.clipboard.writeText(shortLink);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const chartData = (dailyData ?? []).map((d) => ({
    ...d,
    label: (() => {
      try {
        return format(new Date(d.date), "MMM d");
      } catch {
        return d.date;
      }
    })(),
  }));

  if (analyticsLoading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!analytics) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="text-muted-foreground">
            Link not found or you don't have access.
          </p>
          <Button onClick={() => setLocation("/dashboard")} className="mt-4">
            Back to dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {`/${analytics.shortCode}`}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <button
                onClick={handleCopy}
                className="text-sm font-mono text-primary hover:underline flex items-center gap-1"
                data-testid="button-copy-short-link"
              >
                {shortLink}
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <a
                href={analytics.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="max-w-48 truncate">
                  {analytics.originalUrl}
                </span>
              </a>
              <a
                href={`/public/${analytics.shortCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                data-testid="link-public-stats"
              >
                <Globe className="h-3 w-3" />
                Public page
              </a>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                data-testid="button-qr-code"
              >
                <QrCode className="h-4 w-4" />
                QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
              <DialogHeader>
                <DialogTitle>QR Code</DialogTitle>
                <DialogDescription>
                  Scan to open this short link
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <QRCodeSVG
                  value={shortLink}
                  size={200}
                  level="H"
                  includeMargin
                />
                <p className="text-xs text-muted-foreground text-center break-all">
                  {shortLink}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: MousePointerClick,
              label: "Total clicks",
              value: analytics.totalClicks.toLocaleString(),
              testId: "stat-total-clicks",
            },
            {
              icon: Users,
              label: "Unique visitors",
              value: analytics.uniqueClicks.toLocaleString(),
              testId: "stat-unique-clicks",
            },
            {
              icon: Clock,
              label: "Last click",
              value: analytics.lastVisitedAt
                ? (() => {
                    try {
                      return format(
                        new Date(analytics.lastVisitedAt),
                        "MMM d, HH:mm",
                      );
                    } catch {
                      return "—";
                    }
                  })()
                : "Never",
              testId: "stat-last-visit",
            },
            {
              icon: BarChart3,
              label: "Recent events",
              value: analytics.recentClicks.length,
              testId: "stat-recent",
            },
          ].map(({ icon: Icon, label, value, testId }) => (
            <Card key={label} data-testid={testId}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card data-testid="chart-daily-clicks">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Daily clicks (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No click data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(246,80%,60%)"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(246,80%,60%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(220,13%,91%)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(220,13%,91%)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(246,80%,60%)"
                    strokeWidth={2}
                    fill="url(#gradClicks)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {breakdownLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : breakdown ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            data-testid="breakdown-charts"
          >
            <BreakdownChart title="Devices" data={breakdown.devices} />
            <BreakdownChart title="Browsers" data={breakdown.browsers} />
            <BreakdownChart title="Operating Systems" data={breakdown.os} />
            <BreakdownChart title="Countries" data={breakdown.countries} />
          </div>
        ) : null}

        {analytics.recentClicks.length > 0 && (
          <Card data-testid="table-recent-clicks">
            <CardHeader>
              <CardTitle className="text-base">Recent clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">
                        Time
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">
                        Device
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">
                        Browser
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">
                        OS
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">
                        Country
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentClicks.map((click) => (
                      <tr
                        key={click.id}
                        className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                        data-testid={`click-row-${click.id}`}
                      >
                        <td className="py-2 px-2 text-xs text-muted-foreground">
                          {(() => {
                            try {
                              return format(
                                new Date(click.createdAt),
                                "MMM d, HH:mm",
                              );
                            } catch {
                              return "—";
                            }
                          })()}
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant="secondary" className="text-xs">
                            {click.deviceType ?? "Unknown"}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-xs">
                          {click.browser ?? "—"}
                        </td>
                        <td className="py-2 px-2 text-xs">{click.os ?? "—"}</td>
                        <td className="py-2 px-2 text-xs">
                          {click.country ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, MousePointerClick, Link2, Activity, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/app-layout";
import UrlCard from "@/components/url-card";
import {
  useListUrls,
  getListUrlsQueryKey,
  useGetDashboardStats,
} from "@workspace/api-client-react";

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
  testId,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  isLoading: boolean;
  testId: string;
}) {
  return (
    <div
      className="border border-border rounded-xl p-5 bg-card"
      data-testid={testId}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          {isLoading ? (
            <Skeleton className="h-7 w-16 mb-1" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();

  const { data: urlsData, isLoading: urlsLoading } = useListUrls(
    { page, limit, search: search || undefined },
    {
      query: {
        queryKey: getListUrlsQueryKey({ page, limit, search: search || undefined }),
      },
    },
  );

  const urls = urlsData?.urls ?? [];
  const total = urlsData?.total ?? 0;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Manage and track all your short links
            </p>
          </div>
          <Link href="/create">
            <Button className="gap-2" data-testid="button-create-link">
              <Plus className="h-4 w-4" />
              New link
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Link2}
            label="Total links"
            value={(stats?.totalUrls ?? 0).toLocaleString()}
            isLoading={statsLoading}
            testId="stat-total-urls"
          />
          <StatCard
            icon={MousePointerClick}
            label="Total clicks"
            value={(stats?.totalClicks ?? 0).toLocaleString()}
            isLoading={statsLoading}
            testId="stat-total-clicks"
          />
          <StatCard
            icon={Activity}
            label="Active links"
            value={(stats?.activeUrls ?? 0).toLocaleString()}
            isLoading={statsLoading}
            testId="stat-active-urls"
          />
          <StatCard
            icon={TrendingUp}
            label="Clicks this week"
            value={(stats?.clicksThisWeek ?? 0).toLocaleString()}
            isLoading={statsLoading}
            testId="stat-clicks-week"
          />
        </div>

        <div className="mb-5">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search links..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </div>

        {urlsLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : urls.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl" data-testid="empty-state">
            <Link2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">
              {search ? "No links match your search" : "No links yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {search
                ? "Try a different search term"
                : "Create your first short link to start tracking"}
            </p>
            {!search && (
              <Link href="/create">
                <Button size="sm" className="gap-2" data-testid="button-empty-create">
                  <Plus className="h-4 w-4" />
                  Create your first link
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground mb-3">
              {total.toLocaleString()} link{total !== 1 ? "s" : ""} {search && `matching "${search}"`}
            </div>
            <div className="space-y-3" data-testid="url-list">
              {urls.map((url) => (
                <UrlCard key={url.id} url={url} />
              ))}
            </div>
            {total > limit && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

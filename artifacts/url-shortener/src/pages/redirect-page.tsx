import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Link2, ExternalLink } from "lucide-react";
import { useResolveShortCode, getResolveShortCodeQueryKey } from "@workspace/api-client-react";

export default function RedirectPage() {
  const params = useParams<{ shortCode: string }>();
  const shortCode = params.shortCode ?? "";
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useResolveShortCode(shortCode, {
    query: {
      enabled: !!shortCode,
      queryKey: getResolveShortCodeQueryKey(shortCode),
    },
  });

  useEffect(() => {
    if (!data?.originalUrl) return;
    const timer = setTimeout(() => {
      window.location.href = data.originalUrl;
    }, 800);
    return () => clearTimeout(timer);
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Link2 className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Resolving link...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-sm">
          <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Link2 className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Link not found</h1>
          <p className="text-muted-foreground text-sm mb-6">
            This short link doesn't exist or has expired.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="text-primary text-sm hover:underline"
            data-testid="button-go-home"
          >
            Go to homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-sm px-6">
        <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-semibold text-lg mb-1">
          {data.title ?? "Redirecting..."}
        </h1>
        <p className="text-muted-foreground text-sm mb-4 truncate">
          {data.originalUrl}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
          </span>
          Taking you there now
        </div>
      </div>
    </div>
  );
}

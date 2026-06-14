import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Check,
  Trash2,
  BarChart3,
  ExternalLink,
  Power,
  PowerOff,
  Calendar,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { QRCodeSVG } from "qrcode.react";
import {
  useDeleteUrl,
  useUpdateUrl,
  getListUrlsQueryKey,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import type { ShortUrl } from "@workspace/api-client-react";
import { format } from "date-fns";

interface UrlCardProps {
  url: ShortUrl;
}

export default function UrlCard({ url }: UrlCardProps) {
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const deleteUrl = useDeleteUrl();
  const updateUrl = useUpdateUrl();

  const shortLink = `${window.location.origin}/r/${url.shortCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortLink);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    deleteUrl.mutate(
      { id: url.id },
      {
        onSuccess: () => {
          toast.success("Link deleted");
          queryClient.invalidateQueries({ queryKey: getListUrlsQueryKey() });
          queryClient.invalidateQueries({
            queryKey: getGetDashboardStatsQueryKey(),
          });
        },
        onError: () => toast.error("Failed to delete link"),
      },
    );
  };

  const handleToggleActive = () => {
    updateUrl.mutate(
      { id: url.id, data: { isActive: !url.isActive } },
      {
        onSuccess: () => {
          toast.success(url.isActive ? "Link deactivated" : "Link activated");
          queryClient.invalidateQueries({ queryKey: getListUrlsQueryKey() });
        },
        onError: () => toast.error("Failed to update link"),
      },
    );
  };

  return (
    <div
      className="group border border-border rounded-xl p-4 bg-card hover:border-primary/20 hover:shadow-sm transition-all"
      data-testid={`url-card-${url.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {url.title && (
              <span
                className="font-medium text-sm text-foreground truncate"
                data-testid={`text-title-${url.id}`}
              >
                {url.title}
              </span>
            )}
            {!url.isActive && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
            {url.expiresAt && new Date(url.expiresAt) < new Date() && (
              <Badge variant="destructive" className="text-xs">
                Expired
              </Badge>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-primary text-sm font-mono hover:underline mb-1"
            data-testid={`button-short-link-${url.id}`}
          >
            {shortLink}
          </button>

          <p
            className="text-xs text-muted-foreground truncate max-w-xs"
            data-testid={`text-original-url-${url.id}`}
          >
            {url.originalUrl}
          </p>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span data-testid={`text-clicks-${url.id}`}>
              {url.totalClicks.toLocaleString()} clicks
            </span>
            {url.lastVisitedAt && (
              <span>
                Last visit {format(new Date(url.lastVisitedAt), "MMM d")}
              </span>
            )}
            {url.expiresAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Expires {format(new Date(url.expiresAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
            data-testid={`button-copy-${url.id}`}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid={`button-qr-${url.id}`}
              >
                <QrCode className="h-3.5 w-3.5" />
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

          <Link href={`/analytics/${url.id}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-testid={`button-analytics-${url.id}`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </Button>
          </Link>

          <a href={url.originalUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-testid={`button-open-${url.id}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleToggleActive}
            disabled={updateUrl.isPending}
            data-testid={`button-toggle-${url.id}`}
          >
            {url.isActive ? (
              <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Power className="h-3.5 w-3.5 text-green-500" />
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                data-testid={`button-delete-${url.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this link?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{" "}
                  <strong className="font-mono">/r/{url.shortCode}</strong> and
                  all its analytics. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                  data-testid={`button-confirm-delete-${url.id}`}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

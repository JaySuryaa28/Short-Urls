import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Link2, Loader2, Upload, FileText,
  CheckCircle2, XCircle, Download, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreateUrl,
  useBulkCreateUrls,
  getListUrlsQueryKey,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import type { BulkUrlItem, BulkUploadResult } from "@workspace/api-client-react";
import AppLayout from "@/components/app-layout";

// ─── Single URL form ─────────────────────────────────────────────────────────

const singleSchema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  customAlias: z
    .string()
    .regex(/^[a-zA-Z0-9_-]*$/, "Only letters, numbers, hyphens, underscores")
    .max(32, "Max 32 characters")
    .optional()
    .or(z.literal("")),
  title: z.string().max(120).optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
});

type SingleFormValues = z.infer<typeof singleSchema>;

function SingleUrlForm() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createUrl = useCreateUrl();

  const form = useForm<SingleFormValues>({
    resolver: zodResolver(singleSchema),
    defaultValues: { originalUrl: "", customAlias: "", title: "", expiresAt: "" },
  });

  const onSubmit = (values: SingleFormValues) => {
    createUrl.mutate(
      {
        data: {
          originalUrl: values.originalUrl,
          customAlias: values.customAlias || undefined,
          title: values.title || undefined,
          expiresAt: values.expiresAt || undefined,
        },
      },
      {
        onSuccess: (url) => {
          toast.success("Short link created");
          queryClient.invalidateQueries({ queryKey: getListUrlsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          setLocation(`/analytics/${url.id}`);
        },
        onError: (err: unknown) => {
          const apiErr = err as { data?: { error?: string }; message?: string };
          const msg = apiErr?.data?.error ?? apiErr?.message ?? "Failed to create link";
          toast.error(msg);
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="originalUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination URL *</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/very/long/url"
                  {...field}
                  data-testid="input-original-url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="My product launch"
                  {...field}
                  data-testid="input-title"
                />
              </FormControl>
              <FormDescription>Optional label for your reference</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customAlias"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom alias</FormLabel>
              <div className="flex items-stretch rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 aria-[invalid]:border-destructive">
                <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted border-r border-input rounded-l-md whitespace-nowrap select-none">
                  {window.location.origin}/r/
                </span>
                <FormControl>
                  <Input
                    placeholder="my-link"
                    {...field}
                    className="border-0 rounded-l-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                    data-testid="input-custom-alias"
                  />
                </FormControl>
              </div>
              <FormDescription>Only letters, numbers, hyphens, underscores — leave blank to auto-generate</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiry date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  {...field}
                  data-testid="input-expires-at"
                />
              </FormControl>
              <FormDescription>Optional — leave blank for no expiry</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={createUrl.isPending}
          data-testid="button-submit-create"
        >
          {createUrl.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create short link"
          )}
        </Button>
      </form>
    </Form>
  );
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCSV(raw: string): BulkUrlItem[] {
  const lines = raw.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes("url") ||
    firstLine.includes("alias") ||
    firstLine.includes("title");

  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const url = cols[0] ?? "";
      const alias = cols[1] ?? "";
      const title = cols[2] ?? "";
      const expiresAt = cols[3] ?? "";
      if (!url) return null;
      return {
        url,
        alias: alias || undefined,
        title: title || undefined,
        expiresAt: expiresAt || undefined,
      } as BulkUrlItem;
    })
    .filter((r): r is BulkUrlItem => r !== null);
}

// ─── Bulk upload form ─────────────────────────────────────────────────────────

function BulkUploadForm() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<BulkUrlItem[]>([]);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [parseError, setParseError] = useState("");
  const bulkCreate = useBulkCreateUrls();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv") && file.type !== "text/csv" && file.type !== "text/plain") {
      setParseError("Please upload a .csv file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      tryParse(text);
    };
    reader.readAsText(file);
  };

  const tryParse = (text: string) => {
    setParseError("");
    setResult(null);
    try {
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setParseError("No valid rows found. Make sure each line has at least a URL.");
        setPreview([]);
        return;
      }
      setPreview(rows);
    } catch {
      setParseError("Failed to parse CSV. Check the format and try again.");
      setPreview([]);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvText(e.target.value);
    if (e.target.value.trim()) {
      tryParse(e.target.value);
    } else {
      setPreview([]);
      setParseError("");
    }
  };

  const handleSubmit = () => {
    if (preview.length === 0) return;
    bulkCreate.mutate(
      { data: { urls: preview } },
      {
        onSuccess: (data) => {
          setResult(data);
          queryClient.invalidateQueries({ queryKey: getListUrlsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          if (data.failed === 0) {
            toast.success(`${data.succeeded} links created successfully`);
          } else {
            toast.warning(`${data.succeeded} created, ${data.failed} failed`);
          }
        },
        onError: (err: unknown) => {
          const apiErr = err as { data?: { error?: string }; message?: string };
          toast.error(apiErr?.data?.error ?? apiErr?.message ?? "Bulk upload failed");
        },
      },
    );
  };

  const downloadTemplate = () => {
    const csv = "url,alias,title,expires_at\nhttps://example.com,my-link,Example Title,2026-12-31\nhttps://another.com,,Another Link,\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "links-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file or paste CSV text. Columns: <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">url, alias, title, expires_at</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Header row is optional. Only <strong>url</strong> is required.</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 shrink-0" data-testid="button-download-template">
          <Download className="h-3.5 w-3.5" />
          Template
        </Button>
      </div>

      <div
        className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-all"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) {
            const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileChange(fakeEvent);
          }
        }}
        data-testid="dropzone-csv"
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">Drop a CSV file here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">Or paste CSV text below</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={handleFileChange}
          data-testid="input-file-csv"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Or paste CSV text</label>
        <Textarea
          value={csvText}
          onChange={handleTextChange}
          placeholder={"url,alias,title,expires_at\nhttps://example.com,my-link,My Title,2026-12-31\nhttps://another.com,,,"}
          className="font-mono text-xs mt-1.5 min-h-[120px]"
          data-testid="textarea-csv"
        />
      </div>

      {parseError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm" data-testid="error-parse">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {parseError}
        </div>
      )}

      {preview.length > 0 && !result && (
        <div data-testid="preview-table">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{preview.length} row{preview.length !== 1 ? "s" : ""} ready to import</p>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">URL</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Alias</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-border" data-testid={`preview-row-${i}`}>
                      <td className="py-1.5 px-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-1.5 px-3 max-w-[200px] truncate font-mono">{row.url}</td>
                      <td className="py-1.5 px-3">{row.alias ?? <span className="text-muted-foreground italic">auto</span>}</td>
                      <td className="py-1.5 px-3 max-w-[120px] truncate">{row.title ?? "—"}</td>
                      <td className="py-1.5 px-3">{row.expiresAt ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div data-testid="result-table">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant={result.failed === 0 ? "default" : "secondary"} className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {result.succeeded} created
            </Badge>
            {result.failed > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                {result.failed} failed
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{result.total} total rows</span>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">URL</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Short code / Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r) => (
                    <tr key={r.row} className="border-t border-border" data-testid={`result-row-${r.row}`}>
                      <td className="py-1.5 px-3 text-muted-foreground">{r.row}</td>
                      <td className="py-1.5 px-3 max-w-[180px] truncate font-mono">{r.url}</td>
                      <td className="py-1.5 px-3">
                        {r.success
                          ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" />OK</span>
                          : <span className="flex items-center gap-1 text-destructive"><XCircle className="h-3 w-3" />Failed</span>}
                      </td>
                      <td className="py-1.5 px-3 font-mono">
                        {r.success
                          ? <a href={`/r/${r.shortCode}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">/r/{r.shortCode}</a>
                          : <span className="text-destructive">{r.error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => { setResult(null); setCsvText(""); setPreview([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
            data-testid="button-reset-bulk"
          >
            Upload another file
          </Button>
        </div>
      )}

      {!result && (
        <Button
          className="w-full"
          disabled={preview.length === 0 || bulkCreate.isPending}
          onClick={handleSubmit}
          data-testid="button-submit-bulk"
        >
          {bulkCreate.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importing {preview.length} links...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Import {preview.length > 0 ? `${preview.length} links` : "links"}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CreateUrl() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto py-8 px-4">
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <Tabs defaultValue="single" data-testid="tabs-create">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="single" className="flex-1 gap-2" data-testid="tab-single">
              <Link2 className="h-3.5 w-3.5" />
              Single URL
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1 gap-2" data-testid="tab-bulk">
              <Upload className="h-3.5 w-3.5" />
              Bulk CSV upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card data-testid="card-create-url">
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Create short link</CardTitle>
                    <CardDescription>Shorten a long URL and start tracking clicks</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SingleUrlForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card data-testid="card-bulk-upload">
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Bulk CSV upload</CardTitle>
                    <CardDescription>Import multiple links at once from a spreadsheet</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <BulkUploadForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

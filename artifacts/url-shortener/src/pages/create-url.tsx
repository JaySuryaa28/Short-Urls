import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useCreateUrl, getListUrlsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import AppLayout from "@/components/app-layout";

const schema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  customAlias: z.string().regex(/^[a-zA-Z0-9_-]*$/, "Only letters, numbers, hyphens, underscores").max(32).optional().or(z.literal("")),
  title: z.string().max(120).optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function CreateUrl() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createUrl = useCreateUrl();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      originalUrl: "",
      customAlias: "",
      title: "",
      expiresAt: "",
    },
  });

  const onSubmit = (values: FormValues) => {
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
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to create link";
          toast.error(msg);
        },
      },
    );
  };

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
                      <FormControl>
                        <div className="flex items-center gap-0">
                          <span className="h-9 px-3 flex items-center text-sm text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md whitespace-nowrap">
                            {window.location.origin}/r/
                          </span>
                          <Input
                            placeholder="my-link"
                            {...field}
                            className="rounded-l-none"
                            data-testid="input-custom-alias"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Leave blank to auto-generate</FormDescription>
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
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

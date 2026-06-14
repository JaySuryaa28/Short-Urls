import { Link } from "wouter";
import { BarChart3, Link2, Shield, Zap, Globe, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Link2,
    title: "Instant Short Links",
    description: "Generate short, memorable URLs in seconds. Custom aliases or auto-generated codes.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Track clicks, devices, browsers, OS, and countries with beautiful charts.",
  },
  {
    icon: Globe,
    title: "Public Stats Pages",
    description: "Share a public statistics page for any link — no login required to view.",
  },
  {
    icon: Zap,
    title: "Link Expiry",
    description: "Set expiry dates on links. Deactivate them instantly from your dashboard.",
  },
  {
    icon: Copy,
    title: "One-Click Copy",
    description: "Copy your short URL to clipboard instantly. QR codes generated automatically.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Each link belongs to your account. Nobody else can edit or delete your links.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg tracking-tight">LinkSnap</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" data-testid="link-sign-in">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" data-testid="link-sign-up">Get started free</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="pt-24 pb-20 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              Track every click, from every corner
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Short links with{" "}
              <span className="text-primary">real analytics</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Create short URLs, track who clicks them, from where, on what device — and share public stats with anyone.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto px-8" data-testid="button-get-started">
                  Get started free
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8" data-testid="button-sign-in">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-card border-y border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight mb-3">Everything you need</h2>
              <p className="text-muted-foreground text-lg">Built for people who care about where their links go.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="p-6 rounded-xl border border-border bg-background hover:border-primary/30 hover:shadow-sm transition-all"
                  data-testid={`feature-card-${f.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Ready to track your links?</h2>
            <p className="text-muted-foreground mb-8">Create an account in seconds. No credit card required.</p>
            <Link href="/sign-up">
              <Button size="lg" className="px-10" data-testid="button-cta-bottom">
                Create free account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="font-medium">LinkSnap</span>
          </div>
          <p>This project is a part of a hackathon run by <a href="https://katomaran.com" className="text-primary hover:underline">https://katomaran.com</a></p>
        </div>
      </footer>
    </div>
  );
}

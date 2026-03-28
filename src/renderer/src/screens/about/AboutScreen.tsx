import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Layers3,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_CONFIG } from '@/config/app';

const ICONS = [Sparkles, ShieldCheck, CheckCircle2] as const;
const STACK_ICONS = [Layers3, Workflow, Boxes] as const;

export default function AboutScreen() {
  const [version, setVersion] = useState('Loading...');

  useEffect(() => {
    window.app
      .getAppInfo()
      .then((info) => setVersion(info.version))
      .catch(() => setVersion('Unknown'));
  }, []);

  return (
    <section className="space-y-6 px-6 py-6">
      <div className="rounded-[30px] border border-border/70 bg-muted/20 px-6 py-6 md:px-8 md:py-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              About {APP_CONFIG.name}
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">{APP_CONFIG.tagline}</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              {APP_CONFIG.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Version</p>
              <p className="mt-2 text-lg font-semibold">{version}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Owner</p>
              <p className="mt-2 text-lg font-semibold">{APP_CONFIG.company}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Support</p>
              <p className="mt-2 text-sm font-medium">{APP_CONFIG.supportEmail}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.25)]">
        <CardHeader>
          <CardTitle>Why the product exists</CardTitle>
          <CardDescription>
            Built for teams that want repeatable job discovery without juggling tabs, scripts, and manual reruns.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {APP_CONFIG.aboutHighlights.map((highlight, index) => {
            const Icon = ICONS[index] ?? CheckCircle2;

            return (
              <div key={highlight} className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <Icon className="mb-4 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">{highlight}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.25)]">
          <CardHeader>
            <CardTitle>What ships with the desktop app</CardTitle>
            <CardDescription>The app is meant to feel operational on first launch, not dependent on local setup.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'A bundled backend runtime so users do not need to install separate developer tooling.',
              'Preset-driven job searches so useful queries can be rerun consistently across sessions.',
              'Desktop-native updates and runtime diagnostics so the app is easier to maintain in production.',
            ].map((item, index) => {
              const Icon = STACK_ICONS[index] ?? Layers3;

              return (
                <div key={item} className="flex items-start gap-4 rounded-2xl border border-border/70 bg-background/80 p-4">
                  <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.25)]">
          <CardHeader>
            <CardTitle>Project reference</CardTitle>
            <CardDescription>Essential ownership and access details for the product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Product</p>
                <p className="mt-2 font-medium">{APP_CONFIG.name}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Maintainer</p>
                <p className="mt-2 font-medium">{APP_CONFIG.company}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Support channel</p>
              <p className="mt-2 font-medium">{APP_CONFIG.supportEmail}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={() => window.app.openExternalUrl(APP_CONFIG.repository.url)}>
                {APP_CONFIG.repository.label}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => window.app.openExternalUrl(`mailto:${APP_CONFIG.supportEmail}`)}>
                Email support
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

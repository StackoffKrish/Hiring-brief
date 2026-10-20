import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroProps = {
  id?: string;
};

type TrustItem = {
  icon: LucideIcon;
  value: string;
  label: string;
};

type Step = {
  number: string;
  title: string;
  description: string;
};

const trustItems: TrustItem[] = [
  {
    icon: Building2,
    value: "5,000+",
    label: "companies covered across India",
  },
  {
    icon: GraduationCap,
    value: "IITs, NITs & bootcamps",
    label: "trusted by candidates from top programmes",
  },
  {
    icon: RefreshCw,
    value: "Weekly",
    label: "interview data refreshed",
  },
];

const steps: Step[] = [
  {
    number: "01",
    title: "Tell us where you're interviewing",
    description:
      "Enter the company, role, and location. No signup walls, no 10-page forms.",
  },
  {
    number: "02",
    title: "We build your brief",
    description:
      "Real experiences, recurring questions, salary signals, and culture insights — organized into one structured document.",
  },
  {
    number: "03",
    title: "Walk in prepared",
    description:
      "Know the rounds, questions that repeat, topics that matter, and red flags worth watching before you sit down.",
  },
];

export default function Hero({ id }: HeroProps) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-600">
            Interview intelligence
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance text-black sm:text-5xl lg:text-6xl">
            Ace Your Next Interview With Inside Intel
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Real interview experiences, questions, and insider tips for the
            company and role you want — gathered and organized into one clear
            brief, so you walk in knowing what to expect.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Get Your First Brief Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#features">See how it works</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-3">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left"
            >
              <item.icon className="h-5 w-5 text-gray-500" />
              <p className="mt-4 text-xl font-semibold tracking-tight text-black">
                {item.value}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                How it works
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-black">
                From interview invite to a clear prep plan in three steps.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-gray-600">
              One focused brief instead of scattered threads, login walls, and
              last-minute guesswork.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6"
              >
                <p className="font-mono text-sm font-semibold text-gray-500">
                  {step.number}
                </p>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-black">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

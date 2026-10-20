import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type AboutProps = {
  id?: string;
};

type Audience = {
  title: string;
  description: string;
};

const audiences: Audience[] = [
  {
    title: "Candidates",
    description: "Clarity before next week's interview, not chaos the night before.",
  },
  {
    title: "Placement cells",
    description: "Company intel for hundreds of students in minutes instead of weeks.",
  },
  {
    title: "HR teams",
    description: "Competitor perception, culture gaps, and signals behind lost offers.",
  },
];

export default function About({ id }: AboutProps) {
  return (
    <section id={id} className="scroll-mt-20 bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              About
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-balance text-black sm:text-4xl">
              The interview system is broken. We&apos;re fixing the
              information part.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-gray-600">
              Great candidates fail interviews every day — not because they
              lack ability, but because they walk in blind while others walk
              in knowing the process, the questions, and what the company
              really looks for.
            </p>
            <p className="mt-4 leading-relaxed text-gray-600">
              Some people have seniors at the right companies, expensive
              coaching, or the right WhatsApp group. Everyone else is left
              Googling through half-useful threads and hoping they prepared
              enough.
            </p>
          </div>

          <aside className="rounded-3xl bg-black p-7 text-white sm:p-8">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-400">
              The problem
            </p>
            <blockquote className="mt-4 text-2xl font-semibold leading-snug tracking-tight">
              “That&apos;s not a level playing field. That&apos;s an
              information lottery.”
            </blockquote>
            <p className="mt-5 leading-relaxed text-gray-300">
              Inside Intel brings scattered interview experiences, questions,
              salary data, and cultural signals into one clear, honest,
              structured brief.
            </p>
          </aside>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-black">
              What we&apos;re building
            </h3>
            <p className="mt-4 leading-relaxed text-gray-600">
              No fluff. No generic advice. Just the information that helps you
              prepare better, negotiate smarter, and decide whether a company
              deserves your time.
            </p>
            <p className="mt-4 leading-relaxed text-gray-600">
              We started with individual candidates, then placement cells, then
              HR teams. Same data, different lens — one platform.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200">
            {audiences.map((audience, index) => (
              <div
                key={audience.title}
                className={
                  index === 0
                    ? "grid gap-2 bg-white p-5 sm:grid-cols-[180px_1fr]"
                    : "grid gap-2 border-t border-gray-200 bg-white p-5 sm:grid-cols-[180px_1fr]"
                }
              >
                <h4 className="font-semibold text-black">{audience.title}</h4>
                <p className="text-sm leading-relaxed text-gray-600">
                  {audience.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 rounded-3xl border border-gray-200 bg-white p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h3 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">
              Your next interview doesn&apos;t have to be a guessing game.
            </h3>
            <p className="mt-3 leading-relaxed text-gray-600">
              We&apos;re a small, focused team of engineers and researchers
              based in India who have sat on both sides of the interview table
              — and wished something like this existed.
            </p>
          </div>
          <Button asChild size="lg" className="w-fit shrink-0">
            <Link href="/dashboard">
              Get your first brief
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

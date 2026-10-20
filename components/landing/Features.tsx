import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  FileText,
  GraduationCap,
  IndianRupee,
  ListChecks,
  Search,
  ShieldAlert,
  User,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FeaturesProps = {
  id?: string;
};

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type Audience = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: Search,
    title: "Company-specific intel",
    description:
      "Search by company, role, and location for details from people who actually interviewed there — no generic advice.",
  },
  {
    icon: FileText,
    title: "One structured brief",
    description:
      "Scattered posts and experiences cleaned into one easy-to-scan document, instead of 23 open tabs.",
  },
  {
    icon: ListChecks,
    title: "Know what to prepare",
    description:
      "See the rounds, recurring questions, and repeat topics so you can focus preparation where it counts.",
  },
  {
    icon: IndianRupee,
    title: "Salary & compensation signals",
    description:
      "Ranges filtered by role, location, and experience level, so you can negotiate with knowledge — not guesswork.",
  },
  {
    icon: ShieldAlert,
    title: "Culture & red-flag detection",
    description:
      "Go beyond star ratings with patterns around leadership churn, work-life balance, layoffs, and team-specific watch-outs.",
  },
  {
    icon: Users,
    title: "Team & bulk briefs",
    description:
      "Generate and share briefs across placement batches or recruiting teams without duplicating research effort.",
  },
];

const audiences: Audience[] = [
  {
    icon: User,
    title: "Candidates",
    description:
      "Interview in three days and no time for five hours of research? Get the brief, do the prep, skip the anxiety.",
  },
  {
    icon: GraduationCap,
    title: "Placement cells",
    description:
      "Give students structured intel for every company this season — without coordinators burning out.",
  },
  {
    icon: Briefcase,
    title: "HR & talent teams",
    description:
      "Benchmark competitor culture, compensation, and hiring reputation before you lose offers across the street.",
  },
];

export default function Features({ id }: FeaturesProps) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Features
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-black sm:text-4xl">
            Everything you need to prepare with confidence — nothing you
            don&apos;t.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Six layers of interview intelligence, one clean brief.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-gray-200 bg-white shadow-none transition-colors hover:border-gray-400"
            >
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50">
                  <feature.icon className="h-5 w-5 text-gray-700" />
                </div>
                <CardTitle className="pt-4 text-base text-black">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Who is this for?
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
              Built for the people carrying the interview pressure.
            </h3>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {audiences.map((audience) => (
              <article
                key={audience.title}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6"
              >
                <audience.icon className="h-5 w-5 text-gray-600" />
                <h4 className="mt-4 font-semibold text-black">
                  {audience.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {audience.description}
                </p>
              </article>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

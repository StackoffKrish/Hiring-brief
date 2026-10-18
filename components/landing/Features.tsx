import type { LucideIcon } from "lucide-react";
import { FileText, ListChecks, Search } from "lucide-react";
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

const features: Feature[] = [
  {
    icon: Search,
    title: "Company-specific intel",
    description:
      "Search by company, role, and location to surface the interview details that are actually relevant to where you're applying.",
  },
  {
    icon: FileText,
    title: "One structured brief",
    description:
      "Scattered posts and experiences, cleaned up and organized into a single, easy-to-scan brief instead of dozens of open tabs.",
  },
  {
    icon: ListChecks,
    title: "Know what to prepare",
    description:
      "Spot the rounds, recurring questions, and topics that come up again and again — and focus your preparation where it counts.",
  },
];

export default function Features({ id }: FeaturesProps) {
  return (
    <section id={id} className="border-b border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            Features
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to prepare with confidence — nothing you
            don&apos;t.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-gray-200 bg-white shadow-none"
            >
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white">
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
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PricingProps = {
  id?: string;
};

type PlanFeature = {
  label: string;
  included: boolean;
};

type Plan = {
  name: string;
  price: string;
  period?: string;
  description: string;
  note?: string;
  cta: string;
  features: PlanFeature[];
  highlighted?: boolean;
};

const included = (label: string): PlanFeature => ({ label, included: true });
const excluded = (label: string): PlanFeature => ({ label, included: false });

const plans: Plan[] = [
  {
    name: "Free",
    price: "₹0",
    description: "For exploring your first interview brief.",
    cta: "Get Started — it's free",
    features: [
      included("Basic company briefs with culture overview"),
      included("2 searches per month"),
      included("Standard data sources"),
      included("Web dashboard access"),
      excluded("No salary signals"),
      excluded("No red-flag detection"),
      excluded("No PDF export"),
    ],
  },
  {
    name: "Pro",
    price: "₹500",
    period: "/month",
    description: "For candidates actively interviewing and serious about preparation.",
    note: "Annual plan: ₹4,999/year — save ₹1,001",
    cta: "Get started with Pro",
    highlighted: true,
    features: [
      included("Full briefs: rounds, questions, difficulty patterns"),
      included("Company + role + location filtered search"),
      included("Salary & compensation benchmarks"),
      included("Culture deep-dive with red-flag detection"),
      included("Priority data sources"),
      included("Unlimited searches"),
      included("PDF export & email delivery"),
    ],
  },
  {
    name: "Team / Custom",
    price: "Custom",
    description: "For placement cells, bootcamps, and HR teams who need scale.",
    cta: "Explore Team briefs",
    features: [
      included("Everything in Pro"),
      included("Bulk brief generation from a company list"),
      included("Shared team dashboard with role-based access"),
      included("Admin analytics and prep coverage"),
      included("Competitor culture & compensation benchmarking"),
      included("API access for internal tools or LMS platforms"),
      included("Dedicated onboarding & support"),
    ],
  },
];

export default function Pricing({ id }: PricingProps) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Pricing
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-black sm:text-4xl">
            Start free. Upgrade when you need the full picture.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            No surprises. No hidden upsells. Pick what fits.
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "flex flex-col bg-white shadow-none",
                plan.highlighted ? "border-black" : "border-gray-200"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base text-black">
                    {plan.name}
                  </CardTitle>
                  {plan.highlighted ? (
                    <span className="rounded-full bg-black px-2.5 py-1 text-xs font-medium text-white">
                      Most Popular
                    </span>
                  ) : null}
                </div>
                <div className="pt-4 text-4xl font-semibold tracking-tight text-black">
                  {plan.price}
                  {plan.period ? (
                    <span className="text-base font-medium text-gray-500">
                      {plan.period}
                    </span>
                  ) : null}
                </div>
                <CardDescription className="pt-2 leading-relaxed text-gray-600">
                  {plan.description}
                </CardDescription>
                {plan.note ? (
                  <p className="pt-3 text-sm font-medium text-black">
                    {plan.note}
                  </p>
                ) : null}
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className={cn(
                        "flex items-start gap-3 text-sm leading-relaxed",
                        feature.included ? "text-gray-700" : "text-gray-400"
                      )}
                    >
                      {feature.included ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      )}
                      <span>{feature.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  asChild
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full"
                >
                  <Link href="/dashboard">
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}

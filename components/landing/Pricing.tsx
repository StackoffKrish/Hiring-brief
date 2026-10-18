import Link from "next/link";
import { Check } from "lucide-react";
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

type Plan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "Rs 0",
    description: "For exploring your first interview brief.",
    features: [
      "Explore the dashboard",
      "Basic company briefs",
      "Limited searches",
    ],
  },
  {
    name: "Pro",
    price: "Rs 499",
    description: "For candidates actively interviewing.",
    features: [
      "Full interview briefs",
      "Company, role & location search",
      "Priority sources",
      "Unlimited searches",
    ],
    highlighted: true,
  },
  {
    name: "Team",
    price: "Custom",
    description: "For groups preparing together.",
    features: ["Everything in Pro", "Shared briefs", "Team access"],
  },
];

export default function Pricing({ id }: PricingProps) {
  return (
    <section id={id} className="border-b border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Start free. Upgrade when you need the full picture.
          </p>
        </div>

        <div className="mt-16 grid items-stretch gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "flex flex-col bg-white shadow-none",
                plan.highlighted ? "border-black" : "border-gray-200"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-black">
                    {plan.name}
                  </CardTitle>
                  {plan.highlighted ? (
                    <span className="rounded-full bg-black px-2.5 py-1 text-xs font-medium text-white">
                      Most popular
                    </span>
                  ) : null}
                </div>
                <div className="pt-4 text-4xl font-semibold tracking-tight text-black">
                  {plan.price}
                </div>
                <CardDescription className="pt-2 text-gray-600">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-gray-700"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                      <span>{feature}</span>
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
                  <Link href="/dashboard">Get started</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

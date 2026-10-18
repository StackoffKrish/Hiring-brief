import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroProps = {
  id?: string;
};

export default function Hero({ id }: HeroProps) {
  return (
    <section id={id} className="border-b border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 text-center sm:py-32">
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-balance text-black sm:text-5xl lg:text-6xl">
          Ace Your Next Interview With Inside Intel
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
          Real interview experiences, questions, and insider tips for the
          company and role you want — gathered and organized into one clear
          brief, so you walk in knowing what to expect.
        </p>
        <div className="mt-10 flex items-center justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

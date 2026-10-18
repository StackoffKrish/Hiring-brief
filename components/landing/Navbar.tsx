import Link from "next/link";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Home", href: "/#home" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/#about" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/#home"
          className="text-sm font-semibold tracking-tight text-black"
        >
          Inside Intel
        </Link>

        <nav className="hidden items-center gap-8 sm:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 transition-colors hover:text-black"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Button asChild size="sm">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </header>
  );
}

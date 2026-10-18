import { Button } from "@/components/ui/button";

// TODO: Wire up to POST /api/brief once the brief flow is specified.
export default function SearchBar() {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label
            htmlFor="company"
            className="text-sm font-medium text-black"
          >
            Company
          </label>
          <input
            id="company"
            name="company"
            type="text"
            placeholder="e.g. Google"
            className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium text-black">
            Role
          </label>
          <input
            id="role"
            name="role"
            type="text"
            placeholder="e.g. Software Engineer"
            className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="location"
            className="text-sm font-medium text-black"
          >
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            placeholder="e.g. Bengaluru"
            className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Button type="button" disabled>
          Search
        </Button>
        <p className="text-sm text-gray-500">Search is not wired up yet.</p>
      </div>
    </section>
  );
}

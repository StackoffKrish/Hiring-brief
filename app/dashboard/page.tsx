import FloatingNav from "@/components/dashboard/FloatingNav";
import SearchBar from "@/components/dashboard/SearchBar";

export default function DashboardPage() {
  return (
    <main className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-black">
          Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-gray-600">
          Search a company to generate an interview brief.
        </p>

        <div className="mt-12">
          <FloatingNav />
        </div>

        <div className="mt-8">
          <SearchBar />
        </div>
      </div>
    </main>
  );
}

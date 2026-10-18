// TODO: 3-tabs wrapper for brief results.
// Define tab labels and content once the brief format is specified.
const tabs = ["Tab 1", "Tab 2", "Tab 3"];

export default function ResultTabs() {
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="flex border-b border-gray-200" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={index === 0}
            disabled
            className={
              index === 0
                ? "-mb-px border-b border-black px-5 py-3 text-sm font-medium text-black"
                : "px-5 py-3 text-sm text-gray-500"
            }
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-500">Results will appear here.</p>
      </div>
    </section>
  );
}

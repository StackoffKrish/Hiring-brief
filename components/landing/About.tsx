type AboutProps = {
  id?: string;
};

export default function About({ id }: AboutProps) {
  return (
    <section id={id} className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            About
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            Great candidates fail interviews every day — not because they
            lack ability, but because they walk in blind while others walk
            in knowing the process, the questions, and what the company
            really looks for.
          </p>
          <p className="mt-4 leading-relaxed text-gray-600">
            Our mission is to level that playing field. Inside Intel brings
            the interview knowledge scattered across the internet into one
            clear, honest brief — so your preparation is judged on your
            ability, not on who you know.
          </p>
        </div>
      </div>
    </section>
  );
}

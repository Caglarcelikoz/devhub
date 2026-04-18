const steps = [
  {
    step: '01',
    title: 'Save anything in seconds',
    description: 'Paste a snippet, type a command, drop a file, or add a link. DevHub stores it with the right editor for the content type.',
  },
  {
    step: '02',
    title: 'AI tags it for you',
    description: 'Pro users get automatic tag suggestions on save. No manual labeling — just save and move on.',
  },
  {
    step: '03',
    title: 'Find it instantly',
    description: 'Press ⌘K from anywhere. Full-text search across all types, tags, and collections — results appear as you type.',
  },
  {
    step: '04',
    title: 'Use it in your flow',
    description: 'Copy with one click, open in the editor, or export everything as JSON or ZIP. Your knowledge, your way.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 sm:px-6 border-t border-white/6">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Built for speed
          </h2>
          <p className="text-zinc-400 text-lg">
            From scattered to searchable in four steps.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map(({ step, title, description }) => (
            <div key={step} className="flex flex-col gap-4">
              <div className="text-4xl font-bold text-primary/30 font-mono leading-none">
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

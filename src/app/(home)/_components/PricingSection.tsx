import { PricingToggle } from './PricingToggle';

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-zinc-400 text-lg">Start free. Upgrade when you outgrow it.</p>
        </div>

        <PricingToggle />

      </div>
    </section>
  );
}

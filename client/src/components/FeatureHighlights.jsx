import { Truck, Wallet, RotateCcw, ShieldCheck } from "lucide-react";

const DEFAULT_FEATURES = [
  {
    icon: Truck,
    title: "Free delivery over Rs 5,000",
    text: "Flat Rs 200 on everything below that.",
  },
  {
    icon: Wallet,
    title: "Pay when it arrives",
    text: "Cash on delivery, nationwide.",
  },
  {
    icon: RotateCcw,
    title: "Seven day returns",
    text: "Unworn and unused, no questions asked.",
  },
  {
    icon: ShieldCheck,
    title: "Checked before it ships",
    text: "Every piece inspected and packed by hand.",
  },
];

function FeatureHighlights({ features = DEFAULT_FEATURES }) {
  return (
    <section className="px-8 py-12 border-t">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="flex flex-col items-center text-center h-full"
          >
            <Icon size={50} className="text-gray-400" strokeWidth={1.5} />
            <p className="font-medium mt-4">{title}</p>
            <p className="text-sm text-gray-500 mt-1 max-w-56">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeatureHighlights;
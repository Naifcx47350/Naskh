import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function ProcessingState() {
  const steps = ["Building preview", "Extracting fields", "Transcribing Arabic", "Indexing assistant"];
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl bg-ink p-8 text-white">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-copper" />
      <h3 className="text-2xl font-semibold">Digitizing document</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-white/70">Running vision extraction and preparing cited answers.</p>
      <div className="mt-8 w-full max-w-md space-y-2">
        {steps.map((step, i) => (
          <motion.div key={step} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.15 }} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-copper/25 text-xs font-bold text-copper">{i + 1}</span>
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

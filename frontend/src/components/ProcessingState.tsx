import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function ProcessingState() {
  const steps = ["Building preview", "Extracting fields", "Transcribing Arabic", "Indexing assistant"];
  return (
    <div className="naskh-processing">
      <Loader2 className="mb-4 h-10 w-10 animate-spin" style={{ color: "var(--accent)" }} />
      <h3 className="text-2xl font-semibold">Digitizing document</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-white/75">
        Running vision extraction and preparing cited answers.
      </p>
      <div className="mt-8 w-full max-w-md space-y-2">
        {steps.map((step, i) => (
          <motion.div
            key={step}
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.15 }}
            className="naskh-processing-step"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: "color-mix(in srgb, var(--accent) 25%, transparent)", color: "var(--accent)" }}
            >
              {i + 1}
            </span>
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

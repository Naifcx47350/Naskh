import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

export function Toast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          className="naskh-toast"
          role="alert"
        >
          <AlertCircle size={18} className="shrink-0" />
          <p className="flex-1 text-sm">{message}</p>
          <button type="button" className="naskh-toast-dismiss" onClick={onDismiss} aria-label="Dismiss">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

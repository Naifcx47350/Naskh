export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="naskh-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="naskh-modal" role="dialog" aria-labelledby="shortcuts-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="shortcuts-title" className="text-lg font-semibold">Keyboard shortcuts</h2>
        <ul className="mt-4 space-y-2 text-sm">
          <li><kbd>?</kbd> Show shortcuts</li>
          <li><kbd>Alt</kbd> + <kbd>T</kbd> Toggle theme</li>
          <li><kbd>Alt</kbd> + <kbd>A</kbd> Toggle assistant</li>
          <li><kbd>Alt</kbd> + <kbd>P</kbd> Process document</li>
        </ul>
        <button type="button" className="naskh-btn-primary mt-5 w-full" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

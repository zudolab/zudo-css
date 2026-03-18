import { useState, useEffect, useRef } from "react";
import { generateCode, type ExportColorState } from "@/utils/export-code";

interface ColorTweakExportModalProps {
  onClose: () => void;
  colorState: ExportColorState;
}

export default function ColorTweakExportModal({
  onClose,
  colorState,
}: ColorTweakExportModalProps) {
  const [copyLabel, setCopyLabel] = useState("Copy");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const code = generateCode(colorState);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleClose() {
      onClose();
    }
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  function handleBackdropClick(e: React.MouseEvent) {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      dialog.close();
    }
  }

  async function handleCopy() {
    let ok = false;
    // Clipboard API needs focus inside the dialog — use fallback
    // that appends a textarea inside the dialog (within the modal's focus trap)
    const dialog = dialogRef.current;
    if (dialog) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.cssText = "position:fixed;opacity:0;left:-9999px";
        dialog.appendChild(textarea);
        textarea.focus();
        textarea.select();
        ok = document.execCommand("copy");
        dialog.removeChild(textarea);
      } catch { /* ignore */ }
    }
    if (!ok) {
      // Last resort: try Clipboard API
      try {
        await navigator.clipboard.writeText(code);
        ok = true;
      } catch { /* ignore */ }
    }
    setCopyLabel(ok ? "Copied!" : "Failed");
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyLabel("Copy"), 2000);
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="mx-auto max-h-[80vh] w-full max-w-[40rem] overflow-y-auto border border-muted bg-surface p-hsp-xl backdrop:bg-bg/80"
      style={{ color: "var(--color-fg)", position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", userSelect: "text" }}
    >
      <h2 className="mb-vsp-sm text-subheading font-bold text-fg">
        Export Color Scheme
      </h2>

      <pre className="overflow-x-auto border border-muted bg-code-bg p-hsp-lg text-small text-code-fg">
        <code>{code}</code>
      </pre>

      <div className="mt-vsp-sm flex items-center gap-x-hsp-md">
        <button
          onClick={handleCopy}
          className="border border-muted bg-surface px-hsp-lg py-vsp-2xs text-small text-fg transition-colors hover:border-accent hover:text-accent"
        >
          {copyLabel}
        </button>
        <button
          onClick={() => dialogRef.current?.close()}
          className="border border-muted bg-surface px-hsp-lg py-vsp-2xs text-small text-muted transition-colors hover:border-fg hover:text-fg"
        >
          Close
        </button>
      </div>
    </dialog>
  );
}

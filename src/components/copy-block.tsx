"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyBlock({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <pre className="overflow-x-auto rounded-xl border border-border bg-card p-4 font-mono text-[12.5px] leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="absolute top-2 right-2"
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
        aria-label="Copy"
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}

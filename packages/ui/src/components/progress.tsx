"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@repo/ui/lib/utils";

interface ProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  softcaps?: Record<number, string>;
}

function Progress({ className, value = 0, softcaps, ...props }: ProgressProps) {
  const currentSoftcap = softcaps
    ? Object.entries(softcaps)
        .sort(([valueA], [valueB]) => Number(valueB) - Number(valueA))
        .find(([softcapValue]) => {
          return (value ?? 0) >= Number(softcapValue);
        })?.[1]
    : undefined;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full shadow-inner",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-[var(--indicator-color)] h-full w-full flex-1 transition-all"
        style={
          {
            "--indicator-color": softcaps ? currentSoftcap : "var(--primary)",
            transform: `translateX(-${100 - (value || 0)}%)`,
          } as React.CSSProperties
        }
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

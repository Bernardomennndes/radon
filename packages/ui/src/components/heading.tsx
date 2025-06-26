import { cva } from "class-variance-authority";
import React from "react";
import { cn } from "@repo/ui/lib/utils";

const headingVariants = cva("tracking-tight font-bold", {
  variants: {
    as: {
      h1: "text-2xl",
      h2: "text-xl",
      h3: "text-xl",
      h4: "text-lg",
      h5: "text-lg",
      h6: "text-lg",
    },
  },
});

interface HeadingProps
  extends React.ComponentProps<"h1" | "h2" | "h3" | "h4" | "h5" | "h6"> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function Heading(props: HeadingProps) {
  const { as: asProp = "h1", className, children, ref, ...headingProps } = props;

  const Component = asProp;

  return (
    <Component
      {...headingProps}
      className={cn(headingVariants({ className, as: asProp }))}
      ref={ref}
    >
      {children}
    </Component>
  );
}

export type { HeadingProps };

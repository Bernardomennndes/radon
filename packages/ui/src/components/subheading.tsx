import { cn } from "@repo/ui/lib/utils";

export function Subheading({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

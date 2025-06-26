"use client";

import { createUser } from "@/lib/api";
import { User } from "@/lib/types";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { cn } from "@repo/ui/lib/utils";
import React from "react";

export function LoginForm({
  className,
  onLogin,
  ...props
}: React.ComponentProps<"div"> & {
  onLogin?: (user: User) => void;
}) {
  const [username, setUsername] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      const user = await createUser(username.trim());

      onLogin?.(user);
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                {/* <GalleryVerticalEnd className="size-6" /> */}
              </div>
              <span className="sr-only">Acme Inc.</span>
            </a>
          </div>
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                type="username"
                placeholder="Nome de Usuário"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : "Login"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

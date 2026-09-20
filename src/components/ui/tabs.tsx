"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tabs as RadixTabs } from "radix-ui";

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof RadixTabs.List>) {
  return <RadixTabs.List className={cn("flex gap-1 border-b border-line", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "-mb-px min-h-11 cursor-pointer border-b-2 border-transparent px-4 text-body text-text-muted transition-colors duration-[var(--dur-fast)] hover:text-text data-[state=active]:border-accent data-[state=active]:text-text",
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = RadixTabs.Content;

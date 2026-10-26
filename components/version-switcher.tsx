"use client";
import { Globe } from "lucide-react";

export default function VersionSwitcher() {
  return (
    <div className="liquid-glass tint-sky flex items-center gap-2.5 rounded-full py-1.5 pl-3 pr-1.5 text-sm font-medium text-[rgb(var(--color-text-primary))]">
      <Globe className="h-5 w-5 text-sky-500" />
      <span>IPInfo</span>
      <span className="rounded-full bg-white/50 px-3 py-1 text-[rgb(var(--color-text-secondary))] shadow-[inset_0_1px_0_rgba(255,255,255,.8)] dark:bg-white/10">
        IPv4 &amp; IPv6 lookup
      </span>
    </div>
  );
}

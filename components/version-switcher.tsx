"use client";
import { Globe } from "lucide-react";
export default function VersionSwitcher() {
 return <div className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--color-text-secondary))]"><Globe className="h-5 w-5 text-blue-500"/><span>IPInfo</span><span className="rounded-full bg-blue-500/10 px-3 py-1">IPv4 &amp; IPv6 lookup</span></div>;
}

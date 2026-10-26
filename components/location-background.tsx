"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useIPQueryStore } from "@/lib/store";

interface BackgroundPhoto {
  image: string;
  source: string;
  place: string;
  artist: string;
  license: string;
  licenseURL: string | null;
}

export default function LocationBackground() {
  const data = useIPQueryStore(state => state.ipData);
  const [photo, setPhoto] = useState<BackgroundPhoto | null>(null);
  const [loaded, setLoaded] = useState(false);
  const country = data?.country;
  const city = data?.city;
  const region = data?.province;

  useEffect(() => {
    if (!country) return;
    const controller = new AbortController();
    setLoaded(false);
    setPhoto(null);
    const params = new URLSearchParams({ country, city: city || "", region: region || "" });
    fetch(`/api/location-background?${params}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : { background: null })
      .then(result => { if (!controller.signal.aborted) setPhoto(result.background); })
      .catch(() => { /* The page remains usable without a background photo. */ });
    return () => controller.abort();
  }, [country, city, region]);

  if (!photo) return null;
  return <>
    <div aria-hidden="true" className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 motion-reduce:transition-none ${loaded ? "opacity-100" : "opacity-0"}`}>
      <Image key={photo.image} src={photo.image} alt="" fill unoptimized sizes="100vw"
        className="object-cover object-center" onLoad={() => setLoaded(true)} onError={() => setPhoto(null)} />
      <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/15 to-white/55 dark:from-slate-950/35 dark:via-slate-950/25 dark:to-slate-950/70" />
    </div>
    {loaded && <div className="absolute bottom-4 left-0 right-0 z-20 mx-auto max-w-3xl px-4 text-center text-xs text-[rgb(var(--color-text-secondary))]">
      <span className="rounded-lg bg-[rgb(var(--color-surface))]/90 px-3 py-2 leading-6 box-decoration-clone">
        Background: {photo.place} · Photo by <a href={photo.source} target="_blank" rel="noreferrer" className="underline underline-offset-2">{photo.artist}</a>
        {" · "}{photo.licenseURL ? <a href={photo.licenseURL} target="_blank" rel="noreferrer" className="underline underline-offset-2">{photo.license}</a> : photo.license}
        {" · Cropped to fit"}
      </span>
    </div>}
  </>;
}

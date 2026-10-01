"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type LatLng = [number, number];

export function RouteMap({
  points,
  color,
  waterStations = [],
  loopSeconds = 35,
}: {
  points: LatLng[];
  color: string;
  waterStations?: LatLng[];
  loopSeconds?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const restartRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current || points.length < 2) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;
    let rafId: number;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        subdomains: "abc",
        maxZoom: 19,
        className: "route-map-tiles",
      }).addTo(map);

      const latLngs = points.map(([lat, lon]) => L.latLng(lat, lon));
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [24, 24] });

      L.polyline(latLngs, { color, weight: 5, opacity: 0.9, lineJoin: "round" }).addTo(map);

      const flagIcon = L.divIcon({
        className: "",
        html: `<div style="font-size:20px;line-height:1;">🏁</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 20],
      });
      L.marker(latLngs[0], { icon: flagIcon }).bindPopup("Start / Finish").addTo(map);

      for (const [lat, lon] of waterStations) {
        const dropIcon = L.divIcon({
          className: "",
          html: `<div style="font-size:28px;line-height:1;">💧</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 28],
        });
        L.marker(L.latLng(lat, lon), { icon: dropIcon }).bindPopup("Water Station").addTo(map);
      }

      const runnerIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 2px ${color}80;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const runner = L.marker(latLngs[0], { icon: runnerIcon }).addTo(map);

      // Precompute cumulative distance along the route for constant-speed movement.
      const cumulative: number[] = [0];
      for (let i = 1; i < latLngs.length; i++) {
        cumulative.push(cumulative[i - 1] + latLngs[i - 1].distanceTo(latLngs[i]));
      }
      const totalDist = cumulative[cumulative.length - 1];

      function positionAt(fraction: number): import("leaflet").LatLng {
        const target = fraction * totalDist;
        let i = 1;
        while (i < cumulative.length && cumulative[i] < target) i++;
        const segStart = cumulative[i - 1];
        const segEnd = cumulative[i] ?? segStart;
        const segFrac = segEnd > segStart ? (target - segStart) / (segEnd - segStart) : 0;
        const a = latLngs[i - 1];
        const b = latLngs[i] ?? a;
        return L.latLng(a.lat + (b.lat - a.lat) * segFrac, a.lng + (b.lng - a.lng) * segFrac);
      }

      const overviewDelayMs = 1800;
      let startTime = performance.now() + overviewDelayMs;

      restartRef.current = () => {
        if (!map) return;
        startTime = performance.now() + overviewDelayMs;
        runner.setLatLng(latLngs[0]);
        map.fitBounds(bounds, { padding: [24, 24] });
      };

      function tick(now: number) {
        if (cancelled || !map) return;
        const elapsed = Math.max(0, now - startTime);
        const fraction = (elapsed % (loopSeconds * 1000)) / (loopSeconds * 1000);
        const pos = positionAt(fraction);
        runner.setLatLng(pos);
        if (elapsed > 0) {
          if (map.getZoom() < 16) {
            map.setView(pos, 16.5, { animate: false });
          } else {
            map.panTo(pos, { animate: false });
          }
        }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      restartRef.current = null;
      map?.remove();
    };
  }, [points, color, waterStations, loopSeconds]);

  return (
    <>
      <div ref={containerRef} className="h-full w-full" />
      <button
        type="button"
        onClick={() => restartRef.current?.()}
        className="absolute bottom-3 right-3 z-[1000] rounded-full bg-navy/85 px-3 py-1.5 text-xs font-semibold text-cream backdrop-blur-sm transition hover:bg-navy"
      >
        ↻ Restart
      </button>
    </>
  );
}

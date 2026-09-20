import { DeviceDetails, LinkCapacityChart, LinkHeader, RateBar, SignalPanel } from "@noisefloor/dashboards";
import { galleryAnnotations, gallerySeed, galleryWorld } from "../lib/gallery-world";

export function DevGallery() {
  return (
    <main className="flex min-h-screen flex-col gap-8 p-8">
      <h1 className="text-xl font-semibold">Dashboard component gallery (dev only)</h1>
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-sm text-muted">crm/LinkCapacityChart</h2>
        <div className="max-w-2xl">
          <LinkCapacityChart world={galleryWorld} seed={gallerySeed} annotations={galleryAnnotations} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-sm text-muted">radio/LinkHeader</h2>
        <div className="max-w-2xl">
          <LinkHeader world={galleryWorld} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-sm text-muted">radio/SignalPanel</h2>
        <div className="max-w-2xl">
          <SignalPanel world={galleryWorld} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-sm text-muted">radio/RateBar</h2>
        <div className="max-w-2xl">
          <RateBar world={galleryWorld} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-sm text-muted">radio/DeviceDetails</h2>
        <div className="max-w-2xl">
          <DeviceDetails world={galleryWorld} side="local" />
        </div>
      </section>
    </main>
  );
}

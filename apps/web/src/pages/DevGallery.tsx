import { LinkCapacityChart } from "@noisefloor/dashboards";
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
    </main>
  );
}

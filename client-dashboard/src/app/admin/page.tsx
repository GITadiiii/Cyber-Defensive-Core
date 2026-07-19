import IncidentMapClient from "@/components/IncidentMapClient";
import PstiGauges from "@/components/PstiGauges";

export default function AdminCommandPanel() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Cyber-Cell Command Panel
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Live incident map and threat intelligence feed.
        </p>
      </header>

      <section className="mb-8">
        <PstiGauges />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-gray-900">
          Incident Map
        </h2>
        <div className="h-[500px] w-full">
          <IncidentMapClient />
        </div>
      </section>
    </main>
  );
}

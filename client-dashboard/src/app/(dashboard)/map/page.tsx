import IncidentMapClient from "@/components/IncidentMapClient";
import PstiGauges from "@/components/PstiGauges";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default function MapPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Incident Map</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live incident feed and threat intelligence overview.
        </p>
      </header>

      <section className="mb-8">
        <ErrorBoundary label="Dashboard Overview">
          <DashboardOverview />
        </ErrorBoundary>
      </section>

      <section className="mb-8">
        <ErrorBoundary label="PSTI Gauges">
          <PstiGauges />
        </ErrorBoundary>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">Live Map</h2>
        <div className="h-80 w-full md:h-125">
          <ErrorBoundary label="Incident Map">
            <IncidentMapClient />
          </ErrorBoundary>
        </div>
      </section>
    </div>
  );
}

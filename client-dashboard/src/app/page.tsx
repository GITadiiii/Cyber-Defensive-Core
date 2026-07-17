import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-gray-900">
          Digital Public Safety Intelligence Platform
        </h1>
        <p className="mt-2 text-gray-500">
          DeepTrust Guardian &amp; MuleHunter Core
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/citizen"
          className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Citizen Sandbox
        </Link>
        <Link
          href="/admin"
          className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100"
        >
          Cyber-Cell Command Panel
        </Link>
      </div>
    </main>
  );
}

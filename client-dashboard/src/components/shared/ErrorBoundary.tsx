"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
}

// Wrap any section that fetches/renders potentially unreliable data in this,
// e.g. <ErrorBoundary label="Incident Map"><IncidentMap /></ErrorBoundary>.
// A crash inside stays contained instead of taking down the whole page.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ""}]`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-red-500/30 bg-red-950/20 p-8 text-center">
          <AlertTriangle className="text-red-400" size={28} />
          <div>
            <p className="font-medium text-slate-200">
              {this.props.label ? `${this.props.label} hit a problem` : "Something went wrong"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              This section failed to render. The rest of the dashboard is unaffected.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-1 rounded-md bg-white/10 px-4 py-1.5 text-sm text-slate-200 hover:bg-white/20"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
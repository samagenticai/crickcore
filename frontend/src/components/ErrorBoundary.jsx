import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.06),transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#ffffff_100%)]">
          <div className="max-w-lg w-full rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
            <h1 className="text-lg font-bold text-secondary">
              {this.props.title || "Something went wrong"}
            </h1>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              {this.props.message ||
                "This page hit an unexpected error. You can go back and try again."}
            </p>
            {import.meta.env.DEV && error?.message && (
              <pre className="mt-4 text-left text-xs text-red-600 overflow-auto max-h-36 p-3 rounded-lg bg-red-50/50">
                {error.message}
              </pre>
            )}
            <Link
              to={this.props.backTo || "/viewer"}
              className="inline-flex items-center justify-center mt-6 px-4 py-2.5 rounded-xl text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
            >
              {this.props.backLabel || "Back to tournaments"}
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

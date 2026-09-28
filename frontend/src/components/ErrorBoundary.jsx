import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReload);
      }

      return (
        <div style={{
          padding: "2rem",
          margin: "1rem auto",
          maxWidth: "600px",
          background: "rgba(244, 63, 94, 0.1)",
          border: "1px solid rgba(244, 63, 94, 0.3)",
          borderRadius: "12px",
          color: "#fecdd3",
          textAlign: "center"
        }}>
          <AlertTriangle size={32} color="#f43f5e" style={{ margin: "0 auto 0.75rem" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "#fff" }}>
            {this.props.title || "Something went wrong rendering this component"}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#fda4af", marginBottom: "1rem" }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={this.handleReload}
            style={{ margin: "0 auto" }}
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

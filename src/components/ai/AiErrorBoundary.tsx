"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AiErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <button
          type="button"
          className="ai-fab fixed right-4 bottom-[calc(var(--mobile-nav-h)+1rem)] z-[60] rounded-full px-4 py-3 text-xs font-semibold xl:right-6 xl:bottom-24"
          onClick={() => this.setState({ hasError: false })}
        >
          Reload AI Assistant
        </button>
      );
    }
    return this.props.children;
  }
}

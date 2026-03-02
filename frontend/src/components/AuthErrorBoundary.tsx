'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[AuthErrorBoundary] Auth provider error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.warn('[AuthErrorBoundary] Rendering fallback UI due to auth error');
      return this.props.children;
    }

    return this.props.children;
  }
}

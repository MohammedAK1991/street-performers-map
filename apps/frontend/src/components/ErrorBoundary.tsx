import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children?: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false
	};

	public static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
		
		this.setState({
			error,
			errorInfo
		});

		// You can also log the error to an error reporting service here
		// logErrorToService(error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			// Render custom fallback UI if provided
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default fallback UI
			return (
				<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
					<div className="max-w-md w-full bg-gray-800 rounded-lg p-8 border border-red-500/50">
						<div className="text-center">
							<div className="text-4xl mb-4">🚨</div>
							<h1 className="text-2xl font-bold text-white mb-4">
								Oops! Something went wrong
							</h1>
							<p className="text-gray-300 mb-6">
								We encountered an unexpected error. Don't worry, our team has been notified.
							</p>
							
							{process.env.NODE_ENV === 'development' && this.state.error && (
								<details className="mb-6 text-left">
									<summary className="text-red-400 cursor-pointer mb-2">
										Error Details (Development)
									</summary>
									<div className="bg-gray-900 rounded p-4 text-sm text-gray-300 overflow-auto">
										<p className="text-red-400 font-semibold mb-2">
											{this.state.error.message}
										</p>
										<pre className="whitespace-pre-wrap text-xs">
											{this.state.error.stack}
										</pre>
									</div>
								</details>
							)}

							<div className="space-y-3">
								<button
									onClick={() => window.location.reload()}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
								>
									Try Again
								</button>
								<button
									onClick={() => window.location.href = '/'}
									className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
								>
									Go Home
								</button>
							</div>

							<p className="text-xs text-gray-400 mt-6">
								Error ID: {Date.now().toString(36)} • 
								Time: {new Date().toLocaleString()}
							</p>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

// Hook version for functional components
import { useState, useEffect } from "react";

interface ErrorBoundaryHookState {
	hasError: boolean;
	error: Error | null;
}

export function useErrorBoundary() {
	const [state, setState] = useState<ErrorBoundaryHookState>({
		hasError: false,
		error: null
	});

	const resetError = () => {
		setState({ hasError: false, error: null });
	};

	const captureError = (error: Error) => {
		setState({ hasError: true, error });
	};

	useEffect(() => {
		const handleError = (event: ErrorEvent) => {
			captureError(new Error(event.message));
		};

		const handleRejection = (event: PromiseRejectionEvent) => {
			captureError(new Error(event.reason));
		};

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleRejection);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleRejection);
		};
	}, []);

	return {
		hasError: state.hasError,
		error: state.error,
		resetError,
		captureError
	};
}

// Component-specific error boundary
interface FeatureErrorBoundaryProps {
	children: ReactNode;
	featureName: string;
}

export function FeatureErrorBoundary({ children, featureName }: FeatureErrorBoundaryProps) {
	return (
		<ErrorBoundary
			fallback={
				<div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 m-4">
					<div className="flex items-center space-x-3 mb-3">
						<span className="text-red-400 text-xl">⚠️</span>
						<h3 className="text-red-400 font-semibold">
							{featureName} Error
						</h3>
					</div>
					<p className="text-gray-300 text-sm mb-4">
						This feature is temporarily unavailable. Please try refreshing the page.
					</p>
					<button
						onClick={() => window.location.reload()}
						className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
					>
						Refresh Page
					</button>
				</div>
			}
		>
			{children}
		</ErrorBoundary>
	);
}
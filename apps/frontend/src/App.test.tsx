import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

// Mock Clerk components
vi.mock('@clerk/clerk-react', () => ({
	SignedIn: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-in">{children}</div>,
	useClerkSync: () => null,
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
	Route: ({ children }: { children: React.ReactNode }) => <div data-testid="route">{children}</div>,
	Routes: ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>,
}));

// Mock pages
vi.mock('./pages/Home', () => ({
	Home: () => <div data-testid="home-page">Home Page</div>,
}));

vi.mock('./pages/Map', () => ({
	Map: () => <div data-testid="map-page">Map Page</div>,
}));

vi.mock('./pages/Profile', () => ({
	Profile: () => <div data-testid="profile-page">Profile Page</div>,
}));

vi.mock('./pages/CreatePerformance', () => ({
	CreatePerformance: () => <div data-testid="create-performance-page">Create Performance Page</div>,
}));

vi.mock('./components/onboarding/OnboardingWizard', () => ({
	OnboardingWizard: () => <div data-testid="onboarding-wizard">Onboarding Wizard</div>,
}));

describe('App', () => {
	it('should render without crashing', () => {
		render(<App />);
		expect(screen.getByTestId('signed-in')).toBeInTheDocument();
	});
});

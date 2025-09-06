import { Routes, Route } from 'react-router-dom';
import { SignedIn } from '@clerk/clerk-react';
import { Home } from './pages/Home';
import { Map } from './pages/Map';
import { CreatePerformance } from './pages/CreatePerformance';
import { useClerkSync } from './hooks/useClerkSync';

export function App() {
  // Sync Clerk user with our database
  useClerkSync();

  return (
    <div className="min-h-screen bg-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/map" 
          element={
            <SignedIn>
              <Map />
            </SignedIn>
          } 
        />
        <Route 
          path="/create-performance" 
          element={
            <SignedIn>
              <CreatePerformance />
            </SignedIn>
          } 
        />
      </Routes>
    </div>
  );
}
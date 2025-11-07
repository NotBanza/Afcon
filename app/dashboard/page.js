// app/dashboard/page.js
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Import BOTH components we need for the dashboard
import CreateTeamForm from '@/components/CreateTeamForm';
import AdminTournamentManager from '@/components/AdminTournamentManager';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return null; 
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}!</p>
      <p>Your role is: {user.role}</p>
      
      {/* Representative's View */}
      {user.role === 'representative' && (
        <div>
          <CreateTeamForm />
        </div>
      )}

      {/* Administrator's View */}
      {user.role === 'administrator' && (
        <div>
          <AdminTournamentManager />
        </div>
      )}

      <button onClick={logout} style={{ marginTop: '20px' }}>Logout</button>
    </div>
  );
}
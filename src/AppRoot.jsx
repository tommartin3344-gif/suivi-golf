import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import SuiviTournois from './App';

export default function AppRoot() {
  const [session, setSession] = useState(undefined); // undefined = chargement, null = pas connecté

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#0d2340] flex items-center justify-center">
        <p className="text-white/60 text-sm">Chargement...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <SuiviTournois key={session.user.id} />;
}

import React, { useState } from 'react';
import { Loader2, Flag } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [mode, setMode] = useState('connexion'); // 'connexion' | 'inscription'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (mode === 'inscription') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(traduireErreur(err.message));
    } finally {
      setLoading(false);
    }
  }

  function traduireErreur(msg) {
    if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
    if (msg.includes('User already registered')) return 'Un compte existe déjà avec cet email.';
    if (msg.includes('Password should be at least')) return 'Le mot de passe doit faire au moins 6 caractères.';
    if (msg.includes('Email not confirmed')) return "Confirme d'abord ton email (regarde ta boîte mail).";
    return msg;
  }

  return (
    <div className="min-h-screen bg-[#0d2340] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#d9622b] rounded-xl mb-3">
            <Flag className="text-white" size={22} />
          </div>
          <h1 className="text-white text-xl font-black">Suivi Tournois Golf</h1>
          <p className="text-white/50 text-sm mt-1">
            {mode === 'connexion' ? 'Connecte-toi à ton compte' : 'Crée ton compte'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">Email</label>
            <input
              type="email"
              required
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0d2340]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {message && <p className="text-xs text-emerald-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0d2340] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#0d2340]/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {mode === 'connexion' ? 'Se connecter' : "S'inscrire"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'connexion' ? 'inscription' : 'connexion');
              setError('');
              setMessage('');
            }}
            className="w-full text-xs text-stone-500 hover:text-[#0d2340] pt-1"
          >
            {mode === 'connexion' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

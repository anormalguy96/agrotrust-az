import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

        if (error) {
          console.error('Auth callback error:', error);
          setStatus('Verification failed. The link may be expired or already used.');
          return;
        }

        if (data?.session) {
          // Session established — redirect to final page
          navigate('/welcome', { replace: true });
        } else {
          setStatus('No session created automatically. Please enter your verification code if you have one.');
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        setStatus('Unexpected error. Check console for details.');
      }
    })();
  }, [navigate]);

  return (
    <div style={{ padding: '2rem', maxWidth: 720, margin: '2rem auto' }}>
      <h1>Signing you in…</h1>
      <p>{status}</p>
    </div>
  );
}

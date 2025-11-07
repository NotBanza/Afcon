// app/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: null, message: '' });
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to log in. Check your email and password.' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setFeedback({ type: null, message: '' });

    if (!email) {
      setFeedback({ type: 'error', message: 'Enter your email first so we can send reset instructions.' });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setFeedback({ type: 'success', message: 'Password reset email sent. Check your inbox.' });
    } catch (error) {
      setFeedback({ type: 'error', message: 'Could not send reset email. Confirm the address and try again.' });
      console.error(error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ position: 'relative' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: { xs: '10% auto auto -20%', md: '6% auto auto -15%' },
          width: { xs: '60vmax', md: '45vmax' },
          height: { xs: '60vmax', md: '45vmax' },
          background: 'radial-gradient(circle at 30% 30%, rgba(14,143,72,0.35), transparent 60%)',
          filter: 'blur(0px)',
          zIndex: -1,
        }}
      />
      <Paper
        elevation={12}
        sx={{
          p: { xs: 3.5, md: 5 },
          mt: { xs: 8, md: 12 },
          borderRadius: 4,
          background: 'linear-gradient(140deg, rgba(5,18,26,0.92), rgba(14,143,72,0.18))',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Stack spacing={2.5}>
          <div>
            <Typography variant="overline" sx={{ letterSpacing: '0.25em', color: 'rgba(249,246,238,0.6)' }}>
              Welcome back
            </Typography>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
              Sign in to continue
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(249,246,238,0.7)' }}>
              Manage fixtures, squads, and analytics for the African Nations League 2026 season.
            </Typography>
          </div>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={3}>
              <TextField
                label="Email address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                fullWidth
                InputLabelProps={{ style: { color: 'rgba(249,246,238,0.7)' } }}
                InputProps={{
                  style: {
                    color: '#F9F6EE',
                    backgroundColor: 'rgba(10,30,38,0.6)',
                    borderRadius: 14,
                  },
                }}
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                fullWidth
                InputLabelProps={{ style: { color: 'rgba(249,246,238,0.7)' } }}
                InputProps={{
                  style: {
                    color: '#F9F6EE',
                    backgroundColor: 'rgba(10,30,38,0.6)',
                    borderRadius: 14,
                  },
                }}
              />

              {feedback.type && (
                <Alert severity={feedback.type} variant="filled">
                  {feedback.message}
                </Alert>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  sx={{ px: 5 }}
                >
                  {loading ? 'Logging in…' : 'Login'}
                </Button>
                <Button variant="text" color="secondary" onClick={handleForgotPassword} disabled={loading}>
                  Forgot password?
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Divider sx={{ borderColor: 'rgba(108,122,137,0.4)' }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
            <Typography variant="body2" sx={{ color: 'rgba(249,246,238,0.7)' }}>
              New federation onboarding with us?
            </Typography>
            <Link href="/signup" passHref legacyBehavior>
              <Button component="a" variant="outlined" color="inherit">
                Create an account
              </Button>
            </Link>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
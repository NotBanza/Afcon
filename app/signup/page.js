'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', federation: '' });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: '' });

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: null, message: '' });

    if (form.password.trim().length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          federation: form.federation.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Registration failed. Please try again.');
      }

      setFeedback({ type: 'success', message: 'Account created! Redirecting to login…' });
      router.push('/login');
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ position: 'relative' }}>
      <Paper
        elevation={10}
        sx={{
          p: { xs: 3, md: 5 },
          mt: { xs: 6, md: 10 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(30,64,175,0.9), rgba(13,148,136,0.8))',
          color: '#f8fafc',
          overflow: 'hidden',
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Register Your Federation
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
          Create an account to submit your 23-player squad and compete in the African Nations League 2026.
        </Typography>

        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            <TextField
              label="Federation Name"
              value={form.federation}
              onChange={updateField('federation')}
              required
              fullWidth
              variant="outlined"
              InputLabelProps={{ style: { color: '#e2e8f0' } }}
              InputProps={{ style: { color: '#f8fafc', backgroundColor: 'rgba(15,23,42,0.35)' } }}
            />
            <TextField
              label="Email Address"
              type="email"
              value={form.email}
              onChange={updateField('email')}
              required
              fullWidth
              variant="outlined"
              InputLabelProps={{ style: { color: '#e2e8f0' } }}
              InputProps={{ style: { color: '#f8fafc', backgroundColor: 'rgba(15,23,42,0.35)' } }}
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={updateField('password')}
              required
              fullWidth
              helperText="Minimum 6 characters. Strong passwords recommended."
              FormHelperTextProps={{ style: { color: 'rgba(226,232,240,0.7)' } }}
              InputLabelProps={{ style: { color: '#e2e8f0' } }}
              InputProps={{ style: { color: '#f8fafc', backgroundColor: 'rgba(15,23,42,0.35)' } }}
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              required
              fullWidth
              InputLabelProps={{ style: { color: '#e2e8f0' } }}
              InputProps={{ style: { color: '#f8fafc', backgroundColor: 'rgba(15,23,42,0.35)' } }}
            />

            {feedback.type && (
              <Alert severity={feedback.type} variant="filled">
                {feedback.message}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="secondary"
              size="large"
              disabled={loading}
              sx={{ py: 1.5, fontSize: '1.05rem' }}
            >
              {loading ? 'Registering…' : 'Create Account'}
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 4, borderColor: 'rgba(148,163,184,0.35)' }}>
          <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.75)' }}>
            Already registered?
          </Typography>
        </Divider>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.75)' }}>
            Sign in to manage squads and monitor fixtures.
          </Typography>
          <Link href="/login" passHref legacyBehavior>
            <Button component="a" variant="outlined" color="inherit">
              Go to Login
            </Button>
          </Link>
        </Stack>
      </Paper>
    </Container>
  );
}
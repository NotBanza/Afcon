// components/MuiRoot.js
'use client';

import { AuthProvider } from '@/context/AuthContext';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0E8F48',
      contrastText: '#F9F6EE',
    },
    secondary: {
      main: '#F6C94C',
      contrastText: '#05121A',
    },
    error: {
      main: '#D03C34',
    },
    background: {
      default: '#05121A',
      paper: '#0A1E26',
    },
    text: {
      primary: '#F9F6EE',
      secondary: 'rgba(249, 246, 238, 0.72)',
    },
    divider: 'rgba(108, 122, 137, 0.4)',
  },
  typography: {
    fontFamily: `'Inter', 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`,
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.015em' },
    h3: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.02em' },
    subtitle1: { color: 'rgba(249, 246, 238, 0.72)' },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(145deg, rgba(14, 143, 72, 0.06), rgba(5, 18, 26, 0.9))',
          border: '1px solid rgba(108, 122, 137, 0.4)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 9999,
          paddingTop: '10px',
          paddingBottom: '10px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: '1px solid rgba(108, 122, 137, 0.35)',
          backgroundImage: 'linear-gradient(160deg, rgba(14, 143, 72, 0.07), rgba(5, 18, 26, 0.92))',
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default function MuiRoot({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}

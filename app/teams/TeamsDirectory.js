'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const ratingColumns = [
  { key: 'GK', label: 'GK Rating' },
  { key: 'DF', label: 'DF Rating' },
  { key: 'MD', label: 'MD Rating' },
  { key: 'AT', label: 'AT Rating' },
];

function highlightStyles(position, naturalPosition) {
  if (position !== naturalPosition) {
    return {};
  }

  return {
    fontWeight: 700,
    backgroundColor: 'rgba(14, 143, 72, 0.15)',
  };
}

function getTeamDisplayName(team) {
  return team.federationName || team.countryName || team.name || 'Unnamed Federation';
}

function renderFlag(team) {
  const label = getTeamDisplayName(team);
  const flag = team.flag;
  const alt = team.flagAlt || `${label} flag`;

  if (typeof flag === 'string' && flag.startsWith('http')) {
    return (
      <Box
        component="img"
        src={flag}
        alt={alt}
        sx={{
          width: 46,
          height: 32,
          objectFit: 'cover',
          borderRadius: 1,
          border: '1px solid rgba(249,246,238,0.18)',
          boxShadow: '0 0 12px rgba(5,18,26,0.45)',
        }}
        loading="lazy"
      />
    );
  }

  if (typeof flag === 'string' && flag.trim().length > 0 && flag.trim().length <= 4) {
    return (
      <Box
        component="span"
        aria-label={alt}
        sx={{ fontSize: '2rem', lineHeight: 1 }}
      >
        {flag}
      </Box>
    );
  }

  const initials = label
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Box
      sx={{
        width: 46,
        height: 46,
        borderRadius: '50%',
        background: 'linear-gradient(140deg, rgba(15,23,42,0.85), rgba(14,143,72,0.4))',
        border: '1px solid rgba(108,122,137,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        letterSpacing: '0.05em',
        color: '#F9F6EE',
      }}
    >
      {initials || 'ANL'}
    </Box>
  );
}

export default function TeamsDirectory({ teams }) {
  const hasTeams = Array.isArray(teams) && teams.length > 0;
  const teamList = hasTeams ? teams : [];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack spacing={3} sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ letterSpacing: '0.25em', color: 'rgba(249,246,238,0.6)' }}>
          Official Federations
        </Typography>
        <Typography variant="h2" component="h1" sx={{ fontWeight: 700 }}>
          Teams & Squads
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(249,246,238,0.72)' }}>
          Explore every registered federation, review their squad depth, and study player ratings by position before kick-off.
        </Typography>
      </Stack>

      {!hasTeams && (
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="body1" sx={{ color: 'rgba(249,246,238,0.72)' }}>
            Teams will appear here once federations complete their registrations.
          </Typography>
        </Paper>
      )}

      <Stack spacing={2.5}>
        {teamList.map((team) => {
          const overallValue = team.overallRating ?? team.averageRating ?? null;
          const overallDisplay = Number.isFinite(overallValue) ? overallValue.toFixed(2) : 'N/A';
          const displayName = getTeamDisplayName(team);

          return (
            <Accordion key={team.id} disableGutters sx={{ background: 'rgba(5,18,26,0.85)', borderRadius: 3, border: '1px solid rgba(108,122,137,0.35)' }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(249,246,238,0.8)' }} />}
                sx={{ px: { xs: 2, md: 3 } }}
              >
                <Stack direction="row" spacing={2.5} alignItems="center">
                  {renderFlag(team)}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {displayName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(249,246,238,0.65)' }}>
                      Overall rating: <strong>{overallDisplay}</strong>
                    </Typography>
                  </Box>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 0, md: 1 }, pb: 3 }}>
                <TableContainer component={Box} sx={{ borderRadius: 2, border: '1px solid rgba(108,122,137,0.25)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'rgba(249,246,238,0.72)', fontWeight: 600 }}>Player Name</TableCell>
                        <TableCell sx={{ color: 'rgba(249,246,238,0.72)', fontWeight: 600 }}>Natural Position</TableCell>
                        {ratingColumns.map((column) => (
                          <TableCell key={column.key} sx={{ color: 'rgba(249,246,238,0.72)', fontWeight: 600 }}>
                            {column.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {team.players.map((player) => {
                        const ratings = player.ratings || {};

                        return (
                          <TableRow key={player.id} hover sx={{ '&:last-of-type td, &:last-of-type th': { border: 0 } }}>
                            <TableCell sx={{ color: '#F9F6EE' }}>{player.name || 'Unnamed Player'}</TableCell>
                            <TableCell sx={{ color: 'rgba(249,246,238,0.7)' }}>{player.naturalPosition || 'N/A'}</TableCell>
                            {ratingColumns.map((column) => (
                              <TableCell
                                key={column.key}
                                sx={{
                                  color: 'rgba(249,246,238,0.85)',
                                  fontVariantNumeric: 'tabular-nums',
                                  ...highlightStyles(column.key, player.naturalPosition),
                                }}
                              >
                                {typeof ratings[column.key] === 'number' ? ratings[column.key].toFixed(1) : '—'}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Container>
  );
}

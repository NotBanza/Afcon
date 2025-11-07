// components/CreateTeamForm.js
'use client';

import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { autoGenerateSquad } from '@/lib/playerUtils';
import PlayerTable from '@/components/PlayerTable';

const DEFAULT_DISTRIBUTION = [
  { count: 3, position: 'GK' },
  { count: 7, position: 'DF' },
  { count: 8, position: 'MD' },
  { count: 5, position: 'AT' },
];

const AFRICAN_COUNTRIES = [
  'Algeria',
  'Angola',
  'Benin',
  'Botswana',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cameroon',
  'Central African Republic',
  'Chad',
  'Comoros',
  'Democratic Republic of the Congo',
  'Djibouti',
  'Egypt',
  'Equatorial Guinea',
  'Eritrea',
  'Eswatini',
  'Ethiopia',
  'Gabon',
  'Gambia',
  'Ghana',
  'Guinea',
  'Guinea-Bissau',
  "Cote d'Ivoire",
  'Kenya',
  'Lesotho',
  'Liberia',
  'Libya',
  'Madagascar',
  'Malawi',
  'Mali',
  'Mauritania',
  'Mauritius',
  'Morocco',
  'Mozambique',
  'Namibia',
  'Niger',
  'Nigeria',
  'Republic of the Congo',
  'Rwanda',
  'Sao Tome and Principe',
  'Senegal',
  'Seychelles',
  'Sierra Leone',
  'Somalia',
  'South Africa',
  'South Sudan',
  'Sudan',
  'Tanzania',
  'Togo',
  'Tunisia',
  'Uganda',
  'Zambia',
  'Zimbabwe',
];

const createBlankSquad = () => {
  const rows = [];
  let idx = 0;
  DEFAULT_DISTRIBUTION.forEach(({ count, position }) => {
    for (let i = 0; i < count; i += 1) {
      rows.push({ id: idx, name: '', naturalPosition: position, isCaptain: idx === 0 });
      idx += 1;
    }
  });
  return rows;
};

export default function CreateTeamForm() {
  const { user } = useAuth();
  const [country, setCountry] = useState('');
  const [managerName, setManagerName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactEmailTouched, setContactEmailTouched] = useState(false);
  const [players, setPlayers] = useState(() => createBlankSquad());
  const [captainIndex, setCaptainIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [averageRating, setAverageRating] = useState(null);

  useEffect(() => {
    if (user?.email && !contactEmailTouched && !contactEmail) {
      setContactEmail(user.email);
    }
  }, [user, contactEmail, contactEmailTouched]);

  const initialSquadTemplate = createBlankSquad();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setAverageRating(null);

    if (!user) {
      setError('You must be logged in to register a team.');
      return;
    }

    if (!country.trim()) {
      setError('Country is required.');
      return;
    }

    if (!managerName.trim()) {
      setError('Manager name is required.');
      return;
    }

    const cleanedPlayers = players.map((player, index) => ({
      ...player,
      name: player.name.trim(),
      isCaptain: index === captainIndex,
    }));

    if (cleanedPlayers.some((player) => !player.name)) {
      setError('Every player must have a name.');
      return;
    }

    const trimmedContactEmail = contactEmail.trim();
    if (!trimmedContactEmail) {
      setError('Federation contact email is required.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedContactEmail)) {
      setError('Federation contact email must be a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('You are no longer authenticated. Please sign in again.');
      }

      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          country: country.trim(),
          managerName: managerName.trim(),
          contactEmail: trimmedContactEmail,
          players: cleanedPlayers,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server rejected the team submission.');
      }

      const payload = await res.json();
      setInfo('Team submitted successfully.');
      if (payload?.averageRating) {
        setAverageRating(payload.averageRating);
      }
      setCountry('');
      setManagerName('');
      setContactEmail('');
      setContactEmailTouched(false);
      setPlayers(initialSquadTemplate);
      setCaptainIndex(0);
    } catch (err) {
      console.error('Failed to create team', err);
      setError(err.message || 'Could not submit team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    const generated = autoGenerateSquad().map((player, index) => ({
      ...player,
      id: index,
      isCaptain: index === 0,
    }));
    setPlayers(generated);
    setCaptainIndex(0);
  };

  const handlePlayerFieldChange = (index, field, value) => {
    setPlayers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleCaptainChange = (index) => {
    setCaptainIndex(index);
    setPlayers((prev) =>
      prev.map((player, idx) => ({
        ...player,
        isCaptain: idx === index,
      }))
    );
  };

  return (
    <div>
      <h2>Register Your Team</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="team-country">Country</label>
          <select
            id="team-country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            required
          >
            <option value="" disabled>
              Select a country
            </option>
            {AFRICAN_COUNTRIES.map((nation) => (
              <option key={nation} value={nation}>
                {nation}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="team-manager">Manager Name</label>
          <input
            id="team-manager"
            type="text"
            value={managerName}
            onChange={(event) => setManagerName(event.target.value)}
            required
          />
        </div>
        <TextField
          id="team-contact"
          type="email"
          label="Federation Contact Email"
          value={contactEmail}
          onChange={(event) => {
            setContactEmail(event.target.value);
            setContactEmailTouched(true);
          }}
          placeholder={user?.email || ''}
          required
          fullWidth
          margin="normal"
        />
        <div style={{ margin: '10px 0' }}>
          <button type="button" onClick={handleAutoFill} disabled={loading}>
            Auto-fill squad
          </button>
        </div>
        <PlayerTable
          players={players}
          captainIndex={captainIndex}
          onFieldChange={handlePlayerFieldChange}
          onCaptainChange={handleCaptainChange}
          disabled={loading}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {info && <p style={{ color: 'green' }}>{info}</p>}
        {averageRating !== null && (
          <p style={{ color: '#1a237e' }}>Squad rating: {averageRating}</p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Team'}
        </button>
      </form>
    </div>
  );
}

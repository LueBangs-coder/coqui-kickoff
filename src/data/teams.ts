export interface Team {
  id: string
  name: string
  city: string
  abbreviation: string
  primary: string
  secondary: string
}

// 1997 franchises. Cleveland was inactive; Tennessee was still the Oilers.
// Historical names are used only for the selectable 1997 season.
// All 30 teams are selectable, including the Giants. Packers stays first/default.
export const GIANTS: Team = { id: 'giants', name: 'Giants', city: 'New York', abbreviation: 'NYG', primary: '#17459c', secondary: '#d33142' }

export const TEAMS: Team[] = [
  { id: 'packers', name: 'Packers', city: 'Green Bay', abbreviation: 'GB', primary: '#203b2d', secondary: '#ffbd28' },
  { id: 'cardinals', name: 'Cardinals', city: 'Arizona', abbreviation: 'ARI', primary: '#97233f', secondary: '#ffffff' },
  { id: 'falcons', name: 'Falcons', city: 'Atlanta', abbreviation: 'ATL', primary: '#141820', secondary: '#a71930' },
  { id: 'ravens', name: 'Ravens', city: 'Baltimore', abbreviation: 'BAL', primary: '#39216c', secondary: '#d4aa00' },
  { id: 'bills', name: 'Bills', city: 'Buffalo', abbreviation: 'BUF', primary: '#17469d', secondary: '#d62938' },
  { id: 'panthers', name: 'Panthers', city: 'Carolina', abbreviation: 'CAR', primary: '#0086ca', secondary: '#161b22' },
  { id: 'bears', name: 'Bears', city: 'Chicago', abbreviation: 'CHI', primary: '#182b49', secondary: '#dd4924' },
  { id: 'bengals', name: 'Bengals', city: 'Cincinnati', abbreviation: 'CIN', primary: '#ef5b25', secondary: '#171b24' },
  { id: 'cowboys', name: 'Cowboys', city: 'Dallas', abbreviation: 'DAL', primary: '#203a68', secondary: '#aab4c5' },
  { id: 'broncos', name: 'Broncos', city: 'Denver', abbreviation: 'DEN', primary: '#173454', secondary: '#f26722' },
  { id: 'lions', name: 'Lions', city: 'Detroit', abbreviation: 'DET', primary: '#087fbc', secondary: '#b3bec4' },
  { id: 'colts', name: 'Colts', city: 'Indianapolis', abbreviation: 'IND', primary: '#174f91', secondary: '#ffffff' },
  { id: 'jaguars', name: 'Jaguars', city: 'Jacksonville', abbreviation: 'JAX', primary: '#007e85', secondary: '#c39c60' },
  { id: 'chiefs', name: 'Chiefs', city: 'Kansas City', abbreviation: 'KC', primary: '#cc1c36', secondary: '#ffbd30' },
  { id: 'dolphins', name: 'Dolphins', city: 'Miami', abbreviation: 'MIA', primary: '#008b95', secondary: '#f17c32' },
  { id: 'vikings', name: 'Vikings', city: 'Minnesota', abbreviation: 'MIN', primary: '#542a83', secondary: '#ffc52f' },
  { id: 'patriots', name: 'Patriots', city: 'New England', abbreviation: 'NE', primary: '#175394', secondary: '#d3283c' },
  { id: 'saints', name: 'Saints', city: 'New Orleans', abbreviation: 'NO', primary: '#26272b', secondary: '#d8bd84' },
  GIANTS,
  { id: 'jets', name: 'Jets', city: 'New York', abbreviation: 'NYJ', primary: '#1d774c', secondary: '#ffffff' },
  { id: 'raiders', name: 'Raiders', city: 'Oakland', abbreviation: 'OAK', primary: '#20252b', secondary: '#b2bec6' },
  { id: 'eagles', name: 'Eagles', city: 'Philadelphia', abbreviation: 'PHI', primary: '#075e60', secondary: '#adb7bb' },
  { id: 'steelers', name: 'Steelers', city: 'Pittsburgh', abbreviation: 'PIT', primary: '#242830', secondary: '#ffca28' },
  { id: 'chargers', name: 'Chargers', city: 'San Diego', abbreviation: 'SD', primary: '#203856', secondary: '#e7af27' },
  { id: '49ers', name: '49ers', city: 'San Francisco', abbreviation: 'SF', primary: '#a71930', secondary: '#c7a169' },
  { id: 'seahawks', name: 'Seahawks', city: 'Seattle', abbreviation: 'SEA', primary: '#1c5298', secondary: '#21a06a' },
  { id: 'rams', name: 'Rams', city: 'St. Louis', abbreviation: 'STL', primary: '#24569d', secondary: '#ffcb36' },
  { id: 'buccaneers', name: 'Buccaneers', city: 'Tampa Bay', abbreviation: 'TB', primary: '#b72635', secondary: '#8c8977' },
  { id: 'oilers', name: 'Oilers', city: 'Tennessee', abbreviation: 'TEN', primary: '#4697d0', secondary: '#e3384a' },
  { id: 'washington', name: '· 1997', city: 'Washington', abbreviation: 'WAS', primary: '#80313b', secondary: '#ffc535' },
]

export function getOpponent(playerTeam: Team, preferredId?: string): Team {
  const preferred = TEAMS.find(team => team.id === preferredId && team.id !== playerTeam.id)
  if (preferred) return preferred
  if (playerTeam.id !== GIANTS.id) return GIANTS
  return TEAMS.find(team => team.id === 'cowboys')!
}

export function spokenTeamName(team: Team): string {
  if (team.id === 'washington') return 'Washington team'
  if (team.id === '49ers') return 'San Francisco Forty Niners'
  if (team.id === 'rams') return 'Saint Louis Rams'
  return `${team.city} ${team.name}`
}

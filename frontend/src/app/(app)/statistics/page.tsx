'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Trophy, Users, TrendingUp, Search, Loader2, 
  BarChart3, Target, Activity, Home, Award
} from 'lucide-react';
import { StaggerContainer, StaggerItem, GradientText } from '@/components/animations';
import { POSITION_LABELS, POSITION_COLORS } from '@/lib/types';
import Image from 'next/image';

const API_BASE = '/api/fpl';
const api = axios.create({ timeout: 60000 });

const safeNumber = (val: unknown, defaultVal = 0): number => {
  if (val === null || val === undefined) return defaultVal;
  const num = Number(val);
  return isNaN(num) ? defaultVal : num;
};

const safeFloat = (val: unknown, decimals = 1): string => {
  return safeNumber(val).toFixed(decimals);
};

interface Team {
  id: number;
  name: string;
  short_name: string;
  strength: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
  strength_overall_home: number;
  strength_overall_away: number;
}

interface Player {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  element_type: number;
  team: number;
  now_cost: number;
  price?: number;
  total_points: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  bonus: number;
  bps: number;
  form: number | string;
  points_per_game: number;
  expected_goals: number;
  expected_assists: number;
  expected_goal_involvement: number;
  threat: number;
  creativity: number;
  influence: number;
  ICT_index: number;
  status: string;
}

interface Fixture {
  id: number;
  event: number;
  team_a: number;
  team_h: number;
  team_a_difficulty: number;
  team_h_difficulty: number;
  score_h: number | null;
  score_a: number | null;
  finished: boolean;
}

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<number | null>(null);
  const [currentGw, setCurrentGw] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bootstrapRes, fixturesRes, gwRes] = await Promise.all([
        api.get(`${API_BASE}/bootstrap`),
        api.get(`${API_BASE}/fixtures`),
        api.get(`${API_BASE}/current-gw`),
      ]);

      setTeams(bootstrapRes.data.teams || []);
      setPlayers(bootstrapRes.data.players || []);
      setFixtures(fixturesRes.data.fixtures || []);
      setCurrentGw(gwRes.data.current || 1);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const teamMap = new Map(teams.map(t => [t.id, t]));
  const teamNameMap = new Map(teams.map(t => [t.id, t.name]));
  const teamShortNameMap = new Map(teams.map(t => [t.id, t.short_name]));

  const getTeamName = (id: number) => teamNameMap.get(id) || 'Unknown';
  const getTeamShortName = (id: number) => teamShortNameMap.get(id) || 'UNK';

  const formatPrice = (price: number | undefined) => {
    const p = safeNumber(price);
    if (p === 0) return '£0.0m';
    return `£${(p / 10).toFixed(1)}m`;
  };

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.web_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === null || p.element_type === positionFilter;
    return matchesSearch && matchesPosition;
  });

  const topScorers = [...players].sort((a, b) => safeNumber(b.goals_scored) - safeNumber(a.goals_scored)).slice(0, 20);
  const topAssists = [...players].sort((a, b) => safeNumber(b.assists) - safeNumber(a.assists)).slice(0, 20);
  const topForm = [...players].sort((a, b) => safeNumber(b.form) - safeNumber(a.form)).slice(0, 20);
  const topICT = [...players].sort((a, b) => safeNumber(b.ICT_index) - safeNumber(a.ICT_index)).slice(0, 20);

  const getLeagueTable = () => {
    const table: Record<number, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number }> = {};
    
    teams.forEach(t => {
      table[t.id] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
    });

    fixtures.filter(f => f.finished && f.score_h !== null && f.score_a !== null).forEach(f => {
      const home = table[f.team_h];
      const away = table[f.team_a];
      if (!home || !away) return;
      
      const homeGoals = f.score_h!;
      const awayGoals = f.score_a!;

      home.played++;
      away.played++;
      home.gf += homeGoals;
      home.ga += awayGoals;
      away.gf += awayGoals;
      away.ga += homeGoals;

      if (homeGoals > awayGoals) {
        home.won++;
        away.lost++;
        home.points += 3;
      } else if (homeGoals < awayGoals) {
        away.won++;
        home.lost++;
        away.points += 3;
      } else {
        home.drawn++;
        away.drawn++;
        home.points += 1;
      }
    });

    return teams.map(t => ({
      ...t,
      ...table[t.id],
      gd: (table[t.id]?.gf || 0) - (table[t.id]?.ga || 0)
    })).sort((a, b) => b.points - a.points || b.gd - a.gd);
  };

  const leagueTable = getLeagueTable();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <StaggerContainer staggerDelay={0.1} className="space-y-6 pb-10">
      <StaggerItem direction="up">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 min-h-[180px] flex items-center p-6 sm:p-8">
          <Image 
            src="/images/dashboard_fpl.png" 
            alt="Statistics" 
            fill 
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover opacity-30 select-none mix-blend-screen" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              <GradientText>FPL Statistics</GradientText>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Comprehensive statistics across teams, players, and the league table
            </p>
          </div>
        </div>
      </StaggerItem>

      <StaggerItem direction="up">
        <Badge variant="outline" className="text-sm px-4 py-1 bg-white/5">
          GW{currentGw} Data
        </Badge>
      </StaggerItem>

      <Tabs defaultValue="players" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Players
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            League Table
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Player Statistics
              </CardTitle>
              <CardDescription>Filter and search players by name or position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    id="player-search"
                    name="player-search"
                    aria-label="Search players by name"
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {[null, 1, 2, 3, 4].map((pos) => (
                    <Button
                      key={pos ?? 'all'}
                      variant={positionFilter === pos ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPositionFilter(pos)}
                    >
                      {pos === null ? 'All' : POSITION_LABELS[pos]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Target className="h-4 w-4 text-green-400" />
                      Top Scorers
                    </div>
                    <div className="space-y-1">
                      {topScorers.slice(0, 5).map((p, i) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <span className="truncate">{i + 1}. {p.web_name}</span>
                          <span className="font-medium">{p.goals_scored}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Award className="h-4 w-4 text-purple-400" />
                      Top Assists
                    </div>
                    <div className="space-y-1">
                      {topAssists.slice(0, 5).map((p, i) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <span className="truncate">{i + 1}. {p.web_name}</span>
                          <span className="font-medium">{p.assists}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                      Top Form
                    </div>
                    <div className="space-y-1">
                      {topForm.slice(0, 5).map((p, i) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <span className="truncate">{i + 1}. {p.web_name}</span>
                          <span className="font-medium text-green-400">{safeFloat(p.form, 1)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Activity className="h-4 w-4 text-yellow-400" />
                      Top ICT
                    </div>
                    <div className="space-y-1">
                      {topICT.slice(0, 5).map((p, i) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <span className="truncate">{i + 1}. {p.web_name}</span>
                          <span className="font-medium text-purple-400">{safeFloat(p.ICT_index, 1)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-md border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-white/70">Player</TableHead>
                      <TableHead className="text-white/70">Team</TableHead>
                      <TableHead className="text-white/70">Pos</TableHead>
                      <TableHead className="text-white/70 text-right">Price</TableHead>
                      <TableHead className="text-white/70 text-right">Pts</TableHead>
                      <TableHead className="text-white/70 text-right">Form</TableHead>
                      <TableHead className="text-white/70 text-right">xG</TableHead>
                      <TableHead className="text-white/70 text-right">xA</TableHead>
                      <TableHead className="text-white/70 text-right">ICT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers.slice(0, 50).map((player) => (
                      <TableRow key={player.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="font-medium">{player.web_name}</TableCell>
                        <TableCell>{getTeamShortName(player.team)}</TableCell>
                        <TableCell>
                          <Badge className={POSITION_COLORS[player.element_type]}>
                            {POSITION_LABELS[player.element_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatPrice(player.now_cost || player.price)}</TableCell>
                        <TableCell className="text-right font-medium">{player.total_points}</TableCell>
                        <TableCell className="text-right">
                          <span className={safeNumber(player.form) > 0 ? 'text-green-400' : ''}>
                            {safeFloat(player.form, 1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{safeFloat(player.expected_goals, 1)}</TableCell>
                        <TableCell className="text-right">{safeFloat(player.expected_assists, 1)}</TableCell>
                        <TableCell className="text-right">{safeFloat(player.ICT_index, 1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Premier League Table
              </CardTitle>
              <CardDescription>League standings based on current fixture results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-white/70 w-12">Pos</TableHead>
                      <TableHead className="text-white/70">Team</TableHead>
                      <TableHead className="text-white/70 text-center">P</TableHead>
                      <TableHead className="text-white/70 text-center">W</TableHead>
                      <TableHead className="text-white/70 text-center">D</TableHead>
                      <TableHead className="text-white/70 text-center">L</TableHead>
                      <TableHead className="text-white/70 text-center">GF</TableHead>
                      <TableHead className="text-white/70 text-center">GA</TableHead>
                      <TableHead className="text-white/70 text-center">GD</TableHead>
                      <TableHead className="text-white/70 text-right">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leagueTable.map((team, index) => (
                      <TableRow key={team.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="font-medium">
                          {index + 1}
                          {index === 0 && <Trophy className="inline ml-1 h-3 w-3 text-yellow-400" />}
                          {index === 3 && <Trophy className="inline ml-1 h-3 w-3 text-red-400" />}
                        </TableCell>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell className="text-center">{team.played}</TableCell>
                        <TableCell className="text-center">{team.won}</TableCell>
                        <TableCell className="text-center">{team.drawn}</TableCell>
                        <TableCell className="text-center">{team.lost}</TableCell>
                        <TableCell className="text-center">{team.gf}</TableCell>
                        <TableCell className="text-center">{team.ga}</TableCell>
                        <TableCell className={`text-center ${team.gd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {team.gd > 0 ? '+' : ''}{team.gd}
                        </TableCell>
                        <TableCell className="text-right font-bold">{team.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Players</p>
                  <p className="text-3xl font-bold">{players.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Teams</p>
                  <p className="text-3xl font-bold">{teams.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Goals</p>
                  <p className="text-3xl font-bold text-green-400">
                    {players.reduce((sum, p) => sum + (p.goals_scored || 0), 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Assists</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {players.reduce((sum, p) => sum + (p.assists || 0), 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-fpl-light" />
                Team Strength Ratings
              </CardTitle>
              <CardDescription>Relative team strength (1000 = average)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {teams.sort((a, b) => b.strength - a.strength).map((team) => (
                  <div key={team.id} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="text-sm font-medium mb-1">{team.short_name}</div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Att: {team.strength_attack_home}</span>
                      <span>Def: {team.strength_defence_home}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StaggerContainer>
  );
}

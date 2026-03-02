'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Search, Loader2, TrendingUp, Crown, Zap, Target
} from 'lucide-react';
import { StaggerContainer, StaggerItem, GradientText } from '@/components/animations';
import { useDemoAuth } from '@/components/DemoAuthProvider';
import { POSITION_LABELS, POSITION_COLORS, PredictionsResponse, PlayerPrediction } from '@/lib/types';

const API_BASE = '/api/fpl';
const api = axios.create({ timeout: 120000 });

const TIER_LIMITS = {
  free: 1,
  pro: 4,
  elite: 8,
};

const TIER_INFO = {
  free: { label: 'Free', icon: null, color: 'bg-gray-500' },
  pro: { label: 'Pro', icon: <Crown className="h-3 w-3" />, color: 'bg-yellow-500' },
  elite: { label: 'Elite', icon: <Crown className="h-3 w-3" />, color: 'bg-purple-500' },
};

export default function XP() {
  const { demoUser, isDemoMode } = useDemoAuth();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<PlayerPrediction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<number | null>(null);
  const [teamFilter, setTeamFilter] = useState<number | null>(null);
  const [horizon, setHorizon] = useState(1);
  const [currentGw, setCurrentGw] = useState(1);
  const [teams, setTeams] = useState<{id: number; name: string; short_name: string}[]>([]);

  const userTier = demoUser?.tier || 'free';
  const maxHorizon = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS] || 1;

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchPredictions(horizon);
  }, [horizon]);

  const fetchTeams = async () => {
    try {
      const res = await api.get(`${API_BASE}/bootstrap`);
      setTeams(res.data.teams || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const fetchPredictions = async (h: number) => {
    setLoading(true);
    try {
      const [predRes, gwRes] = await Promise.all([
        api.get(`${API_BASE}/predictions?horizon=${h}`, { timeout: 120000 }),
        api.get(`${API_BASE}/current-gw`),
      ]);
      
      setPredictions(predRes.data.predictions || []);
      setCurrentGw(gwRes.data.current || 1);
    } catch (err) {
      console.error('Error fetching predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `£${(price / 10).toFixed(1)}m`;

  const filteredPredictions = predictions.filter(p => {
    const matchesSearch = p.web_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === null || p.element_type === positionFilter;
    const matchesTeam = teamFilter === null || p.team === teamFilter;
    return matchesSearch && matchesPosition && matchesTeam;
  });

  const topPlayers = [...filteredPredictions].slice(0, 20);

  const getPositionBadge = (pos: number) => POSITION_LABELS[pos] || 'UNK';

  const getGWColumns = () => {
    const cols = [];
    for (let i = 1; i <= horizon; i++) {
      cols.push(`GW${currentGw + i}`);
    }
    return cols;
  };

  return (
    <StaggerContainer staggerDelay={0.1} className="space-y-6 pb-10">
      <StaggerItem direction="up">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 min-h-[180px] flex items-center p-6 sm:p-8">
          <Image 
            src="/images/dashboard_fpl.png" 
            alt="xP Predictions" 
            fill 
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover opacity-30 select-none mix-blend-screen" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              <GradientText>Expected Points (xP)</GradientText>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              AI-powered predictions for upcoming gameweeks using Gradient Boosting
            </p>
          </div>
        </div>
      </StaggerItem>

      <StaggerItem direction="up">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1 bg-white/5">
            <Crown className="h-3 w-3 mr-1" />
            {TIER_INFO[userTier as keyof typeof TIER_INFO].label}
          </Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {maxHorizon} GW{maxHorizon > 1 ? 's' : ''} ahead
          </Badge>
        </div>
      </StaggerItem>

      <StaggerItem direction="up">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-fpl-light" />
              Prediction Horizon
            </CardTitle>
            <CardDescription>
              Select how many gameweeks ahead to predict (based on your tier)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => {
                const isAvailable = h <= maxHorizon;
                return (
                  <Button
                    key={h}
                    variant={horizon === h ? 'default' : 'outline'}
                    size="sm"
                    disabled={!isAvailable}
                    onClick={() => setHorizon(h)}
                    className={!isAvailable ? 'opacity-50' : ''}
                  >
                    {h} GW{h > 1 ? 's' : ''}
                    {!isAvailable && <Crown className="h-3 w-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
            {!isDemoMode && (
              <p className="text-xs text-muted-foreground mt-2">
                Upgrade to Pro for 4 GWs, Elite for 8 GWs
              </p>
            )}
          </CardContent>
        </Card>
      </StaggerItem>

      <StaggerItem direction="up">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-fpl-light" />
              Player Predictions
            </CardTitle>
            <CardDescription>
              Filter by name, position, or team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  id="xp-player-search"
                  name="xp-player-search"
                  aria-label="Search players by name or team"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
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

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={teamFilter === null ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setTeamFilter(null)}
              >
                All Teams
              </Button>
              {teams.slice(0, 10).map((team) => (
                <Button
                  key={team.id}
                  variant={teamFilter === team.id ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setTeamFilter(team.id)}
                >
                  {team.short_name}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading predictions...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {topPlayers.slice(0, 4).map((player, i) => (
                    <div 
                      key={player.id} 
                      className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">#{i + 1}</span>
                        <Badge className={POSITION_COLORS[player.element_type]}>
                          {getPositionBadge(player.element_type)}
                        </Badge>
                      </div>
                      <div className="text-lg font-bold truncate">{player.web_name}</div>
                      <div className="text-sm text-muted-foreground">{player.team_name}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatPrice(player.price)}</span>
                        <span className="text-lg font-bold text-fpl-light">
                          {player.total_xp?.toFixed(1) || '0.0'} xp
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-md border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-white/70 w-12">#</TableHead>
                        <TableHead className="text-white/70">Player</TableHead>
                        <TableHead className="text-white/70">Team</TableHead>
                        <TableHead className="text-white/70">Pos</TableHead>
                        <TableHead className="text-white/70 text-right">Price</TableHead>
                        {getGWColumns().map((gw) => (
                          <TableHead key={gw} className="text-white/70 text-right">{gw}</TableHead>
                        ))}
                        <TableHead className="text-white/70 text-right">Total xP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPredictions.slice(0, 100).map((player, index) => (
                        <TableRow key={player.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium">{player.web_name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {teams.find(t => t.id === player.team)?.short_name || 'UNK'}
                          </TableCell>
                          <TableCell>
                            <Badge className={POSITION_COLORS[player.element_type]}>
                              {getPositionBadge(player.element_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatPrice(player.price)}</TableCell>
                          {getGWColumns().map((_, i) => {
                            const gw = currentGw + i + 1;
                            const xp = player.predictions?.[gw] || 0;
                            return (
                              <TableCell key={gw} className="text-right">
                                <span className={xp >= 5 ? 'text-green-400 font-medium' : ''}>
                                  {xp.toFixed(1)}
                                </span>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right font-bold text-fpl-light">
                            {player.total_xp?.toFixed(1) || '0.0'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </StaggerItem>

      <StaggerItem direction="up">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              How xP is Calculated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our xP predictions use a Gradient Boosting model trained on player metrics, team strength, 
              fixture difficulty, and home/away advantage. See the "How It Works" page for full details.
            </p>
          </CardContent>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { OptimizeResponse, OptimizeRequest, SquadPlayer, POSITION_LABELS, POSITION_COLORS } from '@/lib/types';
import Pitch from '@/components/Pitch';
import { PremiumFeature } from '@/components/PremiumFeature';
import { useDemoAuth } from '@/components/DemoAuthProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Settings2, Calendar, Zap, Crown, Sparkles, TrendingUp, Users, Clock } from 'lucide-react';
import { StaggerContainer, StaggerItem, GradientText, AnimatedCounter } from '@/components/animations';
import Image from 'next/image';

const API_BASE = '/api/fpl';
const API_TIMEOUT = 60000;

const api = axios.create({ timeout: API_TIMEOUT });

api.interceptors.request.use(
  (config) => {
    console.log('[API Request]', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default function Dashboard() {
  const { demoUser, isDemoMode } = useDemoAuth();
  const [teamUrl, setTeamUrl] = useState('');
  const [horizon, setHorizon] = useState(1);
  const [useHits, setUseHits] = useState(false);
  const [chipsAvailable, setChipsAvailable] = useState<Record<string, boolean>>({
    wildcard: true,
    free_hit: true,
    bench_boost: true,
    triple_captain: true
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [currentGw, setCurrentGw] = useState(1);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    checkApiAndFetchGw();
  }, []);

  const checkApiAndFetchGw = async () => {
    setInitializing(true);
    setError('');
    try {
      const healthResponse = await api.get('/health', { timeout: 5000 });
      console.log('[Init] Health:', healthResponse.data);
      setApiStatus('ok');
      const gwResponse = await api.get(`${API_BASE}/current-gw`);
      setCurrentGw(gwResponse.data.current);
    } catch (err) {
      console.error('[Init] Failed:', err);
      setApiStatus('error');
      setError('Cannot connect to backend. Make sure npm run dev is running.');
    } finally {
      setInitializing(false);
    }
  };

  const handleOptimize = async () => {
    if (!teamUrl.trim()) {
      setError('Please enter your FPL team URL');
      return;
    }
    const urlPattern = /^(https?:\/\/)?(www\.)?fantasy\.premierleague\.com\/entry\/\d+(\/.*)?$/i;
    if (!urlPattern.test(teamUrl.trim())) {
      setError('Invalid URL. Use format: https://fantasy.premierleague.com/entry/123456');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const request: OptimizeRequest = {
        team_url: teamUrl.trim(),
        horizon,
        use_hits: useHits,
        chips_available: chipsAvailable
      };
      const response = await api.post<OptimizeResponse>(`${API_BASE}/optimize`, request);
      setResult(response.data);
      if (!response.data.success) {
        setError(response.data.message || 'Optimization failed');
      }
    } catch (err: unknown) {
      let msg = 'An unexpected error occurred.';
      if (err instanceof Error) {
        if ('code' in err && err.code === 'ECONNABORTED') {
          msg = 'Request timed out. Please try again.';
        } else if ('response' in err) {
          const errorResponse = err as { response?: { status?: number; data?: { detail?: string } } };
          if (errorResponse.response?.status === 400) {
            msg = `Bad Request: ${errorResponse.response.data?.detail || 'Invalid input'}`;
          } else if (errorResponse.response?.status === 404) {
            msg = 'Team not found. Check your URL.';
          } else if (errorResponse.response?.status === 500) {
            msg = `Server Error: ${errorResponse.response.data?.detail || 'Internal error'}`;
          }
        }
      } else if (err && typeof err === 'object' && 'request' in err) {
        msg = 'No response from server. Is backend running?';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getPositionBadge = (position: number) => POSITION_LABELS[position] || 'UNK';
  const getPositionColor = (position: number) => POSITION_COLORS[position] || 'bg-gray-500';
  const formatPrice = (price: number) => `£${(price / 10).toFixed(1)}m`;

  const chipLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    wildcard: { label: 'Wildcard', icon: <Crown className="h-3 w-3" /> },
    free_hit: { label: 'Free Hit', icon: <Zap className="h-3 w-3" /> },
    bench_boost: { label: 'Bench Boost', icon: <Users className="h-3 w-3" /> },
    triple_captain: { label: 'Triple Capt.', icon: <Crown className="h-3 w-3" /> },
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Connecting to backend...</p>
          <p className="text-muted-foreground text-sm mt-1">Make sure npm run dev is running</p>
        </div>
      </div>
    );
  }

  return (
    <StaggerContainer staggerDelay={0.1} className="space-y-6 pb-10">
      <StaggerItem direction="up" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight"><GradientText>Team Optimizer</GradientText></h1>
          <p className="text-muted-foreground mt-1 text-lg">
            AI-powered optimization using XGBoost + Linear Programming
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
          <div className={`w-2.5 h-2.5 rounded-full ${apiStatus === 'ok' ? 'bg-green-500' : apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
          <span className="text-sm font-medium">
            {apiStatus === 'ok' ? 'Backend Connected' : apiStatus === 'error' ? 'Backend Disconnected' : 'Checking...'}
          </span>
        </div>
      </StaggerItem>

      <div className="grid gap-6 lg:grid-cols-3">
        <StaggerItem direction="up" className="lg:col-span-1 h-full">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Configure
              </CardTitle>
              <CardDescription>Enter your FPL team details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="teamUrl">FPL Team URL</Label>
                <Input
                  id="teamUrl"
                  placeholder="https://fantasy.premierleague.com/entry/123456"
                  value={teamUrl}
                  onChange={(e) => setTeamUrl(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Paste your team URL from fantasy.premierleague.com</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Horizon
                  </Label>
                  <Badge variant="secondary">{horizon} GW{horizon > 1 ? 's' : ''}</Badge>
                </div>
                <PremiumFeature
                  tier={demoUser?.tier || 'free'}
                  requiredTier="pro"
                  featureName="Multi-week Planning"
                  variant="compact"
                  ctaLink="/pricing"
                >
                  <Slider
                    value={[horizon]}
                    onValueChange={([v]) => setHorizon(v)}
                    min={1}
                    max={4}
                    step={1}
                    disabled={loading}
                    className="py-2"
                  />
                </PremiumFeature>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 GW</span>
                  <span>4 GWs</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="useHits" className="text-sm cursor-pointer flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Allow -4 hits
                </Label>
                <Switch
                  id="useHits"
                  checked={useHits}
                  onCheckedChange={setUseHits}
                  disabled={loading}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Chips
                </Label>
                <PremiumFeature
                  tier={demoUser?.tier || 'free'}
                  requiredTier="pro"
                  featureName="Chip Optimization"
                  variant="compact"
                  ctaLink="/pricing"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(chipsAvailable).map(([chip, available]) => (
                      <button
                        key={chip}
                        onClick={() => setChipsAvailable((p: Record<string, boolean>) => ({ ...p, [chip]: !p[chip] }))}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-all ${available
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted border-muted text-muted-foreground'
                          }`}
                        disabled={loading}
                      >
                        {chipLabels[chip]?.icon}
                        {chipLabels[chip]?.label || chip}
                      </button>
                    ))}
                  </div>
                </PremiumFeature>
              </div>

              <Button
                onClick={handleOptimize}
                disabled={loading || apiStatus === 'error'}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run Optimization
                  </>
                )}
              </Button>

              {apiStatus === 'error' && (
                <Button variant="outline" onClick={checkApiAndFetchGw} className="w-full">
                  Retry Connection
                </Button>
              )}

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem direction="up" className="lg:col-span-2 h-full">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full shadow-xl flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Results
              </CardTitle>
              <CardDescription>
                {result ? `GW${currentGw + 1} optimized squad` : 'Run optimization to see results'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {!result ? (
                <div className="flex flex-col items-center justify-center py-24 text-center relative overflow-hidden rounded-xl border border-white/10 bg-black/40 min-h-[400px]">
                  <Image 
                    src="/images/dashboard_fpl.png" 
                    alt="Dashboard FPL" 
                    fill 
                    priority
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover opacity-30 select-none mix-blend-screen" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="rounded-2xl bg-fpl-green/20 p-4 mb-6 border border-fpl-light/30 shadow-[0_0_30px_rgba(0,255,133,0.2)]">
                      <Sparkles className="h-10 w-10 text-fpl-light animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Ready to Optimize</h3>
                    <p className="text-white/70 max-w-md text-base leading-relaxed">
                      Enter your team URL and let our machine learning models analyze upcoming fixtures, player form, and expected points to build your winning strategy.
                    </p>
                  </div>
                </div>
              ) : !result.success ? (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-destructive font-medium">Optimization Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center backdrop-blur-sm hover:bg-white/10 transition-colors shadow-inner">
                      <p className="text-xs text-white/60 mb-1">Current xP</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">
                        <AnimatedCounter end={result.current_expected_points || 0} decimals={1} duration={1} />
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center backdrop-blur-sm hover:bg-white/10 transition-colors shadow-inner">
                      <p className="text-xs text-white/60 mb-1">Optimized xP</p>
                      <p className="text-2xl sm:text-3xl font-bold text-fpl-light drop-shadow-[0_0_15px_rgba(0,255,133,0.4)]">
                        <AnimatedCounter end={result.optimized_expected_points || 0} decimals={1} duration={1} />
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center backdrop-blur-sm hover:bg-white/10 transition-colors shadow-inner">
                      <p className="text-xs text-white/60 mb-1">Difference</p>
                      <p className={`text-2xl sm:text-3xl font-bold ${(result.points_difference || 0) >= 0 ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.4)]' : 'text-red-400'}`}>
                        {(result.points_difference || 0) >= 0 ? '+' : ''}{result.points_difference}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Starting XI (GW{currentGw + 1})
                      </h3>
                      <Pitch players={result.starting_xi || []} />
                    </div>

                    {result.full_plan && result.full_plan.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Transfer Plan
                        </h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                          {result.full_plan.map((gw, i) => (
                            <div key={i} className="bg-muted rounded-lg p-3 border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold">GW{gw.gameweek}</span>
                                {gw.chip && (
                                  <Badge className="bg-yellow-500 text-black text-[10px]">
                                    {gw.chip}
                                  </Badge>
                                )}
                              </div>
                              {gw.transfers.length > 0 ? (
                                <div className="space-y-1.5">
                                  {gw.transfers.map((t, ti) => (
                                    <div key={ti} className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${t.action === 'buy' ? 'bg-green-500' : 'bg-red-400'}`} />
                                        <span className="truncate max-w-[120px]">{t.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {(t.xp_in !== undefined || t.xp_out !== undefined) && (
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.action === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                                            xP: {t.action === 'buy' ? `+${t.xp_in?.toFixed(1)}` : `-${t.xp_out?.toFixed(1)}`}
                                          </span>
                                        )}
                                        <Badge variant={t.action === 'buy' ? 'default' : 'destructive'} className="text-[10px]">
                                          {t.action}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">No transfers</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Squad List</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.starting_xi?.map((player) => (
                        <div key={player.id} className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${getPositionColor(player.element_type)}`}>
                              {getPositionBadge(player.element_type)}
                            </span>
                            <span className="text-sm font-medium truncate max-w-[120px]">{player.web_name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatPrice(player.price)}</span>
                        </div>
                      ))}
                      {result.bench?.map((player, i) => (
                        <div key={player.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 opacity-60">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">BEN</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${getPositionColor(player.element_type)}`}>
                              {getPositionBadge(player.element_type)}
                            </span>
                            <span className="text-sm text-muted-foreground truncate max-w-[100px]">{player.web_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}

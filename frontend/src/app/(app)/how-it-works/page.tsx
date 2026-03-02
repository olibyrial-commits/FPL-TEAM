'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { 
  Brain, Target, TrendingUp, Users, Home, Shield, Zap, 
  Calculator, BarChart3, Activity, Award, Code
} from 'lucide-react';
import { StaggerContainer, StaggerItem, GradientText } from '@/components/animations';
import { POSITION_COLORS } from '@/lib/types';

const POSITION_MULTIPLIERS = [
  { position: 'GKP', multiplier: 0.6, description: 'Goalkeepers have lower scoring potential' },
  { position: 'DEF', multiplier: 0.7, description: 'Defenders score mainly from clean sheets' },
  { position: 'MID', multiplier: 0.85, description: 'Midfielders get bonus for goals/assists' },
  { position: 'FWD', multiplier: 0.8, description: 'Forwards score primarily from goals' },
];

const FEATURES = [
  { name: 'xG (Expected Goals)', description: 'Expected goals based on shot quality and location' },
  { name: 'xA (Expected Assists)', description: 'Expected assists based on key passes' },
  { name: 'xGI (Expected Goal Involvement)', description: 'Combined xG + xA for goal involvement' },
  { name: 'Minutes', description: 'Total minutes played (rotation risk indicator)' },
  { name: 'Form', description: 'Recent performance score (last 5 matches)' },
  { name: 'Points Per Game', description: 'Average points scored per match' },
  { name: 'Threat', description: 'Attacking threat metric (0-100)' },
  { name: 'Creativity', description: 'Creative output metric (0-100)' },
  { name: 'ICT Index', description: 'Influence + Creativity + Threat combined' },
  { name: 'Team Strength', description: 'Overall team strength rating (1000 = average)' },
  { name: 'Attack Strength (Home/Away)', description: 'Team attacking strength for home/away games' },
  { name: 'Defence Strength (Home/Away)', description: 'Team defensive strength for home/away games' },
  { name: 'Fixture Difficulty', description: 'FDR 1-5 scale (1 = easiest, 5 = hardest)' },
  { name: 'Is Home', description: 'Whether the match is at home (+0.2 bonus)' },
  { name: 'Opponent Attack/Defence', description: 'Opponent strength metrics' },
];

const MODEL_DETAILS = [
  { label: 'Algorithm', value: 'Gradient Boosting Regressor' },
  { label: 'Library', value: 'scikit-learn GradientBoostingRegressor' },
  { label: 'Estimators', value: '100' },
  { label: 'Max Depth', value: '5' },
  { label: 'Learning Rate', value: '0.1' },
  { label: 'Scaling', value: 'StandardScaler' },
];

export default function HowItWorks() {
  return (
    <StaggerContainer staggerDelay={0.1} className="space-y-6 pb-10">
      <StaggerItem direction="up">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 min-h-[180px] flex items-center p-6 sm:p-8">
          <Image 
            src="/images/dashboard_fpl.png" 
            alt="How It Works" 
            fill 
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover opacity-30 select-none mix-blend-screen" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              <GradientText>How It Works</GradientText>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Deep dive into how our xP predictions are calculated
            </p>
          </div>
        </div>
      </StaggerItem>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="model" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Model
          </TabsTrigger>
          <TabsTrigger value="formula" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Formula
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-fpl-green/20 p-2">
                    <Brain className="h-6 w-6 text-fpl-light" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Machine Learning</h3>
                    <p className="text-xs text-muted-foreground">Gradient Boosting</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Uses scikit-learn's GradientBoostingRegressor trained on player metrics, 
                  team strength, and fixture difficulty.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-purple-500/20 p-2">
                    <Target className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">15 Features</h3>
                    <p className="text-xs text-muted-foreground">Multiple data points</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Incorporates xG, xA, form, ICT, team strength, 
                  fixture difficulty, home/away, and opponent metrics.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-yellow-500/20 p-2">
                    <TrendingUp className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Position-Aware</h3>
                    <p className="text-xs text-muted-foreground">Different multipliers</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Each position (GKP, DEF, MID, FWD) has different 
                  scoring potential, reflected in position multipliers.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>The Prediction Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-fpl-green/20 flex items-center justify-center text-fpl-light font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Data Collection</h4>
                  <p className="text-sm text-muted-foreground">
                    Fetch player data, team data, and fixtures from the FPL API.
                    This includes xG, xA, form, ICT index, minutes played, and more.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-fpl-green/20 flex items-center justify-center text-fpl-light font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Model Training</h4>
                  <p className="text-sm text-muted-foreground">
                    Train a Gradient Boosting model on synthetic training data created from 
                    player attributes and team/fixure information.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-fpl-green/20 flex items-center justify-center text-fpl-light font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Feature Extraction</h4>
                  <p className="text-sm text-muted-foreground">
                    For each player and upcoming fixture, extract 15 features including
                    player metrics, team strength, fixture difficulty, and opponent info.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-fpl-green/20 flex items-center justify-center text-fpl-light font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Prediction</h4>
                  <p className="text-sm text-muted-foreground">
                    Scale features using StandardScaler and predict expected points.
                    The model outputs a raw prediction which is clipped to be non-negative.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-fpl-green/20 flex items-center justify-center text-fpl-light font-bold">
                  5
                </div>
                <div>
                  <h4 className="font-medium">Aggregation</h4>
                  <p className="text-sm text-muted-foreground">
                    Sum predictions across the planning horizon to get total expected points.
                    This is used for transfer optimization and player comparison.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                15 Features Used in Prediction
              </CardTitle>
              <CardDescription>
                The model uses these features to predict expected points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FEATURES.map((feature, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      {feature.name.includes('xG') && <Zap className="h-4 w-4 text-green-400" />}
                      {feature.name.includes('xA') && <Zap className="h-4 w-4 text-purple-400" />}
                      {feature.name.includes('Form') && <TrendingUp className="h-4 w-4 text-blue-400" />}
                      {feature.name.includes('ICT') && <Activity className="h-4 w-4 text-yellow-400" />}
                      {feature.name.includes('Fixture') && <Home className="h-4 w-4 text-orange-400" />}
                      {feature.name.includes('Team') && <Users className="h-4 w-4 text-cyan-400" />}
                      {(!feature.name.includes('xG') && !feature.name.includes('xA') && !feature.name.includes('Form') && !feature.name.includes('ICT') && !feature.name.includes('Fixture') && !feature.name.includes('Team')) && <Target className="h-4 w-4" />}
                      <span className="font-medium text-sm">{feature.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Position Multipliers
              </CardTitle>
              <CardDescription>
                Different positions have different scoring potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {POSITION_MULTIPLIERS.map((pm) => (
                  <div key={pm.position} className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                    <Badge className={POSITION_COLORS[pm.position === 'GKP' ? 1 : pm.position === 'DEF' ? 2 : pm.position === 'MID' ? 3 : 4]}>
                      {pm.position}
                    </Badge>
                    <div className="text-2xl font-bold mt-2 text-fpl-light">{pm.multiplier}</div>
                    <p className="text-xs text-muted-foreground mt-1">{pm.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model" className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Model Configuration
              </CardTitle>
              <CardDescription>
                Technical details about the Gradient Boosting model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {MODEL_DETAILS.map((detail, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-muted-foreground">{detail.label}</p>
                    <p className="font-medium">{detail.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Training Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Synthetic Training Data</h4>
                <p className="text-sm text-muted-foreground">
                  The model is trained on synthetic data created from actual player attributes.
                  For each player, we generate training examples for 5 gameweeks with varying 
                  fixture difficulties and home/away conditions.
                </p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">2. Feature Engineering</h4>
                <p className="text-sm text-muted-foreground">
                  Features are extracted and scaled using StandardScaler to ensure 
                  all features contribute equally to the model.
                </p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">3. Model Training</h4>
                <p className="text-sm text-muted-foreground">
                  The GradientBoostingRegressor is trained with 100 estimators, max depth of 5,
                  and learning rate of 0.1. This balances model complexity with generalization.
                </p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">4. Evaluation</h4>
                <p className="text-sm text-muted-foreground">
                  The model achieves an R² score during training, indicating how well
                  the model fits the training data. In production, predictions are 
                  clamped to be non-negative.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formula" className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Prediction Formula
              </CardTitle>
              <CardDescription>
                How the expected points are calculated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-black/40 rounded-lg p-4 font-mono text-sm">
                <p className="text-purple-400">predicted_points =</p>
                <p className="text-fpl-light">max(0, model.predict(scaled_features))</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Base Points Calculation (Training)</h4>
                <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <p className="text-green-400">base_points =</p>
                  <p className="text-white/70 ml-2">points_per_game × 0.3</p>
                  <p className="text-white/70 ml-2">+ xGI × position_multiplier × 4</p>
                  <p className="text-white/70 ml-2">+ form_factor × 1.5</p>
                  <p className="text-white/70 ml-2">+ minutes_factor × 0.5</p>
                  <p className="text-white/70 ml-2">+ (threat + creativity) / 200 × position_multiplier</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Fixture Difficulty Impact</h4>
                <div className="bg-black/40 rounded-lg p-4 font-mono text-sm">
                  <p className="text-green-400">fdr_impact =</p>
                  <p className="text-white/70 ml-2">(3 - fixture_difficulty) × 0.5</p>
                  <p className="text-green-400 mt-2">home_bonus =</p>
                  <p className="text-white/70 ml-2">0.2 if is_home else 0</p>
                  <p className="text-green-400 mt-2">final_prediction =</p>
                  <p className="text-white/70 ml-2">base_points × (1 + home_bonus + fdr_impact)</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Key Factors</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-fpl-light">•</span>
                    <span><strong className="text-white">Form Factor:</strong> Normalized 0-1 based on player form</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-fpl-light">•</span>
                    <span><strong className="text-white">Minutes Factor:</strong> Minutes played / 1800, capped at 1</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-fpl-light">•</span>
                    <span><strong className="text-white">Home Bonus:</strong> +0.2 multiplier for home games</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-fpl-light">•</span>
                    <span><strong className="text-white">FDR Impact:</strong> Easier fixtures = higher points</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-fpl-light">•</span>
                    <span><strong className="text-white">Noise:</strong> Random normal noise (std=1.5) added during training</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Feature Vector
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/40 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <p className="text-white">[</p>
                <p className="text-yellow-400 ml-2">position,</p>
                <p className="text-yellow-400 ml-2">xG,</p>
                <p className="text-yellow-400 ml-2">xA,</p>
                <p className="text-yellow-400 ml-2">xGI,</p>
                <p className="text-yellow-400 ml-2">minutes,</p>
                <p className="text-yellow-400 ml-2">form,</p>
                <p className="text-yellow-400 ml-2">points_per_game,</p>
                <p className="text-yellow-400 ml-2">threat,</p>
                <p className="text-yellow-400 ml-2">creativity,</p>
                <p className="text-yellow-400 ml-2">ICT,</p>
                <p className="text-yellow-400 ml-2">team_strength,</p>
                <p className="text-yellow-400 ml-2">fixture_difficulty,</p>
                <p className="text-yellow-400 ml-2">is_home,</p>
                <p className="text-yellow-400 ml-2">opp_attack,</p>
                <p className="text-yellow-400 ml-2">opp_defence</p>
                <p className="text-white">]</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StaggerContainer>
  );
}

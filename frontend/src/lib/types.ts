export interface Player {
  id: number;
  web_name: string;
  element_type: number;
  team: number;
  price: number;
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  bench_order: number;
}

export interface SquadPlayer extends Player {
  position: number;
  fixtures?: FixtureInfo[];
}

export interface FixtureInfo {
  gameweek: number;
  opponent: string;
  opponent_id: number;
  difficulty: number;
  is_home: boolean;
  finished: boolean;
}

export interface ManagerTeam {
  team_id: number;
  team_name: string;
  player_first_name: string;
  player_last_name: string;
  summary_overall_rank: number;
  overall_rank: number;
  overall_points: number;
  bank: number;
  value: number;
  free_transfers: number;
  saved_transfers: number;
  current_gw: number;
  next_gw: number;
}

export interface TransferAction {
  action: 'buy' | 'sell';
  player_id: number;
  player_name: string;
  price: number;
  xp_in?: number;
  xp_out?: number;
}

export interface OptimizeResponse {
  success: boolean;
  message: string;
  current_squad?: {
    team_id: number;
    picks: SquadPlayer[];
    total_value: number;
    bank: number;
    transfers_available: number;
    transfers_limit: number;
  };
  optimized_squad?: SquadPlayer[];
  starting_xi?: SquadPlayer[];
  bench?: SquadPlayer[];
  transfer_plan?: TransferAction[];
  full_plan?: {
    gameweek: number;
    transfers: { action: 'buy' | 'sell', player_id: number, name: string, xp_in?: number, xp_out?: number }[];
    chip: string | null;
  }[];
  current_expected_points?: number;
  optimized_expected_points?: number;
  points_difference?: number;
  savings?: number;
  fixtures?: Record<number, FixtureInfo[]>;
}

export interface OptimizeRequest {
  team_url: string;
  horizon: number;
  use_hits: boolean;
  chips_available?: Record<string, boolean>;
}

export interface PlayerPrediction {
  id: number;
  web_name: string;
  team: number;
  team_name: string;
  element_type: number;
  price: number;
  predictions: Record<number, number>;
  total_xp?: number;
}

export interface PredictionsResponse {
  success: boolean;
  current_gw: number;
  horizon: number;
  predictions: PlayerPrediction[];
}

export const POSITION_LABELS: Record<number, string> = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD'
};

export const POSITION_COLORS: Record<number, string> = {
  1: 'bg-yellow-500',
  2: 'bg-blue-500',
  3: 'bg-green-500',
  4: 'bg-red-500'
};

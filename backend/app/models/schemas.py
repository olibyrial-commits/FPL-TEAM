from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class Player(BaseModel):
    """Player data from FPL API"""

    id: int
    first_name: str
    second_name: str
    web_name: str
    team: int
    team_code: int
    element_type: int
    price: float
    now_cost: int
    minutes: int
    total_points: int
    bonus: int
    bps: int
    xG: float = Field(default=0.0, alias="expected_goals")
    xA: float = Field(default=0.0, alias="expected_assists")
    expected_goal_involvement: float = Field(default=0.0)
    threat: float = 0.0
    creativity: float = 0.0
    influence: float = 0.0
    ICT_index: float = 0.0
    form: float = 0.0
    points_per_game: float = 0.0
    selected_by_percent: float = 0.0
    status: str = "a"

    class Config:
        populate_by_name = True


class Team(BaseModel):
    """Team data from FPL API"""

    id: int
    name: str
    short_name: str
    strength: int
    strength_overall_home: int
    strength_overall_away: int
    strength_attack_home: int
    strength_attack_away: int
    strength_defence_home: int
    strength_defence_away: int


class FixtureDifficulty(BaseModel):
    """Fixture difficulty rating for a team"""

    team_id: int
    gameweek: int
    opponent_team_id: int
    difficulty: int
    is_home: bool


class FixtureInfo(BaseModel):
    """Fixture information for a player"""

    gameweek: int
    opponent: str
    opponent_id: int
    difficulty: int
    is_home: bool
    finished: bool = False


class ManagerTeam(BaseModel):
    """Manager's FPL team"""

    team_id: int
    team_name: str
    player_first_name: str
    player_last_name: str
    summary_overall_rank: int
    overall_rank: int
    overall_points: int
    bank: float
    value: float
    free_transfers: int
    saved_transfers: int
    current_gw: int
    next_gw: int


class SquadPlayer(BaseModel):
    """Player in manager's squad"""

    id: int
    web_name: str
    element_type: int
    team: int
    price: int
    position: int
    is_captain: bool = False
    is_vice_captain: bool = False
    bench_order: int = 0


class ManagerSquad(BaseModel):
    """Manager's current squad"""

    team_id: int
    picks: List[SquadPlayer]
    total_value: int
    bank: int
    transfers_available: int
    transfers_limit: int


class OptimizeRequest(BaseModel):
    """Request to run optimization"""

    team_url: str = Field(
        ...,
        description="FPL team URL, e.g., https://fantasy.premierleague.com/entry/123456/history",
    )
    horizon: int = Field(
        default=1, ge=1, le=4, description="Number of gameweeks to optimize for"
    )
    use_hits: bool = Field(
        default=False, description="Allow taking point hits for transfers"
    )
    chips_available: Optional[Dict[str, bool]] = Field(
        default={
            "wildcard": True,
            "free_hit": True,
            "bench_boost": True,
            "triple_captain": True,
        },
        description="Availability of chips",
    )


class OptimizeResponse(BaseModel):
    """Response from optimization"""

    success: bool
    message: str
    current_squad: Optional[ManagerSquad] = None
    optimized_squad: Optional[List[SquadPlayer]] = None
    starting_xi: Optional[List[SquadPlayer]] = None
    bench: Optional[List[SquadPlayer]] = None
    transfer_plan: Optional[List[Dict[str, Any]]] = None
    full_plan: Optional[List[Dict[str, Any]]] = None
    current_expected_points: Optional[float] = None
    optimized_expected_points: Optional[float] = None
    points_difference: Optional[float] = None
    savings: Optional[float] = None
    fixtures: Optional[Dict[int, List[FixtureInfo]]] = None  # player_id -> fixtures


class PlayerPrediction(BaseModel):
    """Single player prediction"""

    id: int
    web_name: str
    team: int
    team_name: str
    element_type: int
    price: float
    predictions: Dict[int, float]
    total_xp: Optional[float] = None


class PredictionsResponse(BaseModel):
    """Response with player predictions"""

    success: bool
    current_gw: int
    horizon: int
    predictions: List[PlayerPrediction]


class BacktestRequest(BaseModel):
    """Request to run backtesting"""

    start_gw: int = Field(
        ..., ge=1, le=38, description="First gameweek to test (inclusive)"
    )
    end_gw: int = Field(
        ..., ge=1, le=38, description="Last gameweek to test (inclusive)"
    )


class BacktestPlayerResult(BaseModel):
    """Individual player backtest result"""

    player_id: int
    web_name: str
    position: int
    predicted: float
    actual: float
    error: float


class BacktestMetrics(BaseModel):
    """Backtest accuracy metrics"""

    mae: float
    rmse: float
    accuracy_within_1: float
    accuracy_within_2: float
    accuracy_within_3: float
    total_predictions: int
    mean_predicted: float
    mean_actual: float


class BacktestResponse(BaseModel):
    """Response from backtesting"""

    success: bool
    start_gw: int
    end_gw: int
    metrics: BacktestMetrics
    gameweek_breakdown: Dict[str, Any]
    top_predictions: List[BacktestPlayerResult]
    worst_predictions: List[BacktestPlayerResult]

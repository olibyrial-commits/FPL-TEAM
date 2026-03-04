import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any
import logging
import json
import os
from dataclasses import dataclass, asdict
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


@dataclass
class ModelParams:
    """Configurable parameters for the point prediction model.

    These parameters control how player features are weighted
    when generating predictions.
    """

    # Position-specific multipliers
    gkp_multiplier: float = 0.6
    def_multiplier: float = 0.7
    mid_multiplier: float = 0.85
    fwd_multiplier: float = 0.8

    # Feature weights
    points_pg_weight: float = 0.4
    xgi_weight: float = 3.0
    xa_weight: float = 2.0
    form_weight: float = 1.0
    minutes_weight: float = 0.3
    games_weight: float = 0.3
    threat_creativity_weight: float = 0.02

    # Fixture factors
    home_bonus: float = 0.2
    fdr_weight: float = 0.5

    # Noise for synthetic training
    noise_std: float = 1.5

    # Model hyperparameters
    n_estimators: int = 100
    max_depth: int = 5
    learning_rate: float = 0.1
    min_samples_split: int = 10
    min_samples_leaf: int = 5

    @classmethod
    def get_default(cls) -> "ModelParams":
        """Return default parameters."""
        return cls()

    @classmethod
    def from_dict(cls, data: Dict) -> "ModelParams":
        """Create from dictionary."""
        return cls(**data)

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return asdict(self)

    def get_position_multiplier(self, position: int) -> float:
        """Get multiplier for a specific position."""
        multipliers = {
            1: self.gkp_multiplier,
            2: self.def_multiplier,
            3: self.mid_multiplier,
            4: self.fwd_multiplier,
        }
        return multipliers.get(position, 0.7)

    @classmethod
    def load(cls, filepath: str) -> "ModelParams":
        """Load parameters from JSON file."""
        if os.path.exists(filepath):
            with open(filepath, "r") as f:
                data = json.load(f)
                logger.info(f"Loaded parameters from {filepath}")
                return cls.from_dict(data)
        logger.info(f"No parameter file found at {filepath}, using defaults")
        return cls.get_default()

    def save(self, filepath: str):
        """Save parameters to JSON file."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w") as f:
            json.dump(self.to_dict(), f, indent=2)
        logger.info(f"Saved parameters to {filepath}")


DEFAULT_PARAMS_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "params", "model_params.json"
)


def safe_float(val, default=0.0):
    """Convert FPL API value to float, handling string/int mixed types."""
    if val is None:
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def safe_int(val, default=0):
    """Convert FPL API value to int."""
    if val is None:
        return default
    try:
        return int(val)
    except (TypeError, ValueError):
        return default


def normalize_per_game(value: float, minutes: float, default: float = 0.0) -> float:
    """Convert season-total stats to per-game averages.

    Args:
        value: The season-total stat (e.g., total xG, xA, xGI)
        minutes: Total minutes played in season
        default: Default value if calculation not possible

    Returns:
        Per-game average (normalized to 90 minutes)
    """
    if minutes <= 0 or value is None:
        return default
    return (value / minutes) * 90


class PointPredictor:
    """
    Machine Learning model for predicting Fantasy Premier League points.
    Uses XGBoost/Random Forest to predict expected points based on:
    - Historical xG and xA
    - Fixture difficulty rating (FDR)
    - Home/away advantage
    - Team strength
    - Minutes played (rotation risk)
    - Form and ICT metrics

    Supports configurable parameters for optimization.
    """

    POSITION_MAP = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}

    def __init__(
        self, params: Optional[ModelParams] = None, params_path: Optional[str] = None
    ):
        """Initialize predictor with optional parameters.

        Args:
            params: ModelParams instance. If None, loads from params_path or uses defaults.
            params_path: Path to JSON file with parameters. Overrides defaults if provided.
        """
        self.model: Optional[GradientBoostingRegressor] = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self._player_cache: Dict[int, Dict[int, float]] = {}

        # Load parameters
        if params is not None:
            self.params = params
        elif params_path is not None:
            self.params = ModelParams.load(params_path)
        else:
            self.params = ModelParams.load(DEFAULT_PARAMS_PATH)

    def _create_training_data(
        self, players: List[Dict], teams: List[Dict], fixtures: List[Dict]
    ) -> pd.DataFrame:
        """
        Create training dataset from historical FPL data.
        In production, this would use actual historical gameweek data.
        For this implementation, we create synthetic training data based on
        player attributes to train the model.
        """
        logger.info("Creating training data for point prediction model...")

        team_dict = {t["id"]: t for t in teams}

        training_data = []

        for player in players:
            if player.get("status") == "x":  # Exclude injured
                continue

            player_id = player["id"]
            team_id = player["team"]
            position = player["element_type"]
            team = team_dict.get(team_id, {})

            if position not in [1, 2, 3, 4]:
                continue

            total_minutes = safe_float(player.get("minutes", 0))
            games_played = max(total_minutes / 90, 1)

            xG = safe_float(player.get("expected_goals", 0))
            xA = safe_float(player.get("expected_assists", 0))
            xGI = safe_float(player.get("expected_goal_involvement", 0))
            xG_per_game = normalize_per_game(xG, total_minutes, 0)
            xA_per_game = normalize_per_game(xA, total_minutes, 0)
            xGI_per_game = normalize_per_game(xGI, total_minutes, 0)
            form = safe_float(player.get("form", 0))
            points_pg = safe_float(player.get("points_per_game", 0))
            threat = safe_float(player.get("threat", 0))
            creativity = safe_float(player.get("creativity", 0))
            ICT = safe_float(player.get("ICT_index", 0))
            threat_per_game = normalize_per_game(threat, total_minutes, 0)
            creativity_per_game = normalize_per_game(creativity, total_minutes, 0)
            ict_per_game = normalize_per_game(ICT, total_minutes, 0)

            team_strength = team.get("strength", 1000)
            attack_home = team.get("strength_attack_home", 1000)
            attack_away = team.get("strength_attack_away", 1000)
            defence_home = team.get("strength_defence_home", 1000)
            defence_away = team.get("strength_defence_away", 1000)

            position_multiplier = self.params.get_position_multiplier(position)

            form_factor = max(0, min(form, 10)) / 10
            minutes_factor = min(total_minutes / 1800, 1.0) if total_minutes else 0.0
            games_factor = min(games_played / 20, 1.0)

            base_points = (
                points_pg * self.params.points_pg_weight
                + xGI_per_game * position_multiplier * self.params.xgi_weight
                + xA_per_game * position_multiplier * self.params.xa_weight
                + form_factor * self.params.form_weight
                + minutes_factor * self.params.minutes_weight
                + games_factor * self.params.games_weight
                + (threat_per_game + creativity_per_game)
                / 50
                * position_multiplier
                * self.params.threat_creativity_weight
                * 50
            )

            for gw in range(1, 6):
                is_home = gw % 2 == 1
                opp_strength = (attack_home if is_home else attack_away) / 1000
                def_strength = (defence_home if is_home else defence_away) / 1000

                fixture_difficulty = 3 - (def_strength - 0.5) * 2
                fixture_difficulty = max(1, min(5, fixture_difficulty))

                home_bonus = self.params.home_bonus if is_home else 0

                fdr_impact = (3 - fixture_difficulty) * self.params.fdr_weight

                predicted_points = base_points * (1 + home_bonus + fdr_impact)

                noise = np.random.normal(0, self.params.noise_std)
                predicted_points = max(0, predicted_points + noise)

                training_data.append(
                    {
                        "player_id": player_id,
                        "gameweek": gw,
                        "position": position,
                        "xG": xG_per_game,
                        "xA": xA_per_game,
                        "xGI": xGI_per_game,
                        "minutes": total_minutes,
                        "games_played": games_played,
                        "form": form,
                        "points_per_game": points_pg,
                        "threat": threat_per_game,
                        "creativity": creativity_per_game,
                        "ICT": ict_per_game,
                        "team_strength": team_strength,
                        "fixture_difficulty": fixture_difficulty,
                        "is_home": int(is_home),
                        "opp_attack": opp_strength,
                        "opp_defence": def_strength,
                        "predicted_points": predicted_points,
                    }
                )

        return pd.DataFrame(training_data)

    def train(self, players: List[Dict], teams: List[Dict], fixtures: List[Dict]):
        """
        Train the point prediction model on player data.
        """
        logger.info("Training point prediction model...")

        df = self._create_training_data(players, teams, fixtures)

        feature_cols = [
            "position",
            "xG",
            "xA",
            "xGI",
            "minutes",
            "games_played",
            "form",
            "points_per_game",
            "threat",
            "creativity",
            "ICT",
            "team_strength",
            "fixture_difficulty",
            "is_home",
            "opp_attack",
            "opp_defence",
        ]

        X = df[feature_cols].values
        y = df["predicted_points"].values

        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)

        self.model = GradientBoostingRegressor(
            n_estimators=self.params.n_estimators,
            max_depth=self.params.max_depth,
            learning_rate=self.params.learning_rate,
            min_samples_split=self.params.min_samples_split,
            min_samples_leaf=self.params.min_samples_leaf,
            random_state=42,
        )
        self.model.fit(X_scaled, y)

        self.is_trained = True

        train_score = self.model.score(X_scaled, y)
        logger.info(f"Model training complete. R² score: {train_score:.3f}")

    def predict_player_gw_points(
        self,
        player: Dict,
        team: Optional[Dict],
        fixture_difficulty: int,
        is_home: bool,
        gameweek: int,
    ) -> float:
        """
        Predict points for a single player using formula with optimized parameters.
        This directly applies the ModelParams instead of using ML model.
        """
        position = player["element_type"]

        total_minutes = safe_float(player.get("minutes", 0))
        games_played = max(total_minutes / 90, 1)

        xG = safe_float(player.get("expected_goals", 0))
        xA = safe_float(player.get("expected_assists", 0))
        xGI = safe_float(player.get("expected_goal_involvement", 0))
        xG_per_game = normalize_per_game(xG, total_minutes, 0)
        xA_per_game = normalize_per_game(xA, total_minutes, 0)
        xGI_per_game = normalize_per_game(xGI, total_minutes, 0)
        form = safe_float(player.get("form", 0))
        points_pg = safe_float(player.get("points_per_game", 0))
        threat = safe_float(player.get("threat", 0))
        creativity = safe_float(player.get("creativity", 0))
        threat_per_game = normalize_per_game(threat, total_minutes, 0)
        creativity_per_game = normalize_per_game(creativity, total_minutes, 0)

        team_strength = team.get("strength", 1000) if team else 1000

        # Get position-specific multiplier
        position_multiplier = self.params.get_position_multiplier(position)

        # Calculate using formula with optimized parameters
        form_factor = max(0, min(form, 10)) / 10
        minutes_factor = min(total_minutes / 1800, 1.0) if total_minutes else 0.0
        games_factor = min(games_played / 20, 1.0)

        base_points = (
            points_pg * self.params.points_pg_weight
            + xGI_per_game * position_multiplier * self.params.xgi_weight
            + xA_per_game * position_multiplier * self.params.xa_weight
            + form_factor * self.params.form_weight
            + minutes_factor * self.params.minutes_weight
            + games_factor * self.params.games_weight
            + (threat_per_game + creativity_per_game)
            / 50
            * position_multiplier
            * self.params.threat_creativity_weight
            * 50
        )

        # Apply fixture difficulty
        home_bonus = self.params.home_bonus if is_home else 0
        fdr_impact = (3 - fixture_difficulty) * self.params.fdr_weight

        predicted_points = base_points * (1 + home_bonus + fdr_impact)
        predicted_points = max(0, predicted_points)

        return round(predicted_points, 2)

    def predict_all_players(
        self,
        players: List[Dict],
        teams: List[Dict],
        fixtures: List[Dict],
        current_gw: int,
        horizon: int = 4,
    ) -> Dict[int, Dict[int, float]]:
        """
        Predict points for all players for the next N gameweeks.

        Returns:
            Dict mapping player_id -> {gameweek_number -> expected_points}
        """
        logger.info(
            f"Predicting points for {len(players)} players over {horizon} gameweeks..."
        )

        team_dict = {t["id"]: t for t in teams}

        fixture_map = {}
        for fixture in fixtures:
            gw = fixture.get("event")
            if gw and gw > current_gw:
                team_a = fixture.get("team_a")
                team_h = fixture.get("team_h")
                if team_a:
                    fixture_map.setdefault(team_a, {})[gw] = {
                        "opponent": team_h,
                        "difficulty": fixture.get("team_a_difficulty", 3),
                        "is_home": False,
                    }
                if team_h:
                    fixture_map.setdefault(team_h, {})[gw] = {
                        "opponent": team_a,
                        "difficulty": fixture.get("team_h_difficulty", 3),
                        "is_home": True,
                    }

        predictions = {}

        for player in players:
            player_id = player["id"]
            status = player.get("status", "a")
            # a=available, u=unavailable, i=injured, d=doubtful, s=suspended
            if status != "a":
                predictions[player_id] = {
                    gw: 0 for gw in range(current_gw + 1, current_gw + horizon + 1)
                }
                continue

            team_id = player["team"]
            team = team_dict.get(team_id)
            player_fixtures = fixture_map.get(team_id, {})

            # Handle missing team data gracefully
            if team is None:
                logger.warning(f"Team {team_id} not found for player {player_id}")
                team = {}

            player_predictions = {}

            for gw in range(current_gw + 1, current_gw + horizon + 1):
                fixture = player_fixtures.get(gw)

                if fixture:
                    opp_team = team_dict.get(fixture["opponent"])
                    difficulty = fixture["difficulty"]
                    is_home = fixture["is_home"]
                else:
                    opp_team = None
                    difficulty = 3
                    is_home = True

                xP = self.predict_player_gw_points(
                    player=player,
                    team=team,
                    fixture_difficulty=difficulty,
                    is_home=is_home,
                    gameweek=gw,
                )

                player_predictions[gw] = xP

            predictions[player_id] = player_predictions

        logger.info("Point prediction complete")
        return predictions

    def get_transfer_in_value(
        self,
        player_id: int,
        players: List[Dict],
        predictions: Dict[int, Dict[int, float]],
        current_gw: int,
        horizon: int,
    ) -> float:
        """
        Calculate the total expected points for a player over the horizon.
        Used for transfer optimization.
        """
        if player_id not in predictions:
            return 0

        player_preds = predictions[player_id]
        total_xP = 0

        for gw in range(current_gw + 1, current_gw + horizon + 1):
            total_xP += player_preds.get(gw, 0)

        return total_xP

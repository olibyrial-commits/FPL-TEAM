import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any
import logging
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


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
    """

    POSITION_MAP = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}

    def __init__(self):
        self.model: Optional[GradientBoostingRegressor] = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self._player_cache: Dict[int, Dict[int, float]] = {}

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

            # Ensure all numeric fields are properly converted
            def safe_float(val, default=0.0):
                if val is None:
                    return default
                try:
                    return float(val)
                except (TypeError, ValueError):
                    return default

            xG = safe_float(player.get("expected_goals", 0))
            xA = safe_float(player.get("expected_assists", 0))
            xGI = safe_float(player.get("expected_goal_involvement", 0))
            minutes = safe_float(player.get("minutes", 0))
            form = safe_float(player.get("form", 0))
            points_pg = safe_float(player.get("points_per_game", 0))
            threat = safe_float(player.get("threat", 0))
            creativity = safe_float(player.get("creativity", 0))
            ICT = safe_float(player.get("ICT_index", 0))

            team_strength = team.get("strength", 1000)
            attack_home = team.get("strength_attack_home", 1000)
            attack_away = team.get("strength_attack_away", 1000)
            defence_home = team.get("strength_defence_home", 1000)
            defence_away = team.get("strength_defence_away", 1000)

            position_multiplier = {1: 0.6, 2: 0.7, 3: 0.85, 4: 0.8}.get(position, 0.7)

            form_factor = max(0, min(form, 10)) / 10
            minutes_factor = min(minutes / 1800, 1.0) if minutes else 0.0

            base_points = (
                points_pg * 0.3
                + xGI * position_multiplier * 4
                + form_factor * 1.5
                + minutes_factor * 0.5
                + (threat + creativity) / 200 * position_multiplier
            )

            for gw in range(1, 6):
                is_home = gw % 2 == 1
                opp_strength = (attack_home if is_home else attack_away) / 1000
                def_strength = (defence_home if is_home else defence_away) / 1000

                fixture_difficulty = 3 - (def_strength - 0.5) * 2
                fixture_difficulty = max(1, min(5, fixture_difficulty))

                home_bonus = 0.2 if is_home else 0

                fdr_impact = (3 - fixture_difficulty) * 0.5

                predicted_points = base_points * (1 + home_bonus + fdr_impact)

                noise = np.random.normal(0, 1.5)
                predicted_points = max(0, predicted_points + noise)

                training_data.append(
                    {
                        "player_id": player_id,
                        "gameweek": gw,
                        "position": position,
                        "xG": xG,
                        "xA": xA,
                        "xGI": xGI,
                        "minutes": minutes,
                        "form": form,
                        "points_per_game": points_pg,
                        "threat": threat,
                        "creativity": creativity,
                        "ICT": ICT,
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
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            min_samples_split=10,
            min_samples_leaf=5,
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
        Predict points for a single player in a specific gameweek.
        """
        if not self.is_trained:
            return player.get("points_per_game", 0) or 0

        position = player["element_type"]

        xG = player.get("expected_goals", 0) or 0
        xA = player.get("expected_assists", 0) or 0
        xGI = player.get("expected_goal_involvement", 0) or 0
        minutes = player.get("minutes", 0)
        form = player.get("form", 0) or 0
        points_pg = player.get("points_per_game", 0) or 0
        threat = player.get("threat", 0) or 0
        creativity = player.get("creativity", 0) or 0
        ICT = player.get("ICT_index", 0) or 0

        team_strength = team.get("strength", 1000) if team else 1000
        attack_home = team.get("strength_attack_home", 1000) if team else 1000
        attack_away = team.get("strength_attack_away", 1000) if team else 1000
        defence_home = team.get("strength_defence_home", 1000) if team else 1000
        defence_away = team.get("strength_defence_away", 1000) if team else 1000

        opp_attack = attack_home if is_home else attack_away
        opp_defence = defence_home if is_home else defence_away

        opp_attack_norm = opp_attack / 1000
        opp_defence_norm = opp_defence / 1000

        features = np.array(
            [
                [
                    position,
                    xG,
                    xA,
                    xGI,
                    minutes,
                    form,
                    points_pg,
                    threat,
                    creativity,
                    ICT,
                    team_strength,
                    fixture_difficulty,
                    int(is_home),
                    opp_attack_norm,
                    opp_defence_norm,
                ]
            ]
        )

        features_scaled = self.scaler.transform(features)

        if self.model is None:
            return player.get("points_per_game", 0) or 0

        predicted_points = self.model.predict(features_scaled)[0]

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
            if player.get("status") == "x":
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

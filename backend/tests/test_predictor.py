import pytest
import sys
import os
from unittest.mock import Mock, AsyncMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.predictor import (
    PointPredictor,
    normalize_per_game,
    safe_float,
    safe_int,
)


class TestNormalization:
    """Test the normalization functions."""

    def test_normalize_per_game_basic(self):
        """Test basic per-game normalization."""
        assert normalize_per_game(10, 900) == pytest.approx(1.0)
        assert normalize_per_game(20, 900) == pytest.approx(2.0)
        assert normalize_per_game(5, 450) == pytest.approx(1.0)

    def test_normalize_per_game_zero_minutes(self):
        """Test handling of zero minutes."""
        assert normalize_per_game(10, 0) == 0.0
        assert normalize_per_game(10, -100) == 0.0

    def test_normalize_per_game_zero_value(self):
        """Test handling of zero value."""
        assert normalize_per_game(0, 900) == 0.0

    def test_normalize_per_game_partial_game(self):
        """Test normalization with partial game time."""
        assert normalize_per_game(0.5, 45) == pytest.approx(1.0)

    def test_safe_float(self):
        """Test safe float conversion."""
        assert safe_float(5) == 5.0
        assert safe_float("5.5") == 5.5
        assert safe_float(None) == 0.0
        assert safe_float("invalid") == 0.0
        assert safe_float(5, default=10.0) == 5.0

    def test_safe_int(self):
        """Test safe int conversion."""
        assert safe_int(5) == 5
        assert safe_int("5") == 5
        assert safe_int(None) == 0
        assert safe_int("invalid") == 0


class TestPointPredictor:
    """Test the PointPredictor model."""

    @pytest.fixture
    def mock_players(self):
        """Create mock player data."""
        return [
            {
                "id": 1,
                "team": 1,
                "element_type": 1,
                "web_name": "TestGK",
                "expected_goals": 0,
                "expected_assists": 0,
                "expected_goal_involvement": 0,
                "minutes": 1800,
                "form": 5.0,
                "points_per_game": 4.5,
                "threat": 10.0,
                "creativity": 5.0,
                "ICT_index": 15.0,
                "status": "a",
            },
            {
                "id": 2,
                "team": 1,
                "element_type": 2,
                "web_name": "TestDEF",
                "expected_goals": 2,
                "expected_assists": 1,
                "expected_goal_involvement": 3,
                "minutes": 1800,
                "form": 6.0,
                "points_per_game": 5.5,
                "threat": 50.0,
                "creativity": 100.0,
                "ICT_index": 150.0,
                "status": "a",
            },
            {
                "id": 3,
                "team": 1,
                "element_type": 3,
                "web_name": "TestMID",
                "expected_goals": 8,
                "expected_assists": 6,
                "expected_goal_involvement": 14,
                "minutes": 1800,
                "form": 8.0,
                "points_per_game": 7.5,
                "threat": 500.0,
                "creativity": 400.0,
                "ICT_index": 900.0,
                "status": "a",
            },
            {
                "id": 4,
                "team": 1,
                "element_type": 4,
                "web_name": "TestFWD",
                "expected_goals": 15,
                "expected_assists": 3,
                "expected_goal_involvement": 18,
                "minutes": 1800,
                "form": 9.0,
                "points_per_game": 8.5,
                "threat": 800.0,
                "creativity": 100.0,
                "ICT_index": 900.0,
                "status": "a",
            },
        ]

    @pytest.fixture
    def mock_teams(self):
        """Create mock team data."""
        return [
            {
                "id": 1,
                "name": "Team 1",
                "short_name": "T1",
                "strength": 1000,
                "strength_overall_home": 1050,
                "strength_overall_away": 950,
                "strength_attack_home": 1000,
                "strength_attack_away": 900,
                "strength_defence_home": 1000,
                "strength_defence_away": 1000,
            }
        ]

    @pytest.fixture
    def mock_fixtures(self):
        """Create mock fixtures."""
        return [
            {
                "id": 1,
                "event": 1,
                "team_h": 1,
                "team_a": 2,
                "team_h_difficulty": 2,
                "team_a_difficulty": 4,
            }
        ]

    def test_predictor_initialization(self):
        """Test predictor initializes correctly."""
        predictor = PointPredictor()
        assert predictor.model is None
        assert predictor.is_trained is False

    def test_train_model(self, mock_players, mock_teams, mock_fixtures):
        """Test model training."""
        predictor = PointPredictor()
        predictor.train(mock_players, mock_teams, mock_fixtures)

        assert predictor.is_trained is True
        assert predictor.model is not None

    def test_predict_player_gw_points(self, mock_players, mock_teams, mock_fixtures):
        """Test single player prediction."""
        predictor = PointPredictor()
        predictor.train(mock_players, mock_teams, mock_fixtures)

        player = mock_players[2]  # MID
        team = mock_teams[0]

        pred = predictor.predict_player_gw_points(
            player=player,
            team=team,
            fixture_difficulty=3,
            is_home=True,
            gameweek=1,
        )

        assert isinstance(pred, float)
        assert pred >= 0
        assert pred <= 20

    def test_predictions_are_reasonable(self, mock_players, mock_teams, mock_fixtures):
        """Test that predictions are in reasonable range."""
        predictor = PointPredictor()
        predictor.train(mock_players, mock_teams, mock_fixtures)

        predictions = predictor.predict_all_players(
            players=mock_players,
            teams=mock_teams,
            fixtures=mock_fixtures,
            current_gw=1,
            horizon=4,
        )

        for player_id, gw_preds in predictions.items():
            for gw, pred in gw_preds.items():
                assert pred >= 0, f"Negative prediction for player {player_id} GW {gw}"
                assert pred <= 20, (
                    f"Excessive prediction for player {player_id} GW {gw}: {pred}"
                )

    def test_predictions_vary_by_fixture(self, mock_players, mock_teams, mock_fixtures):
        """Test that predictions differ based on fixture difficulty."""
        predictor = PointPredictor()
        predictor.train(mock_players, mock_teams, mock_fixtures)

        player = mock_players[2]
        team = mock_teams[0]

        easy_fixture = predictor.predict_player_gw_points(
            player, team, fixture_difficulty=1, is_home=True, gameweek=1
        )
        hard_fixture = predictor.predict_player_gw_points(
            player, team, fixture_difficulty=5, is_home=False, gameweek=1
        )

        assert easy_fixture > hard_fixture

    def test_injured_player_prediction(self, mock_players, mock_teams, mock_fixtures):
        """Test that injured players get zero prediction."""
        mock_players[0]["status"] = "x"
        mock_players[0]["id"] = 999

        predictor = PointPredictor()
        predictor.train(mock_players, mock_teams, mock_fixtures)

        predictions = predictor.predict_all_players(
            players=mock_players,
            teams=mock_teams,
            fixtures=mock_fixtures,
            current_gw=1,
            horizon=1,
        )

        assert predictions[999][2] == 0

    def test_predict_all_players_structure(
        self, mock_players, mock_teams, mock_fixtures
    ):
        """Test predict_all_players returns correct structure."""
        predictor = PointPredictor()
        predictor.train(mock_players, mock_teams, mock_fixtures)

        predictions = predictor.predict_all_players(
            players=mock_players,
            teams=mock_teams,
            fixtures=mock_fixtures,
            current_gw=1,
            horizon=4,
        )

        assert isinstance(predictions, dict)
        assert len(predictions) == len(mock_players)

        for player_id, gw_preds in predictions.items():
            assert isinstance(gw_preds, dict)
            assert len(gw_preds) == 4
            for gw in [2, 3, 4, 5]:
                assert gw in gw_preds

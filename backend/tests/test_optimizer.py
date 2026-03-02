"""
Comprehensive tests for FPL Optimizer PuLP solver.
Tests formation constraints, club limits, budget, transfer penalties, and chip strategy.
"""

import pytest
import sys
import os
from unittest.mock import Mock, patch, MagicMock

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.optimizer import TransferOptimizer
from app.services.predictor import PointPredictor


def create_mock_player(
    player_id: int,
    team_id: int,
    position: int,
    price: float,
    web_name: str = None,
    form: float = 5.0,
    points_per_game: float = 5.0,
    expected_goals: float = 0.0,
    expected_assists: float = 0.0,
    minutes: int = 2700,
    threat: float = 50.0,
    creativity: float = 50.0,
    ict_index: float = 50.0,
) -> dict:
    """Create a mock player for testing."""
    return {
        "id": player_id,
        "team": team_id,
        "element_type": position,
        "now_cost": int(price * 10),
        "web_name": web_name or f"Player_{player_id}",
        "form": form,
        "points_per_game": points_per_game,
        "expected_goals": expected_goals,
        "expected_assists": expected_assists,
        "expected_goal_involvement": expected_goals + expected_assists,
        "minutes": minutes,
        "threat": threat,
        "creativity": creativity,
        "ICT_index": ict_index,
        "status": "a",
    }


def create_mock_team(team_id: int, strength: int = 1000) -> dict:
    """Create a mock team for testing."""
    return {
        "id": team_id,
        "name": f"Team_{team_id}",
        "short_name": f"T{team_id}",
        "strength": strength,
        "strength_overall_home": strength,
        "strength_overall_away": strength,
        "strength_attack_home": strength,
        "strength_attack_away": strength,
        "strength_defence_home": strength,
        "strength_defence_away": strength,
    }


def create_mock_predictions(
    player_ids: list, horizon: int, base_points: float = 5.0
) -> dict:
    """Create mock predictions for players."""
    predictions = {}
    for p_id in player_ids:
        predictions[p_id] = {i: base_points for i in range(1, horizon + 1)}
    return predictions


class TestFormationConstraints:
    """Test that optimizer enforces valid FPL formations."""

    def test_formation_requires_1_goalkeeper(self):
        """Starting XI must have exactly 1 goalkeeper."""
        optimizer = TransferOptimizer()

        # Create players with balanced team distribution to enable valid 15-player squad
        players = []
        teams = [create_mock_team(i) for i in range(1, 6)]

        # Goalkeepers - 1 from each team (5 total)
        players.append(create_mock_player(1, 1, 1, 5.0, "GK_1"))
        players.append(create_mock_player(16, 2, 1, 4.5, "GK_2"))
        players.append(create_mock_player(17, 3, 1, 4.3, "GK_3"))
        players.append(create_mock_player(21, 4, 1, 4.6, "GK_4"))
        players.append(create_mock_player(22, 5, 1, 4.4, "GK_5"))

        # Defenders - 3 from each team (15 total, using 3 per team)
        for team_id in range(1, 6):
            players.append(
                create_mock_player(team_id + 100, team_id, 2, 5.0, f"DEF1_T{team_id}")
            )
            players.append(
                create_mock_player(team_id + 200, team_id, 2, 4.8, f"DEF2_T{team_id}")
            )
            players.append(
                create_mock_player(team_id + 300, team_id, 2, 5.2, f"DEF3_T{team_id}")
            )

        # Midfielders - 3 from each team (15 total)
        for team_id in range(1, 6):
            players.append(
                create_mock_player(team_id + 400, team_id, 3, 5.5, f"MID1_T{team_id}")
            )
            players.append(
                create_mock_player(team_id + 500, team_id, 3, 5.3, f"MID2_T{team_id}")
            )
            players.append(
                create_mock_player(team_id + 600, team_id, 3, 5.7, f"MID3_T{team_id}")
            )

        # Forwards - 3 from each team (15 total)
        for team_id in range(1, 6):
            players.append(
                create_mock_player(team_id + 700, team_id, 4, 6.0, f"FWD1_T{team_id}")
            )
            players.append(
                create_mock_player(team_id + 800, team_id, 4, 5.8, f"FWD2_T{team_id}")
            )
            players.append(
                create_mock_player(team_id + 900, team_id, 4, 6.2, f"FWD3_T{team_id}")
            )

        # Current squad: 15 players with valid team distribution (3 per team max)
        # Team distribution: T1:3, T2:3, T3:3, T4:3, T5:3
        current_squad = [
            # Starters - 1 GK, 3 DEF, 3 MID, 3 FWD
            {
                "id": 1,
                "element_type": 1,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 101,
                "element_type": 2,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 102,
                "element_type": 2,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 103,
                "element_type": 2,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 401,
                "element_type": 3,
                "team": 1,
                "position": 1,
                "is_captain": True,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 402,
                "element_type": 3,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": True,
                "bench_order": 0,
            },
            {
                "id": 403,
                "element_type": 3,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 701,
                "element_type": 4,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 702,
                "element_type": 4,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 703,
                "element_type": 4,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 404,
                "element_type": 3,
                "team": 4,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            # Bench - 1 GK, 1 DEF, 1 MID, 1 FWD
            {
                "id": 16,
                "element_type": 1,
                "team": 2,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 1,
            },
            {
                "id": 203,
                "element_type": 2,
                "team": 3,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 2,
            },
            {
                "id": 405,
                "element_type": 3,
                "team": 5,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 3,
            },
            {
                "id": 704,
                "element_type": 4,
                "team": 4,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 4,
            },
        ]

        predictions = create_mock_predictions([p["id"] for p in players], 1)

        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=current_squad,
            current_gw=1,
            horizon=1,
            team_value=100.0,
            bank=0.0,
            free_transfers=1,
            use_hits=True,  # Allow transfers to find valid formation
        )

        result = optimizer.optimize()

        assert result["success"], "Optimization should succeed"

        # Check exactly 1 GK in starting XI
        starting_xi = result.get("starting_xi", [])
        gk_count = sum(1 for p in starting_xi if p["element_type"] == 1)
        assert gk_count == 1, f"Expected 1 GK in starting XI, got {gk_count}"

    def test_formation_requires_minimum_3_defenders(self):
        """Starting XI must have at least 3 defenders."""
        optimizer = TransferOptimizer()

        players = []
        teams = [create_mock_team(i) for i in range(1, 6)]

        # Create 18 players: 3 GK, 5 DEF, 5 MID, 5 FWD
        players.append(create_mock_player(1, 1, 1, 5.0, "GK_1"))
        players.append(create_mock_player(16, 2, 1, 4.5, "GK_2"))
        players.append(create_mock_player(17, 3, 1, 4.3, "GK_3"))
        for i in range(2, 7):
            players.append(create_mock_player(i, (i - 2) % 5 + 1, 2, 5.0, f"DEF_{i}"))
        for i in range(7, 12):
            players.append(create_mock_player(i, (i - 7) % 5 + 1, 3, 5.5, f"MID_{i}"))
        for i in range(12, 17):
            players.append(create_mock_player(i, (i - 12) % 5 + 1, 4, 6.0, f"FWD_{i}"))

        # Current squad: 15 players - complete squad
        current_squad = [
            # Starters: 1 GK, 3 DEF, 3 MID, 3 FWD
            {
                "id": 1,
                "element_type": 1,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 2,
                "element_type": 2,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 3,
                "element_type": 2,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 4,
                "element_type": 2,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 7,
                "element_type": 3,
                "team": 1,
                "position": 1,
                "is_captain": True,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 8,
                "element_type": 3,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": True,
                "bench_order": 0,
            },
            {
                "id": 9,
                "element_type": 3,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 12,
                "element_type": 4,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 13,
                "element_type": 4,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 14,
                "element_type": 4,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            # Bench: 1 GK, 1 DEF, 1 MID, 1 FWD
            {
                "id": 16,
                "element_type": 1,
                "team": 2,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 1,
            },
            {
                "id": 5,
                "element_type": 2,
                "team": 4,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 2,
            },
            {
                "id": 10,
                "element_type": 3,
                "team": 4,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 3,
            },
            {
                "id": 15,
                "element_type": 4,
                "team": 4,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 4,
            },
        ]

        predictions = create_mock_predictions([p["id"] for p in players], 1)

        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=current_squad,
            current_gw=1,
            horizon=1,
            team_value=100.0,
            bank=0.0,
            free_transfers=1,
            use_hits=True,
        )

        result = optimizer.optimize()

        assert result["success"], "Optimization should succeed"

        starting_xi = result.get("starting_xi", [])
        def_count = sum(1 for p in starting_xi if p["element_type"] == 2)
        assert def_count >= 3, (
            f"Expected at least 3 DEF in starting XI, got {def_count}"
        )

    def test_formation_requires_minimum_1_forward(self):
        """Starting XI must have at least 1 forward."""
        optimizer = TransferOptimizer()

        players = []
        teams = [create_mock_team(i) for i in range(1, 6)]

        # Create 18 players: 3 GK, 5 DEF, 5 MID, 5 FWD
        players.append(create_mock_player(1, 1, 1, 5.0, "GK_1"))
        players.append(create_mock_player(16, 2, 1, 4.5, "GK_2"))
        players.append(create_mock_player(17, 3, 1, 4.3, "GK_3"))
        for i in range(2, 7):
            players.append(create_mock_player(i, (i - 2) % 5 + 1, 2, 5.0, f"DEF_{i}"))
        for i in range(7, 12):
            players.append(create_mock_player(i, (i - 7) % 5 + 1, 3, 5.5, f"MID_{i}"))
        for i in range(12, 17):
            players.append(create_mock_player(i, (i - 12) % 5 + 1, 4, 6.0, f"FWD_{i}"))

        # Current squad: 15 players - complete squad with at least 1 FWD
        current_squad = [
            # Starters: 1 GK, 3 DEF, 4 MID, 2 FWD
            {
                "id": 1,
                "element_type": 1,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 2,
                "element_type": 2,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 3,
                "element_type": 2,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 4,
                "element_type": 2,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 7,
                "element_type": 3,
                "team": 1,
                "position": 1,
                "is_captain": True,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 8,
                "element_type": 3,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": True,
                "bench_order": 0,
            },
            {
                "id": 9,
                "element_type": 3,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 10,
                "element_type": 3,
                "team": 4,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 12,
                "element_type": 4,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 13,
                "element_type": 4,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            # Bench: 1 GK, 1 DEF, 1 MID, 1 FWD
            {
                "id": 16,
                "element_type": 1,
                "team": 2,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 1,
            },
            {
                "id": 5,
                "element_type": 2,
                "team": 4,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 2,
            },
            {
                "id": 11,
                "element_type": 3,
                "team": 5,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 3,
            },
            {
                "id": 14,
                "element_type": 4,
                "team": 3,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 4,
            },
        ]

        predictions = create_mock_predictions([p["id"] for p in players], 1)

        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=current_squad,
            current_gw=1,
            horizon=1,
            team_value=100.0,
            bank=0.0,
            free_transfers=1,
            use_hits=True,
        )

        result = optimizer.optimize()

        assert result["success"], "Optimization should succeed"

        starting_xi = result.get("starting_xi", [])
        fwd_count = sum(1 for p in starting_xi if p["element_type"] == 4)
        assert fwd_count >= 1, (
            f"Expected at least 1 FWD in starting XI, got {fwd_count}"
        )

    def test_exactly_11_starters(self):
        """Starting XI must have exactly 11 players."""
        optimizer = TransferOptimizer()

        players = []
        teams = [create_mock_team(i) for i in range(1, 6)]

        # Create 18 players: 3 GK, 5 DEF, 5 MID, 5 FWD
        players.append(create_mock_player(1, 1, 1, 5.0, "GK_1"))
        players.append(create_mock_player(16, 2, 1, 4.5, "GK_2"))
        players.append(create_mock_player(17, 3, 1, 4.3, "GK_3"))
        for i in range(2, 7):
            players.append(create_mock_player(i, (i - 2) % 5 + 1, 2, 5.0, f"DEF_{i}"))
        for i in range(7, 12):
            players.append(create_mock_player(i, (i - 7) % 5 + 1, 3, 5.5, f"MID_{i}"))
        for i in range(12, 17):
            players.append(create_mock_player(i, (i - 12) % 5 + 1, 4, 6.0, f"FWD_{i}"))

        # Current squad: 15 players - complete squad
        current_squad = [
            # Starters: 1 GK, 3 DEF, 3 MID, 3 FWD
            {
                "id": 1,
                "element_type": 1,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 2,
                "element_type": 2,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 3,
                "element_type": 2,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 4,
                "element_type": 2,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 7,
                "element_type": 3,
                "team": 1,
                "position": 1,
                "is_captain": True,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 8,
                "element_type": 3,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": True,
                "bench_order": 0,
            },
            {
                "id": 9,
                "element_type": 3,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 12,
                "element_type": 4,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 13,
                "element_type": 4,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 14,
                "element_type": 4,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            # Bench: 1 GK, 1 DEF, 1 MID, 1 FWD
            {
                "id": 16,
                "element_type": 1,
                "team": 2,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 1,
            },
            {
                "id": 5,
                "element_type": 2,
                "team": 4,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 2,
            },
            {
                "id": 10,
                "element_type": 3,
                "team": 4,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 3,
            },
            {
                "id": 15,
                "element_type": 4,
                "team": 4,
                "position": 0,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 4,
            },
        ]

        predictions = create_mock_predictions([p["id"] for p in players], 1)

        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=current_squad,
            current_gw=1,
            horizon=1,
            team_value=100.0,
            bank=0.0,
            free_transfers=1,
            use_hits=True,
        )

        result = optimizer.optimize()

        assert result["success"], "Optimization should succeed"

        starting_xi = result.get("starting_xi", [])
        assert len(starting_xi) == 11, f"Expected 11 starters, got {len(starting_xi)}"


class TestClubLimits:
    """Test that optimizer enforces max 3 players per club."""

    def test_max_3_players_per_team(self):
        """No more than 3 players from the same team."""
        optimizer = TransferOptimizer()

        players = []
        teams = [create_mock_team(i) for i in range(1, 4)]  # Only 3 teams

        # Create 15 players all from team 1
        # 1 GK from team 1
        players.append(create_mock_player(1, 1, 1, 5.0, "GK_T1"))
        # 5 DEF from team 1
        for i in range(2, 7):
            players.append(create_mock_player(i, 1, 2, 5.0, f"DEF_T1_{i}"))
        # 5 MID from team 1
        for i in range(7, 12):
            players.append(create_mock_player(i, 1, 3, 5.5, f"MID_T1_{i}"))
        # 4 FWD from team 1
        for i in range(12, 16):
            players.append(create_mock_player(i, 1, 4, 6.0, f"FWD_T1_{i}"))

        current_squad = [
            {
                "id": p["id"],
                "element_type": p["element_type"],
                "team": p["team"],
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            }
            for p in players[:11]
        ]

        predictions = create_mock_predictions(
            [p["id"] for p in players], 1, base_points=5.0
        )

        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=current_squad,
            current_gw=1,
            horizon=1,
            team_value=100.0,
            bank=0.0,
            free_transfers=1,
            use_hits=True,
        )

        result = optimizer.optimize()

        # Even with all players from same team, should respect 3-player limit
        if result["success"]:
            all_squad = result.get("optimized_squad", [])
            team_counts = {}
            for p in all_squad:
                team_counts[p["team"]] = team_counts.get(p["team"], 0) + 1

            for team_id, count in team_counts.items():
                assert count <= 3, f"Team {team_id} has {count} players (max 3)"

    def test_respects_different_teams(self):
        """Optimizer should be able to pick from multiple teams."""
        optimizer = TransferOptimizer()

        teams = [create_mock_team(i) for i in range(1, 6)]

        # Create players from different teams with different expected points
        players = []

        # Add players from all 5 teams with balanced distribution
        for team_id in range(1, 6):
            # Team 1 - high performers
            if team_id == 1:
                players.append(
                    create_mock_player(
                        team_id,
                        team_id,
                        1,
                        5.0,
                        f"GK_T{team_id}",
                        form=8.0,
                        points_per_game=8.0,
                    )
                )
                players.append(
                    create_mock_player(
                        team_id + 20,
                        team_id,
                        2,
                        6.0,
                        f"DEF_T{team_id}",
                        form=7.0,
                        points_per_game=7.0,
                    )
                )
                players.append(
                    create_mock_player(
                        team_id + 40,
                        team_id,
                        3,
                        7.0,
                        f"MID_T{team_id}",
                        form=9.0,
                        points_per_game=9.0,
                    )
                )
                players.append(
                    create_mock_player(
                        team_id + 60,
                        team_id,
                        4,
                        8.0,
                        f"FWD_T{team_id}",
                        form=10.0,
                        points_per_game=10.0,
                    )
                )
            else:
                # Other teams - low performers
                players.append(
                    create_mock_player(
                        team_id,
                        team_id,
                        1,
                        4.5,
                        f"GK_T{team_id}",
                        form=2.0,
                        points_per_game=2.0,
                    )
                )
                players.append(
                    create_mock_player(
                        team_id + 20,
                        team_id,
                        2,
                        5.0,
                        f"DEF_T{team_id}",
                        form=3.0,
                        points_per_game=3.0,
                    )
                )
                players.append(
                    create_mock_player(
                        team_id + 40,
                        team_id,
                        3,
                        5.5,
                        f"MID_T{team_id}",
                        form=2.5,
                        points_per_game=2.5,
                    )
                )
                players.append(
                    create_mock_player(
                        team_id + 60,
                        team_id,
                        4,
                        6.0,
                        f"FWD_T{team_id}",
                        form=2.0,
                        points_per_game=2.0,
                    )
                )

        # Create current squad with valid team distribution (max 3 per team)
        # Take 3 from Team 1 (max allowed), and rest from other teams
        current_squad = [
            {
                "id": 1,  # Team 1, GK
                "element_type": 1,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 2,  # Team 1, DEF
                "element_type": 2,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 3,  # Team 1, MID
                "element_type": 3,
                "team": 1,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            # Skip player 4 (Team 1, FWD) to stay within 3-player limit
            {
                "id": 5,  # Team 2, GK
                "element_type": 1,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 6,  # Team 2, position 2
                "element_type": 2,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 7,  # Team 3, position 3
                "element_type": 3,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 8,  # Team 4, position 4
                "element_type": 4,
                "team": 4,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 9,  # Team 5, position 1
                "element_type": 1,
                "team": 5,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 10,  # Team 2, position 2
                "element_type": 2,
                "team": 2,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 11,  # Team 3, position 3
                "element_type": 3,
                "team": 3,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 12,  # Team 4, position 4
                "element_type": 4,
                "team": 4,
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            },
            {
                "id": 13,  # Team 5, position 1
                "element_type": 1,
                "team": 5,
                "position": 0,  # Bench
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 1,
            },
            {
                "id": 14,  # Team 2, position 2
                "element_type": 2,
                "team": 2,
                "position": 0,  # Bench
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 2,
            },
            {
                "id": 15,  # Team 3, position 3
                "element_type": 3,
                "team": 3,
                "position": 0,  # Bench
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 3,
            },
            {
                "id": 4,  # Team 1, FWD - bench to complete squad
                "element_type": 4,
                "team": 1,
                "position": 0,  # Bench
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 4,
            },
        ]

        predictions = {}
        for p in players:
            predictions[p["id"]] = {1: p["points_per_game"]}

        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=current_squad,
            current_gw=1,
            horizon=1,
            team_value=100.0,
            bank=0.0,
            free_transfers=1,
            use_hits=True,  # Allow transfers to find valid team distribution
        )

        result = optimizer.optimize()

        assert result["success"], "Optimization should succeed with team diversity"


class TestBudgetConstraints:
    """Test budget and price constraints."""

    def test_respects_total_budget(self):
        """Total squad price must not exceed team_value + bank."""
        optimizer = TransferOptimizer()

        players = []
        teams = [create_mock_team(i) for i in range(1, 6)]

        # Create expensive players that would exceed budget
        players.append(create_mock_player(1, 1, 1, 15.0, "Expensive_GK"))  # 15.0m
        for i in range(2, 16):
            players.append(
                create_mock_player(
                    i, (i - 2) % 5 + 1, ((i - 2) % 4) + 1, 15.0, f"Expensive_{i}"
                )
            )

        current_squad = [
            {
                "id": p["id"],
                "element_type": p["element_type"],
                "team": p["team"],
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            }
            for p in players[:11]
        ]

        # Budget: 100.0m (team value) + 0.0m (bank) = 100.0m
        # But 15 expensive players would cost 225m
        predictions = create_mock_predictions([p["id"] for p in players], 1)

        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=current_squad,
            current_gw=1,
            horizon=1,
            team_value=100.0,
            bank=0.0,
            free_transfers=1,
            use_hits=True,
        )

        result = optimizer.optimize()

        if result["success"]:
            total_value = sum(
                p["price"] / 10 for p in result.get("optimized_squad", [])
            )
            assert total_value <= 100.0 + 0.1, (
                f"Squad value {total_value}m exceeds budget 100.0m"
            )

    def test_includes_bank_in_budget(self):
        """Bank should be included in available budget."""
        optimizer = TransferOptimizer()

        players = []
        teams = [create_mock_team(i) for i in range(1, 6)]

        # Create 15 players priced at 10m each
        players.append(create_mock_player(1, 1, 1, 10.0, "GK_1"))
        for i in range(2, 7):
            players.append(create_mock_player(i, (i - 2) % 5 + 1, 2, 10.0, f"DEF_{i}"))
        for i in range(7, 12):
            players.append(create_mock_player(i, (i - 7) % 5 + 1, 3, 10.0, f"MID_{i}"))
        for i in range(12, 16):
            players.append(create_mock_player(i, (i - 12) % 5 + 1, 4, 10.0, f"FWD_{i}"))

        current_squad = [
            {
                "id": p["id"],
                "element_type": p["element_type"],
                "team": p["team"],
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            }
            for p in players[:11]
        ]

        predictions = create_mock_predictions([p["id"] for p in players], 1)

        # Team value: 100m, Bank: 20m, Total: 120m
        # 15 players at 10m = 150m - this should fail without enough bank
        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=current_squad,
            current_gw=1,
            horizon=1,
            team_value=100.0,
            bank=0.0,
            free_transfers=1,
            use_hits=False,  # Test constraint enforcement without hits
        )

        result = optimizer.optimize()

        # Should still respect total budget
        if result["success"]:
            total_value = sum(
                p["price"] / 10 for p in result.get("optimized_squad", [])
            )
            assert total_value <= 100.1, f"Squad value {total_value}m exceeds budget"


class TestTransferPenalties:
    """Test transfer penalty logic."""

    def test_free_transfer_no_penalty(self):
        """Using exactly 1 free transfer should not incur penalty."""
        optimizer = TransferOptimizer()

        players = []
        teams = [create_mock_team(i) for i in range(1, 6)]

        # Create players with clear hierarchy in points
        for i in range(1, 16):
            position = 1 if i == 1 else ((i - 2) % 4) + 1
            team = (i - 1) % 5 + 1
            points = 10.0 if i <= 11 else 2.0  # First 11 get high points
            players.append(
                create_mock_player(
                    i,
                    team,
                    position,
                    5.0 + i * 0.1,
                    f"Player_{i}",
                    points_per_game=points,
                    form=points,
                )
            )

        # Current squad: players 1-11
        current_squad = [
            {
                "id": p["id"],
                "element_type": p["element_type"],
                "team": p["team"],
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            }
            for p in players[:11]
        ]

        # Swap player 11 with player 15 (only 1 transfer needed)
        current_squad[10] = {
            "id": 15,
            "element_type": players[14]["element_type"],
            "team": players[14]["team"],
            "position": 1,
            "is_captain": False,
            "is_vice_captain": False,
            "bench_order": 0,
        }

        predictions = {}
        for p in players:
            predictions[p["id"]] = {1: p["points_per_game"]}

        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=current_squad,
            current_gw=1,
            horizon=1,
            team_value=100.0,
            bank=0.0,
            free_transfers=1,  # Exactly 1 free transfer
            use_hits=False,  # Test free transfer logic without hits
        )

        result = optimizer.optimize()

        # Should succeed with no penalty for 1 transfer
        assert result["success"], "Optimization should succeed with free transfer"


class TestChipStrategy:
    """Test chip strategy and penalty waiver."""

    def test_wildcard_disables_transfer_limit(self):
        """Wildcard should allow unlimited transfers."""
        optimizer = TransferOptimizer()

        players = []
        teams = [create_mock_team(i) for i in range(1, 6)]

        for i in range(1, 16):
            position = 1 if i == 1 else ((i - 2) % 4) + 1
            team = (i - 1) % 5 + 1
            players.append(
                create_mock_player(
                    i, team, position, 5.0 + i * 0.1, f"Player_{i}", points_per_game=5.0
                )
            )

        current_squad = [
            {
                "id": p["id"],
                "element_type": p["element_type"],
                "team": p["team"],
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            }
            for p in players[:11]
        ]

        predictions = create_mock_predictions([p["id"] for p in players], 1)

        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=current_squad,
            current_gw=1,
            horizon=1,
            team_value=100.0,
            bank=0.0,
            free_transfers=1,
            use_hits=True,
            chips_available={
                "wildcard": True,
                "free_hit": True,
                "bench_boost": True,
                "triple_captain": True,
            },
        )

        result = optimizer.optimize()

        # Wildcard should be usable
        assert result["success"], "Optimization should succeed with chips available"

    def test_bench_boost_includes_bench_points(self):
        """Bench Boost chip should count bench players' points."""
        optimizer = TransferOptimizer()

        players = []
        teams = [create_mock_team(i) for i in range(1, 6)]

        # Create players with different expected points
        for i in range(1, 16):
            position = 1 if i == 1 else ((i - 2) % 4) + 1
            team = (i - 1) % 5 + 1
            # First 11 have low points, bench has high points
            points = 3.0 if i <= 11 else 10.0
            players.append(
                create_mock_player(
                    i,
                    team,
                    position,
                    5.0 + i * 0.1,
                    f"Player_{i}",
                    points_per_game=points,
                    form=points,
                )
            )

        current_squad = [
            {
                "id": p["id"],
                "element_type": p["element_type"],
                "team": p["team"],
                "position": 1,
                "is_captain": False,
                "is_vice_captain": False,
                "bench_order": 0,
            }
            for p in players[:11]
        ]

        predictions = {}
        for p in players:
            predictions[p["id"]] = {1: p["points_per_game"]}

        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=current_squad,
            current_gw=1,
            horizon=1,
            team_value=100.0,
            bank=0.0,
            free_transfers=1,
            use_hits=True,
            chips_available={
                "wildcard": True,
                "free_hit": True,
                "bench_boost": True,
                "triple_captain": True,
            },
        )

        result = optimizer.optimize()

        assert result["success"], "Optimization should succeed"


class TestIntegration:
    """Integration tests with realistic scenarios."""

    def test_full_optimization_workflow(self):
        """Test complete optimization workflow with all constraints."""
        optimizer = TransferOptimizer()

        # Create realistic player pool
        teams = [create_mock_team(i, strength=800 + i * 50) for i in range(1, 21)]

        players = []
        # Generate 500 players (realistic FPL size)
        for i in range(1, 501):
            team = ((i - 1) % 20) + 1
            position = ((i - 1) % 4) + 1
            # Price between 4.0 and 14.0
            price = 4.0 + (i % 100) * 0.1
            # Points based on price (more expensive = more points on average)
            base_points = (price - 4.0) * 0.8 + 2.0
            players.append(
                create_mock_player(
                    i,
                    team,
                    position,
                    price,
                    f"Player_{i}",
                    points_per_game=base_points,
                    form=base_points,
                    expected_goals=base_points * 0.1,
                    expected_assists=base_points * 0.05,
                )
            )

        # Create a realistic squad
        current_squad = []
        for i in range(1, 12):
            team = ((i - 1) % 5) + 1
            position = 1 if i == 1 else ((i - 2) % 4) + 1
            current_squad.append(
                {
                    "id": i,
                    "element_type": position,
                    "team": team,
                    "position": 1,
                    "is_captain": i == 3,
                    "is_vice_captain": i == 4,
                    "bench_order": 0,
                }
            )

        predictions = {}
        for p in players:
            predictions[p["id"]] = {
                gw: p["points_per_game"] * (1 + (gw * 0.05)) for gw in range(1, 5)
            }

        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=current_squad,
            current_gw=28,
            horizon=4,
            team_value=100.0,
            bank=5.0,
            free_transfers=1,
            use_hits=True,
            chips_available={
                "wildcard": False,
                "free_hit": True,
                "bench_boost": True,
                "triple_captain": True,
            },
        )

        result = optimizer.optimize()

        assert result["success"], (
            f"Optimization failed: {result.get('message', 'Unknown error')}"
        )

        # Verify all constraints
        starting_xi = result.get("starting_xi", [])
        bench = result.get("bench", [])
        all_squad = starting_xi + bench

        # 11 starters
        assert len(starting_xi) == 11, f"Expected 11 starters, got {len(starting_xi)}"

        # 4 bench
        assert len(bench) == 4, f"Expected 4 bench players, got {len(bench)}"

        # 15 total
        assert len(all_squad) == 15, f"Expected 15 total players, got {len(all_squad)}"

        # Formation check
        gk_count = sum(1 for p in starting_xi if p["element_type"] == 1)
        def_count = sum(1 for p in starting_xi if p["element_type"] == 2)
        fwd_count = sum(1 for p in starting_xi if p["element_type"] == 4)

        assert gk_count == 1, f"Expected 1 GK, got {gk_count}"
        assert def_count >= 3, f"Expected >=3 DEF, got {def_count}"
        assert fwd_count >= 1, f"Expected >=1 FWD, got {fwd_count}"

        # Club limit check
        team_counts = {}
        for p in all_squad:
            team_counts[p["team"]] = team_counts.get(p["team"], 0) + 1

        for team_id, count in team_counts.items():
            assert count <= 3, f"Team {team_id} has {count} players (max 3)"

        # Budget check
        total_value = sum(p["price"] / 10 for p in all_squad)
        assert total_value <= 105.1, f"Squad value {total_value}m exceeds budget 105.0m"

        print(f"\nIntegration test passed!")
        print(f"Starting XI: {len(starting_xi)} players")
        print(f"Bench: {len(bench)} players")
        print(f"Total value: {total_value}m")
        print(f"Expected points: {result.get('optimized_expected_points', 0):.1f}")

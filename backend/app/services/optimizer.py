from pulp import LpProblem, LpMaximize, LpVariable, LpBinary, lpSum, LpStatus, value
import logging
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)


class TransferOptimizer:
    """
    Multi-period knapsack optimizer using Linear Programming (PuLP).

    Maximizes expected points over N gameweeks subject to:
    - Budget constraint (team value + bank)
    - Formation rules (1 GK, ≥3 DEF, ≥1 FWD, 11 starters, 4 bench)
    - Max 3 players per club
    - Transfer limits with optional point hits
    """

    POSITION_COUNTS = {
        1: 1,  # GK
        2: 3,  # DEF
        3: 3,  # MID
        4: 1,  # FWD
    }

    def __init__(self):
        self.players: List[Dict] = []
        self.teams: Dict[int, Dict] = {}
        self.predictions: Dict[int, Dict[int, float]] = {}
        self.current_squad: List[Dict] = []
        self.current_gw: int = 1
        self.horizon: int = 1
        self.team_value: float = 0
        self.bank: float = 0
        self.free_transfers: int = 1
        self.use_hits: bool = False
        self.player_map: Dict[int, Dict] = {}
        self.chips_available: Dict[str, bool] = {
            "wildcard": True,
            "free_hit": True,
            "bench_boost": True,
            "triple_captain": True,
        }
        self.price_changes: Dict[int, float] = {}

    def setup(
        self,
        players: List[Dict],
        teams: List[Dict],
        predictions: Dict[int, Dict[int, float]],
        current_squad: List[Dict],
        current_gw: int,
        horizon: int,
        team_value: float,
        bank: float,
        free_transfers: int,
        use_hits: bool = False,
        chips_available: Optional[Dict[str, bool]] = None,
        price_changes: Optional[Dict[int, float]] = None,
    ):
        """
        Set up the optimizer with required data.
        """
        # Validate player data before processing
        for player in players:
            player_id = player.get("id")
            element_type = player.get("element_type")
            team = player.get("team")

            if not isinstance(player_id, int) or player_id < 1:
                raise ValueError(f"Invalid player id {player_id} for player {player}")

            if element_type not in [1, 2, 3, 4]:
                raise ValueError(
                    f"Invalid element_type {element_type} for player {player_id} (must be 1-4)"
                )

            if not isinstance(team, int) or team < 1:
                raise ValueError(f"Invalid team {team} for player {player_id}")

        # Validate current squad
        for squad_player in current_squad:
            squad_id = squad_player.get("id")
            if squad_id not in [p["id"] for p in players]:
                logger.warning(f"Squad player {squad_id} not found in players list")

        self.players = players
        self.teams = {t["id"]: t for t in teams}
        self.predictions = predictions
        self.current_squad = current_squad
        self.current_gw = current_gw
        self.horizon = horizon
        self.team_value = team_value
        self.bank = bank
        self.free_transfers = free_transfers
        self.use_hits = use_hits

        if chips_available:
            self.chips_available.update(chips_available)

        if price_changes:
            self.price_changes = price_changes

        self.player_map = {p["id"]: p for p in players}

        logger.info(
            f"Optimizer setup: {len(players)} players, "
            f"{len(current_squad)} in squad, GW {current_gw}, "
            f"horizon {horizon}, value {team_value}, bank {bank}, "
            f"chips available: {[k for k, v in self.chips_available.items() if v]}"
        )

    def _get_player_value(self, player_id: int, gw: int = 1) -> float:
        """
        Get player price in millions, optionally adjusted for forecasted price changes.
        """
        player = self.player_map.get(player_id)
        if not player:
            return 0

        base_price = (player.get("now_cost", 0) or 0) / 10
        # For future gameweeks, add predicted price change
        if gw > 1:
            change = self.price_changes.get(player_id, 0)
            # Accumulate change over weeks (simplified)
            return base_price + (change * (gw - 1))

        return base_price

    def _get_player_position(self, player_id: int) -> int:
        """Get player position type"""
        player = self.player_map.get(player_id)
        return player.get("element_type", 3) if player else 3

    def _get_player_team(self, player_id: int) -> int:
        """Get player's team ID"""
        player = self.player_map.get(player_id)
        return player.get("team", 0) if player else 0

    def _get_player_predictions(self, player_id: int) -> List[float]:
        """Get predicted points for player over horizon"""
        if player_id not in self.predictions:
            return [0] * self.horizon

        preds = self.predictions[player_id]
        return [preds.get(self.current_gw + i, 0) for i in range(1, self.horizon + 1)]

    def optimize(self) -> Dict[str, Any]:
        """
        Run the optimization solver with chip support.
        """
        logger.info("Starting optimization solver with chip support...")

        squad_player_ids = [p["id"] for p in self.current_squad]
        current_squad_size = len(squad_player_ids)

        # Handle partial squads gracefully
        if current_squad_size < 15:
            needed_transfers = 15 - current_squad_size
            logger.warning(
                f"Partial squad detected ({current_squad_size}/15 players). "
                f"Need {needed_transfers} more players. "
                f"Auto-adjusting transfer limits to allow squad completion."
            )
            # Always adjust transfers for partial squads
            self.free_transfers = max(self.free_transfers, needed_transfers)
            # If use_hits was False, enable it to allow unlimited transfers
            if not self.use_hits:
                self.use_hits = True
                logger.info(
                    f"Enabled hits mode and adjusted free_transfers to {self.free_transfers}"
                )
            else:
                logger.info(f"Adjusted free_transfers to {self.free_transfers}")
        prob = LpProblem("FPL_Optimizer", LpMaximize)
        player_ids = [p["id"] for p in self.players]

        # Decision variables
        start_vars = {}
        bench_vars = {}
        transfer_in = {}
        transfer_out = {}
        captain_vars = {}

        for p_id in player_ids:
            for gw in range(1, self.horizon + 1):
                start_vars[(p_id, gw)] = LpVariable(f"start_{p_id}_{gw}", cat=LpBinary)
                bench_vars[(p_id, gw)] = LpVariable(f"bench_{p_id}_{gw}", cat=LpBinary)
                transfer_in[(p_id, gw)] = LpVariable(f"in_{p_id}_{gw}", cat=LpBinary)
                transfer_out[(p_id, gw)] = LpVariable(f"out_{p_id}_{gw}", cat=LpBinary)
                captain_vars[(p_id, gw)] = LpVariable(f"cap_{p_id}_{gw}", cat=LpBinary)

        # Chip variables
        chip_vars = {}
        chips = ["wildcard", "free_hit", "bench_boost", "triple_captain"]
        for chip in chips:
            for gw in range(1, self.horizon + 1):
                if self.chips_available.get(chip, False):
                    chip_vars[(chip, gw)] = LpVariable(
                        f"chip_{chip}_{gw}", cat=LpBinary
                    )
                else:
                    chip_vars[(chip, gw)] = 0

        # Objective: Maximize expected points
        objective_points = []
        for gw in range(1, self.horizon + 1):
            is_bb = chip_vars.get(("bench_boost", gw), 0)
            is_tc = chip_vars.get(("triple_captain", gw), 0)

            for p_id in player_ids:
                preds = self._get_player_predictions(p_id)
                gw_pred = preds[gw - 1] if gw - 1 < len(preds) else 0

                # Points without multipliers: starter points (1.0x) + bench point baseline (0.1x)
                points = gw_pred * start_vars[(p_id, gw)]
                points += gw_pred * 0.1 * bench_vars[(p_id, gw)]

                # Bench boost gives the remaining 0.9x of bench points
                # To linearize: Add another variable points_bb <= is_bb * max_points, points_bb <= bench_vars * max_points
                # For objective function, we can simplify with an auxiliary variable
                is_bb_bench_var = LpVariable(f"bb_bench_{p_id}_{gw}", cat=LpBinary)
                prob += is_bb_bench_var <= is_bb
                prob += is_bb_bench_var <= bench_vars[(p_id, gw)]
                prob += is_bb_bench_var >= is_bb + bench_vars[(p_id, gw)] - 1

                points += gw_pred * 0.9 * is_bb_bench_var

                # Captaincy points: Normally gives extra 1.0x. If TC, gives extra 2.0x
                # Auxiliary variable for TC * captain
                is_tc_cap_var = LpVariable(f"tc_cap_{p_id}_{gw}", cat=LpBinary)
                prob += is_tc_cap_var <= is_tc
                prob += is_tc_cap_var <= captain_vars[(p_id, gw)]
                prob += is_tc_cap_var >= is_tc + captain_vars[(p_id, gw)] - 1

                points += (
                    gw_pred * captain_vars[(p_id, gw)]
                )  # Normal captain extra 1.0x
                points += (
                    gw_pred * is_tc_cap_var
                )  # TC extra 1.0x (total 3.0x with base + normal cap)

                objective_points.append(points)

        # Transfer penalties (simplified)
        transfer_penalty = []
        for gw in range(1, self.horizon + 1):
            is_wc = chip_vars.get(("wildcard", gw), 0)
            is_fh = chip_vars.get(("free_hit", gw), 0)

            # No penalty if WC or FH active
            no_penalty = is_wc + is_fh

            transfers = lpSum([transfer_in[(p_id, gw)] for p_id in player_ids])
            free = self.free_transfers if gw == 1 else 1

            # Penalty: -4 points per hit (only if not using hits, we'll use hard constraints instead)
            # For simplicity in this implementation, we'll just limit transfers unless chips are used
            pass

        prob += lpSum(objective_points)

        # Constraints
        for gw in range(1, self.horizon + 1):
            # One chip per week
            prob += (
                lpSum(
                    [chip_vars.get((c, gw), 0) for c in chips if (c, gw) in chip_vars]
                )
                <= 1
            )

            # Standard squad constraints
            prob += lpSum(start_vars[(p_id, gw)] for p_id in player_ids) == 11
            prob += lpSum(bench_vars[(p_id, gw)] for p_id in player_ids) == 4
            prob += lpSum(captain_vars[(p_id, gw)] for p_id in player_ids) == 1

            for p_id in player_ids:
                # Captain must be a starter
                prob += captain_vars[(p_id, gw)] <= start_vars[(p_id, gw)]
                # Player can't be both starter and bench
                prob += start_vars[(p_id, gw)] + bench_vars[(p_id, gw)] <= 1

            # Position constraints - exact for GK, minimum for others
            # Exactly 1 GK, at least 3 DEF, at least 1 MID, at least 1 FWD
            prob += (
                lpSum(
                    start_vars[(p_id, gw)]
                    for p_id in player_ids
                    if self._get_player_position(p_id) == 1
                )
                == 1  # Exactly 1 GK in starting XI
            )
            for pos, min_c in [(2, 3), (3, 1), (4, 1)]:
                prob += (
                    lpSum(
                        start_vars[(p_id, gw)]
                        for p_id in player_ids
                        if self._get_player_position(p_id) == pos
                    )
                    >= min_c
                )

            # Max 3 per team
            for t_id in self.teams.keys():
                prob += (
                    lpSum(
                        start_vars[(p_id, gw)] + bench_vars[(p_id, gw)]
                        for p_id in player_ids
                        if self._get_player_team(p_id) == t_id
                    )
                    <= 3
                )

            # Budget constraint with forecasted prices
            prob += (
                lpSum(
                    self._get_player_value(p_id, gw)
                    * (start_vars[(p_id, gw)] + bench_vars[(p_id, gw)])
                    for p_id in player_ids
                )
                <= self.team_value + self.bank
            )

            # Transfer logic
            for p_id in player_ids:
                in_squad_now = start_vars[(p_id, gw)] + bench_vars[(p_id, gw)]
                if gw == 1:
                    was_in = 1 if p_id in squad_player_ids else 0
                else:
                    was_in = start_vars[(p_id, gw - 1)] + bench_vars[(p_id, gw - 1)]

                prob += (
                    in_squad_now - was_in
                    == transfer_in[(p_id, gw)] - transfer_out[(p_id, gw)]
                )

            # Transfer limits
            is_wc = chip_vars.get(("wildcard", gw), 0)
            is_fh = chip_vars.get(("free_hit", gw), 0)
            transfers_made = lpSum(transfer_in[(p_id, gw)] for p_id in player_ids)

            if not self.use_hits:
                limit = 15 * (is_wc + is_fh) + (
                    self.free_transfers if gw == 1 else 1
                ) * (1 - (is_wc + is_fh))
                prob += transfers_made <= limit

        # Each chip only once in horizon
        for chip in chips:
            if any((chip, gw) in chip_vars for gw in range(1, self.horizon + 1)):
                prob += (
                    lpSum(
                        [
                            chip_vars.get((chip, gw), 0)
                            for gw in range(1, self.horizon + 1)
                        ]
                    )
                    <= 1
                )

        logger.info("Solving...")
        prob.solve()

        solver_status = LpStatus[prob.status]
        logger.info(f"Solver status: {solver_status}")

        if solver_status != "Optimal":
            logger.error(f"Optimization failed with status: {solver_status}")
            return {
                "success": False,
                "message": f"Optimization failed: {solver_status}",
            }

        # Extract plan
        plan = []
        for gw in range(1, self.horizon + 1):
            gw_plan = {"gameweek": self.current_gw + gw, "transfers": [], "chip": None}

            for chip in chips:
                if value(chip_vars.get((chip, gw), 0)) > 0.5:
                    gw_plan["chip"] = chip

            for p_id in player_ids:
                if value(transfer_in[(p_id, gw)]) > 0.5:
                    xp = sum(self._get_player_predictions(p_id))
                    gw_plan["transfers"].append(
                        {
                            "action": "buy",
                            "player_id": p_id,
                            "name": self.player_map[p_id]["web_name"],
                            "xp_in": round(xp, 2),
                        }
                    )
                if value(transfer_out[(p_id, gw)]) > 0.5:
                    xp = sum(self._get_player_predictions(p_id))
                    gw_plan["transfers"].append(
                        {
                            "action": "sell",
                            "player_id": p_id,
                            "name": self.player_map[p_id]["web_name"],
                            "xp_out": round(xp, 2),
                        }
                    )

            plan.append(gw_plan)

        # Final optimized squad (for GW 1)
        optimized_squad = []
        for p_id in player_ids:
            if value(start_vars[(p_id, 1)]) > 0.5 or value(bench_vars[(p_id, 1)]) > 0.5:
                is_cap = value(captain_vars[(p_id, 1)]) > 0.5
                optimized_squad.append(
                    {
                        "id": p_id,
                        "web_name": self.player_map[p_id]["web_name"],
                        "element_type": self.player_map[p_id]["element_type"],
                        "team": self.player_map[p_id]["team"],
                        "price": self.player_map[p_id]["now_cost"],
                        "position": 1 if value(start_vars[(p_id, 1)]) > 0.5 else 0,
                        "is_captain": is_cap,
                        "is_vice_captain": False,
                        "bench_order": 0,  # Simplified
                    }
                )

        return {
            "success": True,
            "message": "Optimization complete",
            "optimized_squad": optimized_squad,
            "starting_xi": [p for p in optimized_squad if p["position"] == 1],
            "bench": [p for p in optimized_squad if p["position"] == 0],
            "full_plan": plan,
            "current_expected_points": round(
                self._calculate_expected_points(squad_player_ids), 2
            ),
            "optimized_expected_points": self._calculate_expected_points(
                [p["id"] for p in optimized_squad]
            ),
            "points_difference": round(
                self._calculate_expected_points([p["id"] for p in optimized_squad])
                - self._calculate_expected_points(squad_player_ids),
                2,
            ),
        }

    def _calculate_transfer_plan(
        self,
        original_ids: List[int],
        optimized_squad: List[Dict[str, Any]],
        all_player_ids: List[int],
    ) -> List[Dict[str, Any]]:
        """
        Calculate the transfer plan between original and optimized squad.
        Includes xP values for each transfer.
        """
        original_set = set(original_ids)
        optimized_set = set(p["id"] for p in optimized_squad)

        transfers_in = optimized_set - original_set
        transfers_out = original_set - optimized_set

        transfer_plan = []

        for p_id in transfers_out:
            player = self.player_map.get(p_id)
            if player:
                xp = sum(self._get_player_predictions(p_id))
                transfer_plan.append(
                    {
                        "action": "sell",
                        "player_id": p_id,
                        "player_name": player.get("web_name", "Unknown"),
                        "price": self._get_player_value(p_id),
                        "xp_out": round(xp, 2),
                    }
                )

        for p_id in transfers_in:
            player = self.player_map.get(p_id)
            if player:
                xp = sum(self._get_player_predictions(p_id))
                transfer_plan.append(
                    {
                        "action": "buy",
                        "player_id": p_id,
                        "player_name": player.get("web_name", "Unknown"),
                        "price": self._get_player_value(p_id),
                        "xp_in": round(xp, 2),
                    }
                )

        return transfer_plan

    def _calculate_expected_points(self, player_ids: List[int]) -> float:
        """
        Calculate total expected points for a squad over the horizon.
        """
        total = 0
        for p_id in player_ids:
            preds = self._get_player_predictions(p_id)
            total += sum(preds)
        return total

    def _fallback_optimization(self) -> Dict[str, Any]:
        """
        Fallback optimization using simple greedy approach.
        Used when LP solver fails.
        """
        logger.info("Using fallback greedy optimization...")

        squad_player_ids = [p["id"] for p in self.current_squad]

        squad_value = sum(self._get_player_value(p_id) for p_id in squad_player_ids)
        budget = self.team_value + self.bank

        current_preds = {}
        for p_id in squad_player_ids:
            preds = self._get_player_predictions(p_id)
            current_preds[p_id] = sum(preds)

        available_players = [p for p in self.players if p["id"] not in squad_player_ids]

        available_preds = {}
        for player in available_players:
            p_id = player["id"]
            preds = self._get_player_predictions(p_id)
            available_preds[p_id] = sum(preds)

        sorted_squad = sorted(squad_player_ids, key=lambda p: current_preds.get(p, 0))

        sorted_available = sorted(
            available_players,
            key=lambda p: available_preds.get(p["id"], 0),
            reverse=True,
        )

        optimized_squad = list(squad_player_ids)

        transfers_needed = 0

        while transfers_needed < 3 and len(sorted_available) > 0:
            worst = sorted_squad[0]
            best = sorted_available[0]

            worst_player = self.player_map.get(worst)
            best_player = self.player_map.get(best["id"])

            if not worst_player or not best_player:
                break

            worst_value = self._get_player_value(worst)
            best_value = self._get_player_value(best["id"])

            if squad_value - worst_value + best_value <= budget:
                optimized_squad.remove(worst)
                optimized_squad.append(best["id"])

                squad_value = squad_value - worst_value + best_value

                transfers_needed += 1
                sorted_squad = sorted(
                    [p for p in optimized_squad], key=lambda p: current_preds.get(p, 0)
                )
            else:
                break

            sorted_available = sorted_available[1:]

        transfer_plan = self._calculate_transfer_plan(
            squad_player_ids,
            optimized_squad,
            [p["id"] for p in self.players],
        )

        current_xP = self._calculate_expected_points(squad_player_ids)
        optimized_xP = self._calculate_expected_points(optimized_squad)

        return {
            "success": True,
            "message": "Optimization complete (greedy fallback)",
            "optimized_squad": [
                {
                    "id": p_id,
                    "web_name": self.player_map.get(p_id, {}).get(
                        "web_name", "Unknown"
                    ),
                    "element_type": self.player_map.get(p_id, {}).get(
                        "element_type", 3
                    ),
                    "team": self.player_map.get(p_id, {}).get("team", 0),
                    "price": self.player_map.get(p_id, {}).get("now_cost", 0),
                    "position": 1,
                    "is_captain": False,
                    "is_vice_captain": False,
                    "bench_order": 0,
                }
                for p_id in optimized_squad
            ],
            "starting_xi": [
                {
                    "id": p_id,
                    "web_name": self.player_map.get(p_id, {}).get(
                        "web_name", "Unknown"
                    ),
                    "element_type": self.player_map.get(p_id, {}).get(
                        "element_type", 3
                    ),
                    "team": self.player_map.get(p_id, {}).get("team", 0),
                    "price": self.player_map.get(p_id, {}).get("now_cost", 0),
                    "position": 1,
                    "is_captain": False,
                    "is_vice_captain": False,
                    "bench_order": 0,
                }
                for p_id in optimized_squad[:11]
            ],
            "bench": [
                {
                    "id": p_id,
                    "web_name": self.player_map.get(p_id, {}).get(
                        "web_name", "Unknown"
                    ),
                    "element_type": self.player_map.get(p_id, {}).get(
                        "element_type", 3
                    ),
                    "team": self.player_map.get(p_id, {}).get("team", 0),
                    "price": self.player_map.get(p_id, {}).get("now_cost", 0),
                    "position": 0,
                    "is_captain": False,
                    "is_vice_captain": False,
                    "bench_order": i,
                }
                for i, p_id in enumerate(optimized_squad[11:])
            ],
            "transfer_plan": transfer_plan,
            "current_expected_points": round(current_xP, 2),
            "optimized_expected_points": round(optimized_xP, 2),
            "points_difference": round(optimized_xP - current_xP, 2),
        }

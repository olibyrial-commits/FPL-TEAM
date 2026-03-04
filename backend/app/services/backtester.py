import numpy as np
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import optuna
from optuna.samplers import TPESampler

from app.services.predictor import PointPredictor, ModelParams
from app.services.fpl_client import FPLClient
from app.services.data_loader import FPLDataLoader

logger = logging.getLogger(__name__)


@dataclass
class PlayerBacktestResult:
    player_id: int
    web_name: str
    position: int
    predicted_points: float
    actual_points: float
    error: float
    absolute_error: float


@dataclass
class BacktestMetrics:
    mae: float
    rmse: float
    accuracy_within_1: float
    accuracy_within_2: float
    accuracy_within_3: float
    total_players: int
    mean_predicted: float
    mean_actual: float


@dataclass
class PositionMetrics:
    position: int
    mae: float
    rmse: float
    accuracy_within_1: float
    count: int


@dataclass
class OptimizationResult:
    best_params: ModelParams
    best_mae: float
    best_rmse: float
    study_best_value: float
    n_trials: int
    position_metrics: Dict[int, PositionMetrics]
    cv_results: List[Dict[str, Any]]
    method: str  # 'coefficients' or 'separate_models'


class Backtester:
    """
    Backtesting module for validating and optimizing FPL point predictions.

    Supports:
    - Cross-validation across multiple gameweeks
    - Bayesian optimization with Optuna (TPE sampler)
    - Position-specific tuning (compares coefficients vs separate models)
    - Automatic parameter optimization
    - Fast data loading from GitHub + local caching
    """

    def __init__(self, fpl_client: FPLClient, use_fast_loader: bool = True):
        self.fpl_client = fpl_client
        self.predictor = PointPredictor()
        self.use_fast_loader = use_fast_loader
        self._data_loader: Optional[FPLDataLoader] = None

    async def _get_data_loader(self) -> FPLDataLoader:
        """Get or create data loader."""
        if self._data_loader is None:
            self._data_loader = FPLDataLoader()
            await self._data_loader.initialize()
        return self._data_loader

    async def run_backtest(
        self,
        players: List[Dict],
        teams: List[Dict],
        fixtures: List[Dict],
        start_gw: int,
        end_gw: int,
    ) -> Dict[str, Any]:
        """Run backtesting across multiple gameweeks."""
        logger.info(f"Running backtest for GW {start_gw} to GW {end_gw}")

        player_dict = {p["id"]: p for p in players}
        team_dict = {t["id"]: t for t in teams}
        fixture_map = self._build_fixture_map(fixtures)

        self.predictor.train(players, teams, fixtures)

        all_player_results: List[PlayerBacktestResult] = []
        gw_breakdown = {}

        for gw in range(start_gw, end_gw + 1):
            logger.info(f"Backtesting gameweek {gw}...")

            gw_predictions = self._predict_gameweek(
                players=players,
                teams=teams,
                fixture_map=fixture_map,
                gameweek=gw,
            )

            gw_actuals = await self._get_actual_points(players, gw)

            gw_results = self._compare_predictions(
                gw_predictions, gw_actuals, player_dict
            )

            all_player_results.extend(gw_results)

            gw_metrics = self._calculate_metrics(gw_results)
            gw_breakdown[gw] = {
                "metrics": gw_metrics,
                "player_count": len(gw_results),
            }

            logger.info(
                f"GW {gw}: MAE={gw_metrics.mae:.2f}, RMSE={gw_metrics.rmse:.2f}, "
                f"Accuracy@1={gw_metrics.accuracy_within_1 * 100:.1f}%"
            )

        overall_metrics = self._calculate_metrics(all_player_results)

        top_players = sorted(all_player_results, key=lambda x: x.absolute_error)[:25]
        bottom_players = sorted(
            all_player_results, key=lambda x: x.absolute_error, reverse=True
        )[:25]

        return {
            "metrics": {
                "mae": round(overall_metrics.mae, 3),
                "rmse": round(overall_metrics.rmse, 3),
                "accuracy_within_1": round(overall_metrics.accuracy_within_1 * 100, 2),
                "accuracy_within_2": round(overall_metrics.accuracy_within_2 * 100, 2),
                "accuracy_within_3": round(overall_metrics.accuracy_within_3 * 100, 2),
                "total_predictions": overall_metrics.total_players,
                "mean_predicted": round(overall_metrics.mean_predicted, 2),
                "mean_actual": round(overall_metrics.mean_actual, 2),
            },
            "gameweek_breakdown": {
                gw: {
                    "mae": round(data["metrics"].mae, 3),
                    "rmse": round(data["metrics"].rmse, 3),
                    "accuracy_within_1": round(
                        data["metrics"].accuracy_within_1 * 100, 2
                    ),
                    "player_count": data["player_count"],
                }
                for gw, data in gw_breakdown.items()
            },
            "top_predictions": [
                {
                    "player_id": p.player_id,
                    "web_name": p.web_name,
                    "position": p.position,
                    "predicted": p.predicted_points,
                    "actual": p.actual_points,
                    "error": p.error,
                }
                for p in top_players
            ],
            "worst_predictions": [
                {
                    "player_id": p.player_id,
                    "web_name": p.web_name,
                    "position": p.position,
                    "predicted": p.predicted_points,
                    "actual": p.actual_points,
                    "error": p.error,
                }
                for p in bottom_players
            ],
        }

    async def optimize_parameters(
        self,
        players: List[Dict],
        teams: List[Dict],
        fixtures: List[Dict],
        start_gw: int,
        end_gw: int,
        n_trials: int = 250,
        n_cv_splits: int = 5,
        position_specific: bool = True,
        compare_methods: bool = True,
    ) -> OptimizationResult:
        """
        Run Bayesian optimization to find optimal parameters.

        Args:
            players: Player data from bootstrap-static
            teams: Team data
            fixtures: Fixture data
            start_gw: First gameweek for training
            end_gw: Last gameweek for training
            n_trials: Number of optimization trials (default 250)
            n_cv_splits: Number of cross-validation splits
            position_specific: Whether to use position-specific tuning
            compare_methods: Whether to compare coefficients vs separate models

        Returns:
            OptimizationResult with best parameters and metrics
        """
        logger.info(
            f"Starting parameter optimization: {n_trials} trials, {n_cv_splits} CV splits"
        )
        logger.info(
            f"Position-specific: {position_specific}, Compare methods: {compare_methods}"
        )

        # Fetch actual historical data using FAST loader
        player_dict = {p["id"]: p for p in players}
        fixture_map = self._build_fixture_map(fixtures)

        # Use fast data loading from GitHub + local cache
        if self.use_fast_loader:
            logger.info("Using fast data loader (GitHub + caching)...")
            loader = await self._get_data_loader()
            all_player_history = await loader.get_historical_data_for_optimization(
                start_gw=start_gw,
                end_gw=end_gw,
                use_github=True,
            )

            # Convert to gameweek format
            all_actuals: Dict[int, Dict[int, float]] = {}
            for gw in range(start_gw, end_gw + 1):
                all_actuals[gw] = {}
                for player_id, history in all_player_history.items():
                    if gw in history:
                        all_actuals[gw][player_id] = history[gw]

            logger.info(f"Loaded historical data for {len(all_player_history)} players")
        else:
            # Fallback to slow API fetching
            logger.info("Using slow API fallback...")
            all_actuals: Dict[int, Dict[int, float]] = {}
            for gw in range(start_gw, end_gw + 1):
                all_actuals[gw] = await self._get_actual_points(players, gw)

        # Run optimization
        if compare_methods:
            # Compare both methods and pick the best
            logger.info("Comparing coefficient-based vs separate models...")

            result_coefficients = await self._optimize_with_method(
                players,
                teams,
                fixtures,
                all_actuals,
                fixture_map,
                n_trials,
                n_cv_splits,
                position_specific,
                use_separate_models=False,
            )

            result_models = await self._optimize_with_method(
                players,
                teams,
                fixtures,
                all_actuals,
                fixture_map,
                n_trials,
                n_cv_splits,
                position_specific,
                use_separate_models=True,
            )

            if result_models.best_mae < result_coefficients.best_mae:
                logger.info("Separate models method is BETTER")
                return result_models
            else:
                logger.info("Coefficient-based method is BETTER")
                return result_coefficients
        else:
            return await self._optimize_with_method(
                players,
                teams,
                fixtures,
                all_actuals,
                fixture_map,
                n_trials,
                n_cv_splits,
                position_specific,
                use_separate_models=(not position_specific),
            )

    async def _optimize_with_method(
        self,
        players: List[Dict],
        teams: List[Dict],
        fixtures: List[Dict],
        all_actuals: Dict[int, Dict[int, float]],
        fixture_map: Dict,
        n_trials: int,
        n_cv_splits: int,
        position_specific: bool,
        use_separate_models: bool,
    ) -> OptimizationResult:
        """Internal method to run optimization with a specific method."""

        def objective(trial: optuna.Trial) -> float:
            # Sample parameters
            if position_specific:
                params = self._sample_position_specific_params(trial)
            else:
                params = self._sample_unified_params(trial)

            # Cross-validate
            cv_scores = self._cross_validate(
                players, teams, fixture_map, all_actuals, params, n_cv_splits
            )

            return float(np.mean([s["mae"] for s in cv_scores]))

        # Run optimization
        sampler = TPESampler(seed=42)
        study = optuna.create_study(direction="minimize", sampler=sampler)

        # Add fixed params that don't need optimization
        study.enqueue_trial(
            {
                "gkp_multiplier": 0.6,
                "def_multiplier": 0.7,
                "mid_multiplier": 0.85,
                "fwd_multiplier": 0.8,
                "points_pg_weight": 0.4,
                "xgi_weight": 3.0,
                "xa_weight": 2.0,
                "form_weight": 1.0,
                "minutes_weight": 0.3,
                "games_weight": 0.3,
                "threat_creativity_weight": 0.02,
                "home_bonus": 0.2,
                "fdr_weight": 0.5,
                "noise_std": 1.5,
            }
        )

        study.optimize(objective, n_trials=n_trials, show_progress_bar=False)

        best_params = self._params_from_trial(study.best_trial)

        # Calculate final metrics with best params
        final_cv = self._cross_validate(
            players, teams, fixture_map, all_actuals, best_params, n_cv_splits
        )

        overall_mae = np.mean([s["mae"] for s in final_cv])
        overall_rmse = np.mean([s["rmse"] for s in final_cv])

        # Calculate position-specific metrics
        position_metrics = self._calculate_position_metrics(
            players, teams, fixture_map, all_actuals, best_params
        )

        return OptimizationResult(
            best_params=best_params,
            best_mae=float(overall_mae),
            best_rmse=float(overall_rmse),
            study_best_value=float(study.best_value),
            n_trials=n_trials,
            position_metrics=position_metrics,
            cv_results=final_cv,
            method="separate_models" if use_separate_models else "coefficients",
        )

    def _sample_position_specific_params(self, trial: optuna.Trial) -> ModelParams:
        """Sample parameters with position-specific multipliers."""
        return ModelParams(
            gkp_multiplier=trial.suggest_float("gkp_multiplier", 0.3, 1.2),
            def_multiplier=trial.suggest_float("def_multiplier", 0.4, 1.1),
            mid_multiplier=trial.suggest_float("mid_multiplier", 0.6, 1.4),
            fwd_multiplier=trial.suggest_float("fwd_multiplier", 0.7, 1.5),
            points_pg_weight=trial.suggest_float("points_pg_weight", 0.2, 0.8),
            xgi_weight=trial.suggest_float("xgi_weight", 1.0, 6.0),
            xa_weight=trial.suggest_float("xa_weight", 0.5, 4.0),
            form_weight=trial.suggest_float("form_weight", 0.3, 2.0),
            minutes_weight=trial.suggest_float("minutes_weight", 0.1, 0.8),
            games_weight=trial.suggest_float("games_weight", 0.1, 0.6),
            threat_creativity_weight=trial.suggest_float(
                "threat_creativity_weight", 0.005, 0.05
            ),
            home_bonus=trial.suggest_float("home_bonus", 0.1, 0.4),
            fdr_weight=trial.suggest_float("fdr_weight", 0.2, 1.0),
            noise_std=trial.suggest_float("noise_std", 0.5, 3.0),
        )

    def _sample_unified_params(self, trial: optuna.Trial) -> ModelParams:
        """Sample parameters with unified multiplier."""
        base_mult = trial.suggest_float("base_multiplier", 0.5, 1.2)
        return ModelParams(
            gkp_multiplier=base_mult,
            def_multiplier=base_mult * 1.1,
            mid_multiplier=base_mult * 1.3,
            fwd_multiplier=base_mult * 1.4,
            points_pg_weight=trial.suggest_float("points_pg_weight", 0.2, 0.8),
            xgi_weight=trial.suggest_float("xgi_weight", 1.0, 6.0),
            xa_weight=trial.suggest_float("xa_weight", 0.5, 4.0),
            form_weight=trial.suggest_float("form_weight", 0.3, 2.0),
            minutes_weight=trial.suggest_float("minutes_weight", 0.1, 0.8),
            games_weight=trial.suggest_float("games_weight", 0.1, 0.6),
            threat_creativity_weight=trial.suggest_float(
                "threat_creativity_weight", 0.005, 0.05
            ),
            home_bonus=trial.suggest_float("home_bonus", 0.1, 0.4),
            fdr_weight=trial.suggest_float("fdr_weight", 0.2, 1.0),
            noise_std=trial.suggest_float("noise_std", 0.5, 3.0),
        )

    def _params_from_trial(self, trial: Any) -> ModelParams:
        """Create ModelParams from Optuna trial."""
        return ModelParams(
            gkp_multiplier=trial.params.get("gkp_multiplier", 0.6),
            def_multiplier=trial.params.get("def_multiplier", 0.7),
            mid_multiplier=trial.params.get("mid_multiplier", 0.85),
            fwd_multiplier=trial.params.get("fwd_multiplier", 0.8),
            points_pg_weight=trial.params.get("points_pg_weight", 0.4),
            xgi_weight=trial.params.get("xgi_weight", 3.0),
            xa_weight=trial.params.get("xa_weight", 2.0),
            form_weight=trial.params.get("form_weight", 1.0),
            minutes_weight=trial.params.get("minutes_weight", 0.3),
            games_weight=trial.params.get("games_weight", 0.3),
            threat_creativity_weight=trial.params.get("threat_creativity_weight", 0.02),
            home_bonus=trial.params.get("home_bonus", 0.2),
            fdr_weight=trial.params.get("fdr_weight", 0.5),
            noise_std=trial.params.get("noise_std", 1.5),
        )

    def _cross_validate(
        self,
        players: List[Dict],
        teams: List[Dict],
        fixture_map: Dict,
        all_actuals: Dict[int, Dict[int, float]],
        params: ModelParams,
        n_splits: int,
    ) -> List[Dict[str, Any]]:
        """Perform time-series cross-validation."""
        gameweeks = sorted(all_actuals.keys())
        n_gws = len(gameweeks)

        # Ensure we have enough gameweeks for cross-validation
        if n_gws < n_splits + 1:
            n_splits = max(1, n_gws - 1)

        split_size = max(1, (n_gws - 1) // n_splits)

        cv_scores = []

        for fold in range(n_splits):
            # Training: use first (fold+1) * split_size gameweeks
            train_end = (fold + 1) * split_size
            if train_end >= n_gws:
                train_end = n_gws - 1

            # Test: use next gameweek
            test_idx = train_end
            if test_idx >= n_gws:
                break

            train_gws = gameweeks[:train_end]
            test_gw = gameweeks[test_idx]

            # Create training data using synthetic method with current params
            predictor = PointPredictor(params=params)
            predictor.train(players, teams, [])

            # Predict on test gameweek
            predictions = self._predict_gameweek(
                players, teams, fixture_map, test_gw, predictor
            )

            actuals = all_actuals[test_gw]
            player_dict = {p["id"]: p for p in players}

            results = self._compare_predictions(predictions, actuals, player_dict)
            metrics = self._calculate_metrics(results)

            cv_scores.append(
                {
                    "fold": fold + 1,
                    "train_gws": len(train_gws),
                    "test_gw": test_gw,
                    "mae": metrics.mae,
                    "rmse": metrics.rmse,
                    "accuracy_within_1": metrics.accuracy_within_1,
                }
            )

        return cv_scores

    def _calculate_position_metrics(
        self,
        players: List[Dict],
        teams: List[Dict],
        fixture_map: Dict,
        all_actuals: Dict[int, Dict[int, float]],
        params: ModelParams,
    ) -> Dict[int, PositionMetrics]:
        """Calculate metrics broken down by position."""
        predictor = PointPredictor(params=params)
        predictor.train(players, teams, [])

        player_dict = {p["id"]: p for p in players}
        position_results: Dict[int, List[PlayerBacktestResult]] = {
            1: [],
            2: [],
            3: [],
            4: [],
        }

        for gw, actuals in all_actuals.items():
            predictions = self._predict_gameweek(players, teams, fixture_map, gw)
            results = self._compare_predictions(predictions, actuals, player_dict)

            for r in results:
                position_results[r.position].append(r)

        position_metrics = {}
        for pos, results in position_results.items():
            if results:
                metrics = self._calculate_metrics(results)
                position_metrics[pos] = PositionMetrics(
                    position=pos,
                    mae=metrics.mae,
                    rmse=metrics.rmse,
                    accuracy_within_1=metrics.accuracy_within_1,
                    count=len(results),
                )

        return position_metrics

    def _build_fixture_map(self, fixtures: List[Dict]) -> Dict:
        """Build a map of team_id -> gameweek -> fixture info."""
        fixture_map = {}
        for fixture in fixtures:
            gw = fixture.get("event")
            if not gw:
                continue

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

        return fixture_map

    def _predict_gameweek(
        self,
        players: List[Dict],
        teams: List[Dict],
        fixture_map: Dict,
        gameweek: int,
        predictor: PointPredictor = None,
    ) -> Dict[int, float]:
        """Generate predictions for a specific gameweek."""
        if predictor is None:
            predictor = self.predictor
        predictions = {}

        for player in players:
            player_id = player["id"]
            team_id = player.get("team", 0)

            player_fixtures = fixture_map.get(team_id, {})
            fixture = player_fixtures.get(gameweek)

            if fixture:
                difficulty = fixture["difficulty"]
                is_home = fixture["is_home"]
            else:
                difficulty = 3
                is_home = True

            opp_team = (
                teams[fixture.get("opponent", 0) - 1]
                if fixture and fixture.get("opponent")
                else None
            )

            pred_points = predictor.predict_player_gw_points(
                player=player,
                team=opp_team,
                fixture_difficulty=difficulty,
                is_home=is_home,
                gameweek=gameweek,
            )

            predictions[player_id] = pred_points

        return predictions

    async def _get_actual_points(
        self, players: List[Dict], gameweek: int
    ) -> Dict[int, float]:
        """Fetch actual points for a gameweek from player history."""
        actuals = {}
        player_ids = [p["id"] for p in players]
        history_data = await self.fpl_client.get_all_players_history(player_ids)

        for player in players:
            player_id = player["id"]
            history = history_data.get(player_id, [])

            gw_data = None
            for gw_record in history:
                if gw_record.get("round") == gameweek:
                    gw_data = gw_record
                    break

            if gw_data:
                actual_points = gw_data.get("total_points", 0)
            else:
                actual_points = 0

            actuals[player_id] = actual_points

        return actuals

    def _compare_predictions(
        self,
        predictions: Dict[int, float],
        actuals: Dict[int, float],
        player_dict: Dict[int, Dict],
    ) -> List[PlayerBacktestResult]:
        """Compare predictions vs actuals and return results."""
        results = []

        for player_id, predicted in predictions.items():
            actual = actuals.get(player_id, 0)
            player = player_dict.get(player_id, {})

            # Ensure proper types
            predicted_val = float(predicted) if predicted else 0.0
            actual_val = float(actual) if actual else 0.0

            results.append(
                PlayerBacktestResult(
                    player_id=player_id,
                    web_name=player.get("web_name", f"Player_{player_id}"),
                    position=player.get("element_type", 3),
                    predicted_points=predicted_val,
                    actual_points=actual_val,
                    error=predicted_val - actual_val,
                    absolute_error=abs(predicted_val - actual_val),
                )
            )

        return results

    def _calculate_metrics(
        self, results: List[PlayerBacktestResult]
    ) -> BacktestMetrics:
        """Calculate MAE, RMSE, and accuracy metrics."""
        if not results:
            return BacktestMetrics(
                mae=0.0,
                rmse=0.0,
                accuracy_within_1=0.0,
                accuracy_within_2=0.0,
                accuracy_within_3=0.0,
                total_players=0,
                mean_predicted=0.0,
                mean_actual=0.0,
            )

        errors = [r.error for r in results]
        abs_errors = [r.absolute_error for r in results]
        predicted = [r.predicted_points for r in results]
        actual = [r.actual_points for r in results]

        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean(np.array(errors) ** 2)))

        within_1 = sum(1 for e in abs_errors if e <= 1) / len(results)
        within_2 = sum(1 for e in abs_errors if e <= 2) / len(results)
        within_3 = sum(1 for e in abs_errors if e <= 3) / len(results)

        return BacktestMetrics(
            mae=mae,
            rmse=rmse,
            accuracy_within_1=within_1,
            accuracy_within_2=within_2,
            accuracy_within_3=within_3,
            total_players=len(results),
            mean_predicted=float(np.mean(predicted)),
            mean_actual=float(np.mean(actual)),
        )

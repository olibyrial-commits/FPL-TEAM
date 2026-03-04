from fastapi import APIRouter, HTTPException, Request, Query
from typing import List, Dict, Any
import logging

from app.models.schemas import (
    ManagerTeam,
    ManagerSquad,
    SquadPlayer,
    OptimizeRequest,
    OptimizeResponse,
    PredictionsResponse,
    PlayerPrediction,
    BacktestRequest,
    BacktestResponse,
    FixtureInfo,
)
from app.services.predictor import PointPredictor
from app.services.optimizer import TransferOptimizer
from app.services.price_forecaster import PriceForecaster
from app.services.backtester import Backtester

logger = logging.getLogger(__name__)

router = APIRouter()


def get_fpl_client(request: Request):
    """Dependency to get FPL client from app state"""
    return request.app.state.fpl_client


@router.get("/bootstrap")
async def get_bootstrap_data(request: Request):
    """
    Get all player data, teams, and positions from FPL API.
    """
    fpl_client = get_fpl_client(request)

    try:
        data = await fpl_client.get_bootstrap_static()
        return {
            "teams": data.get("teams", []),
            "players": data.get("elements", []),
            "positions": data.get("element_types", []),
        }
    except Exception as e:
        logger.error(f"Error fetching bootstrap data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fixtures")
async def get_fixtures(request: Request):
    """
    Get fixture data with FDR information.
    """
    fpl_client = get_fpl_client(request)

    try:
        fixtures = await fpl_client.get_fixtures()
        return {"fixtures": fixtures}
    except Exception as e:
        logger.error(f"Error fetching fixtures: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/team/{team_id}")
async def get_team(request: Request, team_id: int):
    """
    Get manager's team information.
    """
    fpl_client = get_fpl_client(request)

    try:
        data = await fpl_client.get_manager_team(team_id)

        current_gw = await fpl_client.get_current_gameweek()
        next_gw = await fpl_client.get_next_gameweek()

        return ManagerTeam(
            team_id=team_id,
            team_name=data.get("name", "Unknown"),
            player_first_name=data.get("player_first_name", ""),
            player_last_name=data.get("player_last_name", ""),
            summary_overall_rank=data.get("summary_overall_rank", 0),
            overall_rank=data.get("overall_rank", 0),
            overall_points=data.get("overall_points", 0),
            bank=data.get("bank", 0) / 10,
            value=data.get("value", 0) / 10,
            free_transfers=data.get("free_transfers", 1),
            saved_transfers=data.get("saved_transfers", 0),
            current_gw=current_gw,
            next_gw=next_gw,
        )
    except Exception as e:
        logger.error(f"Error fetching team {team_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/team/{team_id}/picks")
async def get_team_picks(request: Request, team_id: int):
    """
    Get manager's current squad picks.
    """
    fpl_client = get_fpl_client(request)

    try:
        current_gw = await fpl_client.get_current_gameweek()
        data = await fpl_client.get_manager_picks(team_id, current_gw)

        picks = data.get("picks", [])

        squad_players = []
        for pick in picks:
            squad_players.append(
                SquadPlayer(
                    id=pick.get("element"),
                    web_name=pick.get("element_name", "Unknown"),
                    element_type=pick.get("element_type", 3),
                    team=pick.get("team", 0),
                    price=pick.get("selling_price", 0),
                    position=pick.get("position", 0),
                    is_captain=pick.get("is_captain", False),
                    is_vice_captain=pick.get("is_vice_captain", False),
                    bench_order=pick.get("bench_order", 0),
                )
            )

        return ManagerSquad(
            team_id=team_id,
            picks=squad_players,
            total_value=data.get("entry_history", {}).get("value", 0),
            bank=data.get("entry_history", {}).get("bank", 0),
            transfers_available=data.get("entry_history", {}).get(
                "transfers_available", 1
            ),
            transfers_limit=data.get("entry_history", {}).get("transfers_limit", 1),
        )
    except Exception as e:
        logger.error(f"Error fetching picks for team {team_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize")
async def optimize_team(request: Request, req: OptimizeRequest):
    """
    Run the optimization solver to find the best squad and transfers.
    """
    logger.info(f"=== OPTIMIZATION REQUEST START ===")
    logger.info(f"URL: {req.team_url}")
    logger.info(f"Horizon: {req.horizon}")
    logger.info(f"Use hits: {req.use_hits}")

    fpl_client = get_fpl_client(request)

    try:
        team_id = fpl_client.extract_team_id(req.team_url)
        if not team_id:
            logger.error(f"Failed to extract team ID from URL: {req.team_url}")
            raise HTTPException(
                status_code=400,
                detail="Invalid FPL URL. Please provide a valid team URL (e.g., https://fantasy.premierleague.com/entry/123456)",
            )

        logger.info(f"Extracted team ID: {team_id}")

        # Fetch bootstrap data
        logger.info("Fetching bootstrap data...")
        bootstrap_data = await fpl_client.get_bootstrap_static()
        players = bootstrap_data.get("elements", [])
        teams = bootstrap_data.get("teams", [])
        logger.info(f"Bootstrap: {len(players)} players, {len(teams)} teams")

        # Fetch fixtures
        logger.info("Fetching fixtures...")
        fixtures = await fpl_client.get_fixtures()
        logger.info(f"Fixtures: {len(fixtures)} total")

        # Fetch manager team
        logger.info(f"Fetching manager team {team_id}...")
        manager_data = await fpl_client.get_manager_team(team_id)
        logger.info(
            f"Manager: {manager_data.get('name')}, value={manager_data.get('value')}, bank={manager_data.get('bank')}"
        )

        # Get current gameweek
        current_gw = await fpl_client.get_current_gameweek()
        logger.info(f"Current gameweek: {current_gw}")

        # Fetch squad picks
        logger.info(f"Fetching picks for GW {current_gw}...")
        picks_data = await fpl_client.get_manager_picks(team_id, current_gw)
        picks = picks_data.get("picks", [])
        logger.info(f"Squad picks: {len(picks)} players")

        squad = []
        for pick in picks:
            squad.append(
                {
                    "id": pick.get("element"),
                    "element_type": pick.get("element_type", 3),
                    "team": pick.get("team", 0),
                    "position": pick.get("position", 0),
                    "is_captain": pick.get("is_captain", False),
                    "is_vice_captain": pick.get("is_vice_captain", False),
                    "bench_order": pick.get("bench_order", 0),
                }
            )

        team_value = manager_data.get("value", 1000) / 10
        bank = manager_data.get("bank", 0) / 10
        free_transfers = manager_data.get("free_transfers", 1)

        logger.info(
            f"Team value: {team_value}m, Bank: {bank}m, Free transfers: {free_transfers}"
        )

        # Train prediction model
        logger.info("Training prediction model...")
        predictor = PointPredictor()
        predictor.train(players, teams, fixtures)
        logger.info("Model trained successfully")

        # Generate predictions
        logger.info(
            f"Generating predictions for {len(players)} players over {req.horizon} GWs..."
        )
        predictions = predictor.predict_all_players(
            players=players,
            teams=teams,
            fixtures=fixtures,
            current_gw=current_gw,
            horizon=req.horizon,
        )
        logger.info("Predictions generated")

        # Predict price changes
        logger.info("Predicting price changes...")
        price_changes = PriceForecaster.predict_price_changes(players)

        # Run optimization
        logger.info("Running optimization solver...")
        optimizer = TransferOptimizer()
        optimizer.setup(
            players=players,
            teams=teams,
            predictions=predictions,
            current_squad=squad,
            current_gw=current_gw,
            horizon=req.horizon,
            team_value=team_value,
            bank=bank,
            free_transfers=free_transfers,
            use_hits=req.use_hits,
            chips_available=req.chips_available,
            price_changes=price_changes,
            fixtures=fixtures,
        )

        result = optimizer.optimize()

        logger.info(f"Optimization complete: {result.get('message')}")
        logger.info(f"Points difference: {result.get('points_difference')}")
        logger.info("=== OPTIMIZATION REQUEST END ===")

        return OptimizeResponse(
            success=result["success"],
            message=result["message"],
            current_squad=ManagerSquad(
                team_id=team_id,
                picks=[
                    SquadPlayer(
                        id=p["id"],
                        web_name=next(
                            (
                                p_boost["web_name"]
                                for p_boost in players
                                if p_boost["id"] == p["id"]
                            ),
                            str(p["id"]),
                        ),
                        element_type=p.get("element_type", 3),
                        team=p.get("team", 0),
                        price=0,
                        position=p.get("position", 0),
                        is_captain=p.get("is_captain", False),
                        is_vice_captain=p.get("is_vice_captain", False),
                        bench_order=p.get("bench_order", 0),
                    )
                    for p in squad
                ],
                total_value=int(team_value * 10),
                bank=int(bank * 10),
                transfers_available=free_transfers,
                transfers_limit=1,
            ),
            optimized_squad=result.get("optimized_squad"),
            starting_xi=result.get("starting_xi"),
            bench=result.get("bench"),
            transfer_plan=result.get("transfer_plan"),
            full_plan=result.get("full_plan"),
            current_expected_points=result.get("current_expected_points"),
            optimized_expected_points=result.get("optimized_expected_points"),
            points_difference=result.get("points_difference"),
            savings=0,
            fixtures={
                pid: [FixtureInfo(**f) for f in fixs]
                for pid, fixs in result.get("fixtures", {}).items()
            }
            if result.get("fixtures")
            else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during optimization: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@router.get("/current-gw")
async def get_current_gameweek(request: Request):
    """Get the current gameweek number."""
    logger.info("Fetching current gameweek...")
    fpl_client = get_fpl_client(request)

    try:
        current_gw = await fpl_client.get_current_gameweek()
        next_gw = await fpl_client.get_next_gameweek()
        logger.info(f"Gameweek: current={current_gw}, next={next_gw}")
        return {"current": current_gw, "next": next_gw}
    except Exception as e:
        logger.error(f"Error fetching gameweek: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch gameweek: {str(e)}"
        )


@router.get("/predictions")
async def get_predictions(
    request: Request,
    horizon: int = Query(
        default=1, ge=1, le=8, description="Number of gameweeks to predict"
    ),
):
    """
    Get expected points predictions for all players.
    Horizon is tier-gated: Free=1, Pro=4, Elite=8 (backend validation).
    Frontend should enforce limits; backend enforces max=8.
    """
    logger.info(f"=== PREDICTIONS REQUEST START ===")
    logger.info(f"Horizon: {horizon}")

    fpl_client = get_fpl_client(request)

    try:
        current_gw = await fpl_client.get_current_gameweek()
        logger.info(f"Current gameweek: {current_gw}")

        bootstrap_data = await fpl_client.get_bootstrap_static()
        players = bootstrap_data.get("elements", [])
        teams = bootstrap_data.get("teams", [])
        logger.info(f"Bootstrap: {len(players)} players, {len(teams)} teams")

        fixtures = await fpl_client.get_fixtures()
        logger.info(f"Fixtures: {len(fixtures)} total")

        predictor = PointPredictor()
        predictor.train(players, teams, fixtures)

        predictions = predictor.predict_all_players(
            players=players,
            teams=teams,
            fixtures=fixtures,
            current_gw=current_gw,
            horizon=horizon,
        )

        team_dict = {t["id"]: t for t in teams}
        team_name_dict = {t["id"]: t["name"] for t in teams}

        player_predictions = []
        for player in players:
            player_id = player["id"]
            team_id = player.get("team", 0)

            player_preds = predictions.get(player_id, {})

            total_xp = sum(player_preds.values()) if player_preds else 0

            player_predictions.append(
                PlayerPrediction(
                    id=player_id,
                    web_name=player.get("web_name", "Unknown"),
                    team=team_id,
                    team_name=team_name_dict.get(team_id, "Unknown"),
                    element_type=player.get("element_type", 3),
                    price=player.get("price", 0) or player.get("now_cost", 0) / 10,
                    predictions=player_preds,
                    total_xp=round(total_xp, 2) if total_xp else 0,
                )
            )

        player_predictions.sort(key=lambda x: x.total_xp or 0, reverse=True)

        logger.info(f"Predictions generated for {len(player_predictions)} players")
        logger.info("=== PREDICTIONS REQUEST END ===")

        return PredictionsResponse(
            success=True,
            current_gw=current_gw,
            horizon=horizon,
            predictions=player_predictions,
        )

    except Exception as e:
        logger.error(f"Error generating predictions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Predictions failed: {str(e)}")


@router.post("/backtest")
async def run_backtest(request: Request, req: BacktestRequest):
    """
    Run backtesting on historical gameweeks.

    Validates prediction accuracy by comparing predicted vs actual points
    across specified gameweeks. Returns MAE, RMSE, and accuracy metrics.
    """
    logger.info(f"=== BACKTEST REQUEST START ===")
    logger.info(f"Start GW: {req.start_gw}, End GW: {req.end_gw}")

    fpl_client = get_fpl_client(request)

    try:
        current_gw = await fpl_client.get_current_gameweek()
        logger.info(f"Current gameweek: {current_gw}")

        if req.end_gw >= current_gw:
            logger.warning(
                f"End GW {req.end_gw} >= current GW {current_gw}. "
                f"Adjusting to {current_gw - 1}"
            )
            req.end_gw = current_gw - 1

        if req.start_gw < 1 or req.start_gw > req.end_gw:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid gameweek range: {req.start_gw} to {req.end_gw}",
            )

        logger.info("Fetching bootstrap data...")
        bootstrap_data = await fpl_client.get_bootstrap_static()
        players = bootstrap_data.get("elements", [])
        teams = bootstrap_data.get("teams", [])
        logger.info(f"Bootstrap: {len(players)} players, {len(teams)} teams")

        logger.info("Fetching fixtures...")
        fixtures = await fpl_client.get_fixtures()
        logger.info(f"Fixtures: {len(fixtures)} total")

        logger.info("Running backtest...")
        backtester = Backtester(fpl_client)
        results = await backtester.run_backtest(
            players=players,
            teams=teams,
            fixtures=fixtures,
            start_gw=req.start_gw,
            end_gw=req.end_gw,
        )

        logger.info("=== BACKTEST REQUEST END ===")

        return BacktestResponse(
            success=True,
            start_gw=req.start_gw,
            end_gw=req.end_gw,
            metrics=results["metrics"],
            gameweek_breakdown=results["gameweek_breakdown"],
            top_predictions=results["top_predictions"],
            worst_predictions=results["worst_predictions"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running backtest: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")

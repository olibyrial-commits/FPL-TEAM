#!/usr/bin/env python3
"""
CLI script for optimizing FPL point prediction parameters.

Usage:
    python -m app.scripts.optimize_params --start-gw 1 --end-gw 20 --trials 250

Options:
    --start-gw INT       First gameweek for training (default: 1)
    --end-gw INT         Last gameweek for training (default: current GW - 1)
    --trials INT         Number of optimization trials (default: 250)
    --cv-splits INT      Number of cross-validation splits (default: 5)
    --no-position        Disable position-specific tuning
    --compare            Compare coefficient vs separate model methods
    --save PATH          Save optimized params to file (default: params/model_params.json)
    --apply              Apply optimized params immediately to predictor
    --dry-run            Show results without saving
    --verbose            Enable verbose logging
"""

import asyncio
import argparse
import logging
import os
import sys

# Add parent directory to path
sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.services.fpl_client import FPLClient
from app.services.backtester import Backtester
from app.services.predictor import ModelParams, DEFAULT_PARAMS_PATH


def setup_logging(verbose: bool = False):
    """Configure logging."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%H:%M:%S",
    )


async def main():
    parser = argparse.ArgumentParser(
        description="Optimize FPL point prediction parameters using Bayesian optimization"
    )
    parser.add_argument(
        "--start-gw",
        type=int,
        default=1,
        help="First gameweek for training (default: 1)",
    )
    parser.add_argument(
        "--end-gw",
        type=int,
        default=None,
        help="Last gameweek for training (default: current GW - 1)",
    )
    parser.add_argument(
        "--trials",
        type=int,
        default=250,
        help="Number of optimization trials (default: 250)",
    )
    parser.add_argument(
        "--cv-splits",
        type=int,
        default=5,
        help="Number of cross-validation splits (default: 5)",
    )
    parser.add_argument(
        "--no-position", action="store_true", help="Disable position-specific tuning"
    )
    parser.add_argument(
        "--compare",
        action="store_true",
        help="Compare coefficient vs separate model methods",
    )
    parser.add_argument(
        "--save",
        type=str,
        default="params/model_params.json",
        help="Save optimized params to file (default: params/model_params.json)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply optimized params immediately to predictor",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Show results without saving"
    )
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")

    args = parser.parse_args()

    setup_logging(args.verbose)
    logger = logging.getLogger(__name__)

    print("\n" + "=" * 60)
    print("FPL POINT PREDICTOR - PARAMETER OPTIMIZATION")
    print("=" * 60)
    print(f"\nConfiguration:")
    print(f"  - Trials: {args.trials}")
    print(f"  - CV Splits: {args.cv_splits}")
    print(f"  - Position-specific: {not args.no_position}")
    print(f"  - Compare methods: {args.compare}")

    # Initialize FPL client
    logger.info("Initializing FPL client...")
    fpl_client = FPLClient()
    await fpl_client.initialize()

    # Get current gameweek
    current_gw = await fpl_client.get_current_gameweek()
    logger.info(f"Current gameweek: {current_gw}")

    # Set end_gw if not specified
    if args.end_gw is None:
        args.end_gw = max(1, current_gw - 1)

    if args.end_gw < args.start_gw:
        print(f"\nERROR: end_gw ({args.end_gw}) must be >= start_gw ({args.start_gw})")
        sys.exit(1)

    print(f"  - Gameweek range: {args.start_gw} to {args.end_gw}")
    print()

    # Fetch data
    print("Fetching FPL data...")
    bootstrap_data = await fpl_client.get_bootstrap_static()
    players = bootstrap_data.get("elements", [])
    teams = bootstrap_data.get("teams", [])
    fixtures = await fpl_client.get_fixtures()

    print(f"  - Players: {len(players)}")
    print(f"  - Teams: {len(teams)}")
    print(f"  - Fixtures: {len(fixtures)}")
    print()

    # Run optimization
    print("Starting Bayesian optimization (this may take a while)...\n")

    backtester = Backtester(fpl_client)

    try:
        result = await backtester.optimize_parameters(
            players=players,
            teams=teams,
            fixtures=fixtures,
            start_gw=args.start_gw,
            end_gw=args.end_gw,
            n_trials=args.trials,
            n_cv_splits=args.cv_splits,
            position_specific=not args.no_position,
            compare_methods=args.compare,
        )

        # Print results
        print("\n" + "=" * 60)
        print("OPTIMIZATION RESULTS")
        print("=" * 60)

        print(
            f"\nBest Score: MAE = {result.best_mae:.3f} (RMSE: {result.best_rmse:.3f})"
        )
        print(f"Method used: {result.method}")
        print(f"Trials completed: {result.n_trials}")

        print(f"\n{'─' * 60}")
        print("BEST PARAMETERS:")
        print(f"{'─' * 60}")

        params = result.best_params
        print(f"\nPosition Multipliers:")
        print(f"  GKP: {params.gkp_multiplier:.3f}")
        print(f"  DEF: {params.def_multiplier:.3f}")
        print(f"  MID: {params.mid_multiplier:.3f}")
        print(f"  FWD: {params.fwd_multiplier:.3f}")

        print(f"\nFeature Weights:")
        print(f"  points_pg_weight: {params.points_pg_weight:.3f}")
        print(f"  xgi_weight: {params.xgi_weight:.3f}")
        print(f"  xa_weight: {params.xa_weight:.3f}")
        print(f"  form_weight: {params.form_weight:.3f}")
        print(f"  minutes_weight: {params.minutes_weight:.3f}")
        print(f"  games_weight: {params.games_weight:.3f}")
        print(f"  threat_creativity_weight: {params.threat_creativity_weight:.3f}")

        print(f"\nFixture Factors:")
        print(f"  home_bonus: {params.home_bonus:.3f}")
        print(f"  fdr_weight: {params.fdr_weight:.3f}")

        print(f"\nModel Hyperparameters:")
        print(f"  noise_std: {params.noise_std:.3f}")

        print(f"\n{'─' * 60}")
        print("POSITION-SPECIFIC PERFORMANCE:")
        print(f"{'─' * 60}")

        pos_names = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}
        for pos, metrics in result.position_metrics.items():
            print(
                f"  {pos_names.get(pos, pos)}: MAE={metrics.mae:.3f}, RMSE={metrics.rmse:.3f}, "
                f"Acc@1={metrics.accuracy_within_1 * 100:.1f}%, n={metrics.count}"
            )

        print(f"\n{'─' * 60}")
        print("CROSS-VALIDATION RESULTS:")
        print(f"{'─' * 60}")
        for cv in result.cv_results:
            print(
                f"  Fold {cv['fold']}: Train GWs={cv['train_gws']}, Test GW={cv['test_gw']}, "
                f"MAE={cv['mae']:.3f}, RMSE={cv['rmse']:.3f}"
            )

        # Save or show dry-run
        if args.dry_run:
            print(f"\n[DRY RUN] Parameters NOT saved")
        else:
            save_path = args.save
            if not save_path.startswith("/"):
                save_path = os.path.join(
                    os.path.dirname(
                        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                    ),
                    save_path,
                )

            params.save(save_path)
            print(f"\n[SAVED] Parameters saved to: {save_path}")

        if args.apply:
            print(f"[APPLY] Parameters applied to predictor")

        print("\n" + "=" * 60)
        print("OPTIMIZATION COMPLETE!")
        print("=" * 60 + "\n")

    except Exception as e:
        logger.exception("Optimization failed")
        print(f"\nERROR: {e}")
        sys.exit(1)
    finally:
        await fpl_client.close()


if __name__ == "__main__":
    asyncio.run(main())

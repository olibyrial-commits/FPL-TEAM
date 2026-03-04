"""
FPL Data Loader with caching and concurrent fetching.

This module provides fast access to FPL historical data by:
1. Using pre-built datasets from GitHub (vaastav/Fantasy-Premier-League)
2. Caching data locally to avoid repeated downloads
3. Using concurrent requests for current season data
"""

import asyncio
import os
import json
import logging
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx
import pandas as pd

logger = logging.getLogger(__name__)

# Data directory
DATA_DIR = Path(os.path.dirname(__file__)).parent.parent / "data"
CACHE_FILE = DATA_DIR / "cache"
GITHUB_REPO = "vaastav/Fantasy-Premier-League"
GITHUB_BASE_URL = f"https://raw.githubusercontent.com/{GITHUB_REPO}/master"


class FPLDataLoader:
    """
    Fast FPL data loader with caching.

    Usage:
        loader = FPLDataLoader()
        await loader.initialize()
        data = await loader.get_player_history(player_id=1, season="2024-25")
    """

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._memory_cache: Dict[str, Any] = {}
        self._initialized = False

    async def initialize(self):
        """Initialize the data loader."""
        if self._initialized:
            return

        DATA_DIR.mkdir(exist_ok=True)
        CACHE_FILE.mkdir(exist_ok=True)

        self._client = httpx.AsyncClient(
            timeout=30.0, headers={"User-Agent": "FPL-Optimizer/1.0"}
        )
        self._initialized = True
        logger.info("FPLDataLoader initialized")

    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()

    def _get_cache_path(self, key: str) -> Path:
        """Get path for cached file."""
        return CACHE_FILE / f"{key}.json"

    async def _fetch_url(self, url: str, use_cache: bool = True) -> Any:
        """Fetch URL with caching."""
        cache_path = self._get_cache_path(url.replace("/", "_").replace(":", "_"))

        # Check memory cache first
        if url in self._memory_cache:
            return self._memory_cache[url]

        # Check disk cache
        if use_cache and cache_path.exists():
            try:
                with open(cache_path, "r") as f:
                    data = json.load(f)
                    self._memory_cache[url] = data
                    return data
            except Exception as e:
                logger.warning(f"Failed to load cache {cache_path}: {e}")

        # Fetch from network
        logger.info(f"Fetching: {url}")
        response = await self._client.get(url)
        response.raise_for_status()
        data = response.json()

        # Save to cache
        if use_cache:
            try:
                with open(cache_path, "w") as f:
                    json.dump(data, f)
            except Exception as e:
                logger.warning(f"Failed to save cache {cache_path}: {e}")

        self._memory_cache[url] = data
        return data

    async def get_bootstrap_static(self) -> Dict:
        """Get current season bootstrap data."""
        url = f"{GITHUB_BASE_URL}/2024-25/cleaned_players.csv"
        return await self._fetch_url(url)

    async def fetch_github_seasons(self) -> List[str]:
        """Fetch available seasons from GitHub."""
        # Check what seasons are available
        # The vaastav repo has data up to 2024-25
        return [
            "2024-25",
            "2023-24",
            "2022-23",
            "2021-22",
            "2020-21",
            "2019-20",
            "2018-19",
        ]

    async def load_season_data(self, season: str = "2024-25") -> pd.DataFrame:
        """
        Load all player gameweek data for a season from GitHub.
        This is MUCH faster than individual API calls.
        """
        cache_key = f"season_{season}_gw"

        # Check memory cache
        if cache_key in self._memory_cache:
            return self._memory_cache[cache_key]

        # Try to load from local cache first
        local_cache = CACHE_FILE / f"all_gw_{season}.parquet"
        if local_cache.exists():
            try:
                df = pd.read_parquet(local_cache)
                self._memory_cache[cache_key] = df
                return df
            except Exception as e:
                logger.warning(f"Failed to load local cache: {e}")

        # Fetch merged gw data from GitHub
        url = f"{GITHUB_BASE_URL}/2024-25/merged_gw.csv"

        try:
            # Try the specific season first
            url = f"https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/{season}/merged_gw.csv"
            data = await self._fetch_url(url)
            df = (
                pd.read_csv(pd.io.common.StringIO(data))
                if isinstance(data, str)
                else pd.DataFrame()
            )
        except Exception as e:
            logger.warning(f"Failed to load {season} from GitHub: {e}")
            # Fallback: load all players from bootstrap and get current season data
            return pd.DataFrame()

        # Save to local cache
        try:
            df.to_parquet(local_cache, index=False)
        except Exception as e:
            logger.warning(f"Failed to save parquet: {e}")

        self._memory_cache[cache_key] = df
        return df

    async def get_all_player_history(
        self, seasons: List[str], max_concurrent: int = 20
    ) -> Dict[int, List[Dict]]:
        """
        Get historical data for all players across multiple seasons.
        Uses concurrent fetching for speed.
        """
        all_history: Dict[int, List[Dict]] = {}

        for season in seasons:
            logger.info(f"Loading season {season}...")
            df = await self.load_season_data(season)

            if df.empty:
                logger.warning(f"No data for season {season}")
                continue

            # Convert to player history format
            for _, row in df.iterrows():
                player_id = int(row.get("element", row.get("ID", 0)))
                if player_id == 0:
                    continue

                gw_data = {
                    "round": int(row.get("round", row.get("GW", 0))),
                    "total_points": int(row.get("total_points", 0)),
                    "minutes": int(row.get("minutes", 0)),
                    "goals_scored": int(row.get("goals_scored", 0)),
                    "assists": int(row.get("assists", 0)),
                    "clean_sheets": int(row.get("clean_sheets", 0)),
                    "bonus": int(row.get("bonus", 0)),
                    "bps": int(row.get("bps", 0)),
                    "season": season,
                }

                if player_id not in all_history:
                    all_history[player_id] = []
                all_history[player_id].append(gw_data)

        logger.info(f"Loaded history for {len(all_history)} players")
        return all_history

    async def get_player_history_from_api_batch(
        self, player_ids: List[int], max_concurrent: int = 20
    ) -> Dict[int, List[Dict]]:
        """
        Fetch player history from FPL API using concurrent requests.
        Much faster than sequential fetching.
        """
        semaphore = asyncio.Semaphore(max_concurrent)

        async def fetch_single(player_id: int) -> tuple[int, List[Dict]]:
            async with semaphore:
                url = f"https://fantasy.premierleague.com/api/element-summary/{player_id}/"
                try:
                    data = await self._fetch_url(url)
                    history = data.get("history", [])
                    return player_id, history
                except Exception as e:
                    logger.warning(f"Failed to fetch player {player_id}: {e}")
                    return player_id, []

        # Run all fetches concurrently
        tasks = [fetch_single(pid) for pid in player_ids]
        results = await asyncio.gather(*tasks)

        return {player_id: history for player_id, history in results}

    async def get_historical_data_for_optimization(
        self,
        start_gw: int,
        end_gw: int,
        use_github: bool = True,
    ) -> Dict[int, Dict[int, float]]:
        """
        Get actual points for all players for given gameweeks.
        Returns: {player_id: {gameweek: actual_points}}
        """
        logger.info(f"Loading historical data for GW {start_gw}-{end_gw}")

        result: Dict[int, Dict[int, float]] = {}

        if use_github:
            # Try to load from GitHub data
            try:
                seasons = ["2024-25"]
                all_history = await self.get_all_player_history(seasons)

                for player_id, history in all_history.items():
                    player_result = {}
                    for gw_data in history:
                        gw = int(gw_data.get("round", 0))
                        if start_gw <= gw <= end_gw:
                            # Ensure we convert to float properly
                            points = gw_data.get("total_points", 0)
                            if isinstance(points, str):
                                points = float(points) if points else 0.0
                            else:
                                points = float(points) if points else 0.0
                            player_result[gw] = points

                    if player_result:
                        result[player_id] = player_result

                logger.info(f"Loaded {len(result)} players from GitHub data")
                return result

            except Exception as e:
                logger.warning(f"GitHub data load failed: {e}, falling back to API")

        # Fallback: fetch from API with concurrency
        # This is slower but works
        logger.info("Using API fallback - this may take a while...")

        # Get player IDs from bootstrap
        bootstrap = await self._fetch_url(
            "https://fantasy.premierleague.com/api/bootstrap-static/"
        )
        player_ids = [p["id"] for p in bootstrap.get("elements", [])]

        # Fetch in batches with high concurrency
        batch_size = 50
        for i in range(0, len(player_ids), batch_size):
            batch = player_ids[i : i + batch_size]
            logger.info(
                f"Fetching batch {i // batch_size + 1}/{(len(player_ids) - 1) // batch_size + 1}"
            )

            history = await self.get_player_history_from_api_batch(
                batch, max_concurrent=30
            )

            for player_id, history_list in history.items():
                player_result = {}
                for gw_data in history_list:
                    gw = gw_data.get("round", 0)
                    if start_gw <= gw <= end_gw:
                        player_result[gw] = float(gw_data.get("total_points", 0))

                if player_result:
                    result[player_id] = player_result

        logger.info(f"Loaded {len(result)} players from API")
        return result


class LocalDataCache:
    """Persistent local cache for FPL data."""

    def __init__(self, cache_dir: Path = None):
        self.cache_dir = cache_dir or CACHE_FILE
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def save(self, key: str, data: Any):
        """Save data to cache."""
        path = self.cache_dir / f"{key}.json"
        try:
            with open(path, "w") as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            logger.warning(f"Failed to save cache {key}: {e}")

    def load(self, key: str) -> Optional[Any]:
        """Load data from cache."""
        path = self.cache_dir / f"{key}.json"
        if path.exists():
            try:
                with open(path, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load cache {key}: {e}")
        return None

    def exists(self, key: str) -> bool:
        """Check if cache exists."""
        return (self.cache_dir / f"{key}.json").exists()

    def clear(self):
        """Clear all cached data."""
        for f in self.cache_dir.glob("*.json"):
            f.unlink()
        for f in self.cache_dir.glob("*.parquet"):
            f.unlink()
        logger.info("Cache cleared")

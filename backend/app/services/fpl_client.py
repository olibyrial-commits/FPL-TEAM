import httpx
import asyncio
import re
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class FPLClient:
    """
    Client for fetching data from the official FPL API.
    Implements caching and rate limiting to handle API constraints.
    """

    BASE_URL = "https://fantasy.premierleague.com/api"
    CACHE_TTL = 300  # 5 minutes

    def __init__(self):
        self._cache: Dict[str, tuple[Any, datetime]] = {}
        self._client: Optional[httpx.AsyncClient] = None
        self._request_semaphore = asyncio.Semaphore(1)
        self._last_request_time = datetime.min

    async def initialize(self):
        """Initialize the HTTP client"""
        self._client = httpx.AsyncClient(
            timeout=30.0, headers={"User-Agent": "FPL-Optimizer/1.0 (Python/httpx)"}
        )
        logger.info("FPL Client initialized")

    async def close(self):
        """Close the HTTP client"""
        if self._client:
            await self._client.aclose()

    def _get_cache(self, key: str) -> Optional[Any]:
        """Get cached data if not expired"""
        if key in self._cache:
            data, timestamp = self._cache[key]
            if datetime.now() - timestamp < timedelta(seconds=self.CACHE_TTL):
                logger.debug(f"Cache hit: {key}")
                return data
            else:
                del self._cache[key]
        return None

    def _set_cache(self, key: str, data: Any):
        """Set cache data"""
        self._cache[key] = (data, datetime.now())

    async def _rate_limited_request(self, url: str) -> Any:
        """Make a rate-limited HTTP request"""
        async with self._request_semaphore:
            time_since_last = (datetime.now() - self._last_request_time).total_seconds()
            if time_since_last < 1.1:  # FPL API rate limit
                await asyncio.sleep(1.1 - time_since_last)

            logger.info(f"Requesting: {url}")
            if self._client is None:
                raise RuntimeError("FPL client not initialized")
            response = await self._client.get(url)
            response.raise_for_status()
            self._last_request_time = datetime.now()
            return response.json()

    async def get_bootstrap_static(self) -> Dict:
        """
        Fetch bootstrap-static endpoint containing all player data,
        teams, positions, and global stats.
        """
        cache_key = "bootstrap_static"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        data = await self._rate_limited_request(f"{self.BASE_URL}/bootstrap-static/")
        self._set_cache(cache_key, data)
        return data

    async def get_fixtures(self) -> Any:
        """
        Fetch fixtures data with FDR (Fixture Difficulty Rating),
        home/away information, and team matchups.
        """
        cache_key = "fixtures"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        data = await self._rate_limited_request(f"{self.BASE_URL}/fixtures/")
        self._set_cache(cache_key, data)
        return data

    async def get_manager_team(self, team_id: int) -> Dict:
        """
        Fetch manager's team information including:
        - Team value and bank
        - Free transfers available
        - Overall rank and points
        - Current gameweek
        """
        cache_key = f"team_{team_id}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        data = await self._rate_limited_request(f"{self.BASE_URL}/entry/{team_id}/")
        self._set_cache(cache_key, data)
        return data

    async def get_manager_picks(self, team_id: int, gameweek: int) -> Dict:
        """
        Fetch manager's squad picks for a specific gameweek.
        Returns the starting XI and bench with player details.
        """
        cache_key = f"picks_{team_id}_{gameweek}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        data = await self._rate_limited_request(
            f"{self.BASE_URL}/entry/{team_id}/event/{gameweek}/picks/"
        )
        self._set_cache(cache_key, data)
        return data

    def extract_team_id(self, url: str) -> Optional[int]:
        """
        Extract team ID from FPL URL.
        Supports formats:
        - https://fantasy.premierleague.com/entry/123456/
        - https://fantasy.premierleague.com/entry/123456/history
        - /entry/123456/
        """
        patterns = [
            r"entry/(\d+)",
            r"/entry/(\d+)",
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                team_id = int(match.group(1))
                logger.info(f"Extracted team ID: {team_id} from URL: {url}")
                return team_id

        logger.warning(f"Could not extract team ID from URL: {url}")
        return None

    async def get_all_teams(self) -> List[Dict]:
        """Get all Premier League teams"""
        data = await self.get_bootstrap_static()
        return data.get("teams", [])

    async def get_all_players(self) -> List[Dict]:
        """Get all players with full details"""
        data = await self.get_bootstrap_static()
        return data.get("elements", [])

    async def get_player_positions(self) -> List[Dict]:
        """Get player position types (GKP, DEF, MID, FWD)"""
        data = await self.get_bootstrap_static()
        return data.get("element_types", [])

    async def get_team_fixtures(
        self, team_id: int, num_gameweeks: int = 5
    ) -> List[Dict]:
        """
        Get upcoming fixtures for a specific team.
        Returns fixture difficulty ratings and home/away status.
        """
        fixtures = await self.get_fixtures()
        teams = await self.get_all_teams()

        team_fixture_map = {}
        for team in teams:
            team_fixture_map[team["id"]] = team

        team_fixtures = []
        for fixture in fixtures:
            if fixture["team_a"] == team_id or fixture["team_h"] == team_id:
                if fixture.get("event") and fixture["event"] <= 38:
                    opponent_id = (
                        fixture["team_a"]
                        if fixture["team_h"] == team_id
                        else fixture["team_h"]
                    )
                    is_home = fixture["team_h"] == team_id
                    difficulty = fixture.get(
                        "team_a_difficulty" if is_home else "team_h_difficulty", 3
                    )

                    team_fixtures.append(
                        {
                            "gameweek": fixture["event"],
                            "opponent_id": opponent_id,
                            "opponent_name": team_fixture_map.get(opponent_id, {}).get(
                                "name", "Unknown"
                            ),
                            "is_home": is_home,
                            "difficulty": difficulty,
                        }
                    )

        team_fixtures.sort(key=lambda x: x["gameweek"])
        return team_fixtures[:num_gameweeks]

    async def get_current_gameweek(self) -> int:
        """Get the current gameweek number"""
        data = await self.get_bootstrap_static()
        events = data.get("events", [])
        for event in events:
            if event.get("is_current"):
                return event["id"]
        return 1

    async def get_next_gameweek(self) -> int:
        """Get the next gameweek number"""
        data = await self.get_bootstrap_static()
        events = data.get("events", [])
        current_gw = await self.get_current_gameweek()
        for event in events:
            if event["id"] == current_gw and not event.get("is_finished", False):
                return current_gw
            elif event["id"] == current_gw + 1:
                return event["id"]
        return current_gw + 1

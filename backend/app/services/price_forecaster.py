from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class PriceForecaster:
    """
    Predicts player price changes based on FPL transfer data.
    Uses 'transfers_in_event' and 'transfers_out_event' from the official API.
    """

    DEFAULT_THRESHOLD = 20000  # Net transfers for a price rise/fall

    @staticmethod
    def predict_price_changes(players: List[Dict[str, Any]]) -> Dict[int, float]:
        """
        Predict price changes for the next 24-48 hours.
        Returns a mapping of player_id -> predicted price change (e.g., 0.1 or -0.1).
        """
        predictions = {}

        for player in players:
            player_id = player["id"]
            transfers_in = player.get("transfers_in_event", 0)
            transfers_out = player.get("transfers_out_event", 0)
            net_transfers = transfers_in - transfers_out

            # Simple heuristic: if net transfers > threshold, predict a 0.1 rise
            # If net transfers < -threshold, predict a 0.1 fall
            # We also factor in selected_by_percent to adjust the threshold
            ownership = float(player.get("selected_by_percent", "0"))
            dynamic_threshold = PriceForecaster.DEFAULT_THRESHOLD * (1 + (ownership / 50))

            change = 0.0
            if net_transfers > dynamic_threshold:
                change = 0.1
            elif net_transfers < -dynamic_threshold:
                change = -0.1

            if change != 0:
                predictions[player_id] = change

        logger.info(f"Predicted price changes for {len(predictions)} players")
        return predictions

    @staticmethod
    def forecast_budget(
        current_bank: float,
        current_squad_ids: List[int],
        player_map: Dict[int, Dict[str, Any]],
        price_changes: Dict[int, float],
        horizon: int = 1
    ) -> List[float]:
        """
        Forecast the team budget over the next N gameweeks.
        Accounts for predicted price changes of players in the squad.
        """
        forecasts = []
        # In FPL, you only get half the profit (rounded down) when selling
        # But for budget forecasting of "available funds", we just need to know
        # how much the total squad value + bank will be.
        
        # This is a simplification. Real budget forecasting would need to 
        # know purchase prices to calculate exact selling prices.
        
        current_total_value = current_bank
        for p_id in current_squad_ids:
            player = player_map.get(p_id, {})
            current_total_value += (player.get("now_cost", 0) / 10)

        for i in range(1, horizon + 1):
            # Accumulate predicted changes over the horizon
            # (Assuming the same trend continues, which is a big assumption)
            predicted_change_total = sum(price_changes.get(p_id, 0) for p_id in current_squad_ids)
            # FPL prices change once per day, usually once or twice per week for a player
            # We'll assume the trend manifests over the horizon
            forecasted_value = current_total_value + (predicted_change_total * i)
            forecasts.append(round(forecasted_value, 1))

        return forecasts

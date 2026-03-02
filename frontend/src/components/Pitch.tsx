import React from 'react';
import { SquadPlayer, POSITION_COLORS } from '@/lib/types';

interface PitchProps {
  players: SquadPlayer[];
  title?: string;
}

const Pitch: React.FC<PitchProps> = ({ players, title }) => {
  // Group players by position
  const gks = players.filter(p => p.element_type === 1);
  const defs = players.filter(p => p.element_type === 2);
  const mids = players.filter(p => p.element_type === 3);
  const fwds = players.filter(p => p.element_type === 4);

  const renderPlayer = (player: SquadPlayer) => (
    <div key={player.id} className="flex flex-col items-center justify-center p-1 w-16 md:w-20">
      <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white flex items-center justify-center text-white font-bold shadow-lg ${POSITION_COLORS[player.element_type]}`}>
        {player.is_captain && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] px-1 rounded-sm border border-white">C</span>
        )}
      </div>
      <div className="mt-1 bg-black/80 text-white text-[10px] md:text-xs px-1 py-0.5 rounded text-center w-full truncate border border-white/20">
        {player.web_name}
      </div>
      <div className="bg-white/90 text-black text-[9px] md:text-[10px] px-1 rounded-b w-full text-center border-x border-b border-white/20">
        £{(player.price / 10).toFixed(1)}
      </div>
    </div>
  );

  return (
    <div className="relative w-full aspect-[4/5] bg-green-600 rounded-lg overflow-hidden border-4 border-white/30 shadow-2xl">
      {/* Pitch Lines */}
      <div className="absolute inset-4 border-2 border-white/20 pointer-events-none"></div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-16 border-b-2 border-x-2 border-white/20"></div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-16 border-t-2 border-x-2 border-white/20"></div>
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full"></div>

      {title && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {title}
        </div>
      )}

      {/* Players */}
      <div className="absolute inset-0 flex flex-col justify-around py-4">
        {/* Forwards */}
        <div className="flex justify-center gap-2 md:gap-4">
          {fwds.map(renderPlayer)}
        </div>

        {/* Midfielders */}
        <div className="flex justify-center gap-2 md:gap-4">
          {mids.map(renderPlayer)}
        </div>

        {/* Defenders */}
        <div className="flex justify-center gap-2 md:gap-4">
          {defs.map(renderPlayer)}
        </div>

        {/* Goalkeeper */}
        <div className="flex justify-center">
          {gks.map(renderPlayer)}
        </div>
      </div>
    </div>
  );
};

export default Pitch;

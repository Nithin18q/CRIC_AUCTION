import React from 'react';
import { Target, AlertTriangle, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Smart Bid Alert Component
 * Displays real-time live alerts when the current player in auction is one of the user's targets.
 * 
 * - Below 90% of max: normal status
 * - At or above 90% but <= max: amber warning "APPROACHING YOUR BID LIMIT"
 * - Above max: red alert "MAXIMUM BID EXCEEDED", including amount over planned limit
 * - Completely non-blocking (advisory warning only)
 * - Stops showing when player is no longer being auctioned
 */
const SmartBidAlert = ({ target, currentBid = 0, status }) => {
  // Stop showing active bid alerts when the player is no longer being actively auctioned
  const isActivelyAuctioning = status === 'bidding' || status === 'paused';
  if (!target || !isActivelyAuctioning) {
    return null;
  }

  const maxBid = Number(target.maxBid || 0);
  const actualBid = Number(currentBid || 0);

  // If no planned limit set or invalid, skip
  if (maxBid <= 0) return null;

  const ratio = actualBid / maxBid;
  const percentage = Math.round(ratio * 100);
  const amountOver = actualBid - maxBid;
  const remainingCushion = maxBid - actualBid;

  const isExceeded = actualBid > maxBid;
  const isApproaching = actualBid >= 0.9 * maxBid && actualBid <= maxBid;
  const isNormal = actualBid < 0.9 * maxBid;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${target.id}-${isExceeded ? 'exceeded' : isApproaching ? 'approaching' : 'normal'}`}
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        {isExceeded && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-red-950/80 border-2 border-red-500/80 p-3.5 sm:p-4 text-white shadow-[0_0_35px_rgba(239,68,68,0.35)] backdrop-blur-xl">
            {/* Pulsing Danger Glow Corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10 animate-pulse" />

            <div className="flex items-start sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-500/30 border border-red-400/50 flex items-center justify-center text-red-300 shrink-0 shadow-lg shadow-red-500/30 animate-pulse">
                  <ShieldAlert size={22} className="text-red-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-red-400">
                      MAXIMUM BID EXCEEDED
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-500/30 border border-red-400/40 text-[9px] font-black text-red-200 uppercase tracking-widest">
                      +{amountOver.toFixed(2)} Cr Over Limit
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-300 font-medium mt-0.5 truncate">
                    Planned ceiling: <span className="font-bold text-white">₹{maxBid.toFixed(2)} Cr</span> • Current bid: <span className="font-black text-red-300">₹{actualBid.toFixed(2)} Cr</span> ({percentage}%)
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end shrink-0 pl-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-red-400/80">OVER BUDGET</span>
                <span className="text-base font-black text-red-300 leading-tight">
                  +₹{amountOver.toFixed(2)} Cr
                </span>
                <span className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5">Bidding not blocked</span>
              </div>
            </div>

            {/* Mobile Bottom Over-budget Row */}
            <div className="sm:hidden mt-2 pt-2 border-t border-red-500/20 flex items-center justify-between text-[10px]">
              <span className="text-gray-300">Over planned maximum by:</span>
              <span className="font-black text-red-300 text-xs">+₹{amountOver.toFixed(2)} Cr</span>
            </div>
          </div>
        )}

        {isApproaching && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/70 via-yellow-950/50 to-amber-950/70 border-2 border-amber-500/70 p-3.5 sm:p-4 text-white shadow-[0_0_30px_rgba(245,158,11,0.25)] backdrop-blur-xl">
            {/* Amber Glow Blob */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8 animate-pulse" />

            <div className="flex items-start sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/20 animate-pulse">
                  <AlertTriangle size={22} className="text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-400">
                      APPROACHING YOUR BID LIMIT
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[9px] font-black text-amber-200 uppercase tracking-widest">
                      {percentage}% of Limit
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-300 font-medium mt-0.5 truncate">
                    Current bid: <span className="font-bold text-amber-300">₹{actualBid.toFixed(2)} Cr</span> • Planned max: <span className="font-bold text-white">₹{maxBid.toFixed(2)} Cr</span>
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end shrink-0 pl-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-amber-400/80">REMAINING CUSHION</span>
                <span className="text-base font-black text-amber-300 leading-tight">
                  ₹{remainingCushion.toFixed(2)} Cr
                </span>
                <span className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5">Take caution</span>
              </div>
            </div>

            {/* Mobile Bottom Cushion Row */}
            <div className="sm:hidden mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px]">
              <span className="text-gray-300">Remaining limit cushion:</span>
              <span className="font-black text-amber-300 text-xs">₹{remainingCushion.toFixed(2)} Cr</span>
            </div>
          </div>
        )}

        {isNormal && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0f1f17]/40 to-emerald-950/40 border border-emerald-500/30 p-2.5 sm:p-3 text-white backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Target size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      TARGET PLAYER PRIORITY
                    </span>
                    <span className="text-[8px] text-gray-400 uppercase tracking-wider hidden xs:inline">
                      ({percentage}% of limit)
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-300 truncate">
                    Planned Max: <span className="font-bold text-white">₹{maxBid.toFixed(2)} Cr</span> • Remaining Buffer: <span className="font-bold text-emerald-400">₹{remainingCushion.toFixed(2)} Cr</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Normal Status</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartBidAlert;

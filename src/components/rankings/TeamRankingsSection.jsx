import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Crown,
  ShieldCheck,
  Zap,
  Flame,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Globe,
  Users,
  Target
} from 'lucide-react';

const TeamRankingsSection = ({ rankings = [], onSwitchToSquadTab }) => {
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [showCategoryGuide, setShowCategoryGuide] = useState(false);

  // Trigger celebration confetti for the winning squad
  useEffect(() => {
    if (rankings.length > 0 && rankings[0]?.score > 0) {
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff5500', '#ffd700', '#ffffff', '#ff8c00']
        });
      } catch (e) {
        // Fallback silently if confetti canvas is unavailable
      }
    }
  }, [rankings]);

  if (!rankings || rankings.length === 0) {
    return (
      <div className="bg-[#0b0c10] border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-500">
          <Trophy size={32} />
        </div>
        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">No Auction Data Available</h3>
        <p className="text-sm text-gray-400">
          Squad rankings will automatically calculate once teams purchase players in the auction room.
        </p>
      </div>
    );
  }

  const winner = rankings[0];

  return (
    <div className="space-y-8 sm:space-y-12">
      
      {/* 1. Final Winner Announcement Card */}
      {winner && winner.score > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-[#16130d] via-[#0c0d12] to-[#070709] border-2 border-amber-500/40 p-6 sm:p-10 shadow-[0_0_80px_rgba(245,158,11,0.15)]"
        >
          {/* Ambient Golden Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-orange-600/10 blur-[130px] rounded-full pointer-events-none" />

          {/* Watermark Logo */}
          {winner.teamLogo && (
            <div className="absolute -right-12 -bottom-12 w-64 sm:w-96 h-64 sm:h-96 opacity-[0.06] pointer-events-none grayscale">
              <img src={winner.teamLogo} alt="" className="w-full h-full object-contain" />
            </div>
          )}

          <div className="relative z-10 space-y-8">
            
            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                  <Crown size={14} className="text-amber-400 animate-pulse" />
                  <span>Auction Champion</span>
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-md">
                  STRONGEST SQUAD OF THE AUCTION
                </h2>
              </div>

              {/* Overall Score Badge */}
              <div className="flex items-center gap-4 bg-black/60 border border-amber-500/30 px-5 py-3 rounded-2xl shadow-xl">
                <div className="text-right">
                  <span className="block text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-400/80">Squad Rating</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500">
                      {winner.score}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-500">/ 100</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Trophy size={26} />
                </div>
              </div>
            </div>

            {/* Team Identity & Why They Ranked First */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 flex items-center gap-5">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-black/70 border-2 border-amber-500/30 p-2 sm:p-3 flex items-center justify-center shadow-2xl shrink-0">
                  {winner.teamLogo ? (
                    <img src={winner.teamLogo} alt={winner.teamName} className="w-full h-full object-contain filter drop-shadow-xl" />
                  ) : (
                    <Trophy size={36} className="text-amber-400" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-amber-400 text-black">
                    RANK #1
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">
                    {winner.teamName}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] sm:text-xs font-semibold text-gray-400">
                    <span>{winner.squadCount} Squad Members</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">{winner.overseasCount}/4 Overseas in XI</span>
                    <span>•</span>
                    <span>{winner.bowlingOptionsCount} Bowling Options</span>
                  </div>
                </div>
              </div>

              {/* Justification / Explanation */}
              <div className="lg:col-span-7 bg-white/[0.03] border border-amber-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                  <Sparkles size={13} />
                  <span>Why {winner.teamName} Finished #1</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  {winner.explanation}
                </p>
                {/* Strengths Tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {winner.strengths.map((str, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase tracking-wider"
                    >
                      <CheckCircle size={11} /> {str}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Winner's Strongest Playing XI */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                  <ShieldCheck size={14} className="text-amber-400" />
                  <span>Strongest Valid Playing XI (Max 4 Overseas)</span>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Batting Order (1 - 11)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {winner.playingXI.map((player, idx) => (
                  <div
                    key={player.id}
                    className="group bg-black/50 border border-white/10 hover:border-amber-500/40 p-2.5 rounded-2xl flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-black text-amber-400/70 w-5 text-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 p-0.5 overflow-hidden shrink-0">
                        <img
                          src={player.image}
                          alt={player.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(player.name || 'P');
                          }}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-[11px] font-black uppercase tracking-tight text-white truncate group-hover:text-amber-300">
                            {player.name}
                          </h4>
                          {player.eval?.isOverseas && (
                            <span className="px-1 py-0.2 rounded text-[7px] font-black bg-purple-500/30 text-purple-300 border border-purple-500/40 shrink-0">
                              OS
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400">
                          <span>{player.role}</span>
                          {player.role === 'Wicket-Keeper' && (
                            <span className="text-amber-400 font-extrabold">(WK)</span>
                          )}
                          {player.eval?.bowlingType && (
                            <span className="text-gray-500">• {player.eval.bowlingType}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-black text-amber-400">
                        {player.eval?.rating}
                      </div>
                      {player.eval?.isEstimated && (
                        <span className="text-[7px] font-extrabold text-orange-400 uppercase tracking-tighter" title="Estimated based on base price & role">
                          (Est.)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Winner Key Backups */}
            {winner.backups && winner.backups.length > 0 && (
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <Users size={12} className="text-gray-400" />
                  <span>Key Bench Reserves ({winner.backups.length} Purchased Backups)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {winner.backups.slice(0, 6).map((bp) => (
                    <div
                      key={bp.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-medium text-gray-300"
                    >
                      <span className="font-bold text-white uppercase">{bp.name}</span>
                      <span className="text-[8px] text-gray-500 uppercase">{bp.role}</span>
                      {bp.eval?.isOverseas && <span className="text-[7px] text-purple-400 font-bold">OS</span>}
                      <span className="text-[9px] font-black text-amber-400/80">{bp.eval?.rating}</span>
                      {bp.eval?.isEstimated && <span className="text-[7px] text-orange-400">(Est.)</span>}
                    </div>
                  ))}
                  {winner.backups.length > 6 && (
                    <span className="text-[9px] text-gray-500 self-center font-bold">
                      +{winner.backups.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>
        </motion.div>
      )}

      {/* 2. Team Rankings Leaderboard Header & Guide Toggle */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white">
              Complete Squad Standings
            </h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
              Ranked from Strongest to Weakest using Actual Final Auction Squads
            </p>
          </div>

          <button
            onClick={() => setShowCategoryGuide(!showCategoryGuide)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
          >
            <HelpCircle size={13} />
            <span>{showCategoryGuide ? 'Hide Scoring Model' : 'View Scoring Model (10 Factors)'}</span>
          </button>
        </div>

        {/* Explainable Scoring Model Guide */}
        <AnimatePresence>
          {showCategoryGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#0b0c10] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 text-xs text-gray-400">
                <div className="flex items-center gap-2 text-white font-black uppercase tracking-widest text-[11px]">
                  <Target size={14} className="text-orange-500" />
                  <span>Objective 10-Dimension Evaluation Framework (Score / 100)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { title: 'Opening Pair (10%)', desc: 'Ratings & strike rates of top-2 opening batsmen.' },
                    { title: 'Middle Order (12%)', desc: 'Stability, averages, and tempo across positions #3 to #5.' },
                    { title: 'Finishing Ability (10%)', desc: 'Accelerators with SR > 150 & boundary prowess in death overs.' },
                    { title: 'Wicketkeeper (8%)', desc: 'Specialist keeper presence, batting stats & glove quality.' },
                    { title: 'All-Rounders & Depth (12%)', desc: 'Two-way all-rounders extending batting down to #8/#9.' },
                    { title: 'Pace Bowling (12%)', desc: 'Frontline fast bowlers, strike rates, and raw speed options.' },
                    { title: 'Spin Bowling (10%)', desc: 'Wrist & finger spinners capable of controlling middle overs.' },
                    { title: 'Death Bowling (10%)', desc: 'Yorker execution & economy in overs 16-20.' },
                    { title: 'Squad Balance (8%)', desc: 'Strict IPL rules (max 4 OS in XI, min 5 bowling options).' },
                    { title: 'Backup Depth (8%)', desc: 'Bench quality of remaining squad members in case of injury.' },
                  ].map((dim, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 p-3 rounded-xl space-y-1">
                      <div className="font-black text-white text-[10px] uppercase tracking-wide">{dim.title}</div>
                      <p className="text-[9px] text-gray-400 leading-relaxed">{dim.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-500 italic">
                  * Note: Uses actual career and tournament statistics where available. Players without historical match data are clearly flagged as "(Est.)" with ratings derived objectively from their base price and player set.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Team Rankings Accordion Cards */}
      <div className="space-y-4">
        {rankings.map((team) => {
          const isExpanded = expandedTeamId === team.teamId;
          const isChampion = team.rank === 1;

          return (
            <div
              key={team.teamId}
              className={`rounded-2xl sm:rounded-3xl border transition-all overflow-hidden ${
                isChampion
                  ? 'bg-gradient-to-r from-amber-500/[0.04] to-transparent border-amber-500/30'
                  : 'bg-[#0a0a0c] border-white/10 hover:border-white/20'
              }`}
            >
              {/* Header Accordion Bar */}
              <div
                onClick={() => setExpandedTeamId(isExpanded ? null : team.teamId)}
                className="p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 cursor-pointer select-none group"
              >
                <div className="flex items-center gap-4 sm:gap-6">
                  {/* Rank Badge */}
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-sm sm:text-xl shrink-0 ${
                    team.rank === 1
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                      : team.rank === 2
                      ? 'bg-slate-300 text-black'
                      : team.rank === 3
                      ? 'bg-amber-700/80 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-400'
                  }`}>
                    #{team.rank}
                  </div>

                  {/* Team Logo & Info */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-black/60 border border-white/10 p-1.5 flex items-center justify-center shrink-0">
                    {team.teamLogo ? (
                      <img src={team.teamLogo} alt={team.teamName} className="w-full h-full object-contain" />
                    ) : (
                      <Trophy size={20} className="text-gray-500" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-white group-hover:text-orange-500 transition-colors">
                        {team.teamName}
                      </h3>
                      {team.rank === 1 && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Champion
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-semibold text-gray-400 mt-0.5">
                      <span>{team.squadCount} Players</span>
                      <span>•</span>
                      <span className="text-purple-400">{team.overseasCount}/4 OS in XI</span>
                      <span>•</span>
                      <span className="text-blue-400">{team.bowlingOptionsCount} Bowlers</span>
                    </div>
                  </div>
                </div>

                {/* Score and Strengths Summary */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                  <div className="hidden md:flex flex-col items-end gap-1">
                    <div className="flex gap-1.5">
                      {team.strengths.slice(0, 2).map((st, i) => (
                        <span key={i} className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {st}
                        </span>
                      ))}
                    </div>
                    {team.weaknesses[0] && (
                      <span className="text-[8px] font-bold text-amber-400/80 uppercase">
                        ⚠️ {team.weaknesses[0]}
                      </span>
                    )}
                  </div>

                  {/* Big Score */}
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-baseline justify-end gap-1">
                      <span className={team.rank === 1 ? 'text-amber-400' : 'text-orange-500'}>{team.score}</span>
                      <span className="text-[10px] font-bold text-gray-500">/100</span>
                    </div>
                    <span className="block text-[8px] font-black text-gray-500 uppercase tracking-widest">
                      {team.score >= 88 ? 'Elite Squad' : team.score >= 80 ? 'Contender' : 'Developing'}
                    </span>
                  </div>

                  {/* Toggle Arrow */}
                  <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-all shrink-0 ${isExpanded ? 'rotate-180 bg-orange-600 text-white' : ''}`}>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Expanded Squad Evaluation Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10 bg-[#070709] p-4 sm:p-8 space-y-6 sm:space-y-8"
                  >
                    {/* Strengths & Weaknesses Detailed */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                          <CheckCircle size={14} />
                          <span>Squad Strengths</span>
                        </div>
                        <ul className="space-y-1.5">
                          {team.strengths.map((str, sIdx) => (
                            <li key={sIdx} className="text-xs text-gray-300 flex items-start gap-2">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                          <AlertCircle size={14} />
                          <span>Areas for Improvement / Weaknesses</span>
                        </div>
                        <ul className="space-y-1.5">
                          {team.weaknesses.map((weak, wIdx) => (
                            <li key={wIdx} className="text-xs text-gray-300 flex items-start gap-2">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{weak}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Detailed Dimension Ratings */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">
                        Category Breakdown (Out of 100)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                        {[
                          { label: 'Opening Pair', val: team.dimensions?.openingPair },
                          { label: 'Middle Order', val: team.dimensions?.middleOrder },
                          { label: 'Finishing', val: team.dimensions?.finishing },
                          { label: 'Wicketkeeper', val: team.dimensions?.wicketkeeper },
                          { label: 'All-Rounders', val: team.dimensions?.allRoundersAndDepth },
                          { label: 'Pace Bowling', val: team.dimensions?.paceBowling },
                          { label: 'Spin Bowling', val: team.dimensions?.spinBowling },
                          { label: 'Death Bowling', val: team.dimensions?.deathBowling },
                          { label: 'Squad Balance', val: team.dimensions?.squadBalance },
                          { label: 'Bench Depth', val: team.dimensions?.backupDepth },
                        ].map((dim, dIdx) => (
                          <div key={dIdx} className="bg-white/5 border border-white/5 p-2.5 rounded-xl">
                            <span className="block text-[8px] font-black text-gray-500 uppercase tracking-wider truncate">
                              {dim.label}
                            </span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-black text-white">{dim.val}</span>
                              <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
                                  style={{ width: `${Math.min(100, dim.val || 50)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strongest Playing XI */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
                          <ShieldCheck size={14} className="text-orange-500" />
                          <span>Strongest Valid Playing XI ({team.playingXI.length} Players)</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                          Max 4 Overseas • Wicketkeeper Included
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {team.playingXI.map((player, idx) => (
                          <div
                            key={player.id}
                            className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-black text-gray-500 w-5 text-center shrink-0">
                                #{idx + 1}
                              </span>
                              <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 p-0.5 overflow-hidden shrink-0">
                                <img
                                  src={player.image}
                                  alt={player.name}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(player.name || 'P');
                                  }}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h5 className="text-xs font-black uppercase tracking-tight text-white truncate">
                                    {player.name}
                                  </h5>
                                  {player.eval?.isOverseas && (
                                    <span className="px-1 py-0.2 rounded text-[7px] font-black bg-purple-500/30 text-purple-300 border border-purple-500/40 shrink-0">
                                      OS
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-400">
                                  <span>{player.role}</span>
                                  {player.role === 'Wicket-Keeper' && (
                                    <span className="text-amber-400 font-extrabold">(WK)</span>
                                  )}
                                  {player.eval?.bowlingType && (
                                    <span className="text-gray-500">• {player.eval.bowlingType}</span>
                                  )}
                                  <span>• ₹{player.bid?.toFixed(2)}Cr</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-xs font-black text-orange-400">
                                {player.eval?.rating}
                              </div>
                              {player.eval?.isEstimated && (
                                <span className="text-[7px] font-black text-orange-400 uppercase">
                                  (Est.)
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Backups from Remaining Purchased Squad */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                          <Users size={14} className="text-gray-400" />
                          <span>Squad Backups & Bench Strength ({team.backups.length} Players)</span>
                        </div>
                        <span className="text-[9px] text-gray-500">
                          Selected from remaining purchased squad
                        </span>
                      </div>

                      {team.backups.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {team.backups.map((bp) => (
                            <div
                              key={bp.id}
                              className="bg-black/40 border border-white/5 p-2.5 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-bold text-white uppercase text-[11px] truncate">{bp.name}</span>
                                  {bp.eval?.isOverseas && (
                                    <span className="text-[7px] text-purple-400 font-extrabold shrink-0">OS</span>
                                  )}
                                </div>
                                <span className="text-[8px] text-gray-500 uppercase block">{bp.role} • ₹{bp.bid?.toFixed(2)}Cr</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-black text-gray-300">{bp.eval?.rating}</span>
                                {bp.eval?.isEstimated && (
                                  <span className="text-[7px] font-bold text-orange-400 block">(Est.)</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No remaining players on the bench.</p>
                      )}
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default TeamRankingsSection;

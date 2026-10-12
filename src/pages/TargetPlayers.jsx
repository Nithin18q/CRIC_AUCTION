import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../contexts/AuctionContext';
import { useAuth } from '../contexts/AuthContext';
import { IPL_PLAYERS } from '../data/players';
import { TEAMS } from '../data/teams';
import {
  getTargetPlayers,
  saveTargetPlayers,
  setTargetsConfirmed
} from '../lib/targetPlayersStorage';
import {
  Target,
  Search,
  Filter,
  Trash2,
  Plus,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  X,
  RefreshCw,
  Gavel,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_TARGETS = 5;

const TargetPlayers = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentAuction, roomTeams, joinAuction } = useAuction();

  // Load existing saved targets for this room + user session
  const [targets, setTargets] = useState(() => getTargetPlayers(id, user?.uid));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [replacingSlotIndex, setReplacingSlotIndex] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);

  // Re-sync targets once user auth resolves (useState initializer may have run with null uid)
  useEffect(() => {
    if (user?.uid) {
      const saved = getTargetPlayers(id, user.uid);
      if (saved.length > 0) {
        setTargets(saved);
      }
    }
  }, [id, user?.uid]);

  // Subscribe to auction room if not joined yet
  useEffect(() => {
    if (id && user?.uid) {
      const unsub = joinAuction(id, user.uid);
      return () => unsub?.();
    }
  }, [id, user?.uid, joinAuction]);

  // Find user's assigned team
  const myPlayer = currentAuction?.players?.find(p => p.id === user?.uid);
  const myTeamId = myPlayer?.team;
  const franchise = TEAMS.find(t => t.id === myTeamId) || TEAMS[0];
  const teamDoc = roomTeams?.find(doc => doc.teamId === myTeamId);
  const totalBudget = currentAuction?.settings?.budget || 120;
  const purseRemaining = teamDoc?.budgetRemaining ?? totalBudget;

  // Extract all distinct auction sets available
  const allSets = useMemo(() => {
    const sets = Array.from(new Set(IPL_PLAYERS.map(p => p.set).filter(Boolean)));
    return ['all', ...sets];
  }, []);

  // Filter players catalog
  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return IPL_PLAYERS.filter(player => {
      const matchesSearch = !q || player.name.toLowerCase().includes(q);
      const matchesSet = selectedSet === 'all' || player.set === selectedSet;
      const matchesRole = selectedRole === 'all' || player.role === selectedRole;
      const matchesCountry =
        selectedCountry === 'all' ||
        (selectedCountry === 'IND' ? player.country === 'IND' : player.country !== 'IND');

      return matchesSearch && matchesSet && matchesRole && matchesCountry;
    });
  }, [searchQuery, selectedSet, selectedRole, selectedCountry]);

  // Compute total planned expenditure
  const totalPlannedBid = useMemo(() => {
    return targets.reduce((sum, t) => sum + (Number(t.maxBid) || 0), 0);
  }, [targets]);

  const purseBuffer = totalBudget - totalPlannedBid;

  // Handle adding a target player
  const handleSelectPlayer = (player) => {
    // If player is already targeted
    const existingIndex = targets.findIndex(t => t.id === player.id);
    if (existingIndex !== -1) {
      // Already selected; if in replacement mode, cancel replacement
      if (replacingSlotIndex !== null) {
        setReplacingSlotIndex(null);
      }
      return;
    }

    // Default max bid to player's base price or minimum reasonable bid
    const defaultBid = Math.max(Number(player.basePrice || 2), 2);

    const newTargetObj = {
      ...player,
      maxBid: defaultBid
    };

    if (replacingSlotIndex !== null && replacingSlotIndex < targets.length) {
      // Replace existing slot
      const updated = [...targets];
      updated[replacingSlotIndex] = newTargetObj;
      setTargets(updated);
      setReplacingSlotIndex(null);
    } else {
      // Add new target if below maximum limit
      if (targets.length >= MAX_TARGETS) {
        setValidationErrors({ general: `You can select a maximum of ${MAX_TARGETS} target players. Remove or replace one to add another.` });
        setTimeout(() => setValidationErrors({}), 3500);
        return;
      }
      setTargets(prev => [...prev, newTargetObj]);
    }

    // Clear any previous error on this player
    setValidationErrors(prev => {
      const c = { ...prev };
      delete c[player.id];
      delete c.general;
      return c;
    });
  };

  // Handle removing a target player
  const handleRemoveTarget = (playerId) => {
    setTargets(prev => prev.filter(t => t.id !== playerId));
    if (replacingSlotIndex !== null) setReplacingSlotIndex(null);
    setValidationErrors(prev => {
      const c = { ...prev };
      delete c[playerId];
      delete c.general;
      return c;
    });
  };

  // Handle editing max bid for a target player
  const handleMaxBidChange = (playerId, val) => {
    const num = parseFloat(val);
    setTargets(prev =>
      prev.map(t => {
        if (t.id === playerId) {
          return { ...t, maxBid: isNaN(num) ? '' : num };
        }
        return t;
      })
    );

    // Validate on the fly
    const target = targets.find(t => t.id === playerId);
    if (target) {
      if (isNaN(num) || num <= 0) {
        setValidationErrors(prev => ({ ...prev, [playerId]: 'Enter a positive bid amount' }));
      } else if (num < target.basePrice) {
        setValidationErrors(prev => ({
          ...prev,
          [playerId]: `Cannot be lower than base price (₹${target.basePrice.toFixed(2)} Cr)`
        }));
      } else {
        setValidationErrors(prev => {
          const c = { ...prev };
          delete c[playerId];
          return c;
        });
      }
    }
  };

  // Stepper increment / decrement
  const handleBidStep = (playerId, step) => {
    const target = targets.find(t => t.id === playerId);
    if (!target) return;
    const current = Number(target.maxBid || target.basePrice || 2);
    const nextVal = Math.max(target.basePrice, Math.round((current + step) * 100) / 100);
    handleMaxBidChange(playerId, nextVal);
  };

  // Validate all selections before moving to Confirmation Screen
  const handleProceedToConfirmation = () => {
    const errors = {};

    if (targets.length === 0) {
      errors.general = 'Please select at least 1 target player (up to 5) or proceed without targets.';
    }

    targets.forEach(t => {
      const val = Number(t.maxBid);
      if (isNaN(val) || val <= 0) {
        errors[t.id] = 'Planned bid must be greater than 0';
      } else if (val < t.basePrice) {
        errors[t.id] = `Cannot be lower than base price (₹${t.basePrice.toFixed(2)} Cr)`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setShowConfirmationScreen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Confirmation: Save & Enter Existing Auction Room
  const handleConfirmAndEnterAuction = () => {
    saveTargetPlayers(id, targets, user?.uid);
    setTargetsConfirmed(id, true, user?.uid);

    setTimeout(() => {
      navigate(`/auction/${id}`, { replace: true });
    }, 400);
  };

  // Skip & Enter directly without targets
  const handleSkipToAuction = () => {
    setTargetsConfirmed(id, true, user?.uid);
    navigate(`/auction/${id}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans flex flex-col relative selection:bg-orange-500/30 selection:text-orange-200">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/3 left-10 w-[450px] h-[450px] bg-blue-600/5 blur-[130px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/lobby/${id}`)}
            className="p-2 sm:px-3 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all text-xs font-bold flex items-center gap-2 cursor-pointer"
            title="Back to Lobby"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Lobby</span>
          </button>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
              HUB: {id}
            </span>
            {currentAuction?.status === 'active' && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                AUCTION LIVE
              </span>
            )}
          </div>
        </div>

        {/* User Franchise Indicator */}
        <div className="flex items-center gap-3">
          {franchise && (
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <img
                src={franchise.logo}
                alt={`${franchise.name} Logo`}
                className="w-5 h-5 object-contain"
              />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">
                  {franchise.name}
                </span>
                <span className="text-[9px] font-bold text-gray-400 leading-none">
                  Purse: <span className="text-yellow-400">₹{purseRemaining.toFixed(1)} Cr</span>
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleSkipToAuction}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] sm:text-xs font-bold text-gray-300 hover:text-white transition-all uppercase tracking-wider cursor-pointer"
          >
            Skip to Auction
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 z-10 flex flex-col gap-6">

        {/* Final Confirmation Screen View */}
        <AnimatePresence mode="wait">
          {showConfirmationScreen ? (
            <motion.div
              key="confirmation-step"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-4xl mx-auto flex flex-col gap-6"
            >
              <div className="bg-gradient-to-b from-[#141414] to-[#0d0d0d] border border-orange-500/30 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_20px_60px_rgba(255,85,0,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                {/* Confirmation Header */}
                <div className="text-center max-w-2xl mx-auto mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest mb-3">
                    <ShieldCheck size={14} /> STEP 2 OF 2 — STRATEGY CONFIRMATION
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mb-2">
                    Review Your Target Bid Ceilings
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    Verify your planned ceiling bids for each target player. Real-time alerts will activate
                    during the live auction as bids reach or surpass these thresholds.
                  </p>
                </div>

                {/* Franchise Strategy Summary Card */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-white/5">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                      Franchise
                    </span>
                    <span className="text-sm sm:text-base font-black text-white uppercase">
                      {franchise.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                      Target Players
                    </span>
                    <span className="text-sm sm:text-base font-black text-orange-400">
                      {targets.length} / {MAX_TARGETS}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                      Planned Allocation
                    </span>
                    <span className="text-sm sm:text-base font-black text-yellow-400">
                      ₹{totalPlannedBid.toFixed(2)} Cr
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                      Purse Buffer
                    </span>
                    <span
                      className={`text-sm sm:text-base font-black ${
                        purseBuffer < 0 ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {purseBuffer >= 0 ? `+₹${purseBuffer.toFixed(1)} Cr` : `-₹${Math.abs(purseBuffer).toFixed(1)} Cr`}
                    </span>
                  </div>
                </div>

                {/* Target Players Review List */}
                <div className="space-y-3 mb-8">
                  {targets.map((target, idx) => {
                    const maxBid = Number(target.maxBid || target.basePrice);
                    const amberThreshold = maxBid * 0.9;

                    return (
                      <div
                        key={target.id}
                        className="bg-[#111111] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-white/20"
                      >
                        <div className="flex items-center gap-3.5 w-full sm:w-auto">
                          <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-black shrink-0">
                            #{idx + 1}
                          </div>
                          <img
                            src={target.image}
                            alt={target.name}
                            className="w-12 h-12 rounded-xl object-cover bg-white/5 border border-white/10 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm sm:text-base font-black text-white">
                                {target.name}
                              </h3>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                                {target.role}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">
                              Set: <span className="text-gray-300">{target.set}</span> • Base: ₹{target.basePrice.toFixed(2)} Cr
                            </span>
                          </div>
                        </div>

                        {/* Ceilings breakdown */}
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                          <div className="text-left sm:text-right">
                            <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 block">
                              Amber Alert (90%)
                            </span>
                            <span className="text-xs font-black text-amber-300">
                              ≥ ₹{amberThreshold.toFixed(2)} Cr
                            </span>
                          </div>

                          <div className="h-6 w-px bg-white/10 hidden sm:block" />

                          <div className="text-right bg-orange-500/10 border border-orange-500/30 px-3.5 py-1.5 rounded-xl">
                            <span className="text-[8px] font-black uppercase tracking-widest text-orange-400 block">
                              Planned Ceiling Limit
                            </span>
                            <span className="text-sm sm:text-base font-black text-white">
                              ₹{maxBid.toFixed(2)} Cr
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Alert */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-amber-300 text-xs mb-8">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block mb-0.5">
                      How Live Smart Bid Alerts Work:
                    </span>
                    <p className="text-amber-200/80 leading-relaxed text-[11px]">
                      When any of your target players is on the auction block, the system monitors the real-time bid.
                      At <span className="font-bold text-amber-300">90% of your maximum</span>, an amber notice will warn you.
                      If bidding <span className="font-bold text-red-400">exceeds your limit</span>, a prominent red alert will indicate the exact overrun amount. Bidding remains fully enabled.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setShowConfirmationScreen(false)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ArrowLeft size={16} /> Edit Targets
                  </button>

                  <button
                    onClick={handleConfirmAndEnterAuction}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(255,85,0,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Gavel size={18} /> Confirm & Enter Auction Room
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Setup & Selection View */
            <motion.div
              key="setup-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-8"
            >
              {/* Hero Banner */}
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-[#141414] to-[#0a0a0a] border border-white/10 p-6 sm:p-10 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none -mr-20 -mt-20" />

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest mb-3">
                      <Target size={14} /> AUCTION STRATEGY HUB
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-2 leading-tight">
                      Target Players & Smart Bid Alerts
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      Select up to <span className="text-white font-bold">5 priority target players</span> from any auction set.
                      Enter your maximum ceiling bid in Crores (₹ Cr). Real-time bid alerts will keep you informed during live bidding.
                    </p>
                  </div>

                  {/* Summary Metric Widgets */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
                    <div className="flex-1 sm:w-36 bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                        Slots Selected
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-orange-400">
                        {targets.length} / {MAX_TARGETS}
                      </span>
                    </div>

                    <div className="flex-1 sm:w-44 bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                        Planned Ceiling Total
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-yellow-400">
                        ₹{totalPlannedBid.toFixed(2)} Cr
                      </span>
                    </div>
                  </div>
                </div>

                {validationErrors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2"
                  >
                    <AlertCircle size={16} className="shrink-0 text-red-400" />
                    <span>{validationErrors.general}</span>
                  </motion.div>
                )}
              </div>

              {/* TARGET DOCK: The 5 Selected Target Slots */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                      <Target size={20} className="text-orange-500" />
                      Your Target Board ({targets.length}/{MAX_TARGETS})
                    </h2>
                    <p className="text-[11px] text-gray-400">
                      Set maximum planned bids in Crores. Live warnings trigger at 90% and red alerts trigger if exceeded.
                    </p>
                  </div>

                  {targets.length > 0 && (
                    <button
                      onClick={() => setTargets([])}
                      className="text-[10px] font-bold text-gray-400 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> Clear Board
                    </button>
                  )}
                </div>

                {/* 5 Slots Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                  {Array.from({ length: MAX_TARGETS }).map((_, slotIdx) => {
                    const target = targets[slotIdx];
                    const isReplacingThis = replacingSlotIndex === slotIdx;

                    if (!target) {
                      return (
                        <div
                          key={`empty-slot-${slotIdx}`}
                          className={`rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center text-center min-h-[220px] transition-all ${
                            isReplacingThis
                              ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(255,85,0,0.2)]'
                              : 'border-white/10 bg-white/[0.01] hover:border-white/20'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-2">
                            <Plus size={18} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                            Target Slot #{slotIdx + 1}
                          </span>
                          <span className="text-[9px] text-gray-500 mt-1 max-w-[120px]">
                            {isReplacingThis ? 'Select a player below to replace' : 'Select player from catalog below'}
                          </span>
                        </div>
                      );
                    }

                    const err = validationErrors[target.id];

                    return (
                      <motion.div
                        key={target.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`rounded-2xl bg-gradient-to-b from-[#161616] to-[#111111] border p-4 flex flex-col justify-between transition-all relative group shadow-lg ${
                          isReplacingThis
                            ? 'border-orange-500 shadow-[0_0_25px_rgba(255,85,0,0.3)]'
                            : err
                            ? 'border-red-500/70 bg-red-950/20'
                            : 'border-white/15 hover:border-orange-500/50'
                        }`}
                      >
                        {/* Slot Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[9px] font-black uppercase tracking-widest">
                            Target #{slotIdx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setReplacingSlotIndex(isReplacingThis ? null : slotIdx)
                              }
                              className={`p-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                isReplacingThis
                                  ? 'bg-orange-500 text-black'
                                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                              }`}
                              title="Replace with another player"
                            >
                              <RefreshCw size={12} />
                            </button>
                            <button
                              onClick={() => handleRemoveTarget(target.id)}
                              className="p-1 rounded-lg bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remove target"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Player Basic Info */}
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={target.image}
                            alt={target.name}
                            className="w-12 h-12 rounded-xl object-cover bg-white/5 border border-white/10 shrink-0"
                          />
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-black text-white truncate leading-tight">
                              {target.name}
                            </h3>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">
                              {target.role}
                            </span>
                            <span className="text-[8px] font-bold text-gray-500 block truncate">
                              {target.set}
                            </span>
                          </div>
                        </div>

                        {/* Base Price Display */}
                        <div className="text-[10px] text-gray-400 mb-2 flex items-center justify-between bg-white/[0.02] px-2 py-1 rounded-lg border border-white/5">
                          <span>Base Price:</span>
                          <span className="font-bold text-gray-200">₹{target.basePrice.toFixed(2)} Cr</span>
                        </div>

                        {/* Planned Ceiling Input */}
                        <div className="mt-auto pt-2 border-t border-white/5">
                          <label className="block text-[8px] font-black uppercase tracking-widest text-orange-400 mb-1">
                            Planned Max Bid (Cr)
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleBidStep(target.id, -0.5)}
                              className="w-7 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-black text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            >
                              -
                            </button>
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                                ₹
                              </span>
                              <input
                                type="number"
                                step="0.25"
                                min={target.basePrice}
                                max="35"
                                value={target.maxBid}
                                onChange={e => handleMaxBidChange(target.id, e.target.value)}
                                className={`w-full bg-black/60 border rounded-lg py-1.5 pl-6 pr-6 text-xs font-black text-white text-center focus:outline-none transition-colors ${
                                  err ? 'border-red-500 text-red-300' : 'border-white/15 focus:border-orange-500'
                                }`}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-500">
                                Cr
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleBidStep(target.id, 0.5)}
                              className="w-7 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-black text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {err && (
                            <span className="text-[9px] font-bold text-red-400 mt-1 block leading-tight">
                              {err}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bottom Bar for Proceeding */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10 mt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Sparkles size={16} className="text-orange-400 shrink-0" />
                    <span>
                      {targets.length === 0
                        ? 'Select players from below to add to your target strategy.'
                        : `${targets.length} of ${MAX_TARGETS} targets defined. Total ceiling: ₹${totalPlannedBid.toFixed(2)} Cr.`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleProceedToConfirmation}
                      disabled={targets.length === 0}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-widest shadow-[0_8px_25px_rgba(255,85,0,0.3)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <span>Review & Confirm Strategy</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </section>

              {/* PLAYER CATALOG & SEARCH */}
              <section className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                      <Search size={20} className="text-orange-500" />
                      Browse Auction Sets & Players
                    </h2>
                    <p className="text-[11px] text-gray-400">
                      Find players across all marquee and regular auction sets to assign as targets.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full md:w-80">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search player name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2 pb-2">
                  {/* Auction Sets Dropdown Filter */}
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                    <Filter size={13} className="text-orange-400" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                      Set:
                    </span>
                    <select
                      value={selectedSet}
                      onChange={e => setSelectedSet(e.target.value)}
                      className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-[#121212] text-white">
                        All Sets ({IPL_PLAYERS.length})
                      </option>
                      {allSets.filter(s => s !== 'all').map(s => (
                        <option key={s} value={s} className="bg-[#121212] text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role Pills */}
                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
                    {['all', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map(r => (
                      <button
                        key={r}
                        onClick={() => setSelectedRole(r)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          selectedRole === r
                            ? 'bg-orange-500 text-black shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {r === 'all' ? 'All Roles' : r}
                      </button>
                    ))}
                  </div>

                  {/* Country / Type Pills */}
                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
                    {['all', 'IND', 'OS'].map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedCountry(c)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          selectedCountry === c
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {c === 'all' ? 'All' : c === 'IND' ? 'Indian' : 'Overseas'}
                      </button>
                    ))}
                  </div>

                  <span className="ml-auto text-[10px] font-bold text-gray-500">
                    Showing {filteredPlayers.length} players
                  </span>
                </div>

                {/* Player Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {filteredPlayers.slice(0, 48).map(player => {
                    const isTargeted = targets.some(t => t.id === player.id);
                    const targetedSlotIndex = targets.findIndex(t => t.id === player.id);
                    const isBoardFull = targets.length >= MAX_TARGETS;

                    return (
                      <div
                        key={player.id}
                        className={`rounded-2xl border p-3 flex flex-col justify-between transition-all group relative ${
                          isTargeted
                            ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_20px_rgba(255,85,0,0.15)]'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/25 hover:bg-white/[0.04]'
                        }`}
                      >
                        {/* Player Photo */}
                        <div className="w-full aspect-square rounded-xl bg-gradient-to-b from-white/10 to-transparent overflow-hidden mb-2 relative border border-white/5">
                          <img
                            src={player.image}
                            alt={player.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {player.country !== 'IND' && (
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-purple-500/90 text-[8px] font-black text-white uppercase tracking-wider backdrop-blur-sm">
                              OS
                            </span>
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="mb-2.5">
                          <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider block truncate">
                            {player.set}
                          </span>
                          <h4 className="text-xs font-black text-white truncate leading-tight mt-0.5">
                            {player.name}
                          </h4>
                          <div className="flex items-center justify-between text-[9px] text-gray-400 mt-1">
                            <span className="font-bold text-blue-400">{player.role}</span>
                            <span className="font-bold text-yellow-400">₹{player.basePrice} Cr</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        {isTargeted ? (
                          <button
                            onClick={() => handleRemoveTarget(player.id)}
                            className="w-full py-1.5 rounded-lg bg-orange-500/20 hover:bg-red-500/20 border border-orange-500/40 hover:border-red-500/40 text-orange-300 hover:text-red-300 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <Check size={12} /> Target #{targetedSlotIndex + 1} (Remove)
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectPlayer(player)}
                            className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              replacingSlotIndex !== null
                                ? 'bg-orange-500 text-black hover:bg-orange-400 font-black'
                                : isBoardFull
                                ? 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10 hover:text-white'
                                : 'bg-white/5 hover:bg-orange-500 hover:text-black text-gray-300 border border-white/10'
                            }`}
                          >
                            <Plus size={12} />
                            {replacingSlotIndex !== null
                              ? `Replace Target #${replacingSlotIndex + 1}`
                              : isBoardFull
                              ? 'Board Full'
                              : 'Add to Targets'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {filteredPlayers.length > 48 && (
                  <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider py-4">
                    Showing top 48 results. Use search or set filters above to refine.
                  </p>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default TargetPlayers;

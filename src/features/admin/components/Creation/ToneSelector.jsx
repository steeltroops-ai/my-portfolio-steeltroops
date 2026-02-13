import { motion } from "framer-motion";
import {
  FiCheck,
  FiCpu,
  FiMessageCircle,
  FiBookOpen,
  FiZap,
  FiActivity,
  FiBriefcase,
  FiFeather,
} from "react-icons/fi";

const TONE_OPTIONS = [
  {
    id: "professional",
    label: "Professional",
    icon: FiBriefcase,
    desc: "Clear, structured, authoritative systems engineer.",
  },
  {
    id: "analytical",
    label: "Analytical",
    icon: FiActivity,
    desc: "Data-driven, comparative, evidence-based.",
  },
  {
    id: "conversational",
    label: "Conversational",
    icon: FiMessageCircle,
    desc: "Casual, smart, approachable tech writer.",
  },
  {
    id: "narrative",
    label: "Narrative",
    icon: FiBookOpen,
    desc: "Story-driven, experiential, reflective.",
  },
  {
    id: "instructional",
    label: "Instructional",
    icon: FiCpu,
    desc: "Step-by-step, directive, precise guides.",
  },
  {
    id: "contrarian",
    label: "Contrarian",
    icon: FiZap,
    desc: "Provocative, challenges assumptions.",
  },
  {
    id: "academic",
    label: "Academic",
    icon: FiFeather,
    desc: "Thorough, citation-style, rigorous.",
  },
];

const MODIFIERS = [
  { id: "concise", label: "Concise", desc: "Short sentences, active voice." },
  {
    id: "verbose",
    label: "Verbose",
    desc: "Deep explanations, extra context.",
  },
  {
    id: "opinionated",
    label: "Opinionated",
    desc: "Personal stance, clear arguments.",
  },
  { id: "neutral", label: "Neutral", desc: "Strictly factual, unbiased." },
];

const ToneSelector = ({
  selectedTone,
  onToneChange,
  selectedModifier,
  onModifierChange,
  compact = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Base Tone Selection */}
      <div>
        {!compact && (
          <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">
            Base Personality
          </h3>
        )}
        <div
          className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"}`}
        >
          {TONE_OPTIONS.map((tone) => {
            const Icon = tone.icon;
            const isSelected = selectedTone === tone.id;

            return (
              <motion.button
                key={tone.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onToneChange(tone.id)}
                className={`group relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                  isSelected
                    ? "bg-purple-500/10 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${isSelected ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-neutral-400 group-hover:text-white"}`}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <div
                    className={`font-medium text-sm mb-0.5 ${isSelected ? "text-purple-100" : "text-neutral-300 group-hover:text-white"}`}
                  >
                    {tone.label}
                  </div>
                  {!compact && (
                    <div className="text-xs text-neutral-500 leading-snug">
                      {tone.desc}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <div className="absolute top-3 right-3 text-purple-400">
                    <FiCheck size={14} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Modifiers */}
      <div>
        {!compact && (
          <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">
            Tone Modifier (Optional)
          </h3>
        )}
        <div className="flex flex-wrap gap-2">
          {MODIFIERS.map((mod) => {
            const isSelected = selectedModifier === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => onModifierChange(isSelected ? null : mod.id)} // Toggle allow
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? "bg-blue-500/10 border-blue-500/50 text-blue-300"
                    : "bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {mod.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ToneSelector;

import React, { useEffect, useState, useRef } from "react";

interface ThinkingBubbleProps {
  isLoading: boolean;
}

type Phase = "shrink" | "rotate" | "pause" | "quickPulses";

export const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({ isLoading }) => {
  const [phase, setPhase] = useState<Phase>("shrink");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset to initial shrink when loading starts, and clear old timer
  useEffect(() => {
    if (isLoading) {
      setPhase("shrink");
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isLoading]);

  // Chain animation phases – loops rotate → pause → quickPulses while loading
  useEffect(() => {
    if (!isLoading) return;

    const durations: Record<Phase, number> = {
      shrink: 2000,       // initial shrink 2s, then go to rotate
      rotate: 1000,       // rotate 1s, then pause
      pause: 1000,        // pause 1s, then quick pulses
      quickPulses: 1200,  // two quick pulses ~1.2s, then back to rotate
    };

    const nextPhase: Record<Phase, Phase> = {
      shrink: "rotate",          // after initial shrink, start rotating
      rotate: "pause",
      pause: "quickPulses",
      quickPulses: "rotate",     // loop back to rotate
    };

    timerRef.current = setTimeout(() => {
      setPhase(nextPhase[phase]);
    }, durations[phase]);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, isLoading]);

  if (!isLoading) return null;

  const containerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 12,
  };

  if (phase === "shrink") {
    return (
      <div style={containerStyle}>
        <img
          src="/hydra-icon.png"
          alt="thinking"
          style={{
            width: 40,
            height: 40,
            animation: "hydra-shrink 2s ease forwards",
          }}
        />
        <style>{`
          @keyframes hydra-shrink {
            0% { transform: scale(1); }
            100% { transform: scale(0.6); }
          }
        `}</style>
      </div>
    );
  }

  if (phase === "rotate") {
    return (
      <div style={containerStyle}>
        <img
          src="/hydra-icon.png"
          alt="thinking"
          style={{
            width: 40,
            height: 40,
            animation: "hydra-rotate 0.3s ease-in-out infinite alternate",
          }}
        />
        <style>{`
          @keyframes hydra-rotate {
            0% { transform: rotate(-15deg); }
            100% { transform: rotate(15deg); }
          }
        `}</style>
      </div>
    );
  }

  if (phase === "pause") {
    return (
      <div style={containerStyle}>
        <img
          src="/hydra-icon.png"
          alt="thinking"
          style={{
            width: 40,
            height: 40,
            transform: "scale(1)",
            transition: "none",
          }}
        />
      </div>
    );
  }

  if (phase === "quickPulses") {
    return (
      <div style={containerStyle}>
        <img
          src="/hydra-icon.png"
          alt="thinking"
          style={{
            width: 40,
            height: 40,
            animation: "hydra-pulse 0.3s ease-in-out 2",
          }}
        />
        <style>{`
          @keyframes hydra-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(0.7); }
            100% { transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default ThinkingBubble;

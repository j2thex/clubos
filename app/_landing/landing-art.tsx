"use client";

/* ==========================================================================
   BIOLUMINESCENT ABYSS — SVG art for the osocios.club landing page
   Psychedelic sacred geometry × deep-sea bioluminescence × dark luxury
   All coordinates pre-computed to avoid hydration mismatches.
   ========================================================================== */

// ── Hero Background ──────────────────────────────────────────────────────────

export function HeroArt() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="hero-glow-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="40" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="hero-glow-intense" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="60" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="hero-turbulence">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise">
              <animate attributeName="baseFrequency" values="0.015;0.025;0.015" dur="20s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" />
          </filter>

          <radialGradient id="orb-magenta" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff006e" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#ff006e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ff006e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orb-cyan" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#00f5ff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00f5ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orb-lime" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#39ff14" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#39ff14" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#39ff14" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orb-gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#ffd700" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="geo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff006e" stopOpacity="0.3">
              <animate attributeName="stopColor" values="#ff006e;#00f5ff;#39ff14;#ff006e" dur="12s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#00f5ff" stopOpacity="0.15">
              <animate attributeName="stopColor" values="#00f5ff;#39ff14;#ff006e;#00f5ff" dur="12s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>

        {/* Floating orbs */}
        <circle cx="200" cy="300" r="180" fill="url(#orb-magenta)" filter="url(#hero-glow-intense)" className="landing-float-1" />
        <circle cx="1200" cy="200" r="220" fill="url(#orb-cyan)" filter="url(#hero-glow-intense)" className="landing-float-2" />
        <circle cx="720" cy="600" r="160" fill="url(#orb-lime)" filter="url(#hero-glow-intense)" className="landing-float-3" />
        <circle cx="1000" cy="700" r="120" fill="url(#orb-gold)" filter="url(#hero-glow-soft)" className="landing-float-4" />
        <circle cx="400" cy="750" r="100" fill="url(#orb-cyan)" filter="url(#hero-glow-soft)" className="landing-float-1" opacity="0.5" />

        {/* Sacred geometry ring (outer) */}
        <g className="landing-rotate-slow" style={{ transformOrigin: "720px 450px" }}>
          <polygon points="720,250 894,350 894,550 720,650 546,550 546,350" fill="none" stroke="url(#geo-gradient)" strokeWidth="0.5" opacity="0.4" />
          <polygon points="720,280 870,530 570,530" fill="none" stroke="#ff006e" strokeWidth="0.3" opacity="0.2" />
          <polygon points="720,620 570,370 870,370" fill="none" stroke="#00f5ff" strokeWidth="0.3" opacity="0.2" />
        </g>

        {/* Sacred geometry ring (inner) — flower of life, pre-computed coords */}
        {/* 0°: cx=780 cy=450, 60°: cx=750 cy=501.96, 120°: cx=690 cy=501.96, 180°: cx=660 cy=450, 240°: cx=690 cy=398.04, 300°: cx=750 cy=398.04 */}
        <g className="landing-rotate-reverse" style={{ transformOrigin: "720px 450px" }}>
          <circle cx="720" cy="450" r="120" fill="none" stroke="url(#geo-gradient)" strokeWidth="0.5" opacity="0.3" />
          <circle cx="720" cy="450" r="80" fill="none" stroke="#39ff14" strokeWidth="0.3" opacity="0.15" />
          <circle cx="780" cy="450" r="60" fill="none" stroke="#00f5ff" strokeWidth="0.3" opacity="0.1" />
          <circle cx="750" cy="501.96" r="60" fill="none" stroke="#00f5ff" strokeWidth="0.3" opacity="0.1" />
          <circle cx="690" cy="501.96" r="60" fill="none" stroke="#00f5ff" strokeWidth="0.3" opacity="0.1" />
          <circle cx="660" cy="450" r="60" fill="none" stroke="#00f5ff" strokeWidth="0.3" opacity="0.1" />
          <circle cx="690" cy="398.04" r="60" fill="none" stroke="#00f5ff" strokeWidth="0.3" opacity="0.1" />
          <circle cx="750" cy="398.04" r="60" fill="none" stroke="#00f5ff" strokeWidth="0.3" opacity="0.1" />
        </g>

        {/* Particle field — deterministic positions */}
        <circle cx="0" cy="100" r="0.5" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "0s" }} />
        <circle cx="37" cy="153" r="1" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "0.3s" }} />
        <circle cx="74" cy="206" r="1.5" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "0.6s" }} />
        <circle cx="111" cy="259" r="2" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "0.9s" }} />
        <circle cx="148" cy="312" r="0.5" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "1.2s" }} />
        <circle cx="185" cy="365" r="1" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "1.5s" }} />
        <circle cx="222" cy="418" r="1.5" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "1.8s" }} />
        <circle cx="259" cy="471" r="2" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "2.1s" }} />
        <circle cx="296" cy="524" r="0.5" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "2.4s" }} />
        <circle cx="333" cy="577" r="1" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "2.7s" }} />
        <circle cx="370" cy="630" r="1.5" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "3s" }} />
        <circle cx="407" cy="683" r="2" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "3.3s" }} />
        <circle cx="444" cy="736" r="0.5" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "3.6s" }} />
        <circle cx="481" cy="789" r="1" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "3.9s" }} />
        <circle cx="518" cy="842" r="1.5" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "4.2s" }} />
        <circle cx="555" cy="895" r="2" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "4.5s" }} />
        <circle cx="592" cy="48" r="0.5" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "4.8s" }} />
        <circle cx="629" cy="101" r="1" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "5.1s" }} />
        <circle cx="666" cy="154" r="1.5" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "5.4s" }} />
        <circle cx="703" cy="207" r="2" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "5.7s" }} />
        <circle cx="740" cy="260" r="0.5" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "6s" }} />
        <circle cx="777" cy="313" r="1" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "6.3s" }} />
        <circle cx="814" cy="366" r="1.5" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "6.6s" }} />
        <circle cx="851" cy="419" r="2" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "6.9s" }} />
        <circle cx="888" cy="472" r="0.5" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "7.2s" }} />
        <circle cx="925" cy="525" r="1" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "7.5s" }} />
        <circle cx="962" cy="578" r="1.5" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "7.8s" }} />
        <circle cx="999" cy="631" r="2" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "0.1s" }} />
        <circle cx="1036" cy="684" r="0.5" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "0.4s" }} />
        <circle cx="1073" cy="737" r="1" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "0.7s" }} />
        <circle cx="1110" cy="790" r="1.5" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "1s" }} />
        <circle cx="1147" cy="843" r="2" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "1.3s" }} />
        <circle cx="1184" cy="896" r="0.5" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "1.6s" }} />
        <circle cx="1221" cy="49" r="1" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "1.9s" }} />
        <circle cx="1258" cy="102" r="1.5" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "2.2s" }} />
        <circle cx="1295" cy="155" r="2" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "2.5s" }} />
        <circle cx="1332" cy="208" r="0.5" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "2.8s" }} />
        <circle cx="1369" cy="261" r="1" fill="#00f5ff" opacity="0" className="landing-particle" style={{ animationDelay: "3.1s" }} />
        <circle cx="1406" cy="314" r="1.5" fill="#39ff14" opacity="0" className="landing-particle" style={{ animationDelay: "3.4s" }} />
        <circle cx="3" cy="367" r="2" fill="#ff006e" opacity="0" className="landing-particle" style={{ animationDelay: "3.7s" }} />

        {/* Morphing blob (central) */}
        <g filter="url(#hero-turbulence)" opacity="0.08">
          <ellipse cx="720" cy="450" rx="300" ry="200" fill="#39ff14" className="landing-morph-blob" />
        </g>

        {/* Neural pathway lines */}
        <g opacity="0.06" stroke="#00f5ff" strokeWidth="0.5">
          <line x1="200" y1="300" x2="720" y2="450" className="landing-pulse-line" />
          <line x1="1200" y1="200" x2="720" y2="450" className="landing-pulse-line" style={{ animationDelay: "2s" }} />
          <line x1="720" y1="600" x2="720" y2="450" className="landing-pulse-line" style={{ animationDelay: "4s" }} />
          <line x1="1000" y1="700" x2="720" y2="450" className="landing-pulse-line" style={{ animationDelay: "1s" }} />
          <line x1="400" y1="750" x2="720" y2="450" className="landing-pulse-line" style={{ animationDelay: "3s" }} />
        </g>
      </svg>

      {/* Vignette overlay */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at center, transparent 30%, oklch(0.06 0.02 150) 80%)",
      }} />
    </div>
  );
}


// ── Use Case Icons ───────────────────────────────────────────────────────────

function ArtSvg({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={`w-16 h-16 mb-3 ${className}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="icon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {children}
    </svg>
  );
}

export function SocialClubIcon() {
  /* Flower of life — pre-computed for r=18 at center (60,60) and r=30 for dots
     0°:  (78, 60)       dot: (90, 60)
     60°: (69, 75.59)    dot: (75, 85.98)
     120°:(51, 75.59)    dot: (45, 85.98)
     180°:(42, 60)       dot: (30, 60)
     240°:(51, 44.41)    dot: (45, 34.02)
     300°:(69, 44.41)    dot: (75, 34.02) */
  return (
    <ArtSvg>
      <g filter="url(#icon-glow)" className="landing-breathe">
        <circle cx="60" cy="60" r="18" fill="none" stroke="#ff006e" strokeWidth="0.8" opacity="0.6" />
        <circle cx="78" cy="60" r="18" fill="none" stroke="#00f5ff" strokeWidth="0.6" opacity="0.4" />
        <circle cx="69" cy="75.59" r="18" fill="none" stroke="#ff006e" strokeWidth="0.6" opacity="0.4" />
        <circle cx="51" cy="75.59" r="18" fill="none" stroke="#00f5ff" strokeWidth="0.6" opacity="0.4" />
        <circle cx="42" cy="60" r="18" fill="none" stroke="#ff006e" strokeWidth="0.6" opacity="0.4" />
        <circle cx="51" cy="44.41" r="18" fill="none" stroke="#00f5ff" strokeWidth="0.6" opacity="0.4" />
        <circle cx="69" cy="44.41" r="18" fill="none" stroke="#ff006e" strokeWidth="0.6" opacity="0.4" />
        <circle cx="60" cy="60" r="36" fill="none" stroke="#39ff14" strokeWidth="0.4" opacity="0.3" className="landing-rotate-slow" style={{ transformOrigin: "60px 60px" }} />
        {/* Human dots */}
        <circle cx="90" cy="60" r="2.5" fill="#ff006e" opacity="0.8" className="landing-pulse-dot" style={{ animationDelay: "0s" }} />
        <circle cx="75" cy="85.98" r="2.5" fill="#00f5ff" opacity="0.8" className="landing-pulse-dot" style={{ animationDelay: "0.3s" }} />
        <circle cx="45" cy="85.98" r="2.5" fill="#39ff14" opacity="0.8" className="landing-pulse-dot" style={{ animationDelay: "0.6s" }} />
        <circle cx="30" cy="60" r="2.5" fill="#ff006e" opacity="0.8" className="landing-pulse-dot" style={{ animationDelay: "0.9s" }} />
        <circle cx="45" cy="34.02" r="2.5" fill="#00f5ff" opacity="0.8" className="landing-pulse-dot" style={{ animationDelay: "1.2s" }} />
        <circle cx="75" cy="34.02" r="2.5" fill="#39ff14" opacity="0.8" className="landing-pulse-dot" style={{ animationDelay: "1.5s" }} />
        <circle cx="60" cy="60" r="4" fill="#ff006e" opacity="0.6" />
        <circle cx="60" cy="60" r="8" fill="#ff006e" opacity="0.1" />
      </g>
    </ArtSvg>
  );
}

export function CannabisClubIcon() {
  /* Crystal leaf — 5 points, pentagonal, pre-computed
     Angles at -90 offset: 0→-90, 72→-18, 144→54, 216→126, 288→198
     Inner r=22 from (60,55):  (60,33), (80.91,48.2), (72.96,75.8), (47.04,75.8), (39.09,48.2)
     Outer r=38 from (60,55):  (60,17), (96.12,43.26), (82.38,90.87), (37.62,90.87), (23.88,43.26)
     Inner r=12 from (60,55):  (60,43), (71.41,51.2), (67.07,66.34), (52.93,66.34), (48.59,51.2) */
  return (
    <ArtSvg>
      <g filter="url(#icon-glow)" className="landing-breathe" style={{ animationDelay: "1s" }}>
        <g className="landing-rotate-slow" style={{ transformOrigin: "60px 55px" }}>
          <line x1="60" y1="55" x2="60" y2="33" stroke="#39ff14" strokeWidth="0.4" opacity="0.3" />
          <line x1="60" y1="55" x2="80.91" y2="48.2" stroke="#39ff14" strokeWidth="0.4" opacity="0.3" />
          <line x1="60" y1="55" x2="72.96" y2="75.8" stroke="#39ff14" strokeWidth="0.4" opacity="0.3" />
          <line x1="60" y1="55" x2="47.04" y2="75.8" stroke="#39ff14" strokeWidth="0.4" opacity="0.3" />
          <line x1="60" y1="55" x2="39.09" y2="48.2" stroke="#39ff14" strokeWidth="0.4" opacity="0.3" />
          <polygon points="60,33 80.91,48.2 72.96,75.8 47.04,75.8 39.09,48.2" fill="none" stroke="#39ff14" strokeWidth="0.5" opacity="0.4" />
        </g>
        {/* Leaf crystal shards */}
        <polygon points="60,17 66.41,46.2 53.59,46.2" fill="#39ff14" opacity="0.15" stroke="#39ff14" strokeWidth="0.5" className="landing-pulse-dot" style={{ animationDelay: "0s" }} />
        <polygon points="96.12,43.26 74.36,54.69 67.93,42.22" fill="#00f5ff" opacity="0.15" stroke="#00f5ff" strokeWidth="0.5" className="landing-pulse-dot" style={{ animationDelay: "0.4s" }} />
        <polygon points="82.38,90.87 63.59,69.83 75.55,63.85" fill="#39ff14" opacity="0.15" stroke="#39ff14" strokeWidth="0.5" className="landing-pulse-dot" style={{ animationDelay: "0.8s" }} />
        <polygon points="37.62,90.87 44.45,63.85 56.41,69.83" fill="#ff006e" opacity="0.15" stroke="#ff006e" strokeWidth="0.5" className="landing-pulse-dot" style={{ animationDelay: "1.2s" }} />
        <polygon points="23.88,43.26 52.07,42.22 45.64,54.69" fill="#00f5ff" opacity="0.15" stroke="#00f5ff" strokeWidth="0.5" className="landing-pulse-dot" style={{ animationDelay: "1.6s" }} />
        <circle cx="60" cy="55" r="6" fill="#39ff14" opacity="0.3" />
        <circle cx="60" cy="55" r="3" fill="#39ff14" opacity="0.7" />
        <line x1="60" y1="70" x2="60" y2="95" stroke="#39ff14" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
        <path d="M55,35 Q50,25 55,15" fill="none" stroke="#00f5ff" strokeWidth="0.5" opacity="0.2" className="landing-smoke" />
        <path d="M65,32 Q70,22 63,12" fill="none" stroke="#39ff14" strokeWidth="0.5" opacity="0.15" className="landing-smoke" style={{ animationDelay: "1.5s" }} />
      </g>
    </ArtSvg>
  );
}

export function BarsClubIcon() {
  /* Cocktail glass with galaxy — prismatic ray endpoints pre-computed
     Angles 200+[0,30,60,90,120,150]° at r=50 from (60,45):
     200°: (13.02, 27.9)  230°: (21.7, 6.69)  260°: (10.73, 36.32)
     Actually let me just use fixed positions for the rays */
  return (
    <ArtSvg>
      <g filter="url(#icon-glow)" className="landing-breathe" style={{ animationDelay: "2s" }}>
        <path d="M35,30 L60,70 L85,30" fill="none" stroke="#00f5ff" strokeWidth="0.8" opacity="0.5" />
        <line x1="60" y1="70" x2="60" y2="90" stroke="#00f5ff" strokeWidth="0.8" opacity="0.4" />
        <line x1="45" y1="90" x2="75" y2="90" stroke="#00f5ff" strokeWidth="0.8" opacity="0.4" strokeLinecap="round" />
        <clipPath id="glass-clip">
          <path d="M38,33 L60,67 L82,33 Z" />
        </clipPath>
        <g clipPath="url(#glass-clip)">
          <ellipse cx="60" cy="45" rx="20" ry="12" fill="#ff006e" opacity="0.15" className="landing-rotate-slow" style={{ transformOrigin: "60px 45px" }} />
          <ellipse cx="60" cy="45" rx="15" ry="8" fill="#00f5ff" opacity="0.2" className="landing-rotate-reverse" style={{ transformOrigin: "60px 45px" }} />
          <ellipse cx="60" cy="48" rx="10" ry="5" fill="#ffd700" opacity="0.15" className="landing-rotate-slow" style={{ transformOrigin: "60px 48px" }} />
          <circle cx="50" cy="38" r="0.8" fill="#fff" opacity="0" className="landing-twinkle" style={{ animationDelay: "0s" }} />
          <circle cx="65" cy="42" r="1.2" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "0.5s" }} />
          <circle cx="55" cy="50" r="1.6" fill="#00f5ff" opacity="0" className="landing-twinkle" style={{ animationDelay: "1s" }} />
          <circle cx="70" cy="35" r="0.8" fill="#fff" opacity="0" className="landing-twinkle" style={{ animationDelay: "1.5s" }} />
          <circle cx="45" cy="45" r="1.2" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "2s" }} />
          <circle cx="62" cy="52" r="1.6" fill="#00f5ff" opacity="0" className="landing-twinkle" style={{ animationDelay: "2.5s" }} />
          <circle cx="52" cy="55" r="0.8" fill="#fff" opacity="0" className="landing-twinkle" style={{ animationDelay: "3s" }} />
          <circle cx="68" cy="48" r="1.2" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "3.5s" }} />
          <circle cx="58" cy="35" r="1.6" fill="#00f5ff" opacity="0" className="landing-twinkle" style={{ animationDelay: "4s" }} />
          <circle cx="72" cy="40" r="0.8" fill="#fff" opacity="0" className="landing-twinkle" style={{ animationDelay: "4.5s" }} />
        </g>
        <circle cx="42" cy="30" r="4" fill="#ff006e" opacity="0.6" />
        <circle cx="42" cy="30" r="6" fill="#ff006e" opacity="0.1" />
        <line x1="42" y1="26" x2="45" y2="22" stroke="#39ff14" strokeWidth="0.5" opacity="0.4" />
        {/* Prismatic rays — hardcoded endpoints */}
        <line x1="60" y1="45" x2="13" y2="28" stroke="#ff006e" strokeWidth="0.3" opacity="0.06" className="landing-pulse-line" style={{ animationDelay: "0s" }} />
        <line x1="60" y1="45" x2="22" y2="7" stroke="#ffd700" strokeWidth="0.3" opacity="0.06" className="landing-pulse-line" style={{ animationDelay: "0.8s" }} />
        <line x1="60" y1="45" x2="40" y2="-3" stroke="#39ff14" strokeWidth="0.3" opacity="0.06" className="landing-pulse-line" style={{ animationDelay: "1.6s" }} />
        <line x1="60" y1="45" x2="60" y2="-5" stroke="#00f5ff" strokeWidth="0.3" opacity="0.06" className="landing-pulse-line" style={{ animationDelay: "2.4s" }} />
        <line x1="60" y1="45" x2="80" y2="-3" stroke="#ff006e" strokeWidth="0.3" opacity="0.06" className="landing-pulse-line" style={{ animationDelay: "3.2s" }} />
        <line x1="60" y1="45" x2="98" y2="7" stroke="#ffd700" strokeWidth="0.3" opacity="0.06" className="landing-pulse-line" style={{ animationDelay: "4s" }} />
      </g>
    </ArtSvg>
  );
}

export function SportsClubIcon() {
  return (
    <ArtSvg>
      <g filter="url(#icon-glow)" className="landing-breathe" style={{ animationDelay: "3s" }}>
        <circle cx="60" cy="40" r="6" fill="#00f5ff" opacity="0.5" />
        <line x1="60" y1="46" x2="60" y2="65" stroke="#00f5ff" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
        <line x1="60" y1="55" x2="48" y2="48" stroke="#00f5ff" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
        <line x1="60" y1="55" x2="72" y2="60" stroke="#00f5ff" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
        <line x1="60" y1="65" x2="50" y2="85" stroke="#00f5ff" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" />
        <line x1="60" y1="65" x2="75" y2="80" stroke="#00f5ff" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" />
        <line x1="30" y1="50" x2="45" y2="50" stroke="#ff006e" strokeWidth="2" opacity="0.3" strokeLinecap="round" className="landing-speed-line" style={{ animationDelay: "0s" }} />
        <line x1="27" y1="52" x2="43" y2="52" stroke="#ff006e" strokeWidth="1.7" opacity="0.25" strokeLinecap="round" className="landing-speed-line" style={{ animationDelay: "0.15s" }} />
        <line x1="24" y1="54" x2="41" y2="54" stroke="#ff006e" strokeWidth="1.4" opacity="0.2" strokeLinecap="round" className="landing-speed-line" style={{ animationDelay: "0.3s" }} />
        <line x1="21" y1="56" x2="39" y2="56" stroke="#ff006e" strokeWidth="1.1" opacity="0.15" strokeLinecap="round" className="landing-speed-line" style={{ animationDelay: "0.45s" }} />
        <line x1="18" y1="58" x2="37" y2="58" stroke="#ff006e" strokeWidth="0.8" opacity="0.1" strokeLinecap="round" className="landing-speed-line" style={{ animationDelay: "0.6s" }} />
        <circle cx="60" cy="55" r="20" fill="none" stroke="#ff006e" strokeWidth="0.4" opacity="0.2" strokeDasharray="4 8" className="landing-rotate-slow" style={{ transformOrigin: "60px 55px" }} />
        <circle cx="60" cy="55" r="30" fill="none" stroke="#ffd700" strokeWidth="0.4" opacity="0.15" strokeDasharray="4 8" className="landing-rotate-slow" style={{ transformOrigin: "60px 55px", animationDelay: "2s", animationDuration: "12s" }} />
        <circle cx="60" cy="55" r="40" fill="none" stroke="#39ff14" strokeWidth="0.4" opacity="0.1" strokeDasharray="4 8" className="landing-rotate-slow" style={{ transformOrigin: "60px 55px", animationDelay: "4s", animationDuration: "16s" }} />
        <circle cx="75" cy="40" r="1" fill="#ffd700" opacity="0" className="landing-twinkle" style={{ animationDelay: "0s" }} />
        <circle cx="80" cy="55" r="1" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "0.4s" }} />
        <circle cx="78" cy="70" r="1" fill="#ffd700" opacity="0" className="landing-twinkle" style={{ animationDelay: "0.8s" }} />
        <circle cx="45" cy="35" r="1" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "1.2s" }} />
        <circle cx="35" cy="50" r="1" fill="#ffd700" opacity="0" className="landing-twinkle" style={{ animationDelay: "1.6s" }} />
        <circle cx="82" cy="45" r="1" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "2s" }} />
        <circle cx="85" cy="60" r="1" fill="#ffd700" opacity="0" className="landing-twinkle" style={{ animationDelay: "2.4s" }} />
        <circle cx="40" cy="42" r="1" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "2.8s" }} />
      </g>
    </ArtSvg>
  );
}

export function CoworkingIcon() {
  return (
    <ArtSvg>
      <g filter="url(#icon-glow)" className="landing-breathe" style={{ animationDelay: "4s" }}>
        {/* Neural constellation — all coordinates are static integers/simple decimals */}
        {/* Connection lines */}
        <line x1="60" y1="35" x2="35" y2="55" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "0s" }} />
        <line x1="60" y1="35" x2="85" y2="55" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "0.3s" }} />
        <line x1="60" y1="35" x2="60" y2="60" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "0.6s" }} />
        <line x1="35" y1="55" x2="45" y2="80" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "0.9s" }} />
        <line x1="35" y1="55" x2="60" y2="60" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "1.2s" }} />
        <line x1="85" y1="55" x2="75" y2="80" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "1.5s" }} />
        <line x1="85" y1="55" x2="60" y2="60" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "1.8s" }} />
        <line x1="45" y1="80" x2="75" y2="80" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "2.1s" }} />
        <line x1="45" y1="80" x2="60" y2="60" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "2.4s" }} />
        <line x1="75" y1="80" x2="60" y2="60" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "2.7s" }} />
        <line x1="60" y1="35" x2="25" y2="38" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "3s" }} />
        <line x1="60" y1="35" x2="95" y2="38" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "3.3s" }} />
        <line x1="35" y1="55" x2="25" y2="38" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "3.6s" }} />
        <line x1="85" y1="55" x2="95" y2="38" stroke="#00f5ff" strokeWidth="0.4" opacity="0.15" className="landing-pulse-line" style={{ animationDelay: "3.9s" }} />

        {/* Data flow particles along first 6 connections using SMIL */}
        <circle r="1" fill="#39ff14" opacity="0.6">
          <animateMotion dur="3s" repeatCount="indefinite" path="M60,35 L35,55" />
          <animate attributeName="opacity" values="0;0.6;0" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle r="1" fill="#39ff14" opacity="0.6">
          <animateMotion dur="4s" repeatCount="indefinite" path="M60,35 L85,55" />
          <animate attributeName="opacity" values="0;0.6;0" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle r="1" fill="#39ff14" opacity="0.6">
          <animateMotion dur="5s" repeatCount="indefinite" path="M60,35 L60,60" />
          <animate attributeName="opacity" values="0;0.6;0" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle r="1" fill="#39ff14" opacity="0.6">
          <animateMotion dur="6s" repeatCount="indefinite" path="M35,55 L45,80" />
          <animate attributeName="opacity" values="0;0.6;0" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle r="1" fill="#39ff14" opacity="0.6">
          <animateMotion dur="7s" repeatCount="indefinite" path="M35,55 L60,60" />
          <animate attributeName="opacity" values="0;0.6;0" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle r="1" fill="#39ff14" opacity="0.6">
          <animateMotion dur="8s" repeatCount="indefinite" path="M85,55 L75,80" />
          <animate attributeName="opacity" values="0;0.6;0" dur="8s" repeatCount="indefinite" />
        </circle>

        {/* Node halos + dots */}
        <circle cx="60" cy="35" r="10" fill="#ff006e" opacity="0.06" />
        <circle cx="60" cy="35" r="4" fill="#ff006e" opacity="0.5" className="landing-pulse-dot" style={{ animationDelay: "0s" }} />
        <circle cx="35" cy="55" r="7.5" fill="#00f5ff" opacity="0.06" />
        <circle cx="35" cy="55" r="3" fill="#00f5ff" opacity="0.5" className="landing-pulse-dot" style={{ animationDelay: "0.25s" }} />
        <circle cx="85" cy="55" r="7.5" fill="#39ff14" opacity="0.06" />
        <circle cx="85" cy="55" r="3" fill="#39ff14" opacity="0.5" className="landing-pulse-dot" style={{ animationDelay: "0.5s" }} />
        <circle cx="45" cy="80" r="8.75" fill="#ffd700" opacity="0.06" />
        <circle cx="45" cy="80" r="3.5" fill="#ffd700" opacity="0.5" className="landing-pulse-dot" style={{ animationDelay: "0.75s" }} />
        <circle cx="75" cy="80" r="8.75" fill="#ff006e" opacity="0.06" />
        <circle cx="75" cy="80" r="3.5" fill="#ff006e" opacity="0.5" className="landing-pulse-dot" style={{ animationDelay: "1s" }} />
        <circle cx="60" cy="60" r="12.5" fill="#00f5ff" opacity="0.06" />
        <circle cx="60" cy="60" r="5" fill="#00f5ff" opacity="0.5" className="landing-pulse-dot" style={{ animationDelay: "1.25s" }} />
        <circle cx="25" cy="38" r="5" fill="#39ff14" opacity="0.06" />
        <circle cx="25" cy="38" r="2" fill="#39ff14" opacity="0.5" className="landing-pulse-dot" style={{ animationDelay: "1.5s" }} />
        <circle cx="95" cy="38" r="5" fill="#ffd700" opacity="0.06" />
        <circle cx="95" cy="38" r="2" fill="#ffd700" opacity="0.5" className="landing-pulse-dot" style={{ animationDelay: "1.75s" }} />
      </g>
    </ArtSvg>
  );
}


// ── How It Works Step Art ─────────────────────────────────────────────────────

export function StepArt({ step }: { step: 1 | 2 | 3 }) {
  if (step === 1) return <StepOneSpark />;
  if (step === 2) return <StepTwoGrow />;
  return <StepThreeLaunch />;
}

function StepOneSpark() {
  /* Spark rays at 45° intervals, r=10→25 from center (40,40)
     0°:   (50,40)→(65,40)     45°:  (47.07,47.07)→(57.68,57.68)
     90°:  (40,50)→(40,65)     135°: (32.93,47.07)→(22.32,57.68)
     180°: (30,40)→(15,40)     225°: (32.93,32.93)→(22.32,22.32)
     270°: (40,30)→(40,15)     315°: (47.07,32.93)→(57.68,22.32) */
  return (
    <svg viewBox="0 0 80 80" className="w-12 h-12 mb-4" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="step1-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
          <feComposite in="SourceGraphic" operator="over" />
        </filter>
      </defs>
      <g filter="url(#step1-glow)">
        <circle cx="40" cy="40" r="6" fill="#ffd700" opacity="0.7" className="landing-breathe" />
        <circle cx="40" cy="40" r="12" fill="#ffd700" opacity="0.1" className="landing-breathe" />
        <line x1="50" y1="40" x2="65" y2="40" stroke="#ffd700" strokeWidth="0.8" opacity="0" strokeLinecap="round" className="landing-spark-ray" style={{ animationDelay: "0s" }} />
        <line x1="47.07" y1="47.07" x2="57.68" y2="57.68" stroke="#ffd700" strokeWidth="0.8" opacity="0" strokeLinecap="round" className="landing-spark-ray" style={{ animationDelay: "0.2s" }} />
        <line x1="40" y1="50" x2="40" y2="65" stroke="#ffd700" strokeWidth="0.8" opacity="0" strokeLinecap="round" className="landing-spark-ray" style={{ animationDelay: "0.4s" }} />
        <line x1="32.93" y1="47.07" x2="22.32" y2="57.68" stroke="#ffd700" strokeWidth="0.8" opacity="0" strokeLinecap="round" className="landing-spark-ray" style={{ animationDelay: "0.6s" }} />
        <line x1="30" y1="40" x2="15" y2="40" stroke="#ffd700" strokeWidth="0.8" opacity="0" strokeLinecap="round" className="landing-spark-ray" style={{ animationDelay: "0.8s" }} />
        <line x1="32.93" y1="32.93" x2="22.32" y2="22.32" stroke="#ffd700" strokeWidth="0.8" opacity="0" strokeLinecap="round" className="landing-spark-ray" style={{ animationDelay: "1s" }} />
        <line x1="40" y1="30" x2="40" y2="15" stroke="#ffd700" strokeWidth="0.8" opacity="0" strokeLinecap="round" className="landing-spark-ray" style={{ animationDelay: "1.2s" }} />
        <line x1="47.07" y1="32.93" x2="57.68" y2="22.32" stroke="#ffd700" strokeWidth="0.8" opacity="0" strokeLinecap="round" className="landing-spark-ray" style={{ animationDelay: "1.4s" }} />
        <circle cx="40" cy="40" r="20" fill="none" stroke="#ff006e" strokeWidth="0.5" opacity="0.2" strokeDasharray="3 6" className="landing-rotate-slow" style={{ transformOrigin: "40px 40px" }} />
      </g>
    </svg>
  );
}

function StepTwoGrow() {
  return (
    <svg viewBox="0 0 80 80" className="w-12 h-12 mb-4" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="step2-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
          <feComposite in="SourceGraphic" operator="over" />
        </filter>
      </defs>
      <g filter="url(#step2-glow)">
        <rect x="30" y="55" width="12" height="12" rx="2" fill="#39ff14" opacity="0.2" stroke="#39ff14" strokeWidth="0.5" className="landing-pulse-dot" style={{ animationDelay: "0s" }} />
        <rect x="45" y="55" width="12" height="12" rx="2" fill="#00f5ff" opacity="0.2" stroke="#00f5ff" strokeWidth="0.5" className="landing-pulse-dot" style={{ animationDelay: "0.3s" }} />
        <rect x="37" y="42" width="12" height="12" rx="2" fill="#ff006e" opacity="0.2" stroke="#ff006e" strokeWidth="0.5" className="landing-pulse-dot" style={{ animationDelay: "0.6s" }} />
        <rect x="52" y="42" width="12" height="12" rx="2" fill="#ffd700" opacity="0.2" stroke="#ffd700" strokeWidth="0.5" className="landing-pulse-dot" style={{ animationDelay: "0.9s" }} />
        <rect x="44" y="29" width="12" height="12" rx="2" fill="#39ff14" opacity="0.2" stroke="#39ff14" strokeWidth="0.5" className="landing-pulse-dot" style={{ animationDelay: "1.2s" }} />
        <line x1="36" y1="55" x2="43" y2="42" stroke="#00f5ff" strokeWidth="0.3" opacity="0.2" />
        <line x1="51" y1="55" x2="58" y2="42" stroke="#ff006e" strokeWidth="0.3" opacity="0.2" />
        <line x1="43" y1="42" x2="50" y2="29" stroke="#ffd700" strokeWidth="0.3" opacity="0.2" />
        <path d="M50,22 L50,12 M47,16 L50,12 L53,16" fill="none" stroke="#39ff14" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" className="landing-float-1" />
      </g>
    </svg>
  );
}

function StepThreeLaunch() {
  /* Shooting particles at 0°,72°,144°,216°,288° — r=35 from (40,40)
     0°:   l35,0          72°:  l10.81,33.28    144°: l-28.32,20.57
     216°: l-28.32,-20.57  288°: l10.81,-33.28 */
  return (
    <svg viewBox="0 0 80 80" className="w-12 h-12 mb-4" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="step3-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
          <feComposite in="SourceGraphic" operator="over" />
        </filter>
      </defs>
      <g filter="url(#step3-glow)">
        <circle cx="40" cy="40" r="30" fill="none" stroke="#ff006e" strokeWidth="0.6" opacity="0.15" className="landing-expand-ring" style={{ animationDelay: "0s", transformOrigin: "40px 40px" }} />
        <circle cx="40" cy="40" r="22" fill="none" stroke="#00f5ff" strokeWidth="0.6" opacity="0.25" className="landing-expand-ring" style={{ animationDelay: "0.5s", transformOrigin: "40px 40px" }} />
        <circle cx="40" cy="40" r="14" fill="none" stroke="#39ff14" strokeWidth="0.6" opacity="0.35" className="landing-expand-ring" style={{ animationDelay: "1s", transformOrigin: "40px 40px" }} />
        <circle cx="40" cy="40" r="8" fill="#00f5ff" opacity="0.15" className="landing-breathe" />
        <circle cx="40" cy="40" r="4" fill="#00f5ff" opacity="0.5" className="landing-breathe" />
        {/* Particles shooting outward — pre-computed paths */}
        <circle r="1.5" fill="#39ff14" opacity="0.6">
          <animateMotion dur="3s" repeatCount="indefinite" path="M40,40 l35,0" />
          <animate attributeName="opacity" values="0.8;0" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle r="1.5" fill="#ff006e" opacity="0.6">
          <animateMotion dur="3s" repeatCount="indefinite" path="M40,40 l10.81,33.28" />
          <animate attributeName="opacity" values="0.8;0" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle r="1.5" fill="#39ff14" opacity="0.6">
          <animateMotion dur="3s" repeatCount="indefinite" path="M40,40 l-28.32,20.57" />
          <animate attributeName="opacity" values="0.8;0" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle r="1.5" fill="#ff006e" opacity="0.6">
          <animateMotion dur="3s" repeatCount="indefinite" path="M40,40 l-28.32,-20.57" />
          <animate attributeName="opacity" values="0.8;0" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle r="1.5" fill="#39ff14" opacity="0.6">
          <animateMotion dur="3s" repeatCount="indefinite" path="M40,40 l10.81,-33.28" />
          <animate attributeName="opacity" values="0.8;0" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}


// ── Final CTA Portal ─────────────────────────────────────────────────────────

export function CtaPortalArt() {
  /* Orbiting particles — circular arcs at r=60 from (100,100)
     0°:   start (160,100)  arc end ≈ (159.98,101.05)
     120°: start (70,151.96)  arc end ≈ (69.66,151.5)
     240°: start (70,48.04)   arc end ≈ (70.32,47.45)
     Floating particles at r=30+(i%5)*12, angle=i*18° — all pre-computed */
  return (
    <div className="relative w-48 h-48 mx-auto mb-8" aria-hidden="true">
      <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="cta-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id="cta-gradient">
            <stop offset="0%" stopColor="#39ff14" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#00f5ff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ff006e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Vortex rings */}
        <circle cx="100" cy="100" r="80" fill="none" stroke="#ff006e" strokeWidth="0.5" opacity="0.1" strokeDasharray="4 6" className="landing-rotate-slow" style={{ transformOrigin: "100px 100px", animationDuration: "15s" }} />
        <circle cx="100" cy="100" r="65" fill="none" stroke="#00f5ff" strokeWidth="0.7" opacity="0.15" strokeDasharray="6 8" className="landing-rotate-reverse" style={{ transformOrigin: "100px 100px", animationDuration: "13s" }} />
        <circle cx="100" cy="100" r="50" fill="none" stroke="#39ff14" strokeWidth="0.9" opacity="0.2" strokeDasharray="8 10" className="landing-rotate-slow" style={{ transformOrigin: "100px 100px", animationDuration: "11s" }} />
        <circle cx="100" cy="100" r="35" fill="none" stroke="#ff006e" strokeWidth="1.1" opacity="0.25" strokeDasharray="10 12" className="landing-rotate-reverse" style={{ transformOrigin: "100px 100px", animationDuration: "9s" }} />
        <circle cx="100" cy="100" r="20" fill="none" stroke="#00f5ff" strokeWidth="1.3" opacity="0.3" strokeDasharray="12 14" className="landing-rotate-slow" style={{ transformOrigin: "100px 100px", animationDuration: "7s" }} />

        {/* Central radiance */}
        <circle cx="100" cy="100" r="40" fill="url(#cta-gradient)" filter="url(#cta-glow)" className="landing-breathe" />
        <circle cx="100" cy="100" r="8" fill="#39ff14" opacity="0.4" className="landing-breathe" />
        <circle cx="100" cy="100" r="3" fill="#fff" opacity="0.8" />

        {/* Orbiting particles — using SMIL circular paths */}
        <circle r="2" fill="#ff006e" opacity="0.7">
          <animateMotion dur="4s" repeatCount="indefinite" path="M160,100 A60,60 0 1,1 159.99,99.9 Z" />
        </circle>
        <circle r="2" fill="#00f5ff" opacity="0.7">
          <animateMotion dur="5s" repeatCount="indefinite" path="M70,151.96 A60,60 0 1,1 69.99,151.86 Z" />
        </circle>
        <circle r="2" fill="#ffd700" opacity="0.7">
          <animateMotion dur="6s" repeatCount="indefinite" path="M70,48.04 A60,60 0 1,1 69.99,47.94 Z" />
        </circle>

        {/* Floating twinkle particles — pre-computed coordinates */}
        <circle cx="130" cy="100" r="0.5" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "0s" }} />
        <circle cx="139.89" cy="113.09" r="1" fill="#00f5ff" opacity="0" className="landing-twinkle" style={{ animationDelay: "0.3s" }} />
        <circle cx="140.73" cy="129.27" r="1.5" fill="#39ff14" opacity="0" className="landing-twinkle" style={{ animationDelay: "0.6s" }} />
        <circle cx="132.14" cy="143.02" r="0.5" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "0.9s" }} />
        <circle cx="117.63" cy="149.02" r="1" fill="#00f5ff" opacity="0" className="landing-twinkle" style={{ animationDelay: "1.2s" }} />
        <circle cx="100" cy="142" r="1.5" fill="#39ff14" opacity="0" className="landing-twinkle" style={{ animationDelay: "1.5s" }} />
        <circle cx="64.3" cy="137.55" r="0.5" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "1.8s" }} />
        <circle cx="54.12" cy="122.94" r="1" fill="#00f5ff" opacity="0" className="landing-twinkle" style={{ animationDelay: "2.1s" }} />
        <circle cx="55.28" cy="105.56" r="1.5" fill="#39ff14" opacity="0" className="landing-twinkle" style={{ animationDelay: "2.4s" }} />
        <circle cx="67.86" cy="56.98" r="0.5" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "2.7s" }} />
        <circle cx="70" cy="100" r="1" fill="#00f5ff" opacity="0" className="landing-twinkle" style={{ animationDelay: "3s" }} />
        <circle cx="56.31" cy="68.26" r="1.5" fill="#39ff14" opacity="0" className="landing-twinkle" style={{ animationDelay: "3.3s" }} />
        <circle cx="59.27" cy="86.91" r="0.5" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "3.6s" }} />
        <circle cx="82.37" cy="50.98" r="1" fill="#00f5ff" opacity="0" className="landing-twinkle" style={{ animationDelay: "3.9s" }} />
        <circle cx="100" cy="58" r="1.5" fill="#39ff14" opacity="0" className="landing-twinkle" style={{ animationDelay: "4.2s" }} />
        <circle cx="135.69" cy="68.26" r="0.5" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "4.5s" }} />
        <circle cx="145.88" cy="77.06" r="1" fill="#00f5ff" opacity="0" className="landing-twinkle" style={{ animationDelay: "4.8s" }} />
        <circle cx="144.72" cy="94.44" r="1.5" fill="#39ff14" opacity="0" className="landing-twinkle" style={{ animationDelay: "5.1s" }} />
        <circle cx="174.18" cy="75.9" r="0.5" fill="#ff006e" opacity="0" className="landing-twinkle" style={{ animationDelay: "5.4s" }} />
        <circle cx="117.63" cy="50.98" r="1" fill="#00f5ff" opacity="0" className="landing-twinkle" style={{ animationDelay: "5.7s" }} />
      </svg>
    </div>
  );
}

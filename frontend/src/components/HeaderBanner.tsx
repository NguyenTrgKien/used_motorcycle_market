export default function HeaderBanner() {
  return (
    <div
      className="w-full h-[15rem] md:h-[18rem]"
      style={{
        background:
          "linear-gradient(135deg, #FF8C00 0%, #FFA500 30%, #FFB700 60%, #FFC800 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          width: "clamp(100px, 25vw, 300px)",
          height: "clamp(100px, 25vw, 300px)",
          top: "-50%",
          left: "10%",
        }}
      />
      <div
        style={{
          position: "absolute",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          width: "clamp(70px, 16vw, 200px)",
          height: "clamp(70px, 16vw, 200px)",
          top: "-40%",
          right: "15%",
        }}
      />

      <svg
        className="desktop-banner"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        viewBox="0 0 1200 150"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="shadow-sm" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="1"
              dy="2"
              stdDeviation="1.5"
              floodColor="rgba(0,0,0,0.18)"
            />
          </filter>
        </defs>
        <path
          d="M -20 135 Q 300 50 600 95 Q 900 140 1220 60"
          fill="none"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="26"
          strokeLinecap="round"
        />
        <path
          d="M -20 130 Q 300 45 600 90 Q 900 135 1220 55"
          fill="none"
          stroke="#E8900A"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <path
          d="M -20 124 Q 300 39 600 84 Q 900 129 1220 49"
          fill="none"
          stroke="rgba(255,200,80,0.5)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M -20 130 Q 300 45 600 90 Q 900 135 1220 55"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeDasharray="18 14"
          strokeLinecap="round"
        />
        <g transform="translate(138,58)" filter="url(#shadow-sm)">
          <rect x="-4" y="18" width="8" height="20" rx="3" fill="#A0622A" />
          <ellipse cx="0" cy="14" rx="18" ry="16" fill="#3CB843" />
          <ellipse cx="0" cy="8" rx="14" ry="13" fill="#47C74F" />
          <ellipse cx="0" cy="3" rx="9" ry="9" fill="#5DD465" />
        </g>
        <g transform="translate(328,50)" filter="url(#shadow-sm)">
          <rect x="-3.5" y="16" width="7" height="18" rx="2.5" fill="#A0622A" />
          <ellipse cx="0" cy="12" rx="16" ry="14" fill="#2EA830" />
          <ellipse cx="0" cy="7" rx="12" ry="11" fill="#3CB843" />
          <ellipse cx="0" cy="2" rx="8" ry="8" fill="#4DC455" />
        </g>
        <g transform="translate(545,62)" filter="url(#shadow-sm)">
          <rect x="-4" y="18" width="8" height="20" rx="3" fill="#A0622A" />
          <ellipse cx="0" cy="14" rx="20" ry="17" fill="#34B83A" />
          <ellipse cx="0" cy="8" rx="15" ry="13" fill="#42C24A" />
          <ellipse cx="0" cy="2" rx="10" ry="10" fill="#52CC5A" />
        </g>
        <g transform="translate(762,68)" filter="url(#shadow-sm)">
          <rect x="-3.5" y="16" width="7" height="18" rx="2.5" fill="#A0622A" />
          <ellipse cx="0" cy="12" rx="15" ry="13" fill="#2EA830" />
          <ellipse cx="0" cy="7" rx="11" ry="10" fill="#3CB843" />
          <ellipse cx="0" cy="2" rx="7" ry="7" fill="#4DC455" />
        </g>
        <g transform="translate(962,55)" filter="url(#shadow-sm)">
          <rect x="-4" y="17" width="8" height="19" rx="3" fill="#A0622A" />
          <ellipse cx="0" cy="13" rx="18" ry="16" fill="#38BC3E" />
          <ellipse cx="0" cy="7" rx="13" ry="12" fill="#47C74F" />
          <ellipse cx="0" cy="2" rx="9" ry="8" fill="#58D060" />
        </g>
        <g transform="translate(28,95)" filter="url(#shadow-sm)">
          <ellipse cx="22" cy="10" rx="19" ry="8" fill="#E53935" />
          <rect x="7" y="4" width="26" height="8" rx="4" fill="#EF5350" />
          <ellipse cx="18" cy="4" rx="8" ry="3" fill="#B71C1C" />
          <circle cx="8" cy="20" r="9" fill="#222" />
          <circle cx="8" cy="20" r="6" fill="#444" />
          <circle cx="8" cy="20" r="3" fill="#666" />
          <circle cx="36" cy="20" r="9" fill="#222" />
          <circle cx="36" cy="20" r="6" fill="#444" />
          <circle cx="36" cy="20" r="3" fill="#666" />
          <ellipse cx="20" cy="-2" rx="5" ry="6" fill="#BF360C" />
          <circle cx="20" cy="-10" r="5" fill="#FF7043" />
        </g>
        <g transform="translate(80,88)" filter="url(#shadow-sm)">
          <rect x="0" y="18" width="72" height="28" rx="8" fill="#1565C0" />
          <rect x="10" y="6" width="48" height="22" rx="10" fill="#1976D2" />
          <rect
            x="14"
            y="9"
            width="18"
            height="14"
            rx="4"
            fill="rgba(173,216,255,0.85)"
          />
          <rect
            x="36"
            y="9"
            width="18"
            height="14"
            rx="4"
            fill="rgba(173,216,255,0.85)"
          />
          <rect x="60" y="26" width="10" height="6" rx="3" fill="#FFF9C4" />
          <rect x="2" y="26" width="8" height="6" rx="3" fill="#EF9A9A" />
          <circle cx="16" cy="47" r="10" fill="#111" />
          <circle cx="16" cy="47" r="7" fill="#333" />
          <circle cx="16" cy="47" r="3.5" fill="#888" />
          <circle cx="55" cy="47" r="10" fill="#111" />
          <circle cx="55" cy="47" r="7" fill="#333" />
          <circle cx="55" cy="47" r="3.5" fill="#888" />
        </g>
        <g transform="translate(170,100)" filter="url(#shadow-sm)">
          <ellipse cx="18" cy="8" rx="15" ry="6" fill="#6A1B9A" />
          <rect x="6" y="3" width="20" height="6" rx="3" fill="#7B1FA2" />
          <circle cx="6" cy="16" r="7" fill="#222" />
          <circle cx="6" cy="16" r="4.5" fill="#444" />
          <circle cx="29" cy="16" r="7" fill="#222" />
          <circle cx="29" cy="16" r="4.5" fill="#444" />
          <ellipse cx="16" cy="-1" rx="4" ry="5" fill="#4A148C" />
          <circle cx="16" cy="-8" r="4" fill="#7B1FA2" />
        </g>
        <g transform="translate(990,75)" filter="url(#shadow-sm)">
          <rect x="0" y="18" width="72" height="28" rx="8" fill="#2E7D32" />
          <rect x="10" y="5" width="48" height="22" rx="10" fill="#388E3C" />
          <rect
            x="14"
            y="8"
            width="18"
            height="14"
            rx="4"
            fill="rgba(173,255,200,0.85)"
          />
          <rect
            x="36"
            y="8"
            width="18"
            height="14"
            rx="4"
            fill="rgba(173,255,200,0.85)"
          />
          <rect x="2" y="26" width="10" height="6" rx="3" fill="#FFF9C4" />
          <rect x="60" y="26" width="8" height="6" rx="3" fill="#EF9A9A" />
          <circle cx="16" cy="47" r="10" fill="#111" />
          <circle cx="16" cy="47" r="7" fill="#333" />
          <circle cx="16" cy="47" r="3.5" fill="#888" />
          <circle cx="55" cy="47" r="10" fill="#111" />
          <circle cx="55" cy="47" r="7" fill="#333" />
          <circle cx="55" cy="47" r="3.5" fill="#888" />
        </g>
        <g transform="translate(1080,85)" filter="url(#shadow-sm)">
          <ellipse cx="22" cy="10" rx="19" ry="8" fill="#F57F17" />
          <rect x="7" y="4" width="26" height="8" rx="4" fill="#FFA000" />
          <circle cx="8" cy="20" r="9" fill="#222" />
          <circle cx="8" cy="20" r="6" fill="#444" />
          <circle cx="8" cy="20" r="3" fill="#666" />
          <circle cx="36" cy="20" r="9" fill="#222" />
          <circle cx="36" cy="20" r="6" fill="#444" />
          <circle cx="36" cy="20" r="3" fill="#666" />
          <ellipse cx="20" cy="-2" rx="5" ry="6" fill="#BF360C" />
          <circle cx="20" cy="-10" r="5" fill="#FF7043" />
        </g>
        <g transform="translate(1100,55)" filter="url(#shadow-sm)">
          <rect x="0" y="15" width="58" height="22" rx="7" fill="#6A1B9A" />
          <rect x="8" y="4" width="40" height="18" rx="8" fill="#7B1FA2" />
          <rect
            x="12"
            y="6"
            width="14"
            height="12"
            rx="3"
            fill="rgba(200,180,255,0.85)"
          />
          <rect
            x="30"
            y="6"
            width="14"
            height="12"
            rx="3"
            fill="rgba(200,180,255,0.85)"
          />
          <rect x="1" y="21" width="8" height="5" rx="2.5" fill="#FFF9C4" />
          <circle cx="13" cy="38" r="8" fill="#111" />
          <circle cx="13" cy="38" r="5.5" fill="#333" />
          <circle cx="13" cy="38" r="2.5" fill="#888" />
          <circle cx="44" cy="38" r="8" fill="#111" />
          <circle cx="44" cy="38" r="5.5" fill="#333" />
          <circle cx="44" cy="38" r="2.5" fill="#888" />
        </g>
      </svg>

      <svg
        className="mobile-banner"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        viewBox="0 0 390 130"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="drop" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="2"
              dy="4"
              stdDeviation="3"
              floodColor="rgba(0,0,0,0.18)"
            />
          </filter>
          <filter id="drop-sm" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="1"
              dy="2"
              stdDeviation="2"
              floodColor="rgba(0,0,0,0.15)"
            />
          </filter>
        </defs>

        <ellipse
          cx="195"
          cy="148"
          rx="260"
          ry="52"
          fill="rgba(230,140,0,0.35)"
        />

        <path
          d="M -10 118 Q 195 88 400 118"
          fill="none"
          stroke="rgba(0,0,0,0.10)"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <path
          d="M -10 116 Q 195 86 400 116"
          fill="none"
          stroke="#D4820A"
          strokeWidth="17"
          strokeLinecap="round"
        />
        <path
          d="M -10 114 Q 195 84 400 114"
          fill="none"
          stroke="rgba(255,210,80,0.4)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M -10 116 Q 195 86 400 116"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          strokeDasharray="14 12"
          strokeLinecap="round"
        />

        <g transform="translate(28, 30)" filter="url(#drop-sm)">
          <rect x="-5" y="38" width="10" height="30" rx="4" fill="#8B6914" />
          <ellipse cx="0" cy="34" rx="26" ry="22" fill="#2DA830" />
          <ellipse cx="0" cy="22" rx="20" ry="18" fill="#38C040" />
          <ellipse cx="0" cy="12" rx="14" ry="13" fill="#46CC4A" />
          <ellipse cx="0" cy="4" rx="9" ry="9" fill="#58D862" />
          <ellipse cx="-7" cy="6" rx="4" ry="3" fill="rgba(255,255,255,0.22)" />
        </g>

        <g transform="translate(318, 22)" filter="url(#drop-sm)">
          <rect x="-4" y="30" width="8" height="22" rx="3" fill="#8B6914" />
          <ellipse cx="0" cy="26" rx="20" ry="17" fill="#34B83A" />
          <ellipse cx="0" cy="17" rx="15" ry="13" fill="#44C44C" />
          <ellipse cx="0" cy="9" rx="10" ry="10" fill="#54D05A" />
          <ellipse
            cx="-5"
            cy="8"
            rx="3.5"
            ry="2.5"
            fill="rgba(255,255,255,0.2)"
          />
        </g>

        <g transform="translate(80, 82)">
          <ellipse cx="0" cy="0" rx="14" ry="10" fill="#2EA830" />
          <ellipse cx="14" cy="2" rx="12" ry="9" fill="#38C040" />
          <ellipse cx="7" cy="-4" rx="10" ry="8" fill="#46CC4A" />
        </g>

        <g transform="translate(222, 54)" filter="url(#drop)">
          <ellipse cx="55" cy="68" rx="52" ry="8" fill="rgba(0,0,0,0.12)" />
          <rect x="4" y="36" width="102" height="30" rx="12" fill="#F57F17" />
          <rect x="18" y="14" width="70" height="28" rx="14" fill="#FFA000" />
          <rect
            x="20"
            y="16"
            width="28"
            height="22"
            rx="8"
            fill="rgba(200,240,255,0.88)"
          />
          <rect
            x="62"
            y="16"
            width="22"
            height="22"
            rx="8"
            fill="rgba(200,240,255,0.75)"
          />
          <rect
            x="22"
            y="18"
            width="10"
            height="7"
            rx="3"
            fill="rgba(255,255,255,0.55)"
          />
          <rect
            x="64"
            y="18"
            width="7"
            height="6"
            rx="3"
            fill="rgba(255,255,255,0.45)"
          />
          <rect x="98" y="40" width="10" height="8" rx="4" fill="#FFF9C4" />
          <rect x="2" y="40" width="8" height="8" rx="4" fill="#EF9A9A" />
          <line
            x1="54"
            y1="36"
            x2="54"
            y2="64"
            stroke="rgba(0,0,0,0.10)"
            strokeWidth="1.5"
          />
          <rect
            x="38"
            y="46"
            width="12"
            height="3"
            rx="1.5"
            fill="rgba(255,255,255,0.4)"
          />
          <rect
            x="58"
            y="46"
            width="12"
            height="3"
            rx="1.5"
            fill="rgba(255,255,255,0.4)"
          />
          <ellipse cx="80" cy="66" rx="16" ry="5" fill="#E65100" />
          <ellipse cx="28" cy="66" rx="16" ry="5" fill="#E65100" />
          <circle cx="80" cy="66" r="14" fill="#1A1A1A" />
          <circle cx="80" cy="66" r="10" fill="#333" />
          <circle cx="80" cy="66" r="6" fill="#555" />
          <circle cx="80" cy="66" r="3" fill="#888" />
          <circle cx="80" cy="66" r="1.5" fill="#ccc" />
          <line
            x1="80"
            y1="56"
            x2="80"
            y2="76"
            stroke="#777"
            strokeWidth="1.5"
          />
          <line
            x1="70"
            y1="66"
            x2="90"
            y2="66"
            stroke="#777"
            strokeWidth="1.5"
          />
          <line
            x1="73"
            y1="59"
            x2="87"
            y2="73"
            stroke="#777"
            strokeWidth="1.5"
          />
          <line
            x1="87"
            y1="59"
            x2="73"
            y2="73"
            stroke="#777"
            strokeWidth="1.5"
          />
          <circle cx="28" cy="66" r="14" fill="#1A1A1A" />
          <circle cx="28" cy="66" r="10" fill="#333" />
          <circle cx="28" cy="66" r="6" fill="#555" />
          <circle cx="28" cy="66" r="3" fill="#888" />
          <circle cx="28" cy="66" r="1.5" fill="#ccc" />
          <line
            x1="28"
            y1="56"
            x2="28"
            y2="76"
            stroke="#777"
            strokeWidth="1.5"
          />
          <line
            x1="18"
            y1="66"
            x2="38"
            y2="66"
            stroke="#777"
            strokeWidth="1.5"
          />
          <line
            x1="21"
            y1="59"
            x2="35"
            y2="73"
            stroke="#777"
            strokeWidth="1.5"
          />
          <line
            x1="35"
            y1="59"
            x2="21"
            y2="73"
            stroke="#777"
            strokeWidth="1.5"
          />
          <ellipse
            cx="42"
            cy="18"
            rx="16"
            ry="4"
            fill="rgba(255,255,255,0.18)"
          />
          <line
            x1="82"
            y1="14"
            x2="86"
            y2="2"
            stroke="#888"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="86" cy="2" r="2" fill="#aaa" />
        </g>

        <g transform="translate(100, 66)" filter="url(#drop-sm)">
          <ellipse cx="46" cy="58" rx="44" ry="7" fill="rgba(0,0,0,0.10)" />
          <rect x="2" y="30" width="88" height="26" rx="10" fill="#E8E8E8" />
          <rect x="14" y="12" width="60" height="24" rx="12" fill="#F5F5F5" />
          <rect
            x="16"
            y="14"
            width="24"
            height="18"
            rx="7"
            fill="rgba(180,230,255,0.85)"
          />
          <rect
            x="52"
            y="14"
            width="18"
            height="18"
            rx="7"
            fill="rgba(180,230,255,0.70)"
          />
          <rect
            x="18"
            y="16"
            width="8"
            height="6"
            rx="3"
            fill="rgba(255,255,255,0.6)"
          />
          <rect
            x="54"
            y="16"
            width="6"
            height="5"
            rx="2.5"
            fill="rgba(255,255,255,0.5)"
          />
          <rect x="82" y="34" width="8" height="7" rx="3.5" fill="#FFF9C4" />
          <rect x="2" y="34" width="7" height="7" rx="3.5" fill="#EF9A9A" />
          <line
            x1="46"
            y1="30"
            x2="46"
            y2="54"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="1.5"
          />
          <circle cx="69" cy="57" r="12" fill="#1A1A1A" />
          <circle cx="69" cy="57" r="8" fill="#333" />
          <circle cx="69" cy="57" r="4" fill="#666" />
          <circle cx="69" cy="57" r="2" fill="#999" />
          <circle cx="22" cy="57" r="12" fill="#1A1A1A" />
          <circle cx="22" cy="57" r="8" fill="#333" />
          <circle cx="22" cy="57" r="4" fill="#666" />
          <circle cx="22" cy="57" r="2" fill="#999" />
          <ellipse
            cx="36"
            cy="14"
            rx="14"
            ry="3.5"
            fill="rgba(255,255,255,0.3)"
          />
        </g>

        <g transform="translate(148, 42)">
          <ellipse cx="18" cy="22" rx="14" ry="12" fill="#FF8F00" />
          <circle cx="18" cy="10" r="11" fill="#FFA726" />
          <ellipse cx="14" cy="9" rx="3.5" ry="4" fill="white" />
          <ellipse cx="22" cy="9" rx="3.5" ry="4" fill="white" />
          <circle cx="15" cy="10" r="2" fill="#1A1A1A" />
          <circle cx="23" cy="10" r="2" fill="#1A1A1A" />
          <circle cx="16" cy="9" r="0.8" fill="white" />
          <circle cx="24" cy="9" r="0.8" fill="white" />
          <path
            d="M 13 14 Q 18 18 23 14"
            fill="none"
            stroke="#7B3F00"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <ellipse
            cx="10"
            cy="3"
            rx="3"
            ry="4"
            fill="#FF6F00"
            transform="rotate(-15 10 3)"
          />
          <ellipse
            cx="26"
            cy="3"
            rx="3"
            ry="4"
            fill="#FF6F00"
            transform="rotate(15 26 3)"
          />
          <path
            d="M 4 18 Q -2 12 2 8"
            fill="none"
            stroke="#FFA726"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 32 18 Q 38 12 34 8"
            fill="none"
            stroke="#FFA726"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      </svg>

      <style>{`
        @media (min-width: 641px) {
          .mobile-banner { display: none; }
          .desktop-banner { display: block; }
        }
        @media (max-width: 640px) {
          .desktop-banner { display: none; }
          .mobile-banner { display: block; }
        }
      `}</style>
    </div>
  );
}

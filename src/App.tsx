import { useTranslation } from 'react-i18next';
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import Arclight from './components/Arclight';
import OrapaMine from './components/OrapaMine';
import OrapaSpace from './components/OrapaSpace';
import RicochetRobots from './components/RicochetRobots';
import LanguageSwitcher from './components/shared/LanguageSwitcher';
import Switchboard from './components/Switchboard';

function Home() {
  const { t } = useTranslation();
  return (
    <div className="home">
      <h1>{t('home.title')}</h1>
      <p className="home-subtitle">{t('home.subtitle')}</p>
      <div className="game-grid">
        <NavLink to="/arclight" className="game-card arclight-card">
          <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
            <defs>
              <filter id="arclight-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Left pointy-top hex tile, r=18, center (24,40) */}
            <polygon points="24,22 40,31 40,49 24,58 8,49 8,31" fill="#070f1e" stroke="#1e5070" strokeWidth={1.5} />
            {/* Right pointy-top hex tile, r=18, center (56,40) */}
            <polygon points="56,22 72,31 72,49 56,58 40,49 40,31" fill="#070f1e" stroke="#1e5070" strokeWidth={1.5} />
            {/* Light beam through left tile: top-left edge → shared right edge */}
            <path d="M16,27 C26,22 38,26 40,40" fill="none" stroke="#00e5ff" strokeWidth={2.5} strokeLinecap="round" filter="url(#arclight-glow)" />
            {/* Light beam through right tile: shared left edge → bottom-right edge */}
            <path d="M40,40 C44,50 60,57 64,54" fill="none" stroke="#00e5ff" strokeWidth={2.5} strokeLinecap="round" filter="url(#arclight-glow)" />
            {/* Entry glow */}
            <circle cx={16} cy={27} r={3.5} fill="#00e5ff" filter="url(#arclight-glow)" />
            {/* Mid-point dot at shared edge */}
            <circle cx={40} cy={40} r={2} fill="#7ff6ff" opacity={0.9} />
            {/* Exit glow */}
            <circle cx={64} cy={54} r={3.5} fill="#00e5ff" filter="url(#arclight-glow)" />
          </svg>
          <h2>{t('home.arclight.title')}</h2>
          <p>{t('home.arclight.description')}</p>
        </NavLink>

        <NavLink to="/orapa-mine" className="game-card mine-card">
          <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
            <rect width={80} height={80} fill="#080818" rx={4} />
            <rect x={10} y={20} width={60} height={40} fill="none" stroke="#2a2a6a" strokeWidth={1} />
            <rect x={20} y={27} width={12} height={12} fill="#ff5555" rx={1} />
            <rect x={40} y={35} width={12} height={12} fill="#5577ff" rx={1} />
            <rect x={30} y={43} width={12} height={12} fill="#ffee00" rx={1} />
            <circle cx={10} cy={20} r={5} fill="#1e1e5a" stroke="#7777ee" strokeWidth={1.5} />
            <circle cx={70} cy={60} r={5} fill="#1a3a1a" stroke="#44cc44" strokeWidth={1.5} />
          </svg>
          <h2>{t('home.orapaMine.title')}</h2>
          <p>{t('home.orapaMine.description')}</p>
        </NavLink>

        <NavLink to="/orapa-space" className="game-card space-card">
          <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
            <rect width={80} height={80} fill="#03030f" rx={4} />
            <circle cx={20} cy={15} r={1} fill="white" opacity={0.8} />
            <circle cx={60} cy={25} r={1.5} fill="white" opacity={0.6} />
            <circle cx={45} cy={10} r={1} fill="white" opacity={0.9} />
            <circle cx={40} cy={40} r={16} fill="url(#home-planet)" />
            <defs>
              <radialGradient id="home-planet" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#90caf9" />
                <stop offset="100%" stopColor="#1565c0" />
              </radialGradient>
            </defs>
            <ellipse cx={40} cy={40} rx={22} ry={5} fill="none" stroke="#90caf9" strokeWidth={1.5} opacity={0.6} />
          </svg>
          <h2>{t('home.orapaSpace.title')}</h2>
          <p>{t('home.orapaSpace.description')}</p>
        </NavLink>

        <NavLink to="/switchboard" className="game-card arclight-card">
          <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
            <rect width={80} height={80} fill="#081826" rx={4} />
            <polygon points="18,28 28,34 28,46 18,52 8,46 8,34" fill="#0b2438" stroke="#3a78a1" strokeWidth={2} />
            <polygon points="40,28 50,34 50,46 40,52 30,46 30,34" fill="#0b2438" stroke="#3a78a1" strokeWidth={2} />
            <polygon points="62,28 72,34 72,46 62,52 52,46 52,34" fill="#0b2438" stroke="#3a78a1" strokeWidth={2} />
            <path d="M8,40 Q18,28 28,40 Q40,52 50,40 Q62,28 72,40" fill="none" stroke="#9de7ff" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
          <h2>{t('home.switchboard.title')}</h2>
          <p>{t('home.switchboard.description')}</p>
        </NavLink>

        <NavLink to="/ricochet-robots" className="game-card space-card">
          <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
            <rect width={80} height={80} fill="#03060f" rx={4} />
            {/* Hex grid: pointy-top hexes, r=9. Even rows x=[10,26,42,58,74], odd rows x=[18,34,50,66] */}
            {[12, 26, 40, 54, 68].flatMap((cy, row) =>
              (row % 2 === 0 ? [10, 26, 42, 58, 74] : [18, 34, 50, 66]).map(cx => (
                <polygon key={`h-${cx}-${cy}`}
                  points={`${cx},${cy - 9} ${cx + 8},${cy - 4} ${cx + 8},${cy + 4} ${cx},${cy + 9} ${cx - 8},${cy + 4} ${cx - 8},${cy - 4}`}
                  fill="none" stroke="#1a3050" strokeWidth={0.5}
                />
              ))
            )}
            {/* Wall segments (orange, thick) */}
            {/* East edge of hex (42,12) – stops robot sliding right */}
            <line x1={50} y1={8} x2={50} y2={16} stroke="#cc7700" strokeWidth={3} strokeLinecap="square" />
            {/* North edge of target hex (65,54) – stops robot sliding down */}
            <line x1={65} y1={65} x2={73} y2={58} stroke="#cc7700" strokeWidth={3} strokeLinecap="square" />
            {/* Ricochet path: right then down */}
            <polyline points="10,12 43,12 65,54" fill="none" stroke="#4488ff" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.8} />
            {/* Red robot circle at (10,12) */}
            <circle cx={10} cy={12} r={4} fill="#ff4444" stroke="#cc2222" strokeWidth={1.5} />
            {/* Yellow bullseye target at hex (65,54) */}
            <circle cx={65} cy={54} r={5} fill="none" stroke="#ffdd00" strokeWidth={1.5} />
            <circle cx={65} cy={54} r={2.5} fill="none" stroke="#ffdd00" strokeWidth={1.5} />
            <circle cx={65} cy={54} r={1} fill="#ffdd00" />
          </svg>
          <h2>{t('home.ricochetRobots.title')}</h2>
          <p>{t('home.ricochetRobots.description')}</p>
        </NavLink>
      </div>
    </div>
  );
}

function Nav() {
  const { t } = useTranslation();
  return (
    <nav className="main-nav">
      <NavLink to="/" end className="nav-brand">{t('nav.brand')}</NavLink>
      <ul className="nav-links">
        <li><NavLink to="/arclight">{t('home.arclight.title')}</NavLink></li>
        <li><NavLink to="/orapa-mine">{t('home.orapaMine.title')}</NavLink></li>
        <li><NavLink to="/orapa-space">{t('home.orapaSpace.title')}</NavLink></li>
        <li><NavLink to="/switchboard">{t('home.switchboard.title')}</NavLink></li>
        <li><NavLink to="/ricochet-robots">{t('home.ricochetRobots.title')}</NavLink></li>
      </ul>
      <LanguageSwitcher />
    </nav>
  );
}

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="main-footer">
      <p>{t('home.contact')}</p>
    </footer>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Nav />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/arclight" element={<Arclight />} />
          <Route path="/orapa-mine" element={<OrapaMine />} />
          <Route path="/orapa-space" element={<OrapaSpace />} />
          <Route path="/switchboard" element={<Switchboard />} />
          <Route path="/ricochet-robots" element={<RicochetRobots />} />
        </Routes>
      </main>
      <Footer />
    </HashRouter>
  );
}

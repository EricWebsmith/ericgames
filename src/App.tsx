import { useTranslation } from 'react-i18next';
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import Arclight from './components/Arclight';
import LanguageSwitcher from './components/shared/LanguageSwitcher';
import OrapaMine from './components/OrapaMine';
import OrapaSpace from './components/OrapaSpace';
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
            {/* Pointy-top hex tile, matching in-game tile style */}
            <polygon points="40,12 63,26 63,54 40,68 17,54 17,26" fill="#1a0a04" stroke="#8a5a30" strokeWidth={2} />
            {/* Amber gem in the center (revealed tile) */}
            {/* <circle cx={40} cy={40} r={9} fill="#ffaa00" opacity={0.9} /> */}
            {/* Light-beam arc: upper-right edge → right edge (tight 120° corner) */}
            <path d="M 51.5,21.5 A 13,13 0 0,0 63,40" fill="none" stroke="#00e5ff" strokeWidth={2.5} strokeLinecap="round" />
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

        {/* <NavLink to="/switchboard" className="game-card arclight-card">
          <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
            <rect width={80} height={80} fill="#081826" rx={4} />
            <polygon points="40,14 61,26 61,50 40,62 19,50 19,26" fill="#0b2438" stroke="#3a78a1" strokeWidth={2} />
            <path d="M30,34 A10,10 0 0,0 50,34" fill="none" stroke="#9de7ff" strokeWidth={2.5} strokeLinecap="round" />
            <path d="M29,45 L51,45" fill="none" stroke="#9de7ff" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
          <h2>{t('home.switchboard.title')}</h2>
          <p>{t('home.switchboard.description')}</p>
        </NavLink> */}
      </div>
    </div>
  )
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
        {/* <li><NavLink to="/switchboard">{t('home.switchboard.title')}</NavLink></li> */}
      </ul>
      <LanguageSwitcher />
    </nav>
  )
}

function Footer() {
  return (
    <footer className="main-footer">
      <p>QQ: 961422707</p>
    </footer>
  )
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
        </Routes>
      </main>
      <Footer />
    </HashRouter>
  )
}

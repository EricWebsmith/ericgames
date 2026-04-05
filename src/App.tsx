import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './App.css';
import Arclight from './components/arclight/Arclight';
import OrapaMine from './components/orapaMine/OrapaMine';
import LanguageSwitcher from './components/shared/LanguageSwitcher';

function Home() {
  const { t } = useTranslation();
  return (
    <div className="home">
      <h1>{t('home.title')}</h1>
      <p className="home-subtitle">{t('home.subtitle')}</p>
      <div className="game-grid">
        <NavLink to="/ericgames/arclight" className="game-card arclight-card">
          <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
            <circle cx={40} cy={40} r={30} fill="#0a0a1a" stroke="#00e5ff" strokeWidth={2} />
            <circle cx={40} cy={40} r={18} fill="#00e5ff" opacity={0.8} />
            <path d="M 26 40 A 14 14 0 0 1 54 40" fill="none" stroke="white" strokeWidth={3} />
          </svg>
          <h2>Arclight</h2>
          <p>{t('home.arclight.description')}</p>
        </NavLink>

        <NavLink to="/ericgames/orapa-mine" className="game-card mine-card">
          <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
            <rect width={80} height={80} fill="#080818" rx={4} />
            <rect x={10} y={20} width={60} height={40} fill="none" stroke="#2a2a6a" strokeWidth={1} />
            <rect x={20} y={27} width={12} height={12} fill="#ff5555" rx={1} />
            <rect x={40} y={35} width={12} height={12} fill="#5577ff" rx={1} />
            <rect x={30} y={43} width={12} height={12} fill="#ffee00" rx={1} />
            <circle cx={10} cy={20} r={5} fill="#1e1e5a" stroke="#7777ee" strokeWidth={1.5} />
            <circle cx={70} cy={60} r={5} fill="#1a3a1a" stroke="#44cc44" strokeWidth={1.5} />
          </svg>
          <h2>Orapa Mine</h2>
          <p>{t('home.mine.description')}</p>
        </NavLink>

        {/* <NavLink to="/ericgames/orapa-space" className="game-card space-card">
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
          <h2>Orapa Space</h2>
          <p>{t('home.space.description')}</p>
        </NavLink> */}
      </div>
    </div>
  )
}

function Nav() {
  const { t } = useTranslation();
  return (
    <nav className="main-nav">
      <NavLink to="/ericgames" end className="nav-brand">{t('nav.brand')}</NavLink>
      <ul className="nav-links">
        <li><NavLink to="/ericgames/arclight">Arclight</NavLink></li>
        <li><NavLink to="/ericgames/orapa-mine">Orapa Mine</NavLink></li>
        {/* <li><NavLink to="/ericgames/orapa-space">Orapa Space</NavLink></li> */}
      </ul>
      <LanguageSwitcher />
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main className="main-content">
        <Routes>
          <Route path="/ericgames" element={<Home />} />
          <Route path="/ericgames/arclight" element={<Arclight />} />
          <Route path="/ericgames/orapa-mine" element={<OrapaMine />} />
          {/* <Route path="/ericgames/orapa-space" element={<OrapaSpace />} /> */}
        </Routes>
      </main>
    </BrowserRouter>
  )
}

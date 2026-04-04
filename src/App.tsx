import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import Arclight from './components/arclight/Arclight';

function Home() {
  return (
    <div className="home">
      <h1>Eric Games</h1>
      <p className="home-subtitle">闲鱼卡坦王Eric</p>
      <div className="game-grid">
        <NavLink to="/arclight" className="game-card arclight-card">
          <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
            <circle cx={40} cy={40} r={30} fill="#0a0a1a" stroke="#00e5ff" strokeWidth={2} />
            <circle cx={40} cy={40} r={18} fill="#00e5ff" opacity={0.8} />
            <path d="M 26 40 A 14 14 0 0 1 54 40" fill="none" stroke="white" strokeWidth={3} />
          </svg>
          <h2>Arclight</h2>
          <p>解谜游戏</p>
        </NavLink>

        {/* <NavLink to="/orapa-mine" className="game-card mine-card">
          <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
            <rect width={80} height={80} fill="#2d1f0e" rx={4} />
            <polygon points="40,14 58,50 22,50" fill="#c9a227" stroke="#8b6914" strokeWidth={1.5} />
            <polygon points="40,30 54,66 26,66" fill="#5b9ecc" stroke="#2a6080" strokeWidth={1.5} />
          </svg>
          <h2>Orapa Mine</h2>
          <p>3-in-a-row mining challenge</p>
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
          <h2>Orapa Space</h2>
          <p>4-in-a-row among the stars</p>
        </NavLink> */}
      </div>
    </div>
  )
}

function Nav() {
  return (
    <nav className="main-nav">
      <NavLink to="/ericgames" end className="nav-brand">Eric Games</NavLink>
      <ul className="nav-links">
        <li><NavLink to="/ericgames/arclight">Arclight</NavLink></li>
        {/* <li><NavLink to="/orapa-mine">Orapa Mine</NavLink></li>
        <li><NavLink to="/orapa-space">Orapa Space</NavLink></li> */}
      </ul>
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
          {/* <Route path="/orapa-mine" element={<OrapaMine />} />
          <Route path="/orapa-space" element={<OrapaSpace />} /> */}
        </Routes>
      </main>
    </BrowserRouter>
  )
}

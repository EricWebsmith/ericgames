import { useTranslation } from 'react-i18next';
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import Arclight from './components/Arclight';
import OrapaMine from './components/OrapaMine';
import OrapaSpace from './components/OrapaSpace';
import OrapaStreet221B from './components/OrapaStreet221B';
import RicochetRobots from './components/RicochetRobots';
import LanguageSwitcher from './components/shared/LanguageSwitcher';
import RotatingRoads from './components/RotatingRoads';

function Home() {
  const { t } = useTranslation();
  return <div className="home">
    <h1>{t('home.title')}</h1>
    <p className="home-subtitle">{t('home.subtitle')}</p>
    <div className="game-grid">
      <NavLink to="/arclight" className="game-card arclight-card"><h2>{t('home.arclight.title')}</h2><p>{t('home.arclight.description')}</p></NavLink>
      <NavLink to="/orapa-mine" className="game-card mine-card"><h2>{t('home.orapaMine.title')}</h2><p>{t('home.orapaMine.description')}</p></NavLink>
      <NavLink to="/orapa-space" className="game-card space-card"><h2>{t('home.orapaSpace.title')}</h2><p>{t('home.orapaSpace.description')}</p></NavLink>
      <NavLink to="/orapa-street-221b" className="game-card mine-card"><h2>{t('orapaStreet221B.title', 'En Drapa Street 221B')}</h2><p>{t('orapaStreet221B.description', 'A Sherlock deduction and brainwave game')}</p></NavLink>
      <NavLink to="/rotating-roads" className="game-card arclight-card"><h2>{t('home.rotatingRoads.title')}</h2><p>{t('home.rotatingRoads.description')}</p></NavLink>
      <NavLink to="/ricochet-robots" className="game-card space-card"><h2>{t('home.ricochetRobots.title')}</h2><p>{t('home.ricochetRobots.description')}</p></NavLink>
    </div>
  </div>;
}
function Nav() {
  const { t } = useTranslation();
  return <nav className="main-nav">
    <NavLink to="/" end className="nav-brand">{t('nav.brand')}</NavLink>
    <ul className="nav-links">
      <li><NavLink to="/arclight">{t('home.arclight.title')}</NavLink></li>
      <li><NavLink to="/orapa-mine">{t('home.orapaMine.title')}</NavLink></li>
      <li><NavLink to="/orapa-space">{t('home.orapaSpace.title')}</NavLink></li>
      <li><NavLink to="/orapa-street-221b">{t('orapaStreet221B.title', '221B')}</NavLink></li>
      <li><NavLink to="/rotating-roads">{t('home.rotatingRoads.title')}</NavLink></li>
      <li><NavLink to="/ricochet-robots">{t('home.ricochetRobots.title')}</NavLink></li>
    </ul>
    <LanguageSwitcher />
  </nav>;
}
function Footer() {
  const { t } = useTranslation();
  return <footer className="main-footer"><p>{t('home.contact')}</p></footer>;
}
export default function App() {
  return <HashRouter><Nav /><main className="main-content"><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/arclight" element={<Arclight />} />
    <Route path="/orapa-mine" element={<OrapaMine />} />
    <Route path="/orapa-space" element={<OrapaSpace />} />
    <Route path="/orapa-street-221b" element={<OrapaStreet221B />} />
    <Route path="/rotating-roads" element={<RotatingRoads />} />
    <Route path="/ricochet-robots" element={<RicochetRobots />} />
  </Routes></main><Footer /></HashRouter>;
}

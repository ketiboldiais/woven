import './App.css';
import "katex/dist/katex.min.css";
import Overview from './pages/overview.mdx';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

type LinkObject = {
  /** The link’s anchor text */
  text: string;
  /** The link’s path (must be of the form '/path') */
  path: string;
  /** The JSX page associated with the link (imported from MDX) */
  page: JSX.Element;
};

const links: LinkObject[] = [
  { text: 'Overview', path: '/', page: <Overview /> },
];

const Nav = () => (
  <nav>
    <ul>
      {links.map((link) => (
        <li key={link.path}>
          <Link to={link.path}>{link.text}</Link>
        </li>
      ))}
    </ul>
  </nav>
);

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main>
        <Routes>
          <Route path={'/'} element={<Overview />} />
          {links.map((link) => (
            <Route path={link.path} key={link.path} element={link.page} />
          ))}
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
];

export default function Nav() {
  return (
    <nav className="nav">
      <a href="#top" className="nav__brand" data-magnetic>
        <span className="dot" /> Dibesh Oli
      </a>
      <ul className="nav__list">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href} className="nav__link" data-magnetic>{l.label}</a>
          </li>
        ))}
      </ul>
      <a href="#contact" className="nav__cta" data-magnetic>Let's talk →</a>
    </nav>
  );
}

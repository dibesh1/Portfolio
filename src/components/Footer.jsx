export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="row">
          <small>© {new Date().getFullYear()} Dibesh Oli — designed &amp; built in London</small>
          <small><a href="#top" data-magnetic>Back to top ↑</a></small>
        </div>
      </div>
    </footer>
  );
}

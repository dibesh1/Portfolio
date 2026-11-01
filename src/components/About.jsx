/**
 * Profile-card image falls back through a few filenames, then to an
 * initials monogram if none exist — so the card always looks intentional.
 */
function onProfileImgError(e) {
  const img = e.currentTarget;
  const tried = Number(img.dataset.tried || 0);
  const next = ['/profile.png', '/hero-portrait.jpg', '/hero-portrait.png'][tried];
  if (next) {
    img.dataset.tried = String(tried + 1);
    img.src = next;
  } else {
    img.style.display = 'none'; // reveal the monogram beneath
  }
}

export default function About() {
  return (
    <section id="about">
      <div className="blend blend--top" aria-hidden="true" />
      <div className="wrap">
        <div className="about">
          <div className="about__copy reveal">
            <h2 className="about__title">About <em>me.</em></h2>
            <p>
              <strong>Data driven Informatics Engineering graduate</strong> with hands on experience in SQL, Python,
              and full end to end data analysis covering preprocessing, visualization, and reporting.
            </p>
            <p>
              My background combines <span className="accent">relational database design</span>, ETL workflows,
              and machine learning project delivery with three years of multilingual, GDPR compliant stakeholder
              communication in client facing operations.
            </p>
            <p>
              I'm at my best when translating raw datasets into <strong>actionable business insights</strong>,
              building clean data pipelines, and explaining findings to both technical and non technical audiences
              without losing the nuance.
            </p>

            <div className="about__id">
              <h3 className="profile-card__name">Dibesh Oli</h3>
              <p className="profile-card__role">Data Analyst · Informatics Engineer</p>
              <div className="profile-card__facts">
                <span className="profile-card__fact">London, UK</span>
                <span className="profile-card__fact">BSc · IPB Portugal</span>
                <span className="profile-card__fact">4 languages</span>
              </div>
            </div>
          </div>

          <figure className="profile-card reveal" data-delay="1">
            <span className="profile-card__badge"><span className="dot" /> Open to work</span>
            <div className="profile-card__media">
              <span className="profile-card__monogram" aria-hidden="true">DO</span>
              <img
                src="/profile.jpg"
                alt="Dibesh Oli"
                loading="lazy"
                decoding="async"
                onError={onProfileImgError}
              />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}

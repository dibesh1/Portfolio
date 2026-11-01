import { useState } from 'react';

const EMAIL = 'dibesoli@gmail.com'; // single source of truth for the address

const CONTACTS = [
  { label: 'Email',    text: EMAIL,                                 href: `mailto:${EMAIL}`,                             arrow: '→' },
  { label: 'Phone',    text: '+44 7405 179116',                     href: 'tel:+447405179116',                          arrow: '→' },
  { label: 'LinkedIn', text: '/in/dibes-oli-3270b01ba',             href: 'https://linkedin.com/in/dibes-oli-3270b01ba', arrow: '↗', external: true },
  { label: 'Location', text: 'London, UK',                          href: '#top',                                       arrow: '→' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio enquiry - ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\nFrom ${form.name} (${form.email})`);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="cv-auto">
      <div className="blend blend--top" aria-hidden="true" />
      <div className="wrap">
        <div className="contact">
          <div>
            <h2 className="reveal">Let's build <em>something useful.</em></h2>
            <p className="lead reveal" data-delay="1">
              Open to data analyst, BI, and analytics engineering roles in the UK and remote.
              The fastest way to reach me is email, and I read everything.
            </p>

            <div className="contact-list reveal" data-delay="2">
              {CONTACTS.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <span className="label">{c.label}</span>
                  <span>{c.text}</span>
                  <span className="arrow">{c.arrow}</span>
                </a>
              ))}
            </div>
          </div>

          <form className="contact-form reveal" data-delay="3" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input id="name" name="name" type="text" autoComplete="name" required value={form.name} onChange={onChange} />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={onChange} />
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows={4} required value={form.message} onChange={onChange} />
            </div>
            <button type="submit" className="btn btn--primary" data-magnetic>
              Send message <span className="arrow">→</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

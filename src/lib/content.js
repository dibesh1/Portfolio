// Lightweight read-only data layer for public content. Talks to Supabase's
// REST (PostgREST) endpoint directly via fetch — no client library in the
// public bundle. The publishable key + Row Level Security scope reads to
// published rows only. Returns null on any failure so callers keep their
// built-in fallback content.
const BASE = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function rest(query) {
  if (!BASE || !KEY) return null;
  try {
    const res = await fetch(`${BASE}/rest/v1/${query}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const fetchProjects = () =>
  rest(
    'projects?select=num,kind,title,title_accent,description,tags,hue' +
      '&is_published=eq.true&order=sort_order.asc'
  );

export const fetchExperience = () =>
  rest(
    'experience_roles?select=period,tag,title,org,note,is_current,bullets' +
      '&is_published=eq.true&order=sort_order.asc'
  );

export const fetchSkills = () =>
  rest('skill_blocks?select=title,tags&is_published=eq.true&order=sort_order.asc');

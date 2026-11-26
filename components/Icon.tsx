/* Нэг загварын зураасан дүрсүүд: гадны сан ашиглахгүй */
const PATHS = {
  chevron: <path d="m9 6 6 6-6 6" />,
  back: <path d="m15 6-6 6 6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.9 3.8M6.5 6.6C3.6 8.5 2 12 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6" /><path d="m3 3 18 18" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7 2.5 7h-17S6 15 6 9Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  bulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1.1 2.2h5c.1-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3Z" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10Z" />,
  chat: <path d="M4 5.5h16v10.5H9.5L5 20v-4H4Z" />,
  spark: <path d="M12 3.5 13.9 9l5.6 2-5.6 2-1.9 5.5-1.9-5.5-5.6-2 5.6-2Z" />,
  steth: <><path d="M6 3v6a4 4 0 0 0 8 0V3" /><path d="M10 13v2.5a4.5 4.5 0 0 0 9 0V13" /><circle cx="19" cy="11" r="2" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></>,
  logout: <><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="M15 8l4 4-4 4M19 12H9" /></>,
  /* Өдрийн хэвшлийн дүрсүүд */
  meal: <><path d="M4 11h16a8 8 0 0 1-16 0Z" /><path d="M9 4c0 1.5 1 1.5 1 3M13 4c0 1.5 1 1.5 1 3" /></>,
  bath: <><path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z" /><path d="M6 12V6a2 2 0 0 1 4 0" /></>,
  dress: <path d="M8 4 3 7l2 4 2-1v10h10V10l2 1 2-4-5-3a4 4 0 0 1-8 0Z" />,
  play: <><circle cx="12" cy="12" r="8.5" /><path d="M5.5 7.5c3 1 5 3.5 5.5 7M18.5 7.5c-3 1-5 3.5-5.5 7" /></>,
  out: <><path d="M12 21v-7" /><path d="M12 3a5 5 0 0 0-4 8 4 4 0 0 0 4 3 4 4 0 0 0 4-3 5 5 0 0 0-4-8Z" /></>,
  book: <><path d="M4 5.5C6.5 4.5 9.5 4.5 12 6v13c-2.5-1.5-5.5-1.5-8-.5Z" /><path d="M20 5.5C17.5 4.5 14.5 4.5 12 6v13c2.5-1.5 5.5-1.5 8-.5Z" /></>,
  bed: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  no: <><circle cx="12" cy="12" r="8.5" /><path d="m6 6 12 12" /></>,
  repeat: <><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5" /><path d="M20 4v4.5h-4.5" /><path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.5" /><path d="M4 20v-4.5h4.5" /></>,
};
export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{PATHS[name]}</svg>
  );
}

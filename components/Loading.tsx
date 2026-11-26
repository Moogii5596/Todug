/* Ачаалж буй үеийн хүрээ: хоосон бичвэрийн оронд агуулгын хэлбэрийг урьдчилан харуулна */
export default function Loading({ label = "Ачаалж байна…" }: { label?: string }) {
  return (
    <main aria-busy="true">
      <p className="sr" role="status">{label}</p>
      <div className="skel" aria-hidden="true"><i className="t" /><i /><i className="l" /></div>
    </main>
  );
}

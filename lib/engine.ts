/* Todug: хичээл тааруулах логик. Хичээлийн агуулга lib/content.ts-д байна. */

export type Profile = {
  name: string; years: number; months: number; sex: "boy" | "girl";
  stage: number; comp: "yes" | "some" | "no";
  flags: string[]; likes: string[]; time: number;
  advance: number;   /* дарааллын хэдэн долоо хоногийг аль хэдийн давсан */
};
export type Like = { label: string; n: string; n2: string; v: string; vp: string; snd: string; s3: string };
export type Unit = { title: string; goal: string };
export type RoutineKey = "meal" | "bath" | "dress" | "play" | "out" | "book" | "bed";
/* Нэг өдрийн хичээл: аль хэвшилд, нэр, хэрэгтэй зүйл, гурван тодорхой алхам, ярианы жишээ
   (p = эцэг эх, c = хүүхэд, a = үйлдэл, w = хүлээх), хүүхэд янз бүрээр хариулахад юу хийх (ifs) */
export type DayTip = {
  routine: RoutineKey; title: string; need: string; steps: string[]; talk: string[][];
  ifs: { when: string; then: string }[];
};
/* Долоо хоног = нэг шат = нэг арга. why: яагаад; strategy: долоо хоногийн ганц арга; words: санал болгох зорилтот үг;
   avoid: энэ шатанд хийхгүй зүйл; days: 7 өдрийн хичээл; cheer: урам ба дараагийн алхам; signs: дараагийн шат руу шилжихэд бэлэн болсны шинж;
   stuck: ахиц удаан үед; refer: мэргэжилтэнд хандах дохио.
   Орлуулагч ({n}, {v} гэх мэт) зөвхөн words болон days доторх бичвэрт байж болно. */
export type UnitContent = {
  note?: string; why: string; strategy: { name: string; how: string[] }; avoid: string[]; words: string[];
  days: DayTip[]; cheer: string; signs: string[]; stuck: string; refer: string[];
};
export type Alert = { lvl: "red" | "amber"; t: string; d: string };
export type Plan = ReturnType<typeof buildPlan>;

export const STAGES = [
  "Үг хэлдэггүй, дуу авиа л гаргадаг",
  "Цөөн үг хэлдэг (10 хүртэл)",
  "Олон үг хэлдэг ч хооронд нь холбодоггүй",
  "2 үг холбож хэлдэг",
  "Өгүүлбэрээр ярьдаг ч дутуу, ойлгомжгүй",
  "Насандаа тохирсон, чөлөөтэй ярьдаг"
];
export const COMP: Record<string, string> = { yes: "Тийм", some: "Заримдаа", no: "Үгүй" };
export const FLAGS: Record<string, string> = {
  noName: "Нэрээр нь дуудахад эргэж хардаггүй",
  noPoint: "Хүссэн зүйлээ хуруугаараа зааж үзүүлдэггүй",
  lowEye: "Нүд рүү бага хардаг",
  hearing: "Сонсгол нь эргэлзээтэй, чимээнд сул хариулдаг",
  regress: "Өмнө хэлдэг байсан үгээ хэлэхээ больсон",
  screen: "Өдөрт 2 цагаас дээш дэлгэц үздэг",
  sounds: "Авиаг буруу, тод бус хэлдэг",
  stutter: "Ярихдаа гацдаг, үг давтдаг"
};
export const LIKES: Record<string, Like> = {
  car:    { label: "Машин", n: "машин", n2: "дугуй", v: "яв", vp: "явлаа", snd: "ту-ту", s3: "Аав машин барина" },
  animal: { label: "Амьтан", n: "нохой", n2: "муур", v: "гүй", vp: "гүйлээ", snd: "хав хав", s3: "Нохой хурдан гүйнэ" },
  ball:   { label: "Бөмбөг", n: "бөмбөг", n2: "сагс", v: "шид", vp: "өнхөрлөө", snd: "бүм бүм", s3: "Би бөмбөг шиднэ" },
  food:   { label: "Хоол, жимс", n: "алим", n2: "банана", v: "ид", vp: "уналаа", snd: "ням ням", s3: "Би алим иднэ" },
  doll:   { label: "Хүүхэлдэй, баавгай", n: "баавгай", n2: "хүүхэлдэй", v: "унт", vp: "унтлаа", snd: "ш-ш-ш", s3: "Баавгай орондоо унтана" },
  music:  { label: "Дуу хөгжим", n: "бөмбөр", n2: "хонх", v: "цохь", vp: "дуугарлаа", snd: "дүн дүн", s3: "Би бөмбөр цохино" },
  blocks: { label: "Шоо, барих тоглоом", n: "шоо", n2: "цамхаг", v: "тавь", vp: "уналаа", snd: "пад", s3: "Би цамхаг барина" }
};
export const ROUTINES: Record<RoutineKey, string> = {
  meal: "Хооллох үед", bath: "Усанд орох үед", dress: "Хувцаслах үед", play: "Тоглох үед",
  out: "Гадаа явахад", book: "Ном үзэх үед", bed: "Унтахын өмнө"
};
export const TIMES: Record<string, string> = { 10: "10 минут", 20: "20 минут", 30: "30 минут" };

/* Хичээлийн шатуудын нэр, зорилго. Хичээлийн дэлгэрэнгүй агуулга lib/content.ts-д байх бөгөөд
   зөвхөн серверээс (/api/lessons), эрхтэй хэрэглэгчид л очно. */
export const UNITS: Unit[] = [
  { title: "Хамт анхаарах, ээлжлэх",
    goal: "Тантай хамт нэг зүйлд анхаарч, ээлжилж тоглодог, өөрөө харилцаа эхлүүлдэг болох. Энэ нь ярианы суурь." },
  { title: "Дуу авиа, хөдөлгөөн дуурайх",
    goal: "Таны хөдөлгөөн, дуу авиаг дуурайдаг болох." },
  { title: "Анхны үгс: нэрлэх",
    goal: "Өдөр тутмын 10–15 зүйл, үйлдлийг нэрлэдэг болох." },
  { title: "Хүсэлтийн үгс",
    goal: "\"Өг\", \"дахиад\", \"май\", \"ав\", \"үгүй\" гэж хэлж хүсэлтээ илэрхийлэх." },
  { title: "Үйл үг",
    goal: "10 орчим үйл үг хэлдэг болох: ид, уу, өг, ав, яв, суу, унт, нээ, хаа, үсэр." },
  { title: "Үг холбох, залгах: дахиад, байхгүй, өг",
    goal: "\"Дахиад ус\", \"бөмбөг байхгүй\" гэж хоёр үг холбох, эсвэл \"явъя\", \"аавын\" гэж үгэнд залгавар залгах." },
  { title: "Үг холбох, залгах: хэн яав, ямар, хэнийх",
    goal: "\"Машин явлаа\", \"том бөмбөг\", \"аавын гутал\", \"гэрт байна\" маягийн хослол хэлэх." },
  { title: "3 үгтэй өгүүлбэр",
    goal: "Хэн + юуг + яана гэсэн дарааллаар гурван үгтэй өгүүлбэр хэлэх." },
  { title: "Асуулт, хариулт",
    goal: "Юу, хэн, хаана гэсэн асуултад хариулж, өөрөө асуудаг болох." },
  { title: "Өгүүлэх",
    goal: "Болсон явдлыг 2–3 өгүүлбэрээр дараалуулан ярих." },
  { title: "Үгийг тод хэлэх",
    goal: "Ярианы тод байдлыг тоглоомоор дэмжих: тод хэлж үзүүлэх, авиагаар тоглох." }
];
const START = [0, 2, 4, 6, 7, 7];   /* ярианы түвшин бүрийн эхлэх шат */

/* ============ Логик ============ */
function expected(m: number) {
  if (m < 12) return { s: 0, text: "гунганаж, дуу авиа дуурайдаг" };
  if (m < 24) return { s: 1, text: "анхны үгсээ хэлж, үгийн сан нь нэмэгддэг" };
  if (m < 36) return { s: 3, text: "50 орчим үгтэй болж, 2 үг холбож хэлдэг" };
  if (m < 48) return { s: 4, text: "3 ба түүнээс олон үгтэй өгүүлбэрээр ярьдаг" };
  return { s: 5, text: "4–5 үгтэй өгүүлбэрээр, болсон явдлыг ярьдаг" };
}

export function buildPlan(p: Profile) {
  const m = p.years * 12 + p.months;
  const exp = expected(m);
  const gap = exp.s - p.stage;
  const social = ["noName", "noPoint", "lowEye"].filter(k => p.flags.includes(k)).length;
  const needBase = p.comp === "no" || social > 0;

  const start = START[p.stage];
  const last = UNITS.length - 1;
  const seq: number[] = needBase && start > 0 ? [0] : [];
  for (let i = start; i <= last; i++) seq.push(i);
  const raw = Math.floor(Number(p.advance));
  const advance = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), seq.length - 1) : 0;
  const ids = seq.slice(advance, advance + 4);
  const hasNext = advance + 4 < seq.length;
  const hasPrev = advance > 0;
  const extra: number | null = p.flags.includes("sounds") && !ids.includes(10) ? 10 : null;

  const alerts: Alert[] = [];
  if (p.flags.includes("regress")) alerts.push({ lvl: "red", t: "Яаралтай эмчид үзүүлээрэй",
    d: "Өмнө хэлдэг байсан үгээ хэлэхээ больсон нь заавал шалгуулах шинж. Хүүхдийн мэдрэлийн эмчид ойрын өдрүүдэд үзүүлнэ үү." });
  if (social > 0) alerts.push({ lvl: "red", t: "Хөгжлийн үнэлгээ хийлгээрэй",
    d: "Нэрээр дуудахад харахгүй байх, заахгүй байх, харц бага тулгах нь яриа төдийгүй харилцааны хөгжлийг үнэлүүлэх шаардлагатайг илтгэнэ. Хүүхдийн хөгжлийн эсвэл мэдрэлийн эмчид хандана уу." });
  if (p.flags.includes("hearing") || (p.comp === "no" && m >= 18)) alerts.push({ lvl: "red", t: "Сонсгол шалгуулаарай",
    d: "Чих хамар хоолойн эмчид үзүүлж, сонсголын шинжилгээ хийлгэнэ үү. Бага зэргийн сонсгол бууралт ч яриаг саатуулдаг." });
  if ((gap >= 2 && m >= 24) || (gap >= 1 && m >= 60)) alerts.push({ lvl: "red", t: "Хэл засалчид үзүүлээрэй",
    d: "Яриа нь насны түвшнээс нэлээд хоцорч байна. Гэрийн дасгалтай зэрэгцээд хэл засалч, хүүхдийн эмчийн үнэлгээ хэрэгтэй. Хүлээх тусам цаг алдана." });
  else if (gap === 1 && m >= 24) alerts.push({ lvl: "amber", t: "Ахицыг нь ажиглаарай",
    d: "Насны түвшнээс бага зэрэг хоцорч байж болзошгүй. Дасгалаа тогтмол хийж, 2–3 сарын дотор ахиц бага бол хэл засалчид үзүүлээрэй." });
  if (p.comp === "some" && m >= 24) alerts.push({ lvl: "amber", t: "Ойлголтыг нь ажиглаарай",
    d: "Хэлснийг тань заримдаа л ойлгож байна. Нэг алхамтай богино даалгавар өгч (\"Бөмбөг ав\"), 1–2 сар ажиглаарай. Ойлголт нь сайжрахгүй бол сонсголыг нь шалгуулж, хэл засалчид үзүүлнэ үү." });
  if (p.flags.includes("stutter")) alerts.push({ lvl: "amber", t: "Гацахад нь тайван хандаарай",
    d: "Үгийг нь дуусгаж өгөхгүй, \"удаан хэл\" гэж сануулахгүй, өөрөө удаан тайван ярина. Хэдэн сар үргэлжилбэл эсвэл хүүхэд өөрөө бухимдаж байвал хэл засалчид үзүүлнэ үү." });
  if (p.flags.includes("screen")) alerts.push({ lvl: "amber", t: "Дэлгэцийн цагийг багасгаарай",
    d: "Өдөрт 1 цагаас бага болгож, үзэх үед нь хажууд нь сууж юу болж байгааг хамт ярина. Хүүхэд хэлийг хүнтэй харилцаж сурдаг." });

  let verdict: string;
  if (gap <= 0) verdict = "Яриа нь насныхаа түвшинд ойрхон байна. Доорх хичээл яриаг нь улам баяжуулна.";
  else if (gap === 1) verdict = "Яриа нь насны түвшнээс бага зэрэг хоцорч байж болзошгүй.";
  else verdict = "Яриа нь насны түвшнээс нэлээд хоцорч байна.";

  return { months: m, exp, gap, seq, ids, advance, hasNext, hasPrev, extra, alerts, verdict, needBase };
}

/* Хэрэглэгчид агуулгыг нь нээж өгөх шатууд. Төлбөргүй бол зөвхөн хөтөлбөрийн эхний долоо хоног
   (plan.seq[0]) үнэгүй; төлбөртэй бол одоогийн цонхны бүх шат, нэмэлт шат нээлттэй. */
export function unlockedIds(plan: Plan, access: boolean): number[] {
  const all = plan.extra == null ? plan.ids : [...plan.ids, plan.extra];
  return access ? all : all.filter(id => id === plan.seq[0]);
}

/* ============ Ахиц хянах ============ */
/* Долоо хоногийн тайлан: зорилго тавиагүй бол met нь null */
export function weekRecap(done: number, goal: number | null) {
  const d = Math.min(Math.max(Math.floor(done) || 0, 0), 7);
  const g = goal == null || !Number.isFinite(goal) ? null : Math.min(Math.max(Math.floor(goal), 1), 7);
  return { done: d, goal: g, met: g == null ? null : d >= g };
}
/* "Зорилго биелсний шинж"-ийн талаас илүү нь ажиглагдвал дараагийн шат, үгүй бол давтана */
export function suggestNext(checked: number, total: number): "advance" | "repeat" {
  return total > 0 && checked * 2 > total ? "advance" : "repeat";
}
/* Үгийн бүртгэлд хадгалах хэлбэр: захын зай авч, жижиг үсэг болгож, 30 тэмдэгтээр хязгаарлана */
export function normWord(w: string) {
  return w.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 30).trim();
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
export function fill(str: string, v: Like) {
  return str.replace(/\{(\w+)\}/g, (_: string, k: string) => {
    const low = k.charAt(0).toLowerCase() + k.slice(1);
    const val = (v as unknown as Record<string, string>)[low];
    if (val == null) return "";
    return k === low ? val : cap(val);
  });
}

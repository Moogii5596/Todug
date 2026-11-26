/* Сайтын нийтийн хаяг. Хайлтын системд зориулсан canonical, sitemap, robots-д хэрэглэнэ.
   NEXT_PUBLIC_SITE_URL тохируулаагүй бол Vercel-ийн үндсэн домэйныг авна. */
const raw =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL : "") ||
  "http://localhost:3000";

export const SITE_URL = raw.replace(/\/+$/, "");
export const SITE_NAME = "Todug";
export const SITE_TITLE = "Todug: хүүхдэд тань тохирсон хэл ярианы хичээл";
export const SITE_DESCRIPTION =
  "Хүүхдийнхээ нас, одоогийн яриа, сонирхлыг оруулахад гэртээ хийх хэл ярианы дасгалын 4 долоо хоногийн төлөвлөгөө гарна. Хэл яриа хоцорсон хүүхэдтэй эцэг эхэд зориулав.";

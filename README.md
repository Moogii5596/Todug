# Todug

Хүүхдийн нас, одоогийн яриа, сонирхолд тааруулж гэртээ хийх хэл ярианы дасгалын төлөвлөгөө гаргадаг платформ.

> Todug онош тавихгүй. Хичээлийн агуулгыг (`lib/engine.ts`) олон нийтэд гаргахаас өмнө мэргэжлийн хэл засалчаар хянуулна.

## Боломжууд

- Имэйл, нууц үгээр бүртгүүлэх, нэвтрэх, мартсан нууц үгээ сэргээх (Supabase Auth)
- Нэг хэрэглэгч олон хүүхдийн профайл үүсгэх, засах, устгах
- Ярианы 6 түвшнээр 11 шатнаас эхлэх цэгийг сонгож, 4 долоо хоногийн хичээл гаргах
- 4 долоо хоног дуусахад дараагийн шатнаас үргэлжлүүлэх
- Анхаарах шинж илэрвэл эмчид үзүүлэх зөвлөмж харуулах
- Хийсэн өдрөө тэмдэглэж, ахицаа хадгалах
- Хиймэл оюунаар нэмэлт тоглоом зохиолгох (сервер талын `/api/games`, нэг хэрэглэгч өдөрт 10 хүсэлт)
- Бүртгэлээ бүх мэдээллийн хамт устгах (`/account`)
- Нууцлалын бодлогын хуудас (`/privacy`)

## Бүтэц

| Зам | Үүрэг |
| --- | --- |
| `app/` | Нүүр, `/login`, `/reset` (нууц үг сэргээх), `/children`, `/children/[id]`, `/account`, `/privacy`, `/api/games` |
| `components/` | Толгой, хүүхдийн маягт, төлөвлөгөөний харагдац |
| `lib/engine.ts` | Хичээлийн агуулга ба тааруулах логик |
| `lib/supabase.ts` | Supabase холболт |
| `supabase/migrations/` | Өгөгдлийн сангийн хүснэгт, RLS дүрэм, бүртгэл устгах функц |

## Ажиллуулах

1. [Supabase](https://supabase.com) дээр төсөл үүсгээд SQL Editor-т эхлээд `supabase/migrations/0001_init.sql`, дараа нь `supabase/migrations/0002_improvements.sql`-ийг ажиллуулна. Хоёуланг нь заавал ажиллуулна.
2. Supabase > Authentication > URL Configuration > Redirect URLs хэсэгт сайтын хаягаа `/**` төгсгөлтэй нэмнэ (жишээ нь `http://localhost:3000/**`). Баталгаажуулах холбоос `/children`, нууц үг сэргээх холбоос `/reset` руу буцдаг тул энэ хоёр зам зөвшөөрөгдсөн байх ёстой.
3. `.env.example`-ийг `.env.local` болгон хуулж, утгуудыг бөглөнө.
4. Дараах командыг ажиллуулна:

```bash
npm install
npm run dev
```

Дараа нь http://localhost:3000 хаягийг нээнэ.

## Тест

```bash
npm test
```

`lib/engine.ts`-ийн логикийг vitest-ээр шалгана.

## Google, Facebook-ээр нэвтрэх

1. Supabase > Authentication > Providers хэсэгт Google, Facebook-ийг идэвхжүүлж, тус бүрийн Client ID, Secret-ийг оруулна.
2. Google Cloud болон Meta for Developers дээр буцах хаягаар `https://ТӨСЛИЙН_ID.supabase.co/auth/v1/callback`-ийг бүртгэнэ.
3. Supabase > Authentication > URL Configuration > Redirect URLs хэсэгт сайтын хаягаа `/**` төгсгөлтэй нэмнэ (`/children`, `/reset` хоёулаа хамрагдана).
4. `NEXT_PUBLIC_OAUTH_PROVIDERS=google,facebook` гэж тохируулаад дахин байршуулна.

## Хайлтын системд бүртгүүлэх

Сайт `/robots.txt`, `/sitemap.xml`-ийг өөрөө гаргана. Нүүр болон `/privacy` л хайлтад орно; нэвтэрсний дараах хуудсууд `noindex`.

1. Өөрийн домэйн холбосон бол Vercel дээр `NEXT_PUBLIC_SITE_URL=https://таны-домэйн` гэж тохируулна. Хоосон бол Vercel-ийн үндсэн домэйныг авна.
2. [Google Search Console](https://search.google.com/search-console) дээр сайтаа "URL prefix" төрлөөр нэмж, "HTML tag" аргыг сонгоно. `content="..."` доторх кодыг `GOOGLE_SITE_VERIFICATION` хувьсагчид хийж дахин байршуулаад Verify дарна.
3. Search Console > Sitemaps хэсэгт `sitemap.xml` гэж оруулна.
4. [Bing Webmaster Tools](https://www.bing.com/webmasters) дээр Search Console-оос импортлох эсвэл `BING_SITE_VERIFICATION` кодоор баталгаажуулна. Yandex-д `YANDEX_SITE_VERIFICATION`.

## GitHub руу оруулах

GitHub дээр `todug` нэртэй хоосон репозитор үүсгээд:

```bash
git init
git add .
git commit -m "Todug: эхний хувилбар"
git branch -M main
git remote add origin https://github.com/ТАНЫ_НЭР/todug.git
git push -u origin main
```

## Байршуулах

Vercel дээр репозитороо импортлож, `.env.example` дахь хувьсагчдыг Environment Variables хэсэгт оруулна.

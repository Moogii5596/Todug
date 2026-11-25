# Todug

Хүүхдийн нас, одоогийн яриа, сонирхолд тааруулж гэртээ хийх хэл ярианы дасгалын төлөвлөгөө гаргадаг платформ.

> Todug онош тавихгүй. Хичээлийн агуулгыг (`lib/engine.ts`) олон нийтэд гаргахаас өмнө мэргэжлийн хэл засалчаар хянуулна.

## Боломжууд

- Имэйл, нууц үгээр бүртгүүлэх, нэвтрэх (Supabase Auth)
- Нэг хэрэглэгч олон хүүхдийн профайл үүсгэх, засах, устгах
- Ярианы түвшнээр 11 шатнаас эхлэх цэгийг сонгож, 4 долоо хоногийн хичээл гаргах
- Анхаарах шинж илэрвэл эмчид үзүүлэх зөвлөмж харуулах
- Хийсэн өдрөө тэмдэглэж, ахицаа хадгалах
- Хиймэл оюунаар нэмэлт тоглоом зохиолгох (сервер талын `/api/games`)

## Бүтэц

| Зам | Үүрэг |
| --- | --- |
| `app/` | Хуудсууд: нүүр, `/login`, `/children`, `/children/[id]`, `/api/games` |
| `components/` | Толгой, хүүхдийн маягт, төлөвлөгөөний харагдац |
| `lib/engine.ts` | Хичээлийн агуулга ба тааруулах логик |
| `lib/supabase.ts` | Supabase холболт |
| `supabase/migrations/` | Өгөгдлийн сангийн хүснэгт, RLS дүрэм |

## Ажиллуулах

1. [Supabase](https://supabase.com) дээр төсөл үүсгээд SQL Editor-т `supabase/migrations/0001_init.sql`-ийг ажиллуулна.
2. `.env.example`-ийг `.env.local` болгон хуулж, утгуудыг бөглөнө.
3. Дараах командыг ажиллуулна:

```bash
npm install
npm run dev
```

Дараа нь http://localhost:3000 хаягийг нээнэ.

## Google, Facebook-ээр нэвтрэх

1. Supabase > Authentication > Providers хэсэгт Google, Facebook-ийг идэвхжүүлж, тус бүрийн Client ID, Secret-ийг оруулна.
2. Google Cloud болон Meta for Developers дээр буцах хаягаар `https://ТӨСЛИЙН_ID.supabase.co/auth/v1/callback`-ийг бүртгэнэ.
3. Supabase > Authentication > URL Configuration > Redirect URLs хэсэгт сайтын хаягаа `/**` төгсгөлтэй нэмнэ.
4. `NEXT_PUBLIC_OAUTH_PROVIDERS=google,facebook` гэж тохируулаад дахин байршуулна.

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

# Nirolax — চালানো আর পুরো ফ্লো টেস্ট করার গাইড

## ১. চালু করো (দুইটা PowerShell উইন্ডো)

শুরুর আগে চ্যাটে দেওয়া দুইটা env ফাইল জায়গামতো রাখো:

- `server.env` → `server\.env` নামে। এতে আছে MongoDB-র `nirolax` ডাটাবেস, Cloudinary-র Nirolax key (ফোল্ডার `nirolax`), নতুন secret আর `DEMO_MODE=true`।
- `web.env.local` → `web\.env.local` নামে। এতে আছে `API_URL=http://localhost:5000`।
- এই দুই ফাইল git-এ যাবে না (`.gitignore`-এ বাদ দেওয়া আছে)।

**উইন্ডো ১ — API:**

```powershell
cd "C:\projects\demo project\NiroLax\server"
npm install
npm run check
npm run dev
```

- `npm run check` প্রথমবার চালালে MongoDB-তে ১০টা পিস, ৫ জন স্টাফ আর ডেমো ডাটা বসে যাবে। সাথে Cloudinary সংযোগও পরীক্ষা করে।
- কোনো লাইনে ✗ এলে কারণ সেখানেই লেখা থাকবে। সবচেয়ে সাধারণ কারণ: Atlas → Network Access-এ তোমার IP বা `0.0.0.0/0` allow করা নেই।
- `npm run dev` চালু হলে লেখা আসবে: `Nirolax API on http://localhost:5000 (mongo, ...)`

**উইন্ডো ২ — ওয়েবসাইট:**

```powershell
cd "C:\projects\demo project\NiroLax\web"
npm install
npm run dev
```

তারপর ব্রাউজারে http://localhost:3000 খোলো।

- আগের `npm run dev` চালু থাকলে আগে সেটা বন্ধ করো: `taskkill /PID <নম্বর> /F`
- স্পিড দেখতে চাইলে dev মোড না, production মোডে চালাও: `npm run build`, তারপর `npm start`।

## ২. লগইনগুলো (ডেমো মোডে OTP সবসময় 222222)

| কে | লগইন | পাসওয়ার্ড |
|---|---|---|
| ক্লায়েন্ট (Tanvir) | `01700000000` বা `tanvir@nirolax.demo` | `Demo@1234` |
| Owner | `atelier@nirolax.com` | `atelier2026` |
| Manager | `farah@nirolax.com` | `Manager@1234` |
| Tailor | `karim@nirolax.com` | `Tailor@1234` |
| Orders | `rina@nirolax.com` | `Orders@1234` |
| Content | `mitu@nirolax.com` | `Content@1234` |

প্রতিটা রোল Console-এ শুধু নিজের অংশটুকু দেখে। যেমন Tailor অর্ডার বা টাকার হিসাব দেখতে পায় না।

## ৩. পুরো ফ্লো — এই ক্রমে টেস্ট করো

### ক) ক্লায়েন্ট অ্যাকাউন্ট

1. হেডারের **Sign in** খোলো। **Create account** ট্যাবে নাম, ইমেইল, মোবাইল আর পাসওয়ার্ড দাও। কোড `222222` বসালে অ্যাকাউন্ট তৈরি হবে।
2. আগে যদি ওই নম্বর দিয়ে গেস্ট হিসেবে অর্ডার বা বুকিং করে থাকো, সেগুলো নিজে থেকেই নতুন অ্যাকাউন্টে চলে আসবে।
3. সাইন আউট করে আবার সাইন ইন করো। ইমেইল বা মোবাইল যেকোনোটা, সাথে পাসওয়ার্ড দিলেই হবে।
4. ৫ বার ভুল পাসওয়ার্ড দিলে অ্যাকাউন্ট ১৫ মিনিট লক থাকবে।
5. **Forgot your password?** দিয়ে মোবাইল নম্বর → কোড `222222` → নতুন পাসওয়ার্ড। অন্য সব ডিভাইস থেকে সাইন আউট হয়ে যাবে।
6. পাসওয়ার্ড ছাড়াও ঢোকা যায়: **Sign in with a code instead**।
7. পোর্টালে নতুন দুইটা ট্যাব আছে:
   - **Saved**: পিসের পেজে "Save this piece" চাপলে সেটা এখানে জমা হয়।
   - **Account**: নাম, ইমেইল আর ঠিকানা বদলানো, পাসওয়ার্ড বদলানো।

### খ) কেনাকাটা আর ফিটিং

আগের মতোই কাজ করে। নতুন যা যোগ হয়েছে:

- অর্ডার কনফার্ম হলে SMS আর ইমেইল রসিদ যায়, আর অ্যাটেলিয়ারকেও খবর দেওয়া হয়।
- এখন আসল SMS আর ইমেইল গেটওয়ে বসানো নেই, তাই এগুলো আপাতত Console → Messages → **Outbox**-এ দেখা যাবে।

### গ) অ্যাডমিন প্যানেল (Console) — Owner দিয়ে ঢোকো

| ট্যাব | কী করা যায় |
|---|---|
| Orders | অর্ডারে চাপলে বিস্তারিত খোলে: টাইমলাইন, নোট যোগ করা, কুরিয়ার বুক (Steadfast, Pathao, RedX — ডেমো ট্র্যাকিং নম্বর), ইনভয়েস প্রিন্ট, বাতিল + রিফান্ড (পিস এডিশনে ফেরত যায়)। খোঁজা, তারিখ দিয়ে ছাঁকা, Excel। |
| Fittings | **Book a fitting** (দোকানে সরাসরি আসা বা ফোনে নেওয়া বুকিং), **Move** (অন্য সময়ে সরানো, ক্লায়েন্ট SMS পায়), **Deposit received** |
| Clients | ক্লায়েন্ট যোগ করা, তথ্য বদলানো, মাপ লেখা, প্রাইভেসির অনুরোধে ডিলিট |
| Catalogue | নতুন পিস যোগ বা বদলানো। সামনে, বাম, পেছন, ডান — চারটা ছবি আপলোড; ব্রাউজারেই WebP হয়ে Cloudinary-র `nirolax` ফোল্ডারে যায়। Publish/Draft, ↑↓ দিয়ে সাজানো। এক মিনিটের মধ্যে দোকানে দেখা যায়, নতুন পিসের নিজের পেজও তৈরি হয়। |
| Reports | বিক্রি, ডিপোজিট, কোন পিস কত বিক্রি হলো, কে কীভাবে পেমেন্ট করল। Excel এক্সপোর্ট, পুরো ব্যাকআপ (.json/.xlsx) আর রিস্টোর। |
| Settings | অ্যাটেলিয়ারের ঠিকানা, ফোন আর WhatsApp (সাইটের ফুটার আর Contact পেজ এটা থেকে নেয়)। বুকিংয়ের সময়, বন্ধের দিন, ছুটির তারিখ, ডিপোজিট, স্টাফকে খবর দেওয়ার নম্বর। |
| Staff | নতুন স্টাফ যোগ, রোল বদলানো, অ্যাকাউন্ট বন্ধ করা, পাসওয়ার্ড রিসেট |
| Activity | কে কখন কী বদলেছে, আগে কী ছিল আর পরে কী হলো |

এরপর Tailor (`karim@nirolax.com`) দিয়ে ঢুকে দেখো, Console কতটা ছোট হয়ে যায়।

## ৪. ছবি

- **স্টেজের ছবি:** `web\public\atelier\stages\` ফোল্ডারে এখন হালকা কাপড়ের মতো দেখতে প্লেসহোল্ডার আছে। তোমার আসল ছবি একই নামে রেখে দিলেই বদলে যাবে।
  - নামগুলো: measured, pattern, cutting, basting, first-fitting, stitching, second-fitting, finishing, pressing, final-fitting, ready (সবগুলো `.webp`)
- **পিসের ছবি:** Console → Catalogue → Edit থেকে আপলোড করো। এগুলো Cloudinary-তে থাকবে।

## ৫. SEO আর স্পিড (Lighthouse)

যা আছে:

- প্রতিটা পেজে আলাদা title আর description, canonical লিংক
- শেয়ার করলে যে প্রিভিউ ছবি দেখায় (Open Graph image)
- Google-এর জন্য structured data: দোকান, প্রোডাক্টের দাম, FAQ, আর্টিকেল
- `sitemap.xml`, `robots.txt`, manifest

Lighthouse স্কোর (production build):

| ডিভাইস | Performance | SEO | Best Practices | Accessibility |
|---|---|---|---|---|
| ডেস্কটপ | 98–100 | 100 | 100 | 93–97 |
| মোবাইল (ধীর 4G ধরে মাপা) | 75–92 | 100 | 100 | 93–97 |

মোবাইলে হোমপেজের স্কোর একটু কম। কারণ শুরুর লোগো-অ্যানিমেশন, যেটা ইচ্ছা করেই রাখা।

## ৬. লাইভ করা (তুমি নিজে করবে)

ধাপগুলো `server\README.md`-এর "Deploy" অংশে আছে। সংক্ষেপে:

1. Vercel-এ দুইটা প্রজেক্ট, Root Directory যথাক্রমে `server` আর `web`।
2. env-গুলো `.env` থেকে Vercel-এ কপি করো।
3. API-তে বদলাতে হবে: `CLIENT_URL` আর `CORS_ORIGINS` = সাইটের https লিংক, `API_URL` = API-র লিংক।
4. সাইটে বসাতে হবে: `API_URL` আর `NEXT_PUBLIC_SITE_URL`।
5. Atlas → Network Access-এ `0.0.0.0/0` allow করো।

আসল লঞ্চের আগে:

- `DEMO_MODE=false`
- শক্ত `ATELIER_PASSWORD`
- SMS আর SMTP-র key
- `PAYMENT_PROVIDER=sslcommerz`

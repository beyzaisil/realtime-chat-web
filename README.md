# Realtime Chat Web

Next.js tabanlı realtime chat arayüzü.

## Kurulum

1. `.env.example` dosyasını `.env.local` olarak kopyalayın.
2. API adresini kendi ortamınıza göre düzenleyin.
3. `npm install` çalıştırın.
4. `npm run dev` ile frontend'i başlatın.

Varsayılan adres: `http://chat.test:3000`

## Kontroller

```sh
npm run contract:check
npm run typecheck
npm test
npm run build
```

## OpenAPI sözleşmesi

HTTP sözleşmesinin tek doğruluk kaynağı backend reposundaki
`docs/openapi.yaml` dosyasıdır. Backend reposu frontend çalışmaları sırasında
salt okunur tutulur. Frontend, sözleşmenin sürümlü bir kopyasını
`contracts/openapi.yaml` altında saklar.

Backend sözleşmesi değiştiğinde frontend kökünde aşağıdaki komutları çalıştırın:

```sh
npm run contract:sync
npm run contract:generate
npm run contract:check
```

`contract:sync`, yan dizindeki `realtime-chat-api/docs/openapi.yaml` dosyasını
yalnızca okuyarak frontend snapshot'ını günceller. `contract:generate`, bu
snapshot'tan `lib/api/generated/schema.ts` dosyasını üretir. Generated dosya
elle düzenlenmemelidir.

Hem `contracts/openapi.yaml` hem de generated `schema.ts` repoya commit edilir.
CI, `contract:check` çalıştırarak snapshot ile generated tipler arasında fark
varsa başarısız olmalıdır. Böylece sözleşme değişiklikleri code review içinde
görülebilir ve generator çalıştırılmadan birleştirilemez.

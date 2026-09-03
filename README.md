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

`contract:sync` ayrıca kaynak backend reposunun commit kimliğini, sözleşme
dosyasının repo içindeki yolunu ve snapshot'ın SHA-256 özetini
`contracts/openapi-source.json` dosyasına yazar. Metadata'nın yanıltıcı
olmaması için kaynak `docs/openapi.yaml` commit edilmemiş değişiklik içeriyorsa
sync işlemi başarısız olur. Metadata dosyasında tarih veya yerel mutlak yol
bulunmadığından aynı kaynak commit için her ortamda aynı çıktı üretilir.

Hem `contracts/openapi.yaml` hem de generated `schema.ts` repoya commit edilir.
CI, `contract:check` çalıştırarak snapshot ile generated tipler arasında fark
varsa başarısız olmalıdır. Böylece sözleşme değişiklikleri code review içinde
görülebilir ve generator çalıştırılmadan birleştirilemez.

Önemli sınırlama: `contract:check` backend reposuna bağlanmaz ve backend'deki
`docs/openapi.yaml` ile doğrudan karşılaştırma yapmaz. Yalnızca repoya commit
edilmiş frontend snapshot'ı (`contracts/openapi.yaml`) ile generated TypeScript
dosyasını karşılaştırır. Backend ile hangi commit üzerinden eşitlendiği
`contracts/openapi-source.json` üzerinden takip edilir; backend değiştiğinde
önce `contract:sync`, ardından `contract:generate` çalıştırılmalıdır.

## Contract CI

`.github/workflows/contract-ci.yml` doğrulama workflow'u `main` branch'ine
açılan pull request'lerde, `main` branch'ine yapılan push'larda ve GitHub
arayüzünden elle (`workflow_dispatch`) çalıştırıldığında tetiklenir. Ubuntu ve
Node.js 24 üzerinde aşağıdaki adımları sırayla çalıştırır:

1. `npm ci`
2. `npm run contract:check`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`

Snapshot değiştirilip generated tipler yenilenmezse ikinci adım başarısız olur
ve pull request kontrolü geçmez. Workflow backend reposunu checkout etmez;
backend ile doğrudan drift kontrolü yerine repodaki snapshot ve kaynak metadata
dosyasını esas alır.

<p align="center">
  <img src="https://raw.githubusercontent.com/skylab-kulubu/ytuguessr/41604261a281125e27ef43f2e8385924efe1e1a4/logo.svg" width="200" />
</p>

Bu projeyi çalıştırmak için önce `.env.example` dosyasını `.env` olarak kopyalayıp değerleri doldurun, sonra `docker-compose up --build` komudunu kullanınız.

Yayın: `backend` dalına her push `ghcr.io/skylab-kulubu/ytuguessr-backend:latest` imajını üretir (canlıya dokunmaz). Canlıya çıkmak için `backend`'den `backend-production`'a PR açılır; birleşince `:production` imajı üretilir ve Dokploy deploy edilir.


## Etkinlik lider tabloları

Genel lider tablosu (`GET /api/game/leaderboard`) olduğu gibi çalışır. Oyun bir etkinlik için tanıtılacaksa (ör. 26–29 Kasım Festival Günü) admin bir etkinlik tanımlar; o etkinliğin lider tablosu, **son tahmini etkinlik aralığında yapılan** (tamamlanan) oyunlardan her oyuncunun en iyisini sıralar. Aynı oyun genel tabloda da sayılır.

```sh
# Tanımla: tarih verilirse Türkiye saatiyle bütün gün sayılır (29 Kasım dahil, 30 Kasım 00:00'a kadar)
curl -X POST "$API/api/admin/events?key=$ADMIN_SECRET" -H 'Content-Type: application/json' \
  -d '{"slug": "festival-gunu", "name": "Festival Günü", "starts_at": "2026-11-26", "ends_at": "2026-11-29"}'
```

- Saat de verilebilir, ofsetiyle: `"starts_at": "2026-11-26T10:00:00+03:00"`. Ofsetsiz saat, bitişi başlangıçtan önce olan aralık ve aynı `slug` reddedilir.
- Admin: `GET /api/admin/events`, `POST /api/admin/events`, `PUT /api/admin/events/{id}` (yalnız verilen alanlar değişir), `DELETE /api/admin/events/{id}` (yalnız tanım silinir, skorlar kalır).
- Herkese açık: `GET /api/game/events` (etkinlikler ve durumları: `upcoming`, `active`, `ended`), `GET /api/game/leaderboard?event=festival-gunu&page=1` (genel tabloyla aynı yanıt ve bir `event` alanı; bilinmeyen slug 404).
- Oyunun tamamlandığı an `users.completed_at`'e yazılır (sütun açılışta eklenir). Bu sütundan önce tamamlanmış oyunlar hiçbir etkinliğe sayılmaz.

## Saklama ve imha

ADR-0062'nin Guessr satırları günlük bir işle uygulanır (`retention/`). Guessr sürekli çalıştığı için süreler kayar: bir oyun satırının zamanı son tahminidir, tahmini yoksa başlatıldığı an (`users.created_at`); kişinin zamanı aynı adresle oynadığı en yeni oyundur. `EVENT_ENDED_AT` verilirse süre ondan da sayılır, geç olan geçerlidir. Son 90 günde oynamış kişiye hiç dokunulmaz.

| Kural | Ne | Süre | Ne olur |
|---|---|---|---|
| `ip_address` | `users.ip_address` | oyunun zamanı + 90 gün | IP boşalır |
| `account_email` | `users.email` | adresin en yeni oyunu + 1 yıl | adresin bütün oyun satırlarına tek bir rastgele oyuncu anahtarı (`anonim:…`) yazılır; `leaderboard_name` adını göstermeyi seçen (`show_name`) oyuncuda lider tablosundaki adı, öbüründe `ANONIM` olur |

Skorlar, tahminler ve konumlar silinmez; lider tablosu anonimleşmiş satırda `leaderboard_name`'i gösterir. Guessr'da Turnstile, yasak ve sunucuda tutulan giriş belirteci yoktur (oturum imzalı bir çerezdir). `users.created_at` sütunu eklenirken var olan satırlara eklendiği an yazılır; böylece hiçbiri olduğundan eski sayılmaz.

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `RETENTION_SWEEP_MODE` | `dry-run` | `off` iş yok; `dry-run` her kural için `apply`'ın değiştireceği satırları sayar, hiçbir şeyi değiştirmez; `apply` değiştirir. Başka bir değerde uygulama açılmaz |
| `EVENT_ENDED_AT` | | İsteğe bağlı. `2025-05-18` (o günün sonu, Türkiye saati) ya da `2025-05-18T22:00:00+03:00`. Tarih olmayan değer loga yazılır; uygulama açılır, dry-run onsuz sayar, `apply` hiçbir şeyi değiştirmez (kural ve koşu durumu `config_error`, kod `event_ended_at_invalid`, günde bir kez) |
| `RETENTION_SWEEP_MAX_ROWS` | `50000` | Fren: bir kural bundan çok satır değiştirecekse o gün reddedilir (`refused_large`; dry-run'da `would_refuse_large`) |
| `RETENTION_SWEEP_BATCH_SIZE` | `500` | `apply`'da tek işlemde değiştirilen en çok satır (`account_email` adresi bütün alır; tek başına daha çok satırı olan adres kendi partisinde) |

- Her gunicorn işçisi saatte bir bakar; Postgres advisory lock'u alan işçi, aynı kipte ve aynı `EVENT_ENDED_AT` ile (verilmediyse boş) son 23 saatte `ok` ya da `partial` biten zamanlanmış koşu yoksa koşar (`retention_runs`'tan okunur; yeniden başlatma koşuyu tekrarlatmaz). Dry-run ile apply aynı `WHERE` cümlesinden üretilir; ikinci koşu bir şey değiştirmez. Her parti kendi işleminde, 30 saniyelik zaman aşımıyla çalışır.
- Her koşu kişisiz bir makbuz yazar: `retention_runs` ve `retention_run_rules` (kural, tablo, eşik, `matched`, `changed`, durum). Log satırları da yalnız sayı taşır:
  `retention_rule rule=ip_address version=1 mode=dry-run status=dry_run table=users action=empty cutoff=… matched=12000 changed=0 code=-`
- Elle (konteynerde): `python -m retention` (dry-run), `python -m retention --apply`, freni geçmek için `python -m retention --apply --allow-large`. Elle koşu `triggered_by=manual` diye kaydedilir, zamanlanmış günün yerine geçmez. Çıkış kodu: 0 tamam, 1 kural reddedildi ya da hata, 2 ayar hatası, 3 kilit dolu.
- Bir yedek geri yüklenirse `python -m retention --apply` bir kez koşturulur.
- Şema: tablolar açılışta, advisory lock altında tek işçi tarafından oluşturulur (`core/schema.py`); `users.leaderboard_name` ve `users.created_at` sütunları var olan tabloya eklenir (önce varlığına bakılır; `ALTER TABLE` 5 saniyelik kilit zaman aşımıyla).

### Testler

```sh
pip install -r requirements-dev.txt
POSTGRES_HOST=localhost POSTGRES_PORT=5432 POSTGRES_USER=guessr POSTGRES_PASSWORD=test POSTGRES_DB=game_db python -m pytest
```

Testler gerçek bir Postgres ister (CI'da servis konteyneri); tabloları her testte boşaltır, production veritabanına bağlanmayın.

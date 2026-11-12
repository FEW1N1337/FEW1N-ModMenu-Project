# FEW1N kaynak taraması ve değişiklikler

## Uygulananlar
- ODA akordeon bölümü (indeks 6) ilk açılışta açık: VoteKick butonu artık gizli bölümün arkasında kalmaz.
- Normal VoteKick ve VoteKick tanılama eylemlerinin menü bağlantıları statik test ile doğrulanır.
- `template/control` minimum firmware 15.0 olarak rootless hedefle hizalandı.
- Linux preflight testi eklendi; macOS dakikası harcamadan önce menü bağlantılarını denetler.
- SDK dizini boşsa derleme erken ve açık hata verir.

## Kaynak incelemesi / riskler
- ODA bölümü 7. bölüm; önceki kod tüm bölümleri ilk açılışta kapatıyordu.
- `VoteKick` çözümlemesi `mkw` adlı obfuscated metoda bağlı: sürüm değişince kırılabilir.
- Normal VoteKick oyuncu dizisini IL2CPP bellek ofsetleriyle okuyor: sürüm ve nesne düzeni değişiklikleri crash riski yaratır.
- Anti-VoteKick hook kurulumları yorum satırında: aktif koruma olduğu iddia edilmemeli.
- `Tweak.xm` içinde diğer ağ/oda etkileşimleri ve agresif işlemler bulunuyor; bunlar bu pakette değiştirilmedi.
- SDK deposu, Homebrew ve Theos clone işlemleri canlı runner üzerinde doğrulanmadı.
- `.dylib` doğrudan sideload edilebilir IPA değildir.

## Yapılmayanlar
- macOS/iOS derlemesi ve gerçek cihaz testi (bu ortamda macOS SDK yok).
- Oyun sunucusu davranışını aşan Force VoteKick / Anti-VoteKick etkinleştirmesi.
- Kaynak kodun bütün çalışma zamanı davranışlarının doğrulanması.

## Test
`python3 scripts/check_menu.py`

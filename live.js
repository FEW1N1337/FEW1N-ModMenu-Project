// ============================================================================
// FEW1N LIVE OTA SCRIPT (live.js) v2.2
// Kisi Secmeli Klonlama + Kendi Ekraninda Anlik Degisim + Garaja Kalici Kayit!
// ============================================================================

FEW1N.setMeta("2.2", "Kişi Seçmeli Modifiye/Plaka Çal + Sende Anlık Görünür + Garaja Kaydeder!");

function getMyTM() {
    var tms = FEW1N.findObjects("", "TuningManager");
    for (var i = 0; i < tms.length; i++) {
        if (FEW1N.isMine(tms[i])) return tms[i];
    }
    return "";
}

function getOtherTMs() {
    var tms = FEW1N.findObjects("", "TuningManager");
    var out = [];
    for (var i = 0; i < tms.length; i++) {
        if (!FEW1N.isMine(tms[i])) out.push(tms[i]);
    }
    return out;
}

function getPlayerNameByActor(act) {
    var plys = FEW1N.players();
    for (var i = 0; i < plys.length; i++) {
        if (plys[i].actor === act) return plys[i].name;
    }
    return "Actor#" + act;
}

function findOtherTMByActor(actorNr) {
    var others = getOtherTMs();
    for (var i = 0; i < others.length; i++) {
        if (FEW1N.getOwnerActor(others[i]) === actorNr) return others[i];
    }
    return "";
}

// Hem KENDI EKRANINDA anlik uygular, hem GARAJA KAYDEDER, hem ODADAKI HERKESE yayinlar!
function applyAndSaveToMyCar(label, jsonStr) {
    var myTM = getMyTM();
    if (!myTM) {
        FEW1N.alert("⚠️ " + label, "Kendi aracın bulunamadı (odada araca bin).");
        return false;
    }
    var bytes = FEW1N.invoke("", "", "vn", "gst", [jsonStr]);
    if (!bytes) {
        FEW1N.alert("⚠️ " + label, "vn.gst(string) encode başarısız!");
        return false;
    }
    // 1) Kendi ekranında anında uygula (eaf + direkt LoadTuners)
    FEW1N.invoke(myTM, "", "TuningManager", "eaf", [jsonStr]);
    FEW1N.invoke(myTM, "", "TuningManager", "LoadTuners", [bytes]);
    // 2) Garaja kalıcı kaydet (ead + eae)
    FEW1N.invoke(myTM, "", "TuningManager", "ead", []);
    FEW1N.invoke(myTM, "", "TuningManager", "eae", []);
    // 3) Odadaki herkese + sonradan girenlere yayınla (AllBuffered = 3)
    var ok = FEW1N.sendRPC(myTM, "LoadTuners", 3, [bytes]);
    FEW1N.log("🔥 " + label + " -> Lokal+Garaj+AllBuffered=" + ok);
    return ok;
}

function stealFromActor(actorNr, nick, plateOnly) {
    var tgt = findOtherTMByActor(actorNr);
    if (!tgt) {
        FEW1N.alert("⚠️ Araç Yok", nick + " (#" + actorNr + ") odadan çıkmış veya aracı yüklenmemiş.");
        return;
    }
    var td = FEW1N.invoke(tgt, "", "TuningManager", "eaj", []);
    var gkb = td ? FEW1N.invoke(td, "", "TuningData", "gkb", []) : "";
    if (!gkb || gkb.length < 10) {
        FEW1N.alert("⚠️ Boş Tuning", nick + " oyuncusunun tuning verisi okunamadı.");
        return;
    }
    var payload = gkb;
    if (plateOnly) {
        var plateEntry = null;
        try {
            var obj = JSON.parse(gkb);
            for (var i = 0; i < obj.tuners.length; i++) {
                if (obj.tuners[i].key === "MPlate") { plateEntry = obj.tuners[i]; break; }
            }
        } catch (e) {}
        if (!plateEntry) {
            FEW1N.alert("⚠️ Plaka Yok", nick + " oyuncusunda MPlate verisi bulunamadı.");
            return;
        }
        payload = JSON.stringify({ tuners: [plateEntry] });
    }
    if (applyAndSaveToMyCar(plateOnly ? "Plaka Çal" : "Tam Modifiye Çal", payload)) {
        FEW1N.alert(
            plateOnly ? "🪪 Plaka Çalındı & Kaydedildi!" : "🎭 Araç Klonlandı & Kaydedildi!",
            nick + " (#" + actorNr + ") oyuncusunun " + (plateOnly ? "plakası" : "tüm boya + jant + kamber + plakası") +
            " SENİN aracına anında uygulandı, GARAJA KAYDEDİLDİ ve odadaki herkeste görünüyor!"
        );
    }
}

function rebuildMenuWithPlayers() {
    FEW1N.clearActions();

    // 0) Odadaki güncel oyuncuları tara ve menüyü yenile
    FEW1N.registerAction("refresh_players", "🔄 Odadaki Oyuncuları Yenile (Seçim Listesi)", function () {
        var cnt = rebuildMenuWithPlayers();
        FEW1N.alert("👥 Oyuncu Listesi Yenilendi", cnt + " oyuncu listeye eklendi!\nTekrar '⚡ Canlı Aksiyonları Aç' diyerek istediğin kişiyi seç.");
    });

    // Her oyuncu için ayrı "Tam Klonla" ve "Sadece Plaka Çal" butonu ekle!
    var others = getOtherTMs();
    for (var i = 0; i < others.length; i++) {
        (function (tmObj) {
            var act = FEW1N.getOwnerActor(tmObj);
            var nick = getPlayerNameByActor(act);
            FEW1N.registerAction("steal_full_" + act, "🎭 Tam Çal + Kaydet: " + nick + " (#" + act + ")", function () {
                stealFromActor(act, nick, false);
            });
            FEW1N.registerAction("steal_plate_" + act, "🪪 Plaka Çal + Kaydet: " + nick + " (#" + act + ")", function () {
                stealFromActor(act, nick, true);
            });
        })(others[i]);
    }

    // Sabit kendi aracım paketleri (hepsi anlık + garaja kayıtlı + herkeste görünür)
    FEW1N.registerAction("my_mplate", "🔥 DEV Kırmızı FEW1N Plaka (+ Garaj)", function () {
        var pl = JSON.stringify({ c: "eu1", t: "<size=350><color=#FF0033><b>FEW1N</b></color></size>" });
        if (applyAndSaveToMyCar("DEV FEW1N Plaka", JSON.stringify({ tuners: [{ key: "MPlate", value: pl }] }))) {
            FEW1N.alert("🔥 Plaka Basıldı", "DEV Kırmızı FEW1N plakası sende + herkeste aktif ve garaja kaydedildi!");
        }
    });

    FEW1N.registerAction("my_full", "👑 FULL FEW1N Paketi (Plaka + Neon + Altın Jant)", function () {
        var pl = JSON.stringify({ c: "eu1", t: "<size=350><color=#FF0033><b>FEW1N</b></color></size>" });
        var mp = JSON.stringify({ r: 255, g: 0, b: 45, r2: 0, g2: 255, b2: 255, t: 1 });
        var dp = JSON.stringify({ r: 255, g: 215, b: 0, r2: 255, g2: 140, b2: 0, t: 1 });
        var payload = JSON.stringify({
            tuners: [
                { key: "MPlate", value: pl },
                { key: "MPaint", value: mp },
                { key: "SPaint", value: mp },
                { key: "DiskPaint", value: dp }
            ]
        });
        if (applyAndSaveToMyCar("FULL FEW1N Paketi", payload)) {
            FEW1N.alert("👑 FULL Paket Aktif", "Sende + herkeste aktif ve garaja kaydedildi!");
        }
    });

    FEW1N.registerAction("my_nowheels", "💀 Tekerleklerimi Sök (+ Garaj)", function () {
        var payload = JSON.stringify({ tuners: [{ key: "WheelT", value: JSON.stringify({ i: -1 }) }] });
        if (applyAndSaveToMyCar("Tekerlek Sök", payload)) {
            FEW1N.alert("💀 Tekerlekler Söküldü", "Sende + herkeste aktif ve garaja kaydedildi!");
        }
    });

    FEW1N.registerAction("weather_storm", "⛈️ Canlı Fırtına + Gece", function () {
        FEW1N.claimMaster();
        FEW1N.setRoomProp("WeatherRain", 1.0, true);
        FEW1N.setRoomProp("WeatherLighting", 1.0, true);
        var wm = FEW1N.invoke("", "Weather", "WeatherManager", "eyo", []);
        if (wm) {
            FEW1N.invoke(wm, "Weather", "WeatherManager", "eyt", [1.0]);
            FEW1N.invoke(wm, "Weather", "WeatherManager", "eyw", [1.0]);
            FEW1N.invoke(wm, "Weather", "WeatherManager", "eyy", []);
        }
        FEW1N.alert("⛈️ Hava Güncellendi", "Fırtına + Gece uygulandı!");
    });

    return others.length;
}

// Script indirilince mevcut odadaki oyuncuları otomatik listele
rebuildMenuWithPlayers();

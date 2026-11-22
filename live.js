// ============================================================================
// FEW1N LIVE OTA SCRIPT (live.js) v3.0 — OTA PRO ENGINE
// Direkt Ana Menüye Buton/Toggle + Kişi Seçici + Özel Yazı + Gökkuşağı Boya!
// ============================================================================

FEW1N.setMeta("3.0", "OTA Pro: Direkt Ana Menü + Kişi Seçici + Özel Plaka + Canlı Gökkuşağı Boya!");
FEW1N.clearActions();

var g_rainbowPaintOn = false;
var g_rainbowStep = 0;
var g_rainbowTick = 0;

function getMyTM() {
    var tms = FEW1N.findObjects("", "TuningManager");
    for (var i = 0; i < tms.length; i++) {
        if (FEW1N.isMine(tms[i])) return tms[i];
    }
    return "";
}

function findOtherTMByActor(actorNr) {
    var tms = FEW1N.findObjects("", "TuningManager");
    for (var i = 0; i < tms.length; i++) {
        if (FEW1N.isMine(tms[i])) continue;
        if (actorNr <= 0 || FEW1N.getOwnerActor(tms[i]) === actorNr) return tms[i];
    }
    return "";
}

// Hem KENDI EKRANINDA anlik uygular, hem GARAJA KAYDEDER, hem ODADAKI HERKESE yayinlar!
function applyAndSaveToMyCar(label, jsonStr, saveToGarage) {
    var myTM = getMyTM();
    if (!myTM) {
        if (label) FEW1N.alert("⚠️ " + label, "Kendi aracın bulunamadı (odada araca bin).");
        return false;
    }
    var bytes = FEW1N.invoke("", "", "vn", "gst", [jsonStr]);
    if (!bytes) {
        if (label) FEW1N.alert("⚠️ " + label, "vn.gst(string) encode başarısız!");
        return false;
    }
    FEW1N.invoke(myTM, "", "TuningManager", "eaf", [jsonStr]);
    FEW1N.invoke(myTM, "", "TuningManager", "LoadTuners", [bytes]);
    if (saveToGarage) {
        FEW1N.invoke(myTM, "", "TuningManager", "ead", []);
        FEW1N.invoke(myTM, "", "TuningManager", "eae", []);
    }
    var ok = FEW1N.sendRPC(myTM, "LoadTuners", 3, [bytes]);
    return ok;
}

function stealFromActor(actorNr, nick, plateOnly) {
    var tgt = findOtherTMByActor(actorNr);
    if (!tgt) {
        FEW1N.alert("⚠️ Araç Yok", nick + " odadan çıkmış veya aracı yüklenmemiş.");
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
    if (applyAndSaveToMyCar(plateOnly ? "Plaka Çal" : "Modifiye Çal", payload, true)) {
        FEW1N.alert(
            plateOnly ? "🪪 Plaka Çalındı & Kaydedildi!" : "🎭 Klonlandı & Garaja Kaydedildi!",
            nick + " oyuncusunun " + (plateOnly ? "plakası" : "tüm modifiyesi + plakası") +
            " sende + herkeste aktif ve GARAJA KAYDEDİLDİ!"
        );
    }
}

// Helper: Hem ana menuye (v119+) hem yedek action sheet'e (v118) ekle
function addBtn(id, title, color, fn) {
    if (FEW1N.addMenuButton) FEW1N.addMenuButton(id, title, color, fn);
    FEW1N.registerAction(id, title, fn);
}

// 1) 🎭 Kişi Seç → Tam Modifiye & Plaka Çal (+ Garaj)
addBtn("steal_full", "🎭 Başkasının Modifiyesini & Plakasını Çal (+ Garaj)", "gold", function () {
    if (FEW1N.pickPlayer) {
        FEW1N.pickPlayer("🎭 Kimin Modifiyesini Çalacaksın?", function (act, nm) {
            stealFromActor(act, nm, false);
        });
    } else {
        stealFromActor(-1, "Oyuncu", false);
    }
});

// 2) 🪪 Kişi Seç → Sadece Plakasını Çal (+ Garaj)
addBtn("steal_plate", "🪪 Sadece Başkasının Plakasını Çal (+ Garaj)", "cyan", function () {
    if (FEW1N.pickPlayer) {
        FEW1N.pickPlayer("🪪 Kimin Plakasını Çalacaksın?", function (act, nm) {
            stealFromActor(act, nm, true);
        });
    } else {
        stealFromActor(-1, "Oyuncu", true);
    }
});

// 3) ✏️ Özel Dev/Renkli 3D Plaka Yaz (+ Garaj + Herkeste)
addBtn("custom_mplate", "✏️ Özel Dev/Renkli Plaka Yaz (Herkeste + Garaj)", "green", function () {
    if (FEW1N.prompt) {
        var defP = FEW1N.getPref ? FEW1N.getPref("last_plate", "<size=350><color=#FF0033><b>FEW1N</b></color></size>") : "FEW1N";
        FEW1N.prompt("🔥 Özel 3D Plaka (MPlate)", "RichText destekler (<size>, <color>, <b>):", "FEW1N", defP, function (txt) {
            if (!txt || txt.length === 0) return;
            if (FEW1N.setPref) FEW1N.setPref("last_plate", txt);
            var pl = JSON.stringify({ c: "eu1", t: txt });
            if (applyAndSaveToMyCar("Özel Plaka", JSON.stringify({ tuners: [{ key: "MPlate", value: pl }] }), true)) {
                FEW1N.alert("🔥 Plaka Basıldı!", "Sende + herkeste aktif ve garaja kaydedildi!");
            }
        });
    } else {
        var pl = JSON.stringify({ c: "eu1", t: "<size=350><color=#FF0033><b>FEW1N</b></color></size>" });
        applyAndSaveToMyCar("DEV Plaka", JSON.stringify({ tuners: [{ key: "MPlate", value: pl }] }), true);
    }
});

// 4) 👑 FULL FEW1N Paketi (+ Garaj)
addBtn("full_few1n", "👑 FULL FEW1N Paketi (Plaka + Neon + Altın Jant)", "gold", function () {
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
    if (applyAndSaveToMyCar("FULL FEW1N Paketi", payload, true)) {
        FEW1N.alert("👑 FULL Paket Aktif", "Sende + herkeste aktif ve garaja kaydedildi!");
    }
});

// 5) 💀 Tekerleklerimi Sök (+ Garaj)
addBtn("strip_wheels", "💀 Tekerleklerimi Sök (Herkeste + Garaj)", "red", function () {
    var payload = JSON.stringify({ tuners: [{ key: "WheelT", value: JSON.stringify({ i: -1 }) }] });
    if (applyAndSaveToMyCar("Tekerlek Sök", payload, true)) {
        FEW1N.alert("💀 Tekerlekler Söküldü", "Sende + herkeste aktif ve garaja kaydedildi!");
    }
});

// 6) 🌈 CANLI GÖKKUŞAĞI BOYA TOGGLE (Herkeste Görünür — v119 OTA Toggle + onTick!)
if (FEW1N.addMenuToggle && FEW1N.onTick) {
    FEW1N.addMenuToggle("rainbow_paint", "🌈 Gökkuşağı Boya (Herkeste Canlı)", "Aracının rengini herkeste akıcı değiştirir (OTA)", false, function (isOn) {
        g_rainbowPaintOn = !!isOn;
        FEW1N.log("🌈 Canlı Gökkuşağı Boya: " + (g_rainbowPaintOn ? "ACIK" : "KAPALI"));
    });
    var palette = [
        [255, 0, 40], [255, 140, 0], [255, 230, 0],
        [0, 255, 80], [0, 220, 255], [90, 60, 255], [255, 0, 220]
    ];
    FEW1N.onTick(function () {
        if (!g_rainbowPaintOn) return;
        g_rainbowTick++;
        if (g_rainbowTick % 5 !== 0) return; // ~her 1.5sn
        var c1 = palette[g_rainbowStep % palette.length];
        var c2 = palette[(g_rainbowStep + 2) % palette.length];
        g_rainbowStep++;
        var mp = JSON.stringify({ r: c1[0], g: c1[1], b: c1[2], r2: c2[0], g2: c2[1], b2: c2[2], t: 1 });
        applyAndSaveToMyCar("", JSON.stringify({ tuners: [{ key: "MPaint", value: mp }] }), false);
    });
}

// 7) ⛈️ Canlı Fırtına + Gece
addBtn("weather_storm", "⛈️ Canlı Fırtına + Gece", "cyan", function () {
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

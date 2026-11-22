// ============================================================================
// FEW1N LIVE OTA SCRIPT (live.js) v2.0
// %100 Calisan & Herkeste Gorunen Canli Aksiyonlar (MPlate + MPaint + Steal)
// ============================================================================

FEW1N.setMeta("2.0", "Başkasının Modifiyesini & Plakasını Çal + Kendi Aracına Herkeste Görünür Paketler");
FEW1N.clearActions();

var g_stealIdx = 0;

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

function applyJsonToMyCar(label, jsonStr) {
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
    // RpcTarget.AllBuffered = 3 -> hem sende hem odadaki herkeste + yeni girenlerde görünür!
    var ok = FEW1N.sendRPC(myTM, "LoadTuners", 3, [bytes]);
    FEW1N.log("🔥 " + label + " -> AllBuffered=" + ok);
    return ok;
}

// 1) 🎭 Başkasının TÜM Modifiyesini & Plakasını Çal (Her basışta sıradaki oyuncudan çalar!)
FEW1N.registerAction("steal_full", "🎭 Başkasının Modifiyesini & Plakasını Çal (Herkeste)", function () {
    var others = getOtherTMs();
    if (others.length === 0) {
        FEW1N.alert("⚠️ Araç Yok", "Odada başka oyuncu aracı bulunamadı.");
        return;
    }
    var idx = g_stealIdx % others.length;
    g_stealIdx++;
    var tgt = others[idx];
    var act = FEW1N.getOwnerActor(tgt);
    var nick = getPlayerNameByActor(act);
    var td = FEW1N.invoke(tgt, "", "TuningManager", "eaj", []);
    var gkb = td ? FEW1N.invoke(td, "", "TuningData", "gkb", []) : "";
    if (!gkb || gkb.length < 10) {
        FEW1N.alert("⚠️ Boş Tuning", nick + " oyuncusunun tuning verisi okunamadı.");
        return;
    }
    if (applyJsonToMyCar("Modifiye Çal", gkb)) {
        FEW1N.alert("🎭 Klonlandı (Herkeste!)", nick + " (" + (idx + 1) + "/" + others.length + ") oyuncusunun tüm boya + jant + kamber + plakası SENİN aracına basıldı!\n\n(Tekrar basarsan sıradaki oyuncudan çalar.)");
    }
});

// 2) 🪪 Sadece Başkasının Plakasını Çal (Kendi boyanı bozmadan!)
FEW1N.registerAction("steal_plate", "🪪 Sadece Başkasının Plakasını Çal (Herkeste)", function () {
    var others = getOtherTMs();
    if (others.length === 0) {
        FEW1N.alert("⚠️ Araç Yok", "Odada başka oyuncu aracı bulunamadı.");
        return;
    }
    var idx = g_stealIdx % others.length;
    g_stealIdx++;
    var tgt = others[idx];
    var act = FEW1N.getOwnerActor(tgt);
    var nick = getPlayerNameByActor(act);
    var td = FEW1N.invoke(tgt, "", "TuningManager", "eaj", []);
    var gkb = td ? FEW1N.invoke(td, "", "TuningData", "gkb", []) : "";
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
    var payload = JSON.stringify({ tuners: [plateEntry] });
    if (applyJsonToMyCar("Plaka Çal", payload)) {
        FEW1N.alert("🪪 Plaka Çalındı!", nick + " oyuncusunun plakası senin aracına (herkeste görünür) basıldı!");
    }
});

// 3) 🔥 Kendi Aracıma DEV Kırmızı FEW1N Plaka (Herkeste)
FEW1N.registerAction("my_mplate", "🔥 DEV Kırmızı FEW1N Plaka (Herkeste)", function () {
    var pl = JSON.stringify({ c: "eu1", t: "<size=350><color=#FF0033><b>FEW1N</b></color></size>" });
    if (applyJsonToMyCar("DEV FEW1N Plaka", JSON.stringify({ tuners: [{ key: "MPlate", value: pl }] }))) {
        FEW1N.alert("🔥 Plaka Basıldı", "DEV Kırmızı FEW1N plakası (AllBuffered) herkeste aktif!");
    }
});

// 4) 👑 Kendi Aracıma FULL FEW1N Paketi (DEV Plaka + Neon Boya + Altın Jant)
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
    if (applyJsonToMyCar("FULL FEW1N Paketi", payload)) {
        FEW1N.alert("👑 FULL Paket Aktif", "DEV Plaka + Neon Boya + Altın Jant herkeste yayınlandı!");
    }
});

// 5) 💀 Kendi Aracımın Tekerleklerini Sök (Herkeste)
FEW1N.registerAction("my_nowheels", "💀 Tekerleklerimi Sök (Herkeste)", function () {
    var payload = JSON.stringify({ tuners: [{ key: "WheelT", value: JSON.stringify({ i: -1 }) }] });
    if (applyJsonToMyCar("Tekerlek Sök", payload)) {
        FEW1N.alert("💀 Tekerlekler Söküldü", "Aracın tekerleksiz olarak herkeste görünüyor!");
    }
});

// 6) ⛈️ Canlı Fırtına + Gece (Lokal + Oda)
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

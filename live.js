// ============================================================================
// FEW1N LIVE OTA SCRIPT (live.js) v3.1 — OTA PRO MEGA PACK
// Temiz Kişi Seçici + Kendi Ekranında Anlık Değişim (ead() bug fix!) + 13 Canlı Mod
// ============================================================================

FEW1N.setMeta("3.1", "Temiz Kişi Seçici + Sende Anlık Değişim Fix + 13 Canlı Mod (Krom/Cam/UFO/RGB Plaka/Boya)");
FEW1N.clearActions();

var g_rainbowPaintOn = false;
var g_rainbowPlateOn = false;
var g_tickCount = 0;
var g_colorIdx = 0;

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

// FIX: ead() yerel araci sifirliyordu -> KALDIRILDI!
// Sirasiyla: AllBuffered RPC (herkes + sen) -> direkt LoadTuners (sende garanti) -> eae() (garaja kayit)
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
    // 1) Odadaki herkese + sana RPC ile uygula (RpcTarget.AllBuffered = 3)
    var ok = FEW1N.sendRPC(myTM, "LoadTuners", 3, [bytes]);
    // 2) Kendi ekranında anında görünmesi için direkt LoadTuners çağır (ead() YOK!)
    FEW1N.invoke(myTM, "", "TuningManager", "LoadTuners", [bytes]);
    // 3) Garaja kalıcı kaydet (sadece eae())
    if (saveToGarage) {
        FEW1N.invoke(myTM, "", "TuningManager", "eae", []);
    }
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
            plateOnly ? "🪪 Plaka Çalındı!" : "🎭 Modifiye Klonlandı!",
            nick + " oyuncusunun " + (plateOnly ? "plakası" : "tüm modifiyesi + plakası") +
            " SENDE + HERKESTE uygulandı ve garaja kaydedildi!"
        );
    }
}

function addBtn(id, title, color, fn) {
    if (FEW1N.addMenuButton) FEW1N.addMenuButton(id, title, color, fn);
    FEW1N.registerAction(id, title, fn);
}

// === KLONLAMA (SADE & TEMİZ KİŞİ SEÇİCİ) ===
addBtn("steal_full", "🎭 Başkasının Modifiyesini Çal (Kişi Seç)", "gold", function () {
    if (FEW1N.pickPlayer) {
        FEW1N.pickPlayer("🎭 Kimin Modifiyesini Çalacaksın?", function (act, nm) {
            stealFromActor(act, nm, false);
        });
    } else {
        stealFromActor(-1, "Oyuncu", false);
    }
});

addBtn("steal_plate", "🪪 Başkasının Plakasını Çal (Kişi Seç)", "cyan", function () {
    if (FEW1N.pickPlayer) {
        FEW1N.pickPlayer("🪪 Kimin Plakasını Çalacaksın?", function (act, nm) {
            stealFromActor(act, nm, true);
        });
    } else {
        stealFromActor(-1, "Oyuncu", true);
    }
});

// === ÖZEL PLAKA & BOYA ===
addBtn("custom_mplate", "✏️ Özel 3D Plaka Yaz (Herkeste + Garaj)", "green", function () {
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

addBtn("custom_rgb", "🎨 Özel RGB Boya Yaz (R,G,B — Herkeste)", "cyan", function () {
    if (!FEW1N.prompt) return;
    FEW1N.prompt("🎨 Özel RGB Boya", "0-255 arası R,G,B yaz (örn: 255,0,128):", "255,0,128", "255,0,128", function (txt) {
        var parts = (txt || "").split(",");
        if (parts.length < 3) { FEW1N.alert("⚠️", "Format: R,G,B (örn: 255,0,128)"); return; }
        var r = parseInt(parts[0], 10) || 0, g = parseInt(parts[1], 10) || 0, b = parseInt(parts[2], 10) || 0;
        var mp = JSON.stringify({ r: r, g: g, b: b, r2: r, g2: g, b2: b, t: 1 });
        if (applyAndSaveToMyCar("RGB Boya", JSON.stringify({ tuners: [{ key: "MPaint", value: mp }, { key: "SPaint", value: mp }] }), true)) {
            FEW1N.alert("🎨 Boyandı!", "RGB(" + r + "," + g + "," + b + ") sende + herkeste aktif!");
        }
    });
});

// === HAZIR MODİFİYE PAKETLERİ (HERKESTE + GARAJ) ===
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
    if (applyAndSaveToMyCar("FULL FEW1N", payload, true)) {
        FEW1N.alert("👑 FULL Paket Aktif!", "Sende + herkeste aktif ve garaja kaydedildi!");
    }
});

addBtn("full_chrome", "✨ Full Krom Kaplama (Herkeste + Garaj)", "white", function () {
    var payload = JSON.stringify({ tuners: [{ key: "MChrome", value: JSON.stringify({ v: 1.0 }) }] });
    if (applyAndSaveToMyCar("Full Krom", payload, true)) {
        FEW1N.alert("✨ Krom Aktif!", "Aracın kromlandı!");
    }
});

addBtn("dark_glass", "🪟 Zifiri Siyah Cam (Herkeste + Garaj)", "white", function () {
    var payload = JSON.stringify({ tuners: [{ key: "MainGlass", value: JSON.stringify({ r: 0, g: 0, b: 0, a: 255 }) }] });
    if (applyAndSaveToMyCar("Siyah Cam", payload, true)) {
        FEW1N.alert("🪟 Zifiri Cam!", "Camlar siyaha boyandı!");
    }
});

addBtn("ufo_camber", "🛸 UFO 90° Kamber (Herkeste + Garaj)", "gold", function () {
    var wb = JSON.stringify({ fc: -90, rc: -90, fd: 0, rd: 0, fo: 0.25, ro: 0.25, fs: 1.2, rs: 1.2, fr: 1.4, rr: 1.4 });
    if (applyAndSaveToMyCar("UFO Kamber", JSON.stringify({ tuners: [{ key: "WBase", value: wb }] }), true)) {
        FEW1N.alert("🛸 UFO Kamber!", "Tekerlekler 90° yatırıldı!");
    }
});

addBtn("strip_wheels", "💀 Tekerleklerimi Sök (Herkeste + Garaj)", "red", function () {
    var payload = JSON.stringify({ tuners: [{ key: "WheelT", value: JSON.stringify({ i: -1 }) }] });
    if (applyAndSaveToMyCar("Tekerlek Sök", payload, true)) {
        FEW1N.alert("💀 Tekerlekler Söküldü!", "Aracın tekerleksiz görünüyor!");
    }
});

// === CANLI OTA TOGGLE'LAR (ON-TICK) ===
if (FEW1N.addMenuToggle && FEW1N.onTick) {
    FEW1N.addMenuToggle("rainbow_paint", "🌈 Gökkuşağı Boya (Herkeste Canlı)", "Aracının rengini herkeste sürekli değiştirir", false, function (isOn) {
        g_rainbowPaintOn = !!isOn;
    });
    FEW1N.addMenuToggle("rainbow_plate", "⚡ Gökkuşağı 3D Plaka (Herkeste Canlı)", "Plaka rengini herkeste canlı değiştirir", false, function (isOn) {
        g_rainbowPlateOn = !!isOn;
    });
    var palette = [
        [255, 0, 40, "#FF0028"], [255, 140, 0, "#FF8C00"], [255, 230, 0, "#FFE600"],
        [0, 255, 80, "#00FF50"], [0, 220, 255, "#00DCFF"], [90, 60, 255, "#5A3CFF"], [255, 0, 220, "#FF00DC"]
    ];
    FEW1N.onTick(function () {
        if (!g_rainbowPaintOn && !g_rainbowPlateOn) return;
        g_tickCount++;
        if (g_tickCount % 5 !== 0) return; // ~1.5sn
        var c1 = palette[g_colorIdx % palette.length];
        var c2 = palette[(g_colorIdx + 2) % palette.length];
        g_colorIdx++;
        var arr = [];
        if (g_rainbowPaintOn) {
            arr.push({ key: "MPaint", value: JSON.stringify({ r: c1[0], g: c1[1], b: c1[2], r2: c2[0], g2: c2[1], b2: c2[2], t: 1 }) });
        }
        if (g_rainbowPlateOn) {
            var pTxt = FEW1N.getPref ? FEW1N.getPref("last_plate_plain", "FEW1N") : "FEW1N";
            arr.push({ key: "MPlate", value: JSON.stringify({ c: "eu1", t: "<size=320><color=" + c1[3] + "><b>" + pTxt + "</b></color></size>" }) });
        }
        if (arr.length > 0) applyAndSaveToMyCar("", JSON.stringify({ tuners: arr }), false);
    });
}

// === HAVA DURUMU ===
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
    FEW1N.alert("⛈️ Hava Güncellendi", "Fırtına + Gece aktif!");
});

addBtn("weather_sunny", "☀️ Canlı Güneşli + Gündüz", "gold", function () {
    FEW1N.claimMaster();
    FEW1N.setRoomProp("WeatherRain", 0.0, true);
    FEW1N.setRoomProp("WeatherLighting", 0.0, true);
    var wm = FEW1N.invoke("", "Weather", "WeatherManager", "eyo", []);
    if (wm) {
        FEW1N.invoke(wm, "Weather", "WeatherManager", "eyt", [0.0]);
        FEW1N.invoke(wm, "Weather", "WeatherManager", "eyw", [0.0]);
        FEW1N.invoke(wm, "Weather", "WeatherManager", "eyy", []);
    }
    FEW1N.alert("☀️ Hava Güncellendi", "Güneşli + Gündüz aktif!");
});

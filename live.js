// ============================================================================
// FEW1N LIVE OTA SCRIPT (live.js) v4.1 — TEMİZ OTA PACK
// 12 Sade & %100 Çalışan Canlı Mod (Klonlama, Plaka, Boya, Krom, Cam, Toggle, Rapor)
// ============================================================================

FEW1N.setMeta("4.1", "Temiz OTA Pack: Klonlama, Özel Plaka/Boya, Krom, Cam, Gökkuşağı & Polis Boya");
FEW1N.clearActions();

var g_rainbowPaintOn = false;
var g_rainbowPlateOn = false;
var g_policePaintOn  = false;
var g_tickCount = 0;
var g_colorIdx  = 0;

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

function findOtherTMByActor(actorNr) {
    var others = getOtherTMs();
    for (var i = 0; i < others.length; i++) {
        if (actorNr <= 0 || FEW1N.getOwnerActor(others[i]) === actorNr) return others[i];
    }
    return "";
}

// Sende + Herkeste + Opsiyonel Garaj Kayit
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
    var ok = FEW1N.sendRPC(myTM, "LoadTuners", 3, [bytes]);
    FEW1N.invoke(myTM, "", "TuningManager", "LoadTuners", [bytes]);
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
            FEW1N.alert("⚠️ Plaka Yok", nick + " oyuncusunda MPlate bulunamadı.");
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

// 1-2) KLONLAMA (KİŞİ SEÇİCİLİ + GARAJ KAYITLI)
addBtn("steal_full", "🎭 Başkasının Modifiyesini Çal (Kişi Seç)", "gold", function () {
    FEW1N.pickPlayer("🎭 Kimin Modifiyesini Çalacaksın?", function (act, nm) {
        stealFromActor(act, nm, false);
    });
});

addBtn("steal_plate", "🪪 Başkasının Plakasını Çal (Kişi Seç)", "cyan", function () {
    FEW1N.pickPlayer("🪪 Kimin Plakasını Çalacaksın?", function (act, nm) {
        stealFromActor(act, nm, true);
    });
});

// 3-8) ÖZEL PLAKA, BOYA, KROM & CAM (HERKESTE + GARAJ)
addBtn("custom_mplate", "✏️ Özel 3D Plaka Yaz (Herkeste + Garaj)", "green", function () {
    var defP = FEW1N.getPref ? FEW1N.getPref("last_plate", "<size=350><color=#FF0033><b>FEW1N</b></color></size>") : "FEW1N";
    FEW1N.prompt("🔥 Özel 3D Plaka (MPlate)", "RichText destekler (<size>, <color>, <b>):", "FEW1N", defP, function (txt) {
        if (!txt || txt.length === 0) return;
        if (FEW1N.setPref) FEW1N.setPref("last_plate", txt);
        var pl = JSON.stringify({ c: "eu1", t: txt });
        if (applyAndSaveToMyCar("Özel Plaka", JSON.stringify({ tuners: [{ key: "MPlate", value: pl }] }), true)) {
            FEW1N.alert("🔥 Plaka Basıldı!", "Sende + herkeste aktif ve garaja kaydedildi!");
        }
    });
});

addBtn("secret_plate", "🇯🇵 Gizli Ülke Plakası (cn2 / rusj2 / us1)", "gold", function () {
    FEW1N.prompt("🇯🇵 Ülke Kodu Seç", "Örnek: cn2 (Çin EV), rusj2 (Japon), us1 (ABD), eu1:", "cn2", "cn2", function (cc) {
        if (!cc) return;
        var pl = JSON.stringify({ c: cc, t: "<size=300><color=#FFD700><b>FEW1N</b></color></size>" });
        if (applyAndSaveToMyCar("Gizli Plaka", JSON.stringify({ tuners: [{ key: "MPlate", value: pl }] }), true)) {
            FEW1N.alert("🇯🇵 Gizli Plaka Aktif!", "Kod: " + cc + " herkeste ve garajda!");
        }
    });
});

addBtn("custom_rgb", "🎨 Özel RGB Boya Yaz (R,G,B — Herkeste)", "cyan", function () {
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
    if (applyAndSaveToMyCar("Full Krom", JSON.stringify({ tuners: [{ key: "MChrome", value: JSON.stringify({ v: 1.0 }) }] }), true)) {
        FEW1N.alert("✨ Krom Aktif!", "Aracın kromlandı!");
    }
});

addBtn("dark_glass", "🪟 Zifiri Siyah Cam (Herkeste + Garaj)", "white", function () {
    if (applyAndSaveToMyCar("Siyah Cam", JSON.stringify({ tuners: [{ key: "MainGlass", value: JSON.stringify({ r: 0, g: 0, b: 0, a: 255 }) }] }), true)) {
        FEW1N.alert("🪟 Zifiri Cam!", "Camlar siyaha boyandı!");
    }
});

// 9-11) CANLI OTA TOGGLE'LAR (HERKESTE GÖRÜNÜR)
if (FEW1N.addMenuToggle && FEW1N.onTick) {
    FEW1N.addMenuToggle("rainbow_paint", "🌈 Gökkuşağı Boya (Herkeste Canlı)", "Aracının boyasını herkeste sürekli değiştirir", false, function (isOn) {
        g_rainbowPaintOn = !!isOn;
        if (g_rainbowPaintOn) g_policePaintOn = false;
    });
    FEW1N.addMenuToggle("police_paint", "🚨 Polis Çakar Boya (Kırmızı/Mavi — Herkeste)", "Aracın gövdesini kırmızı/mavi çakar yapar", false, function (isOn) {
        g_policePaintOn = !!isOn;
        if (g_policePaintOn) g_rainbowPaintOn = false;
    });
    FEW1N.addMenuToggle("rainbow_plate", "⚡ Gökkuşağı 3D Plaka (Herkeste Canlı)", "Plaka rengini herkeste canlı değiştirir", false, function (isOn) {
        g_rainbowPlateOn = !!isOn;
    });
    var palette = [
        [255, 0, 40, "#FF0028"], [255, 140, 0, "#FF8C00"], [255, 230, 0, "#FFE600"],
        [0, 255, 80, "#00FF50"], [0, 220, 255, "#00DCFF"], [90, 60, 255, "#5A3CFF"], [255, 0, 220, "#FF00DC"]
    ];
    FEW1N.onTick(function () {
        if (!g_rainbowPaintOn && !g_rainbowPlateOn && !g_policePaintOn) return;
        g_tickCount++;
        var period = g_policePaintOn ? 3 : 5;
        if (g_tickCount % period !== 0) return;
        var c1 = palette[g_colorIdx % palette.length];
        var c2 = palette[(g_colorIdx + 2) % palette.length];
        g_colorIdx++;
        var arr = [];
        if (g_policePaintOn) {
            var red = (g_colorIdx % 2 === 0);
            var mp = red ? { r: 255, g: 0, b: 10, r2: 255, g2: 0, b2: 10, t: 1 } : { r: 0, g: 60, b: 255, r2: 0, g2: 60, b2: 255, t: 1 };
            arr.push({ key: "MPaint", value: JSON.stringify(mp) });
        } else if (g_rainbowPaintOn) {
            arr.push({ key: "MPaint", value: JSON.stringify({ r: c1[0], g: c1[1], b: c1[2], r2: c2[0], g2: c2[1], b2: c2[2], t: 1 }) });
        }
        if (g_rainbowPlateOn) {
            var pTxt = FEW1N.getPref ? FEW1N.getPref("last_plate_plain", "FEW1N") : "FEW1N";
            arr.push({ key: "MPlate", value: JSON.stringify({ c: "eu1", t: "<size=320><color=" + c1[3] + "><b>" + pTxt + "</b></color></size>" }) });
        }
        if (arr.length > 0) applyAndSaveToMyCar("", JSON.stringify({ tuners: arr }), false);
    });
}

// 12) ODA RAPORU
addBtn("room_report", "🔎 Oda & Oyuncu Raporu", "white", function () {
    var me = FEW1N.myActor();
    var plys = FEW1N.players();
    var tms = FEW1N.findObjects("", "TuningManager");
    var lines = ["Ben: Actor#" + me + " | Toplam Araç: " + tms.length];
    for (var i = 0; i < plys.length; i++) {
        lines.push("• " + plys[i].name + " (#" + plys[i].actor + ")");
    }
    FEW1N.alert("🔎 Oda Raporu (" + (plys.length + 1) + " kişi)", lines.join("\n"));
});

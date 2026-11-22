// ============================================================================
// FEW1N LIVE OTA SCRIPT (live.js) v1.3
// GERCEK KEY'LER DOGRULANDI: MPaint, SPaint, DiskPaint, MainGlass, WBase, WheelT, TireT, MChrome, MPlate
// ============================================================================

FEW1N.setMeta("1.3", "Gerçek MPlate + MPaint + WBase + WheelT + MChrome — Tüm Oda Senkron!");
FEW1N.clearActions();

function sendTuningToOthers(title, tunersArr, includeSelf) {
    var outer = JSON.stringify({ tuners: tunersArr });
    var bytes = FEW1N.invoke("", "", "vn", "gst", [outer]);
    if (!bytes) {
        FEW1N.alert("⚠️ Hata", "vn.gst(string) encode başarısız!");
        return;
    }
    var tms = FEW1N.findObjects("", "TuningManager");
    var hit = 0;
    for (var i = 0; i < tms.length; i++) {
        if (!includeSelf && FEW1N.isMine(tms[i])) continue;
        // RpcTarget.AllBuffered = 3 (sonradan girenler de görür)
        if (FEW1N.sendRPC(tms[i], "LoadTuners", 3, [bytes])) hit++;
    }
    FEW1N.log("🔥 " + title + " -> " + hit + " araç");
    FEW1N.alert("✅ " + title, hit + " araca (AllBuffered) basıldı!");
}

// 1) Herkese DEV Kırmızı FEW1N Plaka (GERÇEK KEY: MPlate!)
FEW1N.registerAction("mplate_few1n", "🔥 Herkese DEV FEW1N Plaka (MPlate)", function () {
    var pVal = JSON.stringify({ c: "eu1", t: "<size=350><color=#FF0033><b>FEW1N</b></color></size>" });
    sendTuningToOthers("DEV FEW1N Plaka (MPlate)", [{ key: "MPlate", value: pVal }], false);
});

// 2) Herkese Altın Kral Plaka (MPlate)
FEW1N.registerAction("mplate_gold", "👑 Herkese ALTIN FEW1N Plaka (MPlate)", function () {
    var pVal = JSON.stringify({ c: "cn2", t: "<size=300><color=#FFD700><b>FEW1N</b></color></size>" });
    sendTuningToOthers("ALTIN FEW1N Plaka", [{ key: "MPlate", value: pVal }], false);
});

// 3) Herkesi Neon Kırmızı + Altın Jant Boya
FEW1N.registerAction("mpaint_neon", "🌈 Herkesi Neon Kırmızı + Altın Jant Yap", function () {
    var mp = JSON.stringify({ r: 255, g: 0, b: 40, r2: 0, g2: 255, b2: 255, t: 1 });
    var dp = JSON.stringify({ r: 255, g: 215, b: 0, r2: 255, g2: 140, b2: 0, t: 1 });
    sendTuningToOthers("Neon Boya + Altın Jant", [
        { key: "MPaint", value: mp },
        { key: "SPaint", value: mp },
        { key: "DiskPaint", value: dp }
    ], false);
});

// 4) FULL FEW1N PAKETİ (Plaka + Neon Boya + Altın Jant — Tüm Oda)
FEW1N.registerAction("full_pack", "👑 FULL FEW1N PAKETİ (Plaka + Boya + Jant)", function () {
    var pVal = JSON.stringify({ c: "eu1", t: "<size=350><color=#FF0033><b>FEW1N</b></color></size>" });
    var mp   = JSON.stringify({ r: 255, g: 0, b: 50, r2: 0, g2: 255, b2: 255, t: 1 });
    var dp   = JSON.stringify({ r: 255, g: 215, b: 0, r2: 255, g2: 140, b2: 0, t: 1 });
    sendTuningToOthers("FULL FEW1N Paketi", [
        { key: "MPlate", value: pVal },
        { key: "MPaint", value: mp },
        { key: "SPaint", value: mp },
        { key: "DiskPaint", value: dp }
    ], false);
});

// 5) Herkesin Tekerleklerini Sök (WheelT = -1)
FEW1N.registerAction("strip_wheels", "💀 Herkesin Tekerleklerini Sök (WheelT)", function () {
    sendTuningToOthers("Tekerlek Sök", [{ key: "WheelT", value: JSON.stringify({ i: -1 }) }], false);
});

// 6) Kendi Aracıma da Bas (Test: MPlate + Neon)
FEW1N.registerAction("self_test", "🧪 Kendi Aracıma MPlate + Neon Bas", function () {
    var pVal = JSON.stringify({ c: "eu1", t: "<size=350><color=#FF0033><b>FEW1N</b></color></size>" });
    var mp   = JSON.stringify({ r: 255, g: 0, b: 50, r2: 0, g2: 255, b2: 255, t: 1 });
    sendTuningToOthers("Kendi Aracım + Oda", [
        { key: "MPlate", value: pVal },
        { key: "MPaint", value: mp }
    ], true);
});

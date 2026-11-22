// ============================================================================
// FEW1N LIVE OTA SCRIPT (live.js) v1.2
// Gercek JSON key listesi + MPaint + Plaka A/B/C format testi
// ============================================================================

FEW1N.setMeta("1.2", "Tüm Tuning Key'leri + MPaint & Plaka A/B/C Canlı Test");
FEW1N.clearActions();

function getMyTM() {
    var tms = FEW1N.findObjects("", "TuningManager");
    for (var i = 0; i < tms.length; i++) {
        if (FEW1N.isMine(tms[i])) return tms[i];
    }
    return tms.length > 0 ? tms[0] : "";
}

function getRealPlateKey() {
    var pts = FEW1N.findObjects("", "PlateTuner");
    for (var i = 0; i < pts.length; i++) {
        var k = FEW1N.invoke(pts[i], "", "PlateTuner", "dul", []) ||
                FEW1N.invoke(pts[i], "", "PlateTuner", "dum", []) ||
                FEW1N.readStr(pts[i], 0x20);
        if (k && k.length > 0) return k;
    }
    return "Plate";
}

function buildNeonAndPlateJson(plateText, r, g, b) {
    var pKey = getRealPlateKey();
    var paintVal = JSON.stringify({ r: r, g: g, b: b, r2: b, g2: r, b2: g, t: 1 });
    var plateVal = JSON.stringify({ c: "eu1", t: plateText });
    return JSON.stringify({
        tuners: [
            { key: "MPaint", value: paintVal },
            { key: pKey, value: plateVal }
        ]
    });
}

function sendLoadTunersTest(modeName, bytesHandle) {
    if (!bytesHandle) {
        FEW1N.alert("⚠️ " + modeName, "Encode başarısız (bytes NULL döndü)!");
        return;
    }
    var tms = FEW1N.findObjects("", "TuningManager");
    var hitAll = 0, hitOther = 0;
    for (var i = 0; i < tms.length; i++) {
        var mine = FEW1N.isMine(tms[i]);
        // RpcTarget.All = 0
        if (FEW1N.sendRPC(tms[i], "LoadTuners", 0, [bytesHandle])) {
            hitAll++;
            if (!mine) hitOther++;
        }
    }
    var msg = modeName + "\nToplam TM: " + tms.length + " | RPC: " + hitAll + " (Diğer: " + hitOther + ")\n\nAraba rengi/plakası değiştiyse BU FORMAT DOĞRUDUR!";
    FEW1N.log(msg);
    FEW1N.alert("🧪 " + modeName, msg);
}

// 1) Tüm Tuner Key'lerini listele
FEW1N.registerAction("list_keys", "🔑 1. Tüm Tuning Key'lerini Göster", function () {
    var tm = getMyTM();
    if (!tm) { FEW1N.alert("⚠️", "TuningManager bulunamadı."); return; }
    var td = FEW1N.invoke(tm, "", "TuningManager", "eaj", []);
    var gkb = td ? FEW1N.invoke(td, "", "TuningData", "gkb", []) : "";
    var keys = [];
    try {
        var obj = JSON.parse(gkb);
        for (var i = 0; i < obj.tuners.length; i++) {
            keys.push(obj.tuners[i].key);
        }
    } catch (e) {
        FEW1N.alert("⚠️ Parse", "" + e);
        return;
    }
    FEW1N.alert("🔑 Tüm Tuner Key'leri (" + keys.length + ")", keys.join(", ") + "\n\nPlateKey: " + getRealPlateKey());
});

// 2) Test A: vn.gst (Zip) -> PARLAK KIRMIZI + TEST-A
FEW1N.registerAction("test_a", "🔴 2. Test A (vn.gst Zip -> Kırmızı)", function () {
    var json = buildNeonAndPlateJson("TEST-A", 255, 0, 30);
    var b = FEW1N.invoke("", "", "vn", "gst", [json]);
    sendLoadTunersTest("Test A (vn.gst Zip -> Kırmızı)", b);
});

// 3) Test B: vn.gsx(vn.gst) -> PARLAK YEŞİL + TEST-B
FEW1N.registerAction("test_b", "🟢 3. Test B (vn.gsx+gst -> Yeşil)", function () {
    var json = buildNeonAndPlateJson("TEST-B", 0, 255, 40);
    var z = FEW1N.invoke("", "", "vn", "gst", [json]);
    var b = z ? FEW1N.invoke("", "", "vn", "gsx", [z]) : "";
    sendLoadTunersTest("Test B (vn.gsx+gst -> Yeşil)", b);
});

// 4) Test C: Ham UTF-8 -> PARLAK MAVİ + TEST-C
FEW1N.registerAction("test_c", "🔵 4. Test C (Ham UTF-8 -> Mavi)", function () {
    var json = buildNeonAndPlateJson("TEST-C", 0, 120, 255);
    var utf8 = FEW1N.invoke("", "System.Text", "Encoding", "get_UTF8", []);
    var b = utf8 ? FEW1N.invoke(utf8, "System.Text", "Encoding", "GetBytes", [json]) : "";
    sendLoadTunersTest("Test C (Ham UTF-8 -> Mavi)", b);
});

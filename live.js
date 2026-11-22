// ============================================================================
// FEW1N LIVE OTA SCRIPT (live.js) v1.1
// .dylib derlemeden anlik test & fix motoru!
// ============================================================================

FEW1N.setMeta("1.1", "LoadTuners Gerçek Format Testi (A: Zip, B: Zip+Şifre, C: UTF8) + Gerçek JSON Okuyucu");
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

function buildPlateJson(plateText) {
    var key = getRealPlateKey();
    var inner = JSON.stringify({ c: "eu1", t: plateText });
    return JSON.stringify({ tuners: [{ key: key, value: inner }] });
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
        // RpcTarget.All = 0 -> hem sende hem herkeste tetiklenir
        var ok = FEW1N.sendRPC(tms[i], "LoadTuners", 0, [bytesHandle]);
        if (ok) {
            hitAll++;
            if (!mine) hitOther++;
        }
    }
    var msg = modeName + "\nToplam TM: " + tms.length + "\nRPC Giden: " + hitAll + " (Diğer: " + hitOther + ")\n\nEğer KENDİ plakan değiştiyse bu format %100 DOĞRUDUR!";
    FEW1N.log(msg);
    FEW1N.alert("🧪 " + modeName, msg);
}

// 1) Kendi aracinin GERCEK TuningData JSON'unu ve PlateTuner key'ini oku
FEW1N.registerAction("read_json", "🔎 1. Gerçek Tuning JSON & Key Oku", function () {
    var tm = getMyTM();
    if (!tm) { FEW1N.alert("⚠️", "TuningManager bulunamadı (odada arabaya bin)."); return; }
    var td = FEW1N.invoke(tm, "", "TuningManager", "eaj", []);
    var gkb = td ? FEW1N.invoke(td, "", "TuningData", "gkb", []) : "";
    var dzz = FEW1N.invoke(tm, "", "TuningManager", "dzz", []);
    var pKey = getRealPlateKey();
    var sample = (gkb && gkb.length > 0) ? gkb : (dzz || "(boş)");
    if (sample.length > 320) sample = sample.substring(0, 320) + "...";
    var msg = "PlateKey: '" + pKey + "'\n\ngkb len=" + (gkb ? gkb.length : 0) + " | dzz len=" + (dzz ? dzz.length : 0) + "\n\nÖrnek:\n" + sample;
    FEW1N.log("REAL_JSON: " + sample);
    FEW1N.alert("🔎 Gerçek Tuning JSON", msg);
});

// 2) Test A: Sadece vn.gst(json) (Zip)
FEW1N.registerAction("test_a", "🧪 2. Test A: LoadTuners (vn.gst Zip)", function () {
    var json = buildPlateJson("TEST-A");
    var b = FEW1N.invoke("", "", "vn", "gst", [json]);
    sendLoadTunersTest("Test A (vn.gst Zip)", b);
});

// 3) Test B: vn.gsx(vn.gst(json)) (Zip + AES)
FEW1N.registerAction("test_b", "🧪 3. Test B: LoadTuners (vn.gsx+gst)", function () {
    var json = buildPlateJson("TEST-B");
    var z = FEW1N.invoke("", "", "vn", "gst", [json]);
    var b = z ? FEW1N.invoke("", "", "vn", "gsx", [z]) : "";
    sendLoadTunersTest("Test B (vn.gsx+gst)", b);
});

// 4) Test C: Ham UTF-8 Encoding.UTF8.GetBytes(json)
FEW1N.registerAction("test_c", "🧪 4. Test C: LoadTuners (Ham UTF-8)", function () {
    var json = buildPlateJson("TEST-C");
    var utf8 = FEW1N.invoke("", "System.Text", "Encoding", "get_UTF8", []);
    var b = utf8 ? FEW1N.invoke(utf8, "System.Text", "Encoding", "GetBytes", [json]) : "";
    sendLoadTunersTest("Test C (Ham UTF-8)", b);
});

// 5) Test D: Diğer oyuncuları SmoothSyncRCC RpcTeleport ile fırlat/çevir kontrolü
FEW1N.registerAction("test_flip", "🙃 5. Canlı 180° Ters Çevir (Tüm Oda)", function () {
    var sss = FEW1N.findObjects("Smooth", "SmoothSyncRCC");
    var hit = 0;
    for (var i = 0; i < sss.length; i++) {
        if (FEW1N.isMine(sss[i])) continue;
        var tr = FEW1N.invoke(sss[i], "UnityEngine", "Component", "get_transform", []);
        var pos = tr ? FEW1N.invoke(tr, "UnityEngine", "Transform", "get_position", []) : { x: 0, y: 5, z: 0 };
        var ok = FEW1N.sendRPC(sss[i], "RpcTeleport", 0, [
            { t: "v3", x: pos.x, y: pos.y + 3.0, z: pos.z },
            { t: "v3", x: 0, y: 0, z: 180 },
            { t: "v3", x: 1, y: 1, z: 1 },
            { t: "f", v: 3.0 }
        ]);
        if (ok) hit++;
    }
    FEW1N.alert("🙃 Canlı Flip", "Bulunan SmoothSyncRCC: " + sss.length + "\nRPC Giden: " + hit);
});

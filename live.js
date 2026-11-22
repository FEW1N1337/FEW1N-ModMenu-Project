// ============================================================================
// FEW1N LIVE OTA SCRIPT (live.js)
// Bu dosya GitHub main uzerinden oyunun icinden tek tusla indirilir ve
// yeniden .dylib derlemeden JavaScriptCore + il2cpp koprusuyle calisir!
// ============================================================================

FEW1N.setMeta("1.0", "FEW1N Canlı OTA Motoru aktif — yeniden derlemeden anlık güncelleme!");
FEW1N.clearActions();

// 1) Odadaki oyuncular ve sahne teşhis raporu
FEW1N.registerAction("diag", "🔎 Oda & Sahne Teşhisi (Canlı)", function () {
    var me = FEW1N.myActor();
    var plys = FEW1N.players();
    var tms = FEW1N.findObjects("", "TuningManager");
    var sss = FEW1N.findObjects("Smooth", "SmoothSyncRCC");
    var pts = FEW1N.findObjects("", "PlateTuner");
    var key = "";
    if (pts.length > 0) {
        key = FEW1N.invoke(pts[0], "", "PlateTuner", "dul", []) ||
              FEW1N.invoke(pts[0], "", "PlateTuner", "dum", []) ||
              FEW1N.readStr(pts[0], 0x20) || "Plate";
    }
    var msg = "Benim Actor: #" + me +
        "\nDiğer Oyuncular: " + plys.length +
        "\nTuningManager: " + tms.length +
        "\nSmoothSyncRCC: " + sss.length +
        "\nPlateTuner: " + pts.length + " (key='" + key + "')";
    FEW1N.log(msg);
    FEW1N.alert("🔎 Canlı Teşhis", msg);
});

// 2) Herkesin plakasını canlı Zipper LoadTuners ile bas (anlık test)
FEW1N.registerAction("zipper_plate", "🔥 Herkese Canlı FEW1N Plaka (Zipper)", function () {
    var pts = FEW1N.findObjects("", "PlateTuner");
    var pKey = "Plate";
    if (pts.length > 0) {
        pKey = FEW1N.invoke(pts[0], "", "PlateTuner", "dul", []) ||
               FEW1N.invoke(pts[0], "", "PlateTuner", "dum", []) ||
               FEW1N.readStr(pts[0], 0x20) || "Plate";
    }
    var inner = JSON.stringify({ c: "eu1", t: "<size=350><color=#FF0033><b>FEW1N</b></color></size>" });
    var outer = JSON.stringify({ tuners: [{ key: pKey, value: inner }] });
    var bytes = FEW1N.invoke("", "", "vn", "gst", [outer]);
    if (!bytes) {
        FEW1N.alert("⚠️ Hata", "Zipper vn.gst(string) encode başarısız!");
        return;
    }
    var tms = FEW1N.findObjects("", "TuningManager");
    var hit = 0;
    for (var i = 0; i < tms.length; i++) {
        if (FEW1N.isMine(tms[i])) continue;
        if (FEW1N.sendRPC(tms[i], "LoadTuners", 3, [bytes])) hit++;
    }
    FEW1N.alert("🔥 Canlı Plaka", hit + " araca LoadTuners (key=" + pKey + ") yollandı!");
});

// 3) Canlı Yağmur + Gece (Room CustomProperties + Lokal WeatherManager)
FEW1N.registerAction("weather_storm", "⛈️ Canlı Fırtına + Gece", function () {
    FEW1N.claimMaster();
    var r1 = FEW1N.setRoomProp("WeatherRain", 1.0, true);
    var r2 = FEW1N.setRoomProp("WeatherLighting", 1.0, true);
    var wm = FEW1N.invoke("", "Weather", "WeatherManager", "eyo", []);
    if (wm) {
        FEW1N.invoke(wm, "Weather", "WeatherManager", "eyt", [1.0]);
        FEW1N.invoke(wm, "Weather", "WeatherManager", "eyw", [1.0]);
        FEW1N.invoke(wm, "Weather", "WeatherManager", "eyy", []);
    }
    FEW1N.alert("⛈️ Canlı Hava", "RoomProp: " + (r1 && r2 ? "OK" : "FAIL") + " | Lokal WM: " + (wm ? "OK" : "YOK"));
});

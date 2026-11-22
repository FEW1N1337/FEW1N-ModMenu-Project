// ============================================================================
// FEW1N LIVE OTA SCRIPT (live.js) v1.5
// Neden sadece kendi aracin boyandi, Actor#1 boyanmadi? 3 cerrahi test!
// ============================================================================

FEW1N.setMeta("1.5", "Actor#1 Neden Boyanmadı? (1: Direkt LoadTuners, 2: PV Spoof+RPC, 3: AllViaServer)");
FEW1N.clearActions();

function getOtherTMs() {
    var tms = FEW1N.findObjects("", "TuningManager");
    var out = [];
    for (var i = 0; i < tms.length; i++) {
        if (!FEW1N.isMine(tms[i])) out.push(tms[i]);
    }
    return out;
}

function makeBytes(tag, r, g, b) {
    var mp = JSON.stringify({ r: r, g: g, b: b, r2: b, g2: r, b2: g, t: 1 });
    var pl = JSON.stringify({ c: "eu1", t: "<size=300><color=#FF0033><b>" + tag + "</b></color></size>" });
    var outer = JSON.stringify({
        tuners: [
            { key: "MPaint", value: mp },
            { key: "MPlate", value: pl }
        ]
    });
    return FEW1N.invoke("", "", "vn", "gst", [outer]);
}

// 1) Direkt otherTM.LoadTuners(bytes) cagir (RPC'siz, sadece lokal test)
FEW1N.registerAction("t1_direct", "🔴 1. Diğer Araca Direkt LoadTuners (Lokal)", function () {
    var others = getOtherTMs();
    var b = makeBytes("DIR-1", 255, 0, 20);
    var okCnt = 0;
    for (var i = 0; i < others.length; i++) {
        var r = FEW1N.invoke(others[i], "", "TuningManager", "LoadTuners", [b]);
        if (r) okCnt++;
    }
    FEW1N.alert("🔴 Test 1 (Direkt)", "Diğer TM: " + others.length + " | Başarılı: " + okCnt + "\n\nDiğer araba KIRMIZI oldu mu?");
});

// 2) otherPV'de IsMine/AmOwner/ownerActorNr gecici spoof + sendRPC(LoadTuners, All=0)
FEW1N.registerAction("t2_spoof_rpc", "🟢 2. PV Spoof + LoadTuners RPC (All)", function () {
    var others = getOtherTMs();
    var myAct = FEW1N.myActor();
    var b = makeBytes("SPF-2", 0, 255, 40);
    var okCnt = 0;
    for (var i = 0; i < others.length; i++) {
        var pv = FEW1N.invoke(others[i], "Photon.Pun", "MonoBehaviourPun", "get_photonView", []);
        if (!pv) continue;
        // IsMine @0x68, AmOwner @0x7C, ownerActorNr @0x88, controllerActorNr @0x8C
        var sMine = FEW1N.readInt(pv, 0x68);
        var sAm   = FEW1N.readInt(pv, 0x7C);
        var sOAn  = FEW1N.readInt(pv, 0x88);
        var sCAn  = FEW1N.readInt(pv, 0x8C);
        FEW1N.writeInt(pv, 0x68, (sMine & ~0xFF) | 1);
        FEW1N.writeInt(pv, 0x7C, (sAm   & ~0xFF) | 1);
        FEW1N.writeInt(pv, 0x88, myAct);
        FEW1N.writeInt(pv, 0x8C, myAct);
        var ok = FEW1N.sendRPC(pv, "LoadTuners", 0, [b]);
        // Geri al
        FEW1N.writeInt(pv, 0x68, sMine);
        FEW1N.writeInt(pv, 0x7C, sAm);
        FEW1N.writeInt(pv, 0x88, sOAn);
        FEW1N.writeInt(pv, 0x8C, sCAn);
        if (ok) okCnt++;
    }
    FEW1N.alert("🟢 Test 2 (PV Spoof+RPC)", "Diğer TM: " + others.length + " | RPC OK: " + okCnt + "\n\nDiğer araba YEŞİL oldu mu?");
});

// 3) AllViaServer (5) + AllBufferedViaServer (6) + ViewID raporu
FEW1N.registerAction("t3_viaserver", "🔵 3. AllViaServer (5) + ViewID Raporu", function () {
    var others = getOtherTMs();
    var b = makeBytes("SRV-3", 0, 120, 255);
    var lines = [];
    for (var i = 0; i < others.length; i++) {
        var pv = FEW1N.invoke(others[i], "Photon.Pun", "MonoBehaviourPun", "get_photonView", []);
        var vid = pv ? FEW1N.invoke(pv, "Photon.Pun", "PhotonView", "get_ViewID", []) : -1;
        var act = FEW1N.getOwnerActor(others[i]);
        var ok5 = pv ? FEW1N.sendRPC(pv, "LoadTuners", 5, [b]) : false;
        lines.push("Actor#" + act + " ViewID=" + vid + " AllViaSrv=" + ok5);
    }
    FEW1N.alert("🔵 Test 3 (AllViaServer)", lines.join("\n") || "Diğer araç yok");
});

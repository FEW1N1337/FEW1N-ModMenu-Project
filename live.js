// ============================================================================
// FEW1N LIVE OTA SCRIPT (live.js) v1.4
// Format A/B/C (MPlate + MPaint) + OwnershipTransfer Kontrol + Takeover Testi
// ============================================================================

FEW1N.setMeta("1.4", "MPlate+MPaint 3 Format Testi + OwnershipTransfer Kontrolü");
FEW1N.clearActions();

function makePayload(tag, r, g, b) {
    var mp = JSON.stringify({ r: r, g: g, b: b, r2: b, g2: r, b2: g, t: 1 });
    var pl = JSON.stringify({ c: "eu1", t: "<size=300><color=#FF0033><b>" + tag + "</b></color></size>" });
    return JSON.stringify({
        tuners: [
            { key: "MPaint", value: mp },
            { key: "MPlate", value: pl }
        ]
    });
}

function broadcastLoadTuners(label, bytes, targetRpc) {
    if (!bytes) { FEW1N.alert("⚠️ " + label, "bytes NULL döndü!"); return; }
    var tms = FEW1N.findObjects("", "TuningManager");
    var hit = 0;
    for (var i = 0; i < tms.length; i++) {
        if (FEW1N.sendRPC(tms[i], "LoadTuners", targetRpc, [bytes])) hit++;
    }
    FEW1N.alert("🧪 " + label, "TM: " + tms.length + " | RPC Giden: " + hit + "\n(Kendi araban VEYA diğer araba değişti mi?)");
}

// 1) Diğer araçların OwnershipTransfer değerini ve ViewID'sini kontrol et
FEW1N.registerAction("check_own", "🔍 1. Araç Sahiplik Tipi (Fixed/Takeover?)", function () {
    var tms = FEW1N.findObjects("", "TuningManager");
    var lines = [];
    for (var i = 0; i < tms.length; i++) {
        var pv = FEW1N.invoke(tms[i], "Photon.Pun", "MonoBehaviourPun", "get_photonView", []);
        var act = FEW1N.getOwnerActor(tms[i]);
        var mine = FEW1N.isMine(tms[i]);
        var ow = pv ? FEW1N.readInt(pv, 0x50) : -1; // 0=Fixed, 1=Takeover, 2=Request
        var owName = ow === 0 ? "Fixed" : ow === 1 ? "Takeover!" : ow === 2 ? "Request" : ("?" + ow);
        lines.push("Actor#" + act + (mine ? " (BEN)" : "") + " -> " + owName);
    }
    FEW1N.alert("🔍 OwnershipTransfer (" + tms.length + ")", lines.join("\n") || "Araç yok");
});

// 2) Format 1: vn.gst (Zip) -> KIRMIZI + FEW1N-A
FEW1N.registerAction("fmt_a", "🔴 2. Format A: vn.gst (Kırmızı + MPlate)", function () {
    var json = makePayload("FEW1N-A", 255, 0, 20);
    var b = FEW1N.invoke("", "", "vn", "gst", [json]);
    broadcastLoadTuners("Format A (vn.gst)", b, 0);
});

// 3) Format 2: vn.gsx(vn.gst) (Şifreli) -> YEŞİL + FEW1N-B
FEW1N.registerAction("fmt_b", "🟢 3. Format B: vn.gsx+gst (Yeşil + MPlate)", function () {
    var json = makePayload("FEW1N-B", 0, 255, 40);
    var z = FEW1N.invoke("", "", "vn", "gst", [json]);
    var b = z ? FEW1N.invoke("", "", "vn", "gsx", [z]) : "";
    broadcastLoadTuners("Format B (vn.gsx+gst)", b, 0);
});

// 4) Format 3: Ham UTF-8 -> MAVİ + FEW1N-C
FEW1N.registerAction("fmt_c", "🔵 4. Format C: Ham UTF-8 (Mavi + MPlate)", function () {
    var json = makePayload("FEW1N-C", 0, 120, 255);
    var utf8 = FEW1N.invoke("", "System.Text", "Encoding", "get_UTF8", []);
    var b = utf8 ? FEW1N.invoke(utf8, "System.Text", "Encoding", "GetBytes", [json]) : "";
    broadcastLoadTuners("Format C (UTF-8)", b, 0);
});

// 5) Takeover Sahiplik İste + LoadTuners Bas
FEW1N.registerAction("takeover_tune", "👑 5. Sahiplik İste (TransferOwnership) + Bas", function () {
    var myAct = FEW1N.myActor();
    var tms = FEW1N.findObjects("", "TuningManager");
    var json = makePayload("FEW1N", 255, 0, 200);
    var b = FEW1N.invoke("", "", "vn", "gst", [json]);
    var hit = 0;
    for (var i = 0; i < tms.length; i++) {
        if (FEW1N.isMine(tms[i])) continue;
        var pv = FEW1N.invoke(tms[i], "Photon.Pun", "MonoBehaviourPun", "get_photonView", []);
        if (pv) {
            FEW1N.invoke(pv, "Photon.Pun", "PhotonView", "RequestOwnership", []);
            FEW1N.invoke(pv, "Photon.Pun", "PhotonView", "TransferOwnership", [myAct]);
        }
        if (b && FEW1N.sendRPC(tms[i], "LoadTuners", 3, [b])) hit++;
    }
    FEW1N.alert("👑 Takeover + LoadTuners", "Denenen diğer araç: " + hit);
});

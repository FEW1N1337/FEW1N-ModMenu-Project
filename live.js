// ============================================================================
// FEW1N LIVE OTA SCRIPT (live.js) v4.7 — MANUEL ODA AÇICI (GERÇEK SAYIM + HIZ/SÜRE AYARI)
// ============================================================================

FEW1N.setMeta("4.7", "Manuel Oda Açıcı (Sayı + Süre Ayarlı, Gerçek Sayım) + Odamı En Üstte Tut + Araba Kasası Çalma");
FEW1N.clearActions();

var g_rainbowPaintOn = false;
var g_rainbowPlateOn = false;
var g_policePaintOn  = false;
var g_keepRoomTopOn  = false;
var g_tickCount = 0;
var g_colorIdx  = 0;
var g_roomTopTick = 0;
var g_roomMaxFlip = false;
var g_turboRoomOn     = false;
var g_turboRoomSent   = 0;
var g_turboRoomSeq    = 0;
var g_turboLastOkMs   = 0;
var g_turboRoomOpts   = null;
var g_turboOptsTtlMs  = 0;

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

// 2 satır dönüşümü: "|" veya "\n" -> alt satır; yoksa ilk boşluktan 2 satıra böl (Altın Kral stili)
function toTwoLines(raw) {
    var s = (raw || "FEW1N|KING").trim();
    if (s.indexOf("|") !== -1) return s.split("|").join("\n");
    if (s.indexOf("\\n") !== -1) return s.split("\\n").join("\n");
    if (s.indexOf("\n") !== -1) return s;
    var sp = s.indexOf(" ");
    if (sp > 0 && sp < s.length - 1) {
        return s.substring(0, sp) + "\n" + s.substring(sp + 1);
    }
    return s;
}

function formatPlateRich(rawText, colorHex, sizeNum) {
    var t = toTwoLines(rawText);
    if (t.indexOf("<") !== -1 && t.indexOf(">") !== -1) return t;
    var sz = sizeNum || 250;
    var col = colorHex || "#FFD700";
    return "<size=" + sz + "><color=" + col + "><b>" + t + "</b></color></size>";
}

function getSavedPlateRaw() {
    return FEW1N.getPref ? FEW1N.getPref("last_plate_plain", "FEW1N|KING") : "FEW1N|KING";
}

function savePlateRaw(raw) {
    if (FEW1N.setPref && raw && raw.length > 0) FEW1N.setPref("last_plate_plain", raw);
}

// FIX v4.3: eae() ve ead() KALDIRILDI (eski garaj kaydini geri yukleyip lokal gorunumu bozuyordu!)
// Sadece LoadTuners AllBuffered RPC + lokal LoadTuners -> hem SENDE hem HERKESTE aninda degisir!
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

// ============================================================================
// 💥 MANUEL ODA AÇICI — GERÇEK SAYIM + MANUEL SAYI & SÜRE AYARI (v4.7 OTA)
// ============================================================================
var kTurboZw = ["\u200B", "\u200C", "\u200D", "\uFEFF"];

function getTurboRoomBaseName() {
    return FEW1N.getPref ? FEW1N.getPref("turbo_room_name", "<b><color=#FF0000>FEW1N</color></b>") : "<b><color=#FF0000>FEW1N</color></b>";
}

function getTurboTargetCount() {
    var v = parseInt(FEW1N.getPref ? FEW1N.getPref("turbo_room_target", "1000") : "1000", 10);
    return (isNaN(v) || v < 1) ? 1000 : v;
}

function getTurboDelaySec() {
    var v = parseFloat(FEW1N.getPref ? FEW1N.getPref("turbo_room_delay", "0") : "0");
    return (isNaN(v) || v < 0) ? 0 : v;
}

function getTurboTtlMin() {
    var v = parseInt(FEW1N.getPref ? FEW1N.getPref("turbo_room_ttl", "5") : "5", 10);
    if (isNaN(v) || v < 1) v = 5;
    if (v > 59) v = 59;
    return v;
}

function makeTurboRoomName(base, seq) {
    var suf = "";
    for (var i = 0; i < 8; i++) {
        suf += kTurboZw[(seq >> (i * 2)) & 3];
    }
    return base + suf;
}

function getTurboRoomOpts() {
    var ttlMs = getTurboTtlMin() * 60000;
    if (g_turboRoomOpts && g_turboRoomOpts.indexOf("@0x") === 0 && g_turboOptsTtlMs === ttlMs) {
        return g_turboRoomOpts;
    }
    var tp = FEW1N.invoke("", "System", "Type", "GetType", ["Photon.Realtime.RoomOptions, PhotonRealtime"]);
    if (!tp || tp.indexOf("@0x") !== 0) {
        tp = FEW1N.invoke("", "System", "Type", "GetType", ["Photon.Realtime.RoomOptions"]);
    }
    if (tp && tp.indexOf("@0x") === 0) {
        var opts = FEW1N.invoke("", "System", "Activator", "CreateInstance", [tp]);
        if (opts && opts.indexOf("@0x") === 0) {
            FEW1N.invoke(opts, "Photon.Realtime", "RoomOptions", "set_IsVisible", [true]);
            FEW1N.invoke(opts, "Photon.Realtime", "RoomOptions", "set_IsOpen", [true]);
            FEW1N.writeInt(opts, 0x14, 31);     // MaxPlayers = 31
            FEW1N.writeInt(opts, 0x1C, ttlMs);  // EmptyRoomTtl (ayarlanan dakika)
            g_turboRoomOpts = opts;
            g_turboOptsTtlMs = ttlMs;
            return opts;
        }
    }
    return null; // Yedek: native CreateRoom hook otomatik RoomOptions üretir
}

function stepTurboRoom() {
    if (!g_turboRoomOn) return;
    var target = getTurboTargetCount();
    if (g_turboRoomSent >= target) {
        g_turboRoomOn = false;
        FEW1N.log("⚡ ODA AÇMA TAMAMLANDI: " + g_turboRoomSent + "/" + target);
        FEW1N.alert("💥 Odalar Açıldı!", "Toplam " + g_turboRoomSent + " oda gerçekten oluşturuldu!\nAçık kalma: ~" + getTurboTtlMin() + " dk");
        return;
    }
    // Odadaysak önce hemen çık (oda EmptyRoomTtl ile listede kalır)
    if (FEW1N.invoke("", "Photon.Pun", "PhotonNetwork", "get_InRoom", [])) {
        FEW1N.invoke("", "Photon.Pun", "PhotonNetwork", "LeaveRoom", [false]);
        return;
    }
    // Kullanıcının ayarladığı bekleme süresi kontrolü
    var delayMs = Math.round(getTurboDelaySec() * 1000);
    var now = Date.now();
    if (delayMs > 0 && g_turboLastOkMs > 0 && (now - g_turboLastOkMs) < delayMs) {
        return;
    }
    // Sadece Photon hazır olup CreateRoom gerçekten TRUE döndüğünde sayacı artır!
    var base = getTurboRoomBaseName();
    var opts = getTurboRoomOpts();
    g_turboRoomSeq++;
    var rName = makeTurboRoomName(base, g_turboRoomSeq);
    var ok = !!FEW1N.invoke("", "Photon.Pun", "PhotonNetwork", "CreateRoom", [rName, opts, null, null]);
    if (ok) {
        g_turboRoomSent++;
        g_turboLastOkMs = now;
        if (g_turboRoomSent % 10 === 0 || g_turboRoomSent === target) {
            FEW1N.log("💥 Açılan oda: " + g_turboRoomSent + " / " + target);
        }
        if (FEW1N.invoke("", "Photon.Pun", "PhotonNetwork", "get_InRoom", [])) {
            FEW1N.invoke("", "Photon.Pun", "PhotonNetwork", "LeaveRoom", [false]);
        }
    }
}

addBtn("spam_1000_rooms", "💥 ODA AÇ — Başlat / Durdur (Manuel Sayı & Hız)", "red", function () {
    if (g_turboRoomOn) {
        g_turboRoomOn = false;
        FEW1N.alert("🛑 Oda Açma Durduruldu", "Gerçekten açılan: " + g_turboRoomSent + " / " + getTurboTargetCount() + " oda.");
        return;
    }
    g_turboRoomSent = 0;
    g_turboLastOkMs = 0;
    g_turboRoomOn = true;
    var tgt = getTurboTargetCount();
    var dly = getTurboDelaySec();
    var ttl = getTurboTtlMin();
    FEW1N.log("💥 Oda Açıcı başladı -> Hedef: " + tgt + " | Aralık: " + dly + "sn | Kalma: " + ttl + "dk");
    stepTurboRoom();
});

addBtn("turbo_room_count", "🔢 Oda Sayısını Ayarla (Manuel)", "gold", function () {
    var cur = String(getTurboTargetCount());
    FEW1N.prompt("🔢 Kaç Oda Açılsın?", "İstediğin oda sayısını yaz (örn: 20, 100, 500, 1000):", "1000", cur, function (txt) {
        var n = parseInt((txt || "").trim(), 10);
        if (isNaN(n) || n < 1) { FEW1N.alert("⚠️ Hatalı Sayı", "1 veya daha büyük bir sayı yaz."); return; }
        if (FEW1N.setPref) FEW1N.setPref("turbo_room_target", String(n));
        FEW1N.alert("✅ Oda Sayısı Kaydedildi", "Hedef oda sayısı: " + n);
    });
});

addBtn("turbo_room_delay", "⏱️ Oda Açma Süresi / Hızı Ayarla (sn)", "cyan", function () {
    var cur = String(getTurboDelaySec());
    FEW1N.prompt("⏱️ Oda Açma Hızı (Saniye)", "Odalar arası bekleme süresi:\n0 = En hızlı (anında)\n0.5 = Yarım saniye\n1 = 1 saniye\n2 = 2 saniye", "0", cur, function (txt) {
        var v = parseFloat((txt || "").replace(",", ".").trim());
        if (isNaN(v) || v < 0) { FEW1N.alert("⚠️ Hatalı Süre", "0 veya daha büyük saniye yaz (örn: 0, 0.3, 1, 2)."); return; }
        if (FEW1N.setPref) FEW1N.setPref("turbo_room_delay", String(v));
        FEW1N.alert("✅ Hız Ayarlandı", "Oda açma aralığı: " + (v === 0 ? "EN HIZLI (0 sn)" : (v + " saniye")));
    });
});

addBtn("turbo_room_ttl", "⏳ Oda Açık Kalma Süresi Ayarla (dk)", "cyan", function () {
    var cur = String(getTurboTtlMin());
    FEW1N.prompt("⏳ Oda Açık Kalma Süresi (Dakika)", "Açılan odalar kaç dakika listede kalsın? (1 - 59 dk):", "5", cur, function (txt) {
        var m = parseInt((txt || "").trim(), 10);
        if (isNaN(m) || m < 1) m = 1;
        if (m > 59) m = 59;
        if (FEW1N.setPref) FEW1N.setPref("turbo_room_ttl", String(m));
        g_turboRoomOpts = null; // Yeni TTL ile yeniden oluştur
        FEW1N.alert("✅ Kalma Süresi Kaydedildi", "Oda açık kalma süresi: " + m + " dakika");
    });
});

addBtn("turbo_room_name", "✏️ Oda İsmini Ayarla (OTA)", "cyan", function () {
    var cur = getTurboRoomBaseName();
    FEW1N.prompt("✏️ Oda İsmi", "Açılacak odaların adını yaz (renkli HTML destekler):", "<b><color=#FF0000>FEW1N</color></b>", cur, function (txt) {
        if (!txt || txt.length === 0) return;
        if (FEW1N.setPref) FEW1N.setPref("turbo_room_name", txt);
        FEW1N.alert("✅ Oda İsmi Kaydedildi", "Yeni Oda İsmi:\n" + txt);
    });
});

if (FEW1N.onTick) {
    FEW1N.onTick(function () {
        if (!g_turboRoomOn) return;
        stepTurboRoom();
    });
}

// 0) 🚗 BAŞKASININ ARABA KASASINI + MODİFİYESİNİ ÇAL (CarManager.gng ile Garajda Açar!)
addBtn("steal_car_model", "🚗 Başkasının Araba Kasasını Çal (Garajda Aç!)", "red", function () {
    FEW1N.pickPlayer("🚗 Kimin Araba Kasasını Çalacaksın?", function (act, nm) {
        var phs = FEW1N.findObjects("", "HR_PlayerHandler");
        var vName = "";
        for (var i = 0; i < phs.length; i++) {
            if (FEW1N.isMine(phs[i])) continue;
            if (act <= 0 || FEW1N.getOwnerActor(phs[i]) === act) {
                vName = FEW1N.readStr(phs[i], 0x30); // HR_PlayerHandler.VehicleName
                break;
            }
        }
        var tgt = findOtherTMByActor(act);
        var td = tgt ? FEW1N.invoke(tgt, "", "TuningManager", "eaj", []) : "";
        var gkb = td ? FEW1N.invoke(td, "", "TuningData", "gkb", []) : "";
        if (!vName) {
            FEW1N.alert("⚠️ Araç Adı Yok", nm + " aracının VehicleName alanı okunamadı.");
            return;
        }
        var cm = FEW1N.invoke("", "", "CarManager", "gms", []);
        if (!cm) { FEW1N.alert("⚠️", "CarManager bulunamadı."); return; }
        var carId = FEW1N.invoke(cm, "", "CarManager", "gnb", [vName]);
        if (carId === undefined || carId === null || carId < 0) {
            FEW1N.alert("⚠️ ID Bulunamadı", "Araç: '" + vName + "' için CarID dönmedi (" + carId + ").");
            return;
        }
        // CarManager.gng(carId, true, theirJson) -> garajda sahip olarak acar!
        FEW1N.invoke(cm, "", "CarManager", "gng", [carId, true, (gkb || "")]);
        // Ayrica su anki aracina da modifiyesini uygula
        if (gkb && gkb.length > 10) applyAndSaveToMyCar("", gkb, false);
        FEW1N.alert("🚗 Araba Kasası Çalındı!",
            nm + " oyuncusunun arabası: " + vName + " (ID=" + carId + ")\n\n" +
            "✅ Garajında AÇILDI + modifiyesi yüklendi!\n" +
            "Garaja dönüp '" + vName + "' arabasını SEÇ ve odaya gir — herkeste o arabayla doğarsın!");
    });
});

addBtn("unlock_all_cars", "🔓 Garajdaki TÜM Arabaları Aç (Seç & Sür)", "green", function () {
    var cm = FEW1N.invoke("", "", "CarManager", "gms", []);
    if (!cm) { FEW1N.alert("⚠️", "CarManager bulunamadı."); return; }
    var cnt = 0;
    for (var id = 0; id <= 150; id++) {
        if (FEW1N.invoke(cm, "", "CarManager", "gng", [id, true, ""])) cnt++;
    }
    FEW1N.alert("🔓 Tüm Arabalar Açıldı!", "0–150 arası araç ID'leri CarManager'da açıldı (" + cnt + ").\nGarajda istediğin arabayı seçip online odaya girebilirsin!");
});

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

// 3) 👑 ALTIN KRAL 2 SATIR PLAKA (İSİM DEĞİŞTİRİLEBİLİR!)
addBtn("gold_king_plate", "👑 Altın Kral 2 Satır Plaka (İsim Yaz)", "gold", function () {
    var defP = getSavedPlateRaw();
    FEW1N.prompt("👑 Altın Kral 2 Satır Plaka", "Alt satır için | veya boşluk koy (örn: FEW1N|KING):", "FEW1N|KING", defP, function (txt) {
        if (!txt || txt.length === 0) return;
        savePlateRaw(txt);
        var pl = JSON.stringify({ c: "eu1", t: formatPlateRich(txt, "#FFD700", 250) });
        if (applyAndSaveToMyCar("Altın Kral Plaka", JSON.stringify({ tuners: [{ key: "MPlate", value: pl }] }), true)) {
            FEW1N.alert("👑 Altın Kral Plaka!", "2 satır plaka sende + herkeste aktif ve garaja kaydedildi!");
        }
    });
});

// 4) ✏️ ÖZEL 2 SATIR 3D PLAKA (KIRMIZI / ÖZEL RENK)
addBtn("custom_mplate", "✏️ Özel 2 Satır Plaka Yaz (Herkeste + Garaj)", "green", function () {
    var defP = getSavedPlateRaw();
    FEW1N.prompt("🔥 Özel 2 Satır 3D Plaka", "Alt satır için | veya boşluk koy (örn: FEW1N|1337):", "FEW1N|1337", defP, function (txt) {
        if (!txt || txt.length === 0) return;
        savePlateRaw(txt);
        var pl = JSON.stringify({ c: "eu1", t: formatPlateRich(txt, "#FF0033", 250) });
        if (applyAndSaveToMyCar("Özel 2 Satır Plaka", JSON.stringify({ tuners: [{ key: "MPlate", value: pl }] }), true)) {
            FEW1N.alert("🔥 2 Satır Plaka Basıldı!", "Sende + herkeste aktif ve garaja kaydedildi!");
        }
    });
});

// 5) 🇯🇵 GİZLİ ÜLKE PLAKASI (2 SATIR)
addBtn("secret_plate", "🇯🇵 Gizli Ülke 2 Satır Plaka (cn2/rusj2/us1)", "gold", function () {
    var defVal = "cn2:" + getSavedPlateRaw();
    FEW1N.prompt("🇯🇵 Gizli Ülke 2 Satır Plaka", "Format -> kod:Satır1|Satır2 (örn: cn2:FEW1N|KING):", "cn2:FEW1N|KING", defVal, function (val) {
        if (!val) return;
        var idx = val.indexOf(":");
        var cc = (idx > 0) ? val.substring(0, idx).trim() : val.trim();
        var txt = (idx > 0) ? val.substring(idx + 1).trim() : getSavedPlateRaw();
        if (!txt) txt = getSavedPlateRaw();
        savePlateRaw(txt);
        var pl = JSON.stringify({ c: cc, t: formatPlateRich(txt, "#FFD700", 250) });
        if (applyAndSaveToMyCar("Gizli 2 Satır Plaka", JSON.stringify({ tuners: [{ key: "MPlate", value: pl }] }), true)) {
            FEW1N.alert("🇯🇵 Gizli Plaka Aktif!", "Kod: " + cc + " | 2 satır plaka herkeste ve garajda!");
        }
    });
});

// 6-9) BOYA, FULL PAKET, KROM, CAM
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

addBtn("full_few1n", "👑 FULL FEW1N Paketi (2 Satır Plaka + Neon + Jant)", "gold", function () {
    var pl = JSON.stringify({ c: "eu1", t: formatPlateRich(getSavedPlateRaw(), "#FFD700", 250) });
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
        FEW1N.alert("👑 FULL Paket Aktif!", "2 satır Altın plaka + Neon + Altın Jant herkeste ve garajda!");
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

// 10-12) CANLI OTA TOGGLE'LAR (HERKESTE GÖRÜNÜR)
if (FEW1N.addMenuToggle && FEW1N.onTick) {
    FEW1N.addMenuToggle("rainbow_paint", "🌈 Gökkuşağı Boya (Herkeste Canlı)", "Aracının boyasını herkeste sürekli değiştirir", false, function (isOn) {
        g_rainbowPaintOn = !!isOn;
        if (g_rainbowPaintOn) g_policePaintOn = false;
    });
    FEW1N.addMenuToggle("police_paint", "🚨 Polis Çakar Boya (Kırmızı/Mavi — Herkeste)", "Aracın gövdesini kırmızı/mavi çakar yapar", false, function (isOn) {
        g_policePaintOn = !!isOn;
        if (g_policePaintOn) g_rainbowPaintOn = false;
    });
    FEW1N.addMenuToggle("rainbow_plate", "⚡ Gökkuşağı 2 Satır Plaka (Herkeste Canlı)", "Kayıtlı 2 satır plakanı gökkuşağı renginde döndürür", false, function (isOn) {
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
            arr.push({ key: "MPlate", value: JSON.stringify({ c: "eu1", t: formatPlateRich(getSavedPlateRaw(), c1[3], 250) }) });
        }
        if (arr.length > 0) applyAndSaveToMyCar("", JSON.stringify({ tuners: arr }), false);
    });
}

// 13) ODA RAPORU
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

addBtn("save_garage", "💾 Şu Anki Modifiyeyi Garaja Kaydet (Sunucu)", "green", function () {
    var myTM = getMyTM();
    if (!myTM) { FEW1N.alert("⚠️", "Aracın bulunamadı."); return; }
    var td = FEW1N.invoke(myTM, "", "TuningManager", "eaj", []);
    var gkb = td ? FEW1N.invoke(td, "", "TuningData", "gkb", []) : "";
    var srvOk = false;
    var phs = FEW1N.findObjects("", "HR_PlayerHandler");
    var myVName = "";
    for (var i = 0; i < phs.length; i++) {
        if (FEW1N.isMine(phs[i])) { myVName = FEW1N.readStr(phs[i], 0x30); break; }
    }
    if (myVName && gkb && gkb.length > 10) {
        var cm = FEW1N.invoke("", "", "CarManager", "gms", []);
        var cid = cm ? FEW1N.invoke(cm, "", "CarManager", "gnb", [myVName]) : -1;
        if (cm && cid >= 0) {
            FEW1N.invoke(cm, "", "CarManager", "gng", [cid, true, gkb]);
            srvOk = !!FEW1N.invoke(cm, "", "CarManager", "gne", [cid, gkb]);
        }
    }
    var locOk = !!FEW1N.invoke(myTM, "", "TuningManager", "eah", [true]);
    FEW1N.alert("💾 Garaja Kaydedildi!", "Araç: " + (myVName || "?") + "\nSunucu (UpdateTuning): " + (srvOk ? "OK" : "-") + " | Lokal: " + (locOk ? "OK" : "-"));
});

// ============================================================================
// ODA EN ÜSTTE TUTMA MOTORU (v4.5)
// ============================================================================
function boostMyRoomToTop(silent) {
    var rm = FEW1N.invoke("", "Photon.Pun", "PhotonNetwork", "get_CurrentRoom", []);
    if (!rm) {
        if (!silent) FEW1N.alert("⚠️ Odada Değilsin", "Önce bir oda kurup içine gir (oda ismini '!' veya '00' ile başlat: örn. '! FEW1N').");
        return false;
    }
    FEW1N.claimMaster();
    // 1) Şifresiz + açık + görünür (epg skoru max)
    FEW1N.setRoomProp("pWd", "", false);
    FEW1N.invoke(rm, "Photon.Realtime", "Room", "set_IsOpen", [true]);
    FEW1N.invoke(rm, "Photon.Realtime", "Room", "set_IsVisible", [true]);
    // 2) MaxPlayers 31 <-> 30 ping -> odayi gizlemeden Photon'a taze OnRoomListUpdate yayinlatir!
    g_roomMaxFlip = !g_roomMaxFlip;
    var maxP = g_roomMaxFlip ? 31 : 30;
    FEW1N.invoke(rm, "Photon.Realtime", "Room", "set_MaxPlayers", [maxP]);
    var rName = FEW1N.invoke(rm, "Photon.Realtime", "RoomInfo", "get_Name", []) || "?";
    if (!silent) {
        FEW1N.alert("🏆 Oda En Üste Taşındı!",
            "Oda: " + rName + "\n• Şifre temizlendi (Açık)\n• IsOpen & IsVisible: AÇIK\n• MaxPlayers: " + maxP + " (Lobiye taze güncelleme yollandı!)\n\nİpucu: Oda adının başına '!' veya '00' koyarsan alfabetik olarak da 1. sırada kalır.");
    }
    return true;
}

addBtn("room_boost_once", "🏆 Odamı En Üste Taşı / Optimize Et", "gold", function () {
    boostMyRoomToTop(false);
});

if (FEW1N.addMenuToggle && FEW1N.onTick) {
    FEW1N.addMenuToggle("keep_room_top", "🔄 Odamı Üstte Tut (Otomatik Ping)", "Her 15sn'de bir odayı lobi listesinde tazeler (gizlemeden)", false, function (isOn) {
        g_keepRoomTopOn = !!isOn;
        if (g_keepRoomTopOn) boostMyRoomToTop(true);
    });
    FEW1N.onTick(function () {
        if (!g_keepRoomTopOn) return;
        g_roomTopTick++;
        if (g_roomTopTick % 50 !== 0) return; // ~15sn (50 * 0.3s)
        boostMyRoomToTop(true);
    });
}

addBtn("lobby_epg_scan", "🔎 Lobi Sıralama Analizi (epg Skorları)", "cyan", function () {
    var lm = FEW1N.invoke("", "", "HR_PhotonLobbyManager", "eov", []);
    var lines = FEW1N.findObjects("", "HR_UI_RoomListLine");
    if (!lm || lines.length === 0) {
        FEW1N.alert("⚠️ Lobide Değilsin", "Oda listesi ekranını açıp tekrar bas (" + lines.length + " satır).");
        return;
    }
    var out = [];
    for (var i = 0; i < lines.length && i < 8; i++) {
        var ln = lines[i];
        var ri = FEW1N.invoke(ln, "Photon.Realtime", "RoomInfo", "get_Name", []); // fallback
        // roomInfo @0x60 pointer'ini oku
        var nameTxt = FEW1N.readStr(ln, 0x50) || ("Oda#" + (i + 1));
        var pwd = FEW1N.readStr(ln, 0x58);
        out.push((i + 1) + ". " + nameTxt + (pwd ? " 🔒" : " 🔓"));
    }
    FEW1N.alert("🔎 Lobi İlk " + out.length + " Oda", out.join("\n"));
});

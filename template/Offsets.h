// FEW1N Mod Menu — Named il2cpp / Unity 6 field offsets
//
// v114.23'ten itibaren bu dosya FALLBACK tablosudur, birincil kaynak DEGIL.
// Tweak.xm icindeki few1n_resolveFieldOffsets() acilista class layout'unu
// il2cpp metadata'sindan ALAN ISMIYLE okur (OFFR_* degiskenleri). Buradaki
// degerler yalnizca metadata cozulemezse devreye girer.
//
// Pratik sonuc: oyun guncellenip bir sinifa alan eklendiginde (1.4.3'te
// HR_UI_RoomListLine'a LockImage eklenip TMP_Text'ler +8 kaymisti) offsetler
// kendiliginden duzelir; bu dosyayi guncellemek zorunlu degildir.
//
// Generic il2cpp offset'leri (Array.Length @ 0x18, Array.Data @ 0x20, string
// header @ 0x10) runtime ABI sabitidir, oyun surumune bagli degildir — onlar
// kod icinde birebir kalir.

#pragma once

// ===== Unity temel =====
#define OFF_UNITY_CACHED_PTR            0x10   // UnityEngine.Object.m_CachedPtr (unityAlive kontrolu)

// ===== il2cpp System.String =====
#define OFF_IL2CPP_STRING_LEN           0x10   // int32_t length
#define OFF_IL2CPP_STRING_CHARS         0x14   // unichar[] baslangici

// ===== HR_PlayerHandler (1.4.4 dump ile dogrulandi) =====
#define OFF_PLAYERHANDLER_PHOTONVIEW    0xD8   // PhotonView* iza (1.4.3/1.4.4)
#define OFF_PLAYERHANDLER_CANCRASH      0x38   // bool
#define OFF_PLAYERHANDLER_DAMAGE        0x3C   // float
#define OFF_PLAYERHANDLER_RCCP          0x20   // RCCP_CarController* ixy
#define OFF_PLAYERHANDLER_RIGIDBODY     0x28   // Rigidbody* ixz
#define OFF_PLAYERHANDLER_VEHICLENAME   0x30   // string* VehicleName

// ===== HR_PhotonLobbyManager (1.4.4 dump ile dogrulandi) =====
#define OFF_LOBBY_MAPSEL                0x40   // MapSelection* mapSelection (1.4.2: 0x28 -> 1.4.4: 0x40)
#define OFF_LOBBY_ROOMNAME              0x60   // TMP_InputField* roomNameInput (1.4.2: 0x48 -> 1.4.4: 0x60)
#define OFF_LOBBY_PWD_INPUT             0x68   // TMP_InputField* passwordInput
#define OFF_LOBBY_PLAYERCOUNT           0x70   // Slider* playerCount
#define OFF_LOBBY_PWD_ON_CONN_INPUT     0x78   // TMP_InputField* passwordOnConnectInput
#define OFF_LOBBY_PWDPANEL              0xB0   // GameObject* passwordPanel
#define OFF_LOBBY_PENDROOM              0xF8   // RoomInfo* jdt (1.4.2: 0xE0, 0xF0 string jds -> 1.4.4: 0xF8 jdt)

// ===== HR_PhotonLobbyManagerDummy (1.4.4 dump ile dogrulandi) =====
#define OFF_DUMMY_KICKNAME              0x108  // string* jdz (1.4.2: 0xF0 -> 1.4.4: 0x108)

// ===== ChatManager (1.4.4 dump ile dogrulandi) =====
#define OFF_CHAT_UI                     0x40   // ChatUI* chatUI
#define OFF_CHAT_MSGLIST                0x48   // List<string>* kss (1.4.2: 0x40 -> 1.4.4: 0x48)

// ===== HR_UI_RoomListLine (1.4.4 dump ile dogrulandi) =====
#define OFF_ROOMLINE_NAME_TEXT          0x20   // TMP_Text* RoomNameText
#define OFF_ROOMLINE_MAP_TEXT           0x28   // TMP_Text* MapNameText
#define OFF_ROOMLINE_PLAYERCOUNT_TEXT   0x30   // TMP_Text* PlayerCountText
#define OFF_ROOMLINE_PASSWORD           0x58   // string* password
#define OFF_ROOMLINE_ROOMINFO           0x60   // RoomInfo* roomInfo

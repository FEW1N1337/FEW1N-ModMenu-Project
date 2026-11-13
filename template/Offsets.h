// FEW1N Mod Menu — Dynamic / Offset-Free il2cpp & Unity 6 field resolution
//
// Sabit ofsetler yerine calisma aninda (runtime) fonksiyon ve degisken isimleri ile
// otomatik cozumleme yapilir. Oyun guncellense bile dylib ofsetleri dinamik bulur.
// Eger dinamik arama basarisiz olursa 1.4.4 dogrulanmis ofsetleri yedek (fallback) olarak calisir.

#pragma once

#include <stdint.h>
#include <stddef.h>

// ===== Unity temel =====
#define OFF_UNITY_CACHED_PTR            0x10   // UnityEngine.Object.m_CachedPtr (unityAlive kontrolu)

// ===== il2cpp System.String =====
#define OFF_IL2CPP_STRING_LEN           0x10   // int32_t length
#define OFF_IL2CPP_STRING_CHARS         0x14   // unichar[] baslangici

// ===== Dinamik Cozulen Degiskenler (1.4.4 varsayilan fallback degerleri) =====
#ifdef __cplusplus
extern "C" {
#endif

// HR_PlayerHandler
extern int g_offPlayerHandlerPhotonView; // 1.4.4: 0xD8 (tipi PhotonView)
extern int g_offPlayerHandlerCanCrash;   // 1.4.4: 0x38 (ismi "canCrash")
extern int g_offPlayerHandlerDamage;     // 1.4.4: 0x3C (ismi "damage")

// HR_PhotonLobbyManager
extern int g_offLobbyPwdInput;           // 1.4.4: 0x68 (ismi "passwordInput")
extern int g_offLobbyPwdOnConnInput;     // 1.4.4: 0x78 (ismi "passwordOnConnectInput")

// HR_UI_RoomListLine
extern int g_offRoomLineNameText;        // 1.4.4: 0x20 (ismi "RoomNameText")
extern int g_offRoomLineMapText;         // 1.4.4: 0x28 (ismi "MapNameText")
extern int g_offRoomLinePlayerCountText; // 1.4.4: 0x30 (ismi "PlayerCountText")
extern int g_offRoomLinePassword;        // 1.4.4: 0x58 (ismi "password")
extern int g_offRoomLineRoomInfo;        // 1.4.4: 0x60 (ismi "roomInfo")

#ifdef __cplusplus
}
#endif

// Kod icindeki mevcut cagrilara tam geriye donuk uyumluluk:
#define OFF_PLAYERHANDLER_PHOTONVIEW    g_offPlayerHandlerPhotonView
#define OFF_PLAYERHANDLER_CANCRASH      g_offPlayerHandlerCanCrash
#define OFF_PLAYERHANDLER_DAMAGE        g_offPlayerHandlerDamage

#define OFF_LOBBY_PWD_INPUT             g_offLobbyPwdInput
#define OFF_LOBBY_PWD_ON_CONN_INPUT     g_offLobbyPwdOnConnInput

#define OFF_ROOMLINE_NAME_TEXT          g_offRoomLineNameText
#define OFF_ROOMLINE_MAP_TEXT           g_offRoomLineMapText
#define OFF_ROOMLINE_PLAYERCOUNT_TEXT   g_offRoomLinePlayerCountText
#define OFF_ROOMLINE_PASSWORD           g_offRoomLinePassword
#define OFF_ROOMLINE_ROOMINFO           g_offRoomLineRoomInfo

import json
from pathlib import Path

# ilerleme verileri bu dosyada saklanir
ILERLEME_DOSYASI = Path(__file__).parent / "kullanici_ilerleme.json"

# senaryo kilit sirasi: onceki tamamlanmadan sonraki acilmaz
SENARYO_SIRASI = {
    "A1": ["kafe", "alisveris", "hastane", "otel", "is_gorusmesi"],
    "A2": ["kafe", "alisveris", "hastane", "otel", "is_gorusmesi"],
    "B1": ["kafe", "alisveris", "hastane", "otel", "is_gorusmesi"],
}

KILIT_ESIGI = 70


def _ilerleme_yukle() -> dict:
    if not ILERLEME_DOSYASI.exists():
        return {}
    try:
        return json.loads(ILERLEME_DOSYASI.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _ilerleme_kaydet(veri: dict):
    ILERLEME_DOSYASI.write_text(
        json.dumps(veri, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )


def kullanici_ilerleme_al(kullanici_id: str) -> dict:
    veri = _ilerleme_yukle()
    if kullanici_id not in veri:
        # yeni kullanici: tum seviyeler icin bos ilerleme olustur
        veri[kullanici_id] = {
            "A1": {},
            "A2": {},
            "B1": {},
            "seviye": "A1"  # varsayilan baslangic seviyesi
        }
        _ilerleme_kaydet(veri)
    return veri[kullanici_id]


def senaryo_tamamla(kullanici_id: str, seviye: str, senaryo: str, puan: float):
    veri = _ilerleme_yukle()
    kullanici = veri.setdefault(kullanici_id, {"A1": {}, "A2": {}, "B1": {}, "seviye": "A1"})

    seviye_verisi = kullanici.setdefault(seviye, {})
    senaryo_verisi = seviye_verisi.setdefault(senaryo, {"denemeler": [], "en_yuksek": 0})

    senaryo_verisi["denemeler"].append(round(puan, 1))
    senaryo_verisi["en_yuksek"] = max(senaryo_verisi["en_yuksek"], puan)

    # 70 uzerindeyse tamamlandi olarak isaretle
    if puan >= KILIT_ESIGI:
        senaryo_verisi["tamamlandi"] = True

    veri[kullanici_id] = kullanici
    _ilerleme_kaydet(veri)


def acik_senaryolar(kullanici_id: str, seviye: str) -> list[str]:
    kullanici = kullanici_ilerleme_al(kullanici_id)
    seviye_verisi = kullanici.get(seviye, {})
    sira = SENARYO_SIRASI.get(seviye, [])

    aciklar = []
    for i, senaryo in enumerate(sira):
        if i == 0:
            # ilk senaryo her zaman acik
            aciklar.append(senaryo)
        else:
            # onceki senaryo tamamlanmissa bu da acik
            onceki = sira[i - 1]
            onceki_veri = seviye_verisi.get(onceki, {})
            if onceki_veri.get("tamamlandi", False):
                aciklar.append(senaryo)

    return aciklar


def seviye_tamamlandi_mi(kullanici_id: str, seviye: str) -> bool:
    kullanici = kullanici_ilerleme_al(kullanici_id)
    seviye_verisi = kullanici.get(seviye, {})
    sira = SENARYO_SIRASI.get(seviye, [])
    return all(
        seviye_verisi.get(s, {}).get("tamamlandi", False)
        for s in sira
    )


def sonraki_seviye_ac(kullanici_id: str, mevcut_seviye: str) -> str | None:
    gecis = {"A1": "A2", "A2": "B1", "B1": None}
    sonraki = gecis.get(mevcut_seviye)

    if sonraki and seviye_tamamlandi_mi(kullanici_id, mevcut_seviye):
        veri = _ilerleme_yukle()
        if kullanici_id in veri:
            veri[kullanici_id]["seviye"] = sonraki
            _ilerleme_kaydet(veri)
        return sonraki

    return None

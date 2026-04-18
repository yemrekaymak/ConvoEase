import re
import json
from pathlib import Path
from groq_baglanti import ai_yanit_al

PROMPTLAR = Path(__file__).parent.parent / "promptlar"

# model gecerli puan araligi
MIN_PUAN = 0
MAX_PUAN = 100


def _json_ayikla(metin: str) -> dict | None:
    # model bazen json oncesi/sonrasi aciklama metni ekliyor
    # once markdown kod blogu icinden json cikarmaya calis
    kod_blok = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", metin, re.DOTALL)
    if kod_blok:
        try:
            return json.loads(kod_blok.group(1))
        except json.JSONDecodeError:
            pass

    # direkt json parse dene
    try:
        return json.loads(metin)
    except json.JSONDecodeError:
        pass

    # metin icinde ilk { ... } blogu bul
    ilk_ac = metin.find("{")
    son_kapat = metin.rfind("}")
    if ilk_ac != -1 and son_kapat != -1 and son_kapat > ilk_ac:
        try:
            return json.loads(metin[ilk_ac:son_kapat + 1])
        except json.JSONDecodeError:
            pass

    return None


def _sonucu_dogrula(veri: dict, tur_no: int) -> dict:
    # zorunlu alanlarin varligini ve degerlerinin gecerliligi kontrol et
    puan = veri.get("puan", 0)
    if not isinstance(puan, (int, float)):
        puan = 0
    puan = max(MIN_PUAN, min(MAX_PUAN, int(puan)))

    dagilim = veri.get("dagilim", {})
    for alan in ["dilbilgisi", "kelime", "akicilik", "uygunluk"]:
        deger = dagilim.get(alan, 0)
        if not isinstance(deger, (int, float)):
            deger = 0
        dagilim[alan] = max(0, min(25, int(deger)))

    hatalar = veri.get("hatalar", [])
    if not isinstance(hatalar, list):
        hatalar = []

    tesvik = veri.get("tesvik", "Devam et, iyi gidiyorsun.")
    if not isinstance(tesvik, str) or not tesvik.strip():
        tesvik = "Devam et, iyi gidiyorsun."

    return {
        "tur": tur_no,
        "puan": puan,
        "dagilim": dagilim,
        "hatalar": hatalar,
        "tesvik": tesvik
    }


def _varsayilan_sonuc(tur_no: int) -> dict:
    return {
        "tur": tur_no,
        "puan": 0,
        "dagilim": {"dilbilgisi": 0, "kelime": 0, "akicilik": 0, "uygunluk": 0},
        "hatalar": [],
        "tesvik": "Devam et, iyi gidiyorsun."
    }


class Degerlendirici:

    def _prompt_al(self, dosya_adi: str) -> str:
        return (PROMPTLAR / dosya_adi).read_text(encoding="utf-8")

    def anlik_degerlendir(
        self,
        kullanici_mesaji: str,
        seviye: str,
        senaryo: str,
        tur_no: int
    ) -> dict:
        sistem_promptu = self._prompt_al("anlik_degerlendirme.txt").format(
            level=seviye,
            scenario=senaryo,
            turn_number=tur_no
        )

        yanit = ai_yanit_al(
            sistem_promptu=sistem_promptu,
            mesajlar=[{"role": "user", "content": kullanici_mesaji}],
            max_token=512
        )

        veri = _json_ayikla(yanit)

        if veri is None:
            return _varsayilan_sonuc(tur_no)

        return _sonucu_dogrula(veri, tur_no)

    def oturum_raporu_olustur(
        self,
        hata_logu: list,
        seviye: str,
        senaryo: str,
        toplam_tur: int
    ) -> str:
        sistem_promptu = self._prompt_al("oturum_raporu.txt").format(
            level=seviye,
            scenario=senaryo,
            total_turns=toplam_tur,
            error_log=json.dumps(hata_logu, ensure_ascii=False, indent=2)
        )

        return ai_yanit_al(
            sistem_promptu=sistem_promptu,
            mesajlar=[{"role": "user", "content": "Raporu olustur."}],
            max_token=1024
        )

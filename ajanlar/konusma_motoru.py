from pathlib import Path
from groq_baglanti import ai_yanit_al

PROMPTLAR = Path(__file__).parent.parent / "promptlar"
SENARYO_ADLARI = {
    "kafe": "cafe",
    "hastane": "hospital",
    "alisveris": "shopping",
    "otel": "hotel",
    "is_gorusmesi": "job interview",
}


class KonusmaMotoru:

    def _sablon_al(self) -> str:
        return (PROMPTLAR / "karakter_sablon.txt").read_text(encoding="utf-8")

    def _senaryo_baglami_al(self, senaryo: str, seviye: str) -> str:
        dosya = PROMPTLAR / "senaryolar" / f"{senaryo}_{seviye.lower()}.txt"
        if not dosya.exists() and seviye.upper() == "C2":
            dosya = PROMPTLAR / "senaryolar" / f"{senaryo}_c1.txt"
        if not dosya.exists():
            raise FileNotFoundError(f"Senaryo dosyasi bulunamadi: {dosya.name}")
        return dosya.read_text(encoding="utf-8")

    def _sistem_promptu_hazirla(self, seviye: str, senaryo: str) -> str:
        sablon = self._sablon_al()
        baglam = self._senaryo_baglami_al(senaryo, seviye)
        return sablon.format(level=seviye, scenario_context=baglam)

    def _fallback_baslangic(self, seviye: str, senaryo: str) -> str:
        etiket = SENARYO_ADLARI.get(senaryo, "daily life")
        return (
            f"Hello. We will practice a {etiket} scenario at {seviye} level. "
            "Start with one short sentence in English and I will continue the conversation."
        )

    def _fallback_yazma(self, seviye: str, senaryo: str) -> str:
        etiket = SENARYO_ADLARI.get(senaryo, "daily life")
        return (
            f"Yazma gorevi: {etiket} konusunda kisa bir mesaj yaz.\n"
            f"Seviye: {seviye}\n"
            "Goal: Write 3 to 5 simple English sentences."
        )

    def _fallback_cevap(self, senaryo: str) -> str:
        etiket = SENARYO_ADLARI.get(senaryo, "this topic")
        return f"Good start. Please add one more sentence about {etiket} and give a little more detail."

    def konusmayi_baslat(self, seviye: str, senaryo: str) -> str:
        # karakter ilk selamlama mesajini uretir
        try:
            sistem_promptu = self._sistem_promptu_hazirla(seviye, senaryo)
            return ai_yanit_al(
                sistem_promptu=sistem_promptu,
                mesajlar=[{"role": "user", "content": "start"}],
                max_token=200
            )
        except Exception:
            return self._fallback_baslangic(seviye, senaryo)

    def cevap_uret(self, gecmis: list, seviye: str, senaryo: str) -> str:
        try:
            sistem_promptu = self._sistem_promptu_hazirla(seviye, senaryo)
            return ai_yanit_al(
                sistem_promptu=sistem_promptu,
                mesajlar=gecmis,
                max_token=200
            )
        except Exception:
            return self._fallback_cevap(senaryo)

    def yazma_gorevi_baslat(self, seviye: str, senaryo: str) -> str:
        try:
            baglam = self._senaryo_baglami_al(senaryo, seviye)
            sistem_promptu = (
                "You create concise English writing prompts for learners.\n"
                f"CEFR Level: {seviye}\n"
                f"Scenario context: {baglam}\n"
                "Write one short task in Turkish and one sample goal in English.\n"
                "Keep it to 3 short lines maximum."
            )
            return ai_yanit_al(
                sistem_promptu=sistem_promptu,
                mesajlar=[{"role": "user", "content": "Yazma gorevini hazirla."}],
                max_token=160
            )
        except Exception:
            return self._fallback_yazma(seviye, senaryo)

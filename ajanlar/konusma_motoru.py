from pathlib import Path
from groq_baglanti import ai_yanit_al

PROMPTLAR = Path(__file__).parent.parent / "promptlar"


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

    def konusmayi_baslat(self, seviye: str, senaryo: str) -> str:
        # karakter ilk selamlama mesajini uretir
        sistem_promptu = self._sistem_promptu_hazirla(seviye, senaryo)
        return ai_yanit_al(
            sistem_promptu=sistem_promptu,
            mesajlar=[{"role": "user", "content": "start"}],
            max_token=200
        )

    def cevap_uret(self, gecmis: list, seviye: str, senaryo: str) -> str:
        sistem_promptu = self._sistem_promptu_hazirla(seviye, senaryo)
        return ai_yanit_al(
            sistem_promptu=sistem_promptu,
            mesajlar=gecmis,
            max_token=200
        )

    def yazma_gorevi_baslat(self, seviye: str, senaryo: str) -> str:
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

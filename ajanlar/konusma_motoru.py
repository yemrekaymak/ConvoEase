from pathlib import Path
import re
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
    _control_token_pattern = re.compile(r"<\|[^>]+?\|>")
    _space_pattern = re.compile(r"[ \t]+")
    _linebreak_pattern = re.compile(r"\n{3,}")

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
            f"English: Hello. We will practice a {etiket} scenario at {seviye} level. Start with one short sentence.\n"
            f"Turkce: Merhaba. {seviye} seviyesinde {etiket} senaryosu calisacagiz. Bir kisa Ingilizce cumleyle basla."
        )

    def _fallback_yazma(self, seviye: str, senaryo: str) -> str:
        etiket = SENARYO_ADLARI.get(senaryo, "daily life")
        return (
            f"Yazma gorevi: {etiket} konusunda kisa bir mesaj yaz.\n"
            f"Seviye: {seviye}\n"
            "English goal: Write 3 to 5 simple English sentences.\n"
            "Turkce: Bu konuda 3 ile 5 basit Ingilizce cumle yaz."
        )

    def _fallback_yazma_cevabi(self, senaryo: str) -> str:
        etiket = SENARYO_ADLARI.get(senaryo, "this topic")
        return (
            f"English: Good progress. Add one more short sentence about {etiket}.\n"
            f"Turkce: Iyi gidiyorsun. {etiket} hakkinda bir kisa cumle daha ekle."
        )

    def _fallback_cevap(self, senaryo: str) -> str:
        etiket = SENARYO_ADLARI.get(senaryo, "this topic")
        return (
            f"English: Good start. Add one more short sentence about {etiket}.\n"
            f"Turkce: Iyi basladin. {etiket} hakkinda bir kisa cumle daha ekle."
        )

    def _satiri_temizle(self, metin: str) -> str:
        temiz = self._control_token_pattern.sub(" ", metin or "")
        temiz = temiz.replace("\r", "\n")
        temiz = temiz.replace("English:", "").replace("Turkce:", "")
        temiz = self._space_pattern.sub(" ", temiz)
        temiz = self._linebreak_pattern.sub("\n\n", temiz)
        return temiz.strip(" \n-:")

    def _yaniti_bicimlendir(self, yanit: str, fallback: str) -> str:
        if not yanit or not yanit.strip():
            return fallback

        temiz = self._control_token_pattern.sub(" ", yanit).replace("\r", "\n").strip()
        temiz = self._linebreak_pattern.sub("\n\n", temiz)

        if "Turkce:" in temiz and "English:" not in temiz:
            english_part, turkce_part = temiz.split("Turkce:", 1)
            english = self._satiri_temizle(english_part)
            turkce = self._satiri_temizle(turkce_part)
            if english and turkce:
                return f"English: {english}\nTurkce: {turkce}"

        english_match = re.search(r"English:\s*(.+?)(?:\nTurkce:|\Z)", temiz, re.IGNORECASE | re.DOTALL)
        turkce_match = re.search(r"Turkce:\s*(.+)$", temiz, re.IGNORECASE | re.DOTALL)

        if english_match:
            english = self._satiri_temizle(english_match.group(1))
            turkce = self._satiri_temizle(turkce_match.group(1) if turkce_match else "")
            if english and turkce:
                return f"English: {english}\nTurkce: {turkce}"
            if english:
                return f"English: {english}"

        tek_satir = self._satiri_temizle(temiz)
        return tek_satir or fallback

    def konusmayi_baslat(self, seviye: str, senaryo: str) -> str:
        # karakter ilk selamlama mesajini uretir
        try:
            sistem_promptu = self._sistem_promptu_hazirla(seviye, senaryo)
            yanit = ai_yanit_al(
                sistem_promptu=sistem_promptu,
                mesajlar=[{"role": "user", "content": "start"}],
                max_token=120
            )
            return self._yaniti_bicimlendir(yanit, self._fallback_baslangic(seviye, senaryo))
        except Exception:
            return self._fallback_baslangic(seviye, senaryo)

    def cevap_uret(self, gecmis: list, seviye: str, senaryo: str) -> str:
        try:
            sistem_promptu = self._sistem_promptu_hazirla(seviye, senaryo)
            yanit = ai_yanit_al(
                sistem_promptu=sistem_promptu,
                mesajlar=gecmis,
                max_token=120
            )
            return self._yaniti_bicimlendir(yanit, self._fallback_cevap(senaryo))
        except Exception:
            return self._fallback_cevap(senaryo)

    def yazma_gorevi_baslat(self, seviye: str, senaryo: str) -> str:
        try:
            baglam = self._senaryo_baglami_al(senaryo, seviye)
            sistem_promptu = (
                "You create concise English writing prompts for learners.\n"
                f"CEFR Level: {seviye}\n"
                f"Scenario context: {baglam}\n"
                "Write a very short bilingual task.\n"
                "Line 1 must start with 'English:' and contain one short prompt in English.\n"
                "Line 2 must start with 'Turkce:' and contain the Turkish meaning.\n"
                "Line 3 must start with 'Goal:' and contain one short instruction in English.\n"
                "Keep the whole response to 3 short lines maximum."
            )
            return ai_yanit_al(
                sistem_promptu=sistem_promptu,
                mesajlar=[{"role": "user", "content": "Yazma gorevini hazirla."}],
                max_token=120
            )
        except Exception:
            return self._fallback_yazma(seviye, senaryo)

    def yazmaya_cevap_uret(self, kullanici_mesaji: str, seviye: str, senaryo: str) -> str:
        try:
            baglam = self._senaryo_baglami_al(senaryo, seviye)
            sistem_promptu = (
                "You are a concise writing practice partner.\n"
                f"CEFR Level: {seviye}\n"
                f"Scenario context: {baglam}\n"
                "Reply with only 2 lines.\n"
                "Line 1 must start with 'English:' and encourage the learner to continue the scenario.\n"
                "Line 2 must start with 'Turkce:' and give the short Turkish meaning.\n"
                "Do not repeat the learner's full text.\n"
                "Do not give grammar corrections.\n"
                "Do not exceed 2 short sentences in English."
            )
            yanit = ai_yanit_al(
                sistem_promptu=sistem_promptu,
                mesajlar=[{"role": "user", "content": kullanici_mesaji}],
                max_token=120
            )
            return self._yaniti_bicimlendir(yanit, self._fallback_yazma_cevabi(senaryo))
        except Exception:
            return self._fallback_yazma_cevabi(senaryo)

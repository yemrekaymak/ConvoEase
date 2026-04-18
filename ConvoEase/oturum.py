from dataclasses import dataclass, field


@dataclass
class Oturum:
    kullanici_id: str
    seviye: str      # A1, A2, B1
    senaryo: str     # kafe, hastane, alisveris, otel, is_gorusmesi
    tur_sayisi: int = 0
    puan_listesi: list = field(default_factory=list)
    hata_logu: list = field(default_factory=list)
    konusma_gecmisi: list = field(default_factory=list)

    def kullanici_turu_isle(self, mesaj: str):
        self.tur_sayisi += 1
        self.konusma_gecmisi.append({"role": "user", "content": mesaj})

    def karakter_cevabini_kaydet(self, cevap: str):
        self.konusma_gecmisi.append({"role": "assistant", "content": cevap})

    def degerlendirme_kaydet(self, degerlendirme: dict):
        self.puan_listesi.append(degerlendirme.get("puan", 0))
        self.hata_logu.append(degerlendirme)

    def ortalama_puan(self) -> float:
        if not self.puan_listesi:
            return 0.0
        return round(sum(self.puan_listesi) / len(self.puan_listesi), 1)

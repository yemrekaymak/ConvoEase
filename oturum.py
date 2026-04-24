from dataclasses import dataclass, field
import json


def _anlamli_metin_mi(metin: str) -> bool:
    sade = "".join(ch for ch in metin if ch.isalnum())
    return len(sade) >= 3


@dataclass
class Oturum:
    oturum_id: str
    kullanici_id: str
    backend_access_token: str
    seviye: str
    backend_seviye: str
    senaryo: str
    senaryo_id: int
    interaction_type: str
    tur_sayisi: int = 0
    puan_listesi: list = field(default_factory=list)
    hata_logu: list = field(default_factory=list)
    konusma_gecmisi: list = field(default_factory=list)
    onemli_turlar: list = field(default_factory=list)

    def kullanici_turu_isle(self, mesaj: str):
        self.tur_sayisi += 1
        self.konusma_gecmisi.append({"role": "user", "content": mesaj})
        self.onemli_turlar.append({
            "turn": self.tur_sayisi,
            "role": "user",
            "content": mesaj,
            "important": _anlamli_metin_mi(mesaj)
        })

    def karakter_cevabini_kaydet(self, cevap: str):
        if cevap:
            self.konusma_gecmisi.append({"role": "assistant", "content": cevap})
            self.onemli_turlar.append({
                "turn": self.tur_sayisi,
                "role": "assistant",
                "content": cevap,
                "important": True
            })

    def degerlendirme_kaydet(self, degerlendirme: dict):
        self.puan_listesi.append(degerlendirme.get("puan", 0))
        self.hata_logu.append(degerlendirme)
        if degerlendirme.get("hatalar"):
            self.onemli_turlar.append({
                "turn": self.tur_sayisi,
                "role": "evaluation",
                "important": True,
                "score": degerlendirme.get("puan", 0),
                "errors": degerlendirme.get("hatalar", []),
            })

    def ortalama_puan(self) -> float:
        if not self.puan_listesi:
            return 0.0
        return round(sum(self.puan_listesi) / len(self.puan_listesi), 1)

    def backend_mistakes(self) -> list[dict[str, str]]:
        kok = "Speaking" if self.interaction_type == "speaking" else "Writing"
        sonuc = []
        for kayit in self.hata_logu:
            for hata in kayit.get("hatalar", []):
                tur = hata.get("tur", "Genel")
                tur_baslik = tur.title() if isinstance(tur, str) else "Genel"
                sonuc.append({
                    "errorType": f"{kok}-{tur_baslik}",
                    "wrongSentence": str(hata.get("yanlis", "")).strip(),
                    "correctionText": str(hata.get("dogru", "")).strip(),
                    "whyWrong": str(hata.get("neden", "")).strip() or None,
                    "teachingTip": str(hata.get("ogretici_not", "")).strip() or None,
                })
        return [
            hata for hata in sonuc
            if hata["wrongSentence"] and hata["correctionText"]
        ]

    def ilerleme_jsonu_hazirla(self) -> str:
        error_totals = {"dilbilgisi": 0, "kelime": 0}
        onemli = []

        for kayit in self.onemli_turlar:
            if kayit.get("role") == "evaluation":
                for hata in kayit.get("errors", []):
                    tur = hata.get("tur")
                    if tur in error_totals:
                        error_totals[tur] += 1
                continue

            icerik = str(kayit.get("content", "")).strip()
            if kayit.get("important") or _anlamli_metin_mi(icerik):
                onemli.append({
                    "turn": kayit.get("turn"),
                    "role": kayit.get("role"),
                    "content": icerik,
                })

        veri = {
            "sessionId": self.oturum_id,
            "scenarioId": self.senaryo_id,
            "scenarioSlug": self.senaryo,
            "interactionType": self.interaction_type,
            "cefrLevel": self.seviye,
            "backendLevel": self.backend_seviye,
            "turnCount": self.tur_sayisi,
            "averageScore": self.ortalama_puan(),
            "errorTotals": error_totals,
            "importantTurns": onemli,
        }

        while len(json.dumps(veri, ensure_ascii=False).encode("utf-8")) > 10 * 1024 and veri["importantTurns"]:
            veri["importantTurns"].pop(0)

        return json.dumps(veri, ensure_ascii=False)

    def durum_sozlugu(self) -> dict:
        return {
            "oturum_id": self.oturum_id,
            "kullanici_id": self.kullanici_id,
            "backend_access_token": self.backend_access_token,
            "seviye": self.seviye,
            "backend_seviye": self.backend_seviye,
            "senaryo": self.senaryo,
            "senaryo_id": self.senaryo_id,
            "interaction_type": self.interaction_type,
            "tur_sayisi": self.tur_sayisi,
            "puan_listesi": self.puan_listesi,
            "hata_logu": self.hata_logu,
            "konusma_gecmisi": self.konusma_gecmisi,
            "onemli_turlar": self.onemli_turlar,
        }

    def durum_jsonu(self) -> str:
        return json.dumps(self.durum_sozlugu(), ensure_ascii=False)

    @classmethod
    def durumdan_yukle(cls, veri: dict | str):
        kaynak = json.loads(veri) if isinstance(veri, str) else veri
        return cls(
            oturum_id=str(kaynak["oturum_id"]),
            kullanici_id=str(kaynak.get("kullanici_id", "")),
            backend_access_token=str(kaynak.get("backend_access_token", "")),
            seviye=str(kaynak["seviye"]),
            backend_seviye=str(kaynak.get("backend_seviye", "")),
            senaryo=str(kaynak["senaryo"]),
            senaryo_id=int(kaynak["senaryo_id"]),
            interaction_type=str(kaynak["interaction_type"]),
            tur_sayisi=int(kaynak.get("tur_sayisi", 0)),
            puan_listesi=list(kaynak.get("puan_listesi", [])),
            hata_logu=list(kaynak.get("hata_logu", [])),
            konusma_gecmisi=list(kaynak.get("konusma_gecmisi", [])),
            onemli_turlar=list(kaynak.get("onemli_turlar", [])),
        )

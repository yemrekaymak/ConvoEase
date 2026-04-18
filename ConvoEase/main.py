import sys
from pathlib import Path

# ajanlar/ icindeki dosyalarin groq_baglanti'yi bulabilmesi icin
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from oturum import Oturum
from ajanlar.konusma_motoru import KonusmaMotoru
from ajanlar.degerlendirici import Degerlendirici
from ilerleme_takibi import (
    kullanici_ilerleme_al,
    senaryo_tamamla,
    acik_senaryolar,
    seviye_tamamlandi_mi,
    sonraki_seviye_ac,
)

app = FastAPI(title="ConvoEase API")

# frontend farkli bir portta calisacagi icin cors izni veriliyor
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

aktif_oturumlar: dict[str, Oturum] = {}

konusma_motoru = KonusmaMotoru()
degerlendirici = Degerlendirici()

GECERLI_SEVIYELER = ["A1", "A2", "B1","B2","C1"]
GECERLI_SENARYOLAR = ["kafe", "hastane", "alisveris", "otel", "is_gorusmesi"]


class OturumBaslatIstek(BaseModel):
    kullanici_id: str
    seviye: str
    senaryo: str


class MesajIstek(BaseModel):
    kullanici_id: str
    mesaj: str


class OturumBitirIstek(BaseModel):
    kullanici_id: str


@app.get("/ilerleme/{kullanici_id}")
def ilerleme_getir(kullanici_id: str, seviye: str = "A1"):
    if seviye not in GECERLI_SEVIYELER:
        raise HTTPException(status_code=400, detail="Gecersiz seviye.")

    ilerleme = kullanici_ilerleme_al(kullanici_id)
    aciklar = acik_senaryolar(kullanici_id, seviye)
    seviye_bitti = seviye_tamamlandi_mi(kullanici_id, seviye)

    return {
        "kullanici_id": kullanici_id,
        "seviye": seviye,
        "acik_senaryolar": aciklar,
        "seviye_tamamlandi": seviye_bitti,
        "detay": ilerleme.get(seviye, {})
    }


@app.post("/oturum/baslat")
def oturum_baslat(istek: OturumBaslatIstek):
    if istek.seviye not in GECERLI_SEVIYELER:
        raise HTTPException(status_code=400, detail="Gecersiz seviye. A1, A2 veya B1 olmali.")

    if istek.senaryo not in GECERLI_SENARYOLAR:
        raise HTTPException(status_code=400, detail=f"Gecersiz senaryo. Secenekler: {GECERLI_SENARYOLAR}")

    # kullanici bu senaryoya erisim hakki var mi kontrol et
    aciklar = acik_senaryolar(istek.kullanici_id, istek.seviye)
    if istek.senaryo not in aciklar:
        raise HTTPException(
            status_code=403,
            detail=f"Bu senaryo henuz kilitli. Acik senaryolar: {aciklar}"
        )

    oturum = Oturum(
        kullanici_id=istek.kullanici_id,
        seviye=istek.seviye,
        senaryo=istek.senaryo
    )
    aktif_oturumlar[istek.kullanici_id] = oturum

    ilk_mesaj = konusma_motoru.konusmayi_baslat(istek.seviye, istek.senaryo)

    return {
        "durum": "basarili",
        "karakter_mesaji": ilk_mesaj,
        "tur": 0
    }


@app.post("/mesaj/gonder")
def mesaj_gonder(istek: MesajIstek):
    if istek.kullanici_id not in aktif_oturumlar:
        raise HTTPException(status_code=404, detail="Aktif oturum bulunamadi.")

    oturum = aktif_oturumlar[istek.kullanici_id]

    oturum.kullanici_turu_isle(istek.mesaj)

    karakter_cevabi = konusma_motoru.cevap_uret(
        gecmis=oturum.konusma_gecmisi,
        seviye=oturum.seviye,
        senaryo=oturum.senaryo
    )

    degerlendirme = degerlendirici.anlik_degerlendir(
        kullanici_mesaji=istek.mesaj,
        seviye=oturum.seviye,
        senaryo=oturum.senaryo,
        tur_no=oturum.tur_sayisi
    )

    oturum.karakter_cevabini_kaydet(karakter_cevabi)
    oturum.degerlendirme_kaydet(degerlendirme)

    return {
        "karakter_mesaji": karakter_cevabi,
        "degerlendirme": degerlendirme,
        "tur": oturum.tur_sayisi
    }


@app.post("/oturum/bitir")
def oturum_bitir(istek: OturumBitirIstek):
    if istek.kullanici_id not in aktif_oturumlar:
        raise HTTPException(status_code=404, detail="Aktif oturum bulunamadi.")

    oturum = aktif_oturumlar[istek.kullanici_id]

    rapor = degerlendirici.oturum_raporu_olustur(
        hata_logu=oturum.hata_logu,
        seviye=oturum.seviye,
        senaryo=oturum.senaryo,
        toplam_tur=oturum.tur_sayisi
    )

    ortalama_puan = oturum.ortalama_puan()

    # ilerleme dosyasina kalici olarak kaydet
    senaryo_tamamla(
        kullanici_id=oturum.kullanici_id,
        seviye=oturum.seviye,
        senaryo=oturum.senaryo,
        puan=ortalama_puan
    )

    kilit_acildi = ortalama_puan >= 70

    # seviye tamamen bitti mi, varsa bir ust seviyeyi ac
    acilan_seviye = None
    if seviye_tamamlandi_mi(oturum.kullanici_id, oturum.seviye):
        acilan_seviye = sonraki_seviye_ac(oturum.kullanici_id, oturum.seviye)

    del aktif_oturumlar[istek.kullanici_id]

    return {
        "rapor": rapor,
        "ortalama_puan": ortalama_puan,
        "kilit_acildi": kilit_acildi,
        "acilan_seviye": acilan_seviye
    }


@app.get("/saglik")
def saglik_kontrolu():
    return {"durum": "calisiyor"}

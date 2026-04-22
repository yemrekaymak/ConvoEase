import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from backend_istemci import (
    BackendApiError,
    BackendIstemci,
    CEFR_TO_BACKEND_LEVEL,
    SCENARIO_SLUG_TO_NAME,
)
from oturum import Oturum
from ajanlar.konusma_motoru import KonusmaMotoru
from ajanlar.degerlendirici import Degerlendirici

load_dotenv()

app = FastAPI(title="ConvoEase AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

aktif_oturumlar: dict[str, Oturum] = {}

konusma_motoru = KonusmaMotoru()
degerlendirici = Degerlendirici()

GECERLI_SEVIYELER = ["A1", "A2", "B1", "B2", "C1", "C2"]
GECERLI_SENARYOLAR = ["kafe", "hastane", "alisveris", "otel", "is_gorusmesi"]
GECERLI_ETKILESIM_TURLERI = ["speaking", "writing"]
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://127.0.0.1:5136").strip()
BACKEND_SEVIYE_ADLARI = {
    1: "Beginner",
    2: "Intermediate",
    3: "Advanced",
}


class OturumBaslatIstek(BaseModel):
    kullanici_id: str
    access_token: str
    seviye: str
    senaryo: str
    interaction_type: str = "speaking"


class MesajIstek(BaseModel):
    oturum_id: str
    mesaj: str


class OturumBitirIstek(BaseModel):
    oturum_id: str


def _backend_istemci_olustur(access_token: str | None) -> BackendIstemci:
    if not access_token or not access_token.strip():
        raise HTTPException(status_code=400, detail="access_token gerekli.")
    return BackendIstemci(
        base_url=BACKEND_BASE_URL,
        authorization=f"Bearer {access_token.strip()}"
    )


def _allowed_scenario_bul(allowed_scenarios: list, slug: str):
    for scenario in allowed_scenarios:
        if scenario.slug == slug:
            return scenario
    return None


@app.post("/oturum/baslat")
def oturum_baslat(istek: OturumBaslatIstek):
    if istek.seviye not in GECERLI_SEVIYELER:
        raise HTTPException(status_code=400, detail="Gecersiz seviye.")

    if istek.senaryo not in GECERLI_SENARYOLAR:
        raise HTTPException(status_code=400, detail=f"Gecersiz senaryo. Secenekler: {GECERLI_SENARYOLAR}")

    if istek.interaction_type not in GECERLI_ETKILESIM_TURLERI:
        raise HTTPException(status_code=400, detail="interaction_type speaking veya writing olmali.")

    istemci = _backend_istemci_olustur(istek.access_token)

    try:
        istemci.seviye_esitle(istek.seviye)
        allowed_scenarios = istemci.izinli_senaryolari_getir()
        scenario = _allowed_scenario_bul(allowed_scenarios, istek.senaryo)
        if scenario is None:
            raise HTTPException(
                status_code=403,
                detail=f"Bu senaryo backend tarafinda henuz acik degil. Aciklar: {[x.slug for x in allowed_scenarios]}"
            )

        backend_session = istemci.oturum_baslat(
            scenario_id=scenario.scenario_id,
            interaction_type=istek.interaction_type
        )
    except BackendApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    backend_level = BACKEND_SEVIYE_ADLARI[CEFR_TO_BACKEND_LEVEL[istek.seviye]]
    oturum = Oturum(
        oturum_id=str(backend_session["id"]),
        kullanici_id=istek.kullanici_id,
        backend_access_token=istek.access_token.strip(),
        seviye=istek.seviye,
        backend_seviye=backend_level,
        senaryo=istek.senaryo,
        senaryo_id=scenario.scenario_id,
        interaction_type=istek.interaction_type,
    )
    aktif_oturumlar[oturum.oturum_id] = oturum

    if istek.interaction_type == "writing":
        ilk_mesaj = konusma_motoru.yazma_gorevi_baslat(istek.seviye, istek.senaryo)
    else:
        ilk_mesaj = konusma_motoru.konusmayi_baslat(istek.seviye, istek.senaryo)

    return {
        "durum": "basarili",
        "oturum_id": oturum.oturum_id,
        "scenario_id": scenario.scenario_id,
        "scenario_name": scenario.name,
        "scenario_slug": scenario.slug,
        "interaction_type": istek.interaction_type,
        "karakter_mesaji": ilk_mesaj,
        "tur": 0
    }


@app.post("/mesaj/gonder")
def mesaj_gonder(istek: MesajIstek):
    oturum = aktif_oturumlar.get(istek.oturum_id)
    if oturum is None:
        raise HTTPException(status_code=404, detail="Aktif oturum bulunamadi.")

    istemci = _backend_istemci_olustur(oturum.backend_access_token)
    oturum.kullanici_turu_isle(istek.mesaj)

    karakter_cevabi = None
    if oturum.interaction_type == "speaking":
        karakter_cevabi = konusma_motoru.cevap_uret(
            gecmis=oturum.konusma_gecmisi,
            seviye=oturum.seviye,
            senaryo=oturum.senaryo
        )

    degerlendirme = degerlendirici.anlik_degerlendir(
        kullanici_mesaji=istek.mesaj,
        seviye=oturum.seviye,
        senaryo=oturum.senaryo,
        tur_no=oturum.tur_sayisi,
        interaction_type=oturum.interaction_type
    )

    if karakter_cevabi:
        oturum.karakter_cevabini_kaydet(karakter_cevabi)
    oturum.degerlendirme_kaydet(degerlendirme)

    try:
        istemci.ilerleme_guncelle(
            session_id=oturum.oturum_id,
            last_progress_json=oturum.ilerleme_jsonu_hazirla()
        )
    except BackendApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "oturum_id": oturum.oturum_id,
        "karakter_mesaji": karakter_cevabi,
        "degerlendirme": degerlendirme,
        "tur": oturum.tur_sayisi
    }


@app.post("/oturum/bitir")
def oturum_bitir(istek: OturumBitirIstek):
    oturum = aktif_oturumlar.get(istek.oturum_id)
    if oturum is None:
        raise HTTPException(status_code=404, detail="Aktif oturum bulunamadi.")

    istemci = _backend_istemci_olustur(oturum.backend_access_token)
    rapor = degerlendirici.oturum_raporu_olustur(
        hata_logu=oturum.hata_logu,
        seviye=oturum.seviye,
        senaryo=oturum.senaryo,
        toplam_tur=oturum.tur_sayisi,
        interaction_type=oturum.interaction_type
    )
    ortalama_puan = oturum.ortalama_puan()
    mistakes = oturum.backend_mistakes()

    try:
        tamamlanan = istemci.oturum_tamamla(
            session_id=oturum.oturum_id,
            score=ortalama_puan,
            mistakes=mistakes,
            summary_report=rapor
        )
        backend_raporu = istemci.rapor_getir(oturum.oturum_id)
    except BackendApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    finally:
        del aktif_oturumlar[istek.oturum_id]

    return {
        "oturum_id": oturum.oturum_id,
        "senaryo": SCENARIO_SLUG_TO_NAME.get(oturum.senaryo, oturum.senaryo),
        "interaction_type": oturum.interaction_type,
        "rapor": rapor,
        "ortalama_puan": ortalama_puan,
        "tamamlanan_session": tamamlanan,
        "backend_raporu": backend_raporu,
        "mistake_sayisi": len(mistakes)
    }


@app.get("/saglik")
def saglik_kontrolu():
    return {"durum": "calisiyor"}

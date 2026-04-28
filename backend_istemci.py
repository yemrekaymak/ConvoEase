import json
from dataclasses import dataclass
from typing import Any
from urllib import error, parse, request


CEFR_TO_BACKEND_LEVEL = {
    "A1": 1,
    "A2": 1,
    "B1": 2,
    "B2": 2,
    "C1": 3,
    "C2": 3,
}

SCENARIO_SLUG_TO_NAME = {
    "kafe": "Cafe",
    "hastane": "Hospital",
    "alisveris": "Shopping",
    "otel": "Hotel",
    "is_gorusmesi": "Job Interview",
}

INTERACTION_TYPE_TO_BACKEND = {
    "speaking": 1,
    "writing": 2,
}


class BackendApiError(RuntimeError):
    pass


@dataclass(frozen=True)
class AllowedScenario:
    scenario_id: int
    name: str
    slug: str


class BackendIstemci:
    def __init__(self, base_url: str, authorization: str):
        self.base_url = base_url.rstrip("/")
        self.authorization = authorization.strip()

    def seviye_esitle(self, cefr_seviye: str) -> dict[str, Any]:
        backend_level = CEFR_TO_BACKEND_LEVEL[cefr_seviye]
        return self._json_istek("POST", "/api/users/level", {"currentLevel": backend_level})

    def izinli_senaryolari_getir(self) -> list[AllowedScenario]:
        veri = self._json_istek("GET", "/api/scenarios/allowed")
        sonuc = []
        for kayit in veri:
            slug = str(kayit.get("promptKey") or "").strip()
            if not slug:
                continue
            sonuc.append(
                AllowedScenario(
                    scenario_id=int(kayit["id"]),
                    name=str(kayit["name"]),
                    slug=slug,
                )
            )
        return sonuc

    def oturum_baslat(self, scenario_id: int, interaction_type: str) -> dict[str, Any]:
        return self._json_istek(
            "POST",
            "/api/sessions",
            {
                "scenarioId": scenario_id,
                "interactionType": INTERACTION_TYPE_TO_BACKEND[interaction_type],
            },
        )

    def ilerleme_guncelle(self, session_id: str, last_progress_json: str) -> dict[str, Any]:
        return self._json_istek(
            "PATCH",
            f"/api/sessions/{session_id}/progress",
            {"lastProgressJson": last_progress_json},
        )

    def oturum_tamamla(
        self,
        session_id: str,
        score: float,
        mistakes: list[dict[str, str]],
        summary_report: str,
    ) -> dict[str, Any]:
        return self._json_istek(
            "POST",
            "/api/sessions/complete",
            {
                "sessionId": session_id,
                "score": round(score, 1),
                "summaryReport": summary_report,
                "mistakes": mistakes,
            },
        )

    def rapor_getir(self, session_id: str) -> dict[str, Any]:
        return self._json_istek("GET", f"/api/sessions/{session_id}/report")

    def _json_istek(self, method: str, path: str, payload: dict[str, Any] | None = None) -> Any:
        url = parse.urljoin(f"{self.base_url}/", path.lstrip("/"))
        veri = None if payload is None else json.dumps(payload).encode("utf-8")
        headers = {
            "Authorization": self.authorization,
            "Accept": "application/json",
        }
        if veri is not None:
            headers["Content-Type"] = "application/json"

        istek = request.Request(url=url, data=veri, headers=headers, method=method)
        try:
            with request.urlopen(istek, timeout=15) as yanit:
                icerik = yanit.read().decode("utf-8")
                return json.loads(icerik) if icerik else None
        except error.HTTPError as exc:
            try:
                detay = json.loads(exc.read().decode("utf-8"))
                mesaj = detay.get("message") or detay.get("title") or str(detay)
            except Exception:
                mesaj = exc.reason
            raise BackendApiError(f"{method} {path} basarisiz: {mesaj}") from exc
        except error.URLError as exc:
            raise BackendApiError(f"Backend baglantisi kurulamadi: {exc.reason}") from exc

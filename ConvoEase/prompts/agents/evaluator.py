import json
import os
from pathlib import Path
from anthropic import Anthropic

client = Anthropic()
PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def _load_prompt(filename: str) -> str:
    return (PROMPTS_DIR / filename).read_text(encoding="utf-8")


def run_instant_eval(
    user_message: str,
    user_level: str,
    scenario: str,
    turn_number: int,
) -> dict:
    """
    Her kullanıcı mesajından sonra arka planda çalışır.
    Hataları JSON olarak döndürür, kullanıcı görmez.

    Returns:
        dict — anlık kayıt JSON'ı
    """
    prompt = _load_prompt("instant_eval.txt").format(
        user_level=user_level,
        scenario=scenario,
        turn_number=turn_number,
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = response.content[0].text.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # JSON parse başarısız olursa boş kayıt döndür
        return {
            "turn": turn_number,
            "user_message": user_message,
            "errors": [],
            "fluency_note": None,
        }


def run_session_report(
    error_log: list[dict],
    user_level: str,
    scenario: str,
    total_turns: int,
) -> str:
    """
    Oturum sonunda tüm hata loglarını alır, kullanıcıya Türkçe rapor üretir.

    Args:
        error_log: run_instant_eval() çıktılarının listesi
        user_level: beginner / intermediate / advanced
        scenario: cafe / hotel / hospital / job_interview / shopping
        total_turns: toplam tur sayısı

    Returns:
        str — kullanıcıya gösterilecek Türkçe rapor metni
    """
    prompt = _load_prompt("session_report.txt").format(
        user_level=user_level,
        scenario=scenario,
        total_turns=total_turns,
        error_log=json.dumps(error_log, ensure_ascii=False, indent=2),
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        system=prompt,
        messages=[{"role": "user", "content": "Lütfen oturum raporunu oluştur."}],
    )

    return response.content[0].text.strip()


def run_writing_feedback(
    user_message: str,
    user_level: str,
    scenario: str,
) -> str:
    """
    Yazma modunda her mesajdan sonra anlık geri bildirim üretir.
    Çıktı doğrudan kullanıcıya gösterilir.

    Returns:
        str — Türkçe geri bildirim metni
    """
    prompt = _load_prompt("writing_mode.txt").format(
        user_level=user_level,
        scenario=scenario,
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    return response.content[0].text.strip()
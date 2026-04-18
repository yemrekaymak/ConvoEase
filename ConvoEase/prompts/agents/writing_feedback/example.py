"""
ConvoEase — Değerlendirici Ajan kullanım örnekleri

Çalıştırmadan önce:
    pip install anthropic
    export ANTHROPIC_API_KEY="sk-..."
"""

from agents.evaluator import run_writing_feedback
from utils.session import Session


# ── YAZMA MODU ────────────────────────────────────────────────────────────────
def demo_writing_mode():
    print("=" * 50)
    print("YAZMA MODU")
    print("=" * 50)

    user_message = "I want order a coffee please, how much is costing?"

    feedback = run_writing_feedback(
        user_message=user_message,
        user_level="beginner",
        scenario="cafe",
    )

    print(f"Kullanıcı: {user_message}\n")
    print("Geri Bildirim:")
    print(feedback)


# ── KONUŞMA MODU (anlık kayıt + oturum sonu raporu) ──────────────────────────
def demo_conversation_mode():
    print("\n" + "=" * 50)
    print("KONUŞMA MODU")
    print("=" * 50)

    session = Session(user_level="beginner", scenario="cafe")

    # Simüle edilmiş konuşma turları
    turns = [
        "I want order a coffee please.",
        "Can I have the menu? I am looking since ten minute.",
        "This coffee is very delicious, I drink it every morning in home.",
    ]

    for msg in turns:
        print(f"\nTur {session.turn_number + 1} — Kullanıcı: {msg}")
        result = session.process_turn(msg)
        hata_sayisi = len(result.get("errors", []))
        print(f"  → {hata_sayisi} hata loglandı (kullanıcı görmedi)")

    # Oturum sonu
    print("\n" + "=" * 50)
    print("OTURUM SONU RAPORU")
    print("=" * 50)
    report = session.end_session()
    print(report)


if __name__ == "__main__":
    demo_writing_mode()
    demo_conversation_mode()
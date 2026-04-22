import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# llama 3.3 70b: hizli ve yeterince guclu, konusma icin ideal
MODEL = "llama-3.3-70b-versatile"
_istemci = None


def _istemci_al() -> Groq:
    global _istemci
    if _istemci is not None:
        return _istemci

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY tanimli degil. AI yanitlari icin ortam degiskenini ayarlayin.")

    _istemci = Groq(api_key=api_key)
    return _istemci


def ai_yanit_al(sistem_promptu: str, mesajlar: list, max_token: int = 1024) -> str:
    yanit = _istemci_al().chat.completions.create(
        model=MODEL,
        max_tokens=max_token,
        messages=[
            {"role": "system", "content": sistem_promptu},
            *mesajlar
        ]
    )
    return yanit.choices[0].message.content.strip()

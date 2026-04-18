import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# tum ajanlar bu istemciyi kullanir
istemci = Groq(api_key=os.getenv("GROQ_API_KEY"))

# llama 3.3 70b: hizli ve yeterince guclu, konusma icin ideal
MODEL = "llama-3.3-70b-versatile"


def ai_yanit_al(sistem_promptu: str, mesajlar: list, max_token: int = 1024) -> str:
    yanit = istemci.chat.completions.create(
        model=MODEL,
        max_tokens=max_token,
        messages=[
            {"role": "system", "content": sistem_promptu},
            *mesajlar
        ]
    )
    return yanit.choices[0].message.content.strip()

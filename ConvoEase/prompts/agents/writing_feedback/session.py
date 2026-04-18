from dataclasses import dataclass, field
from agents.evaluator import run_instant_eval, run_session_report


@dataclass
class Session:
    user_level: str       # beginner / intermediate / advanced
    scenario: str         # cafe / hotel / hospital / job_interview / shopping
    error_log: list = field(default_factory=list)
    turn_number: int = 0

    def process_turn(self, user_message: str) -> dict:
        """
        Konuşma modunda her tur çağrılır.
        Hataları loglar, kullanıcıya hiçbir şey döndürmez.
        """
        self.turn_number += 1
        result = run_instant_eval(
            user_message=user_message,
            user_level=self.user_level,
            scenario=self.scenario,
            turn_number=self.turn_number,
        )
        self.error_log.append(result)
        return result

    def end_session(self) -> str:
        """
        Oturum bittiğinde çağrılır.
        Türkçe rapor metni döndürür — kullanıcıya gösterilir.
        """
        return run_session_report(
            error_log=self.error_log,
            user_level=self.user_level,
            scenario=self.scenario,
            total_turns=self.turn_number,
        )
from services.ai_pipeline import ExtractedData

class OrchestratorEngine:
    def detect_conflicts(self, tasks: list) -> list:
        # Mock deadline conflict detection
        return ["No conflicts detected"]
        
    def score_priority(self, task: dict) -> int:
        # Mock basic priority scoring
        if task.get("risk_level") == "High":
            return 90
        return 50

orchestrator = OrchestratorEngine()

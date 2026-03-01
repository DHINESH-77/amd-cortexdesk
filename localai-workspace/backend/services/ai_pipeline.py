import re
from datetime import datetime
from schemas import ExtractedData, TaskCreate, StructuredSummary

class AIPipeline:
    def __init__(self):
        # In a real app, load local models like Llama.cpp or Transformers here
        pass

    def clean_text(self, text: str) -> str:
        if not text:
            return ""
        
        # Remove common timestamp patterns
        text = re.sub(r'\[\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?\]', '', text)
        text = re.sub(r'\b\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\b', '', text)
        text = re.sub(r'\b\d{1,2}:\d{2}:\d{2}\b', '', text)
        
        # Remove typical email headers 
        text = re.sub(r'^(From|To|Date|Subject):\s*.*$', '', text, flags=re.MULTILINE | re.IGNORECASE)
        
        # Remove repeated whitespace and newlines
        text = re.sub(r'\n+', '\n', text)
        text = re.sub(r' +', ' ', text)
        
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        return "\n".join(lines)

    def generate_structured_summary(self, text: str) -> StructuredSummary:
        summary = StructuredSummary(overview="")
        words = text.split()
        
        if len(words) < 5:
            summary.overview = "Input too short to summarize."
            return summary
            
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
        
        summary.overview = "The provided document discusses critical parameters, updates, or conversations captured across the inputs."
        if sentences:
            # Better overview based on first sentence
            summary.overview = f"This session focuses on {sentences[0][:100]}."
            
        key_points = []
        for s in sentences:
            if any(word in s.lower() for word in ['important', 'critical', 'need', 'must', 'update', 'status', 'issue', 'decided', 'agreed']):
                key_points.append(s)
                if len(key_points) >= 5:
                    break
                    
        if not key_points and len(sentences) > 1:
            key_points = sentences[:3]
            
        summary.key_points = key_points
        return summary

    def extract_structured_data(self, raw_text: str) -> ExtractedData:
        text = self.clean_text(raw_text)
        data = ExtractedData(summary=self.generate_structured_summary(text))
        
        # Enhanced Entity Extraction
        entities = ["Dhinesh", "Alex", "Team", "Client", "John", "Me"]
        found_entities = []
        for name in entities:
            if name.lower() in text.lower():
                found_entities.append(name)
                
        # Split into candidates for tasks
        # We split by common sentence delimiters and list markers
        candidates = re.split(r'[.!?\n]|\s*[-•*]\s+', text)
        candidates = [c.strip() for c in candidates if len(c.strip()) > 10]
        
        for s in candidates:
            s_lower = s.lower()
            
            # BROAD TASK HEURISTICS
            is_task = False
            # 1. Mandatory/Action verbs
            if any(verb in s_lower for verb in ["need to", "must", "should", "will", "have to", "is urgent", "it is urgent", "please"]):
                is_task = True
            # 2. Command verbs at start
            if re.match(r'^(fix|update|deploy|check|create|send|email|call|verify|implement)\b', s_lower):
                is_task = True
            # 3. Task markers
            if "task:" in s_lower or "todo:" in s_lower or "action item:" in s_lower:
                is_task = True
            # 4. User context
            if "i need to" in s_lower or "i will" in s_lower:
                is_task = True
                
            if is_task:
                # Find potential owner
                owner = "Unassigned"
                for entity in found_entities:
                    if entity.lower() in s_lower:
                        owner = entity
                        break
                
                # Special cases for "I" and "My"
                if "i need to" in s_lower or "i will" in s_lower:
                    owner = "Me"
                        
                # Determine risk
                risk_level = "High" if any(kw in s_lower for kw in ["urgent", "asap", "immediately", "critical", "fix"]) else "Normal"
                
                # Clean title (remove "Task:" etc)
                title = s
                title = re.sub(r'^(task|todo|action item):\s*', '', title, flags=re.IGNORECASE)
                
                data.tasks.append(
                    TaskCreate(
                        title=title[:100] + "..." if len(title) > 100 else title,
                        description=f"Automated extraction: {s[:50]}...",
                        owner=owner,
                        risk_level=risk_level
                    )
                )

            # Issue/Risk Extraction
            if any(kw in s_lower for kw in ["risk", "issue", "problem", "bottleneck", "delay", "blocker"]):
                if s not in data.risks:
                    data.risks.append(s)
                    
            # Decision Extraction
            if any(kw in s_lower for kw in ["decided", "decision", "agreed", "consensus", "approval", "finalized"]):
                if s not in data.decisions:
                    data.decisions.append(s)
            
        return data

    def assign_tasks(self, data: ExtractedData) -> ExtractedData:
        for task in data.tasks:
            if not task.owner or task.owner == "Unassigned":
                task.owner = "Me"
                
            # If no explicit deadline, maybe default to tomorrow
            if not task.deadline:
                task.deadline = datetime.utcnow()
                
        return data

ai_pipeline = AIPipeline()

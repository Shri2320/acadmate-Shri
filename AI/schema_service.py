import logging
from typing import Dict

logger = logging.getLogger(__name__)


class SchemaService:
    """
    Service for generating exam-style answers based on mark allocation.
    Provides structured prompts for different mark schemes.
    """
    
    # Mark-based answer schemas
    SCHEMAS = {
        1: {
            "name": "1 Mark Answer",
            "structure": "Definition only",
            "max_tokens": 100,
            "temperature": 0.2,
            "guidelines": [
                "Provide only a concise definition",
                "1-2 sentences maximum",
                "Use clear, precise language",
                "No examples or elaboration"
            ]
        },
        2: {
            "name": "2 Mark Answer",
            "structure": "Definition + Example",
            "max_tokens": 200,
            "temperature": 0.3,
            "guidelines": [
                "Start with a clear definition (1-2 sentences)",
                "Provide one relevant example",
                "Keep it concise and direct",
                "Example should illustrate the concept"
            ]
        },
        3: {
            "name": "3 Mark Answer",
            "structure": "Definition + Explanation + Example",
            "max_tokens": 300,
            "temperature": 0.3,
            "guidelines": [
                "Begin with a clear definition",
                "Explain the concept in 2-3 sentences",
                "Provide a relevant example with context",
                "Ensure logical flow between sections"
            ]
        },
        4: {
            "name": "4 Mark Answer",
            "structure": "Definition + Detailed Explanation + Examples",
            "max_tokens": 400,
            "temperature": 0.3,
            "guidelines": [
                "Start with a comprehensive definition",
                "Provide detailed explanation with key points",
                "Include 1-2 examples with context",
                "Cover important aspects of the topic"
            ]
        },
        5: {
            "name": "5 Mark Answer",
            "structure": "Definition + Explanation + Multiple Examples + Key Points",
            "max_tokens": 500,
            "temperature": 0.3,
            "guidelines": [
                "Begin with a complete definition",
                "Explain the concept thoroughly",
                "Provide 2-3 diverse examples",
                "Include key points or characteristics",
                "Show depth of understanding"
            ]
        },
        7: {
            "name": "7 Mark Answer",
            "structure": "Comprehensive Coverage",
            "max_tokens": 700,
            "temperature": 0.3,
            "guidelines": [
                "Detailed definition and context",
                "Thorough explanation with multiple aspects",
                "Multiple examples from different contexts",
                "Include advantages/disadvantages or applications",
                "Show comprehensive understanding"
            ]
        },
        10: {
            "name": "10 Mark Answer",
            "structure": "Complete Analysis",
            "max_tokens": 1000,
            "temperature": 0.3,
            "guidelines": [
                "Comprehensive definition with context",
                "Detailed explanation covering all aspects",
                "Multiple examples with detailed context",
                "Include types, categories, or classifications",
                "Discuss applications, advantages, and limitations",
                "Show critical analysis and depth"
            ]
        },
        15: {
            "name": "15 Mark Answer",
            "structure": "In-Depth Essay Style",
            "max_tokens": 1500,
            "temperature": 0.3,
            "guidelines": [
                "Structured with introduction, body, conclusion",
                "Comprehensive coverage of all aspects",
                "Multiple detailed examples and case studies",
                "Compare and contrast different approaches",
                "Discuss real-world applications",
                "Include diagrams or structured explanations where relevant",
                "Critical analysis and evaluation"
            ]
        }
    }
    
    @staticmethod
    def get_schema(marks: int) -> Dict:
        """
        Get the answer schema for given marks.
        Returns closest available schema if exact match not found.
        """
        # If exact match exists
        if marks in SchemaService.SCHEMAS:
            return SchemaService.SCHEMAS[marks]
        
        # Find closest schema
        available_marks = sorted(SchemaService.SCHEMAS.keys())
        closest = min(available_marks, key=lambda x: abs(x - marks))
        
        logger.info(f"No exact schema for {marks} marks, using {closest} mark schema")
        return SchemaService.SCHEMAS[closest]
    
    @staticmethod
    def build_system_prompt(marks: int) -> str:
        """
        Build system prompt based on mark allocation.
        """
        schema = SchemaService.get_schema(marks)
        
        system_prompt = f"""You are an expert academic tutor helping college students prepare for exams. 
You provide answers following strict academic marking schemes.

MARKING SCHEME: {schema['name']}
STRUCTURE: {schema['structure']}

GUIDELINES:
{chr(10).join(f"- {guideline}" for guideline in schema['guidelines'])}

IMPORTANT RULES:
- Answer ONLY based on the provided context
- If context lacks information, state it clearly
- Use academic language appropriate for college level
- Structure your answer according to the mark allocation
- Be precise and exam-focused
- Do not add information not present in the context

FORMAT YOUR ANSWER AS:
"""
        
        # Add format based on marks
        if marks == 1:
            system_prompt += "\nDefinition: [Your concise definition here]"
        
        elif marks == 2:
            system_prompt += """
Definition: [Clear definition]
Example: [One relevant example]"""
        
        elif marks == 3:
            system_prompt += """
Definition: [Clear definition]
Explanation: [Brief explanation]
Example: [Relevant example]"""
        
        elif marks >= 4 and marks <= 5:
            system_prompt += """
Definition: [Comprehensive definition]
Explanation: [Detailed explanation with key points]
Examples: [1-2 relevant examples]"""
        
        elif marks >= 7 and marks <= 10:
            system_prompt += """
Definition: [Complete definition with context]
Explanation: [Thorough explanation covering multiple aspects]
Examples: [Multiple diverse examples]
Key Points/Applications: [Important aspects or real-world applications]"""
        
        else:  # 15 marks or more
            system_prompt += """
Introduction: [Brief overview]
Definition: [Comprehensive definition]
Detailed Explanation: [Cover all major aspects]
Examples: [Multiple detailed examples]
Applications/Types: [Practical applications or classifications]
Analysis: [Critical evaluation]
Conclusion: [Summary of key points]"""
        
        return system_prompt
    
    @staticmethod
    def build_user_prompt(query: str, context: str, marks: int) -> str:
        """
        Build user prompt with context and query.
        """
        schema = SchemaService.get_schema(marks)
        
        prompt = f"""Context Information:
{context}

Question ({marks} marks): {query}

Provide a {schema['name']} following the structure: {schema['structure']}"""
        
        return prompt
    
    @staticmethod
    def get_temperature(marks: int) -> float:
        """
        Get appropriate temperature based on marks.
        Lower marks need more precision, higher marks allow more creativity.
        """
        schema = SchemaService.get_schema(marks)
        return schema['temperature']
    
    @staticmethod
    def get_max_tokens(marks: int) -> int:
        """
        Get appropriate max tokens based on marks.
        """
        schema = SchemaService.get_schema(marks)
        return schema['max_tokens']
    
    @staticmethod
    def validate_marks(marks: int) -> int:
        """
        Validate and normalize marks value.
        """
        if marks < 1:
            logger.warning(f"Invalid marks {marks}, setting to 1")
            return 1
        
        if marks > 20:
            logger.warning(f"Marks {marks} too high, capping at 15")
            return 15
        
        return marks
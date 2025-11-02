from __future__ import annotations

from livekit.agents import llm

class ArabicTurnDetector:
    """Simple Arabic-specific turn detector that works with heuristics."""
    
    def __init__(self, *, unlikely_threshold: float | None = None):
        self._unlikely_threshold = unlikely_threshold or 0.3

    async def supports_language(self, language: str | None) -> bool:
        """Check if the turn detector supports the given language."""
        if not language:
            return True  # Default support
        
        # Support only Arabic and English languages
        supported_langs = ["ar", "en"]  # Arabic, English only
        return any(language.startswith(lang) for lang in supported_langs)

    async def unlikely_threshold(self, language: str | None) -> float | None:
        """Return threshold for Arabic language only."""
        if not language:
            return self._unlikely_threshold
        
        # Support only Arabic language variants
        if language.startswith("ar"):
            return self._unlikely_threshold
            
        return None

    async def predict_end_of_turn(
        self,
        chat_ctx: llm.ChatContext,
        *,
        timeout: float | None = 3,
    ) -> float:
        """
        Predict end of turn for Arabic conversations using simple heuristics.
        """
        return await self._predict_arabic_eot(chat_ctx, timeout=timeout)

    async def _predict_arabic_eot(self, chat_ctx: llm.ChatContext, *, timeout: float | None = 3) -> float:
        """
        Simple heuristic-based Arabic end-of-turn detection.
        """
        try:
            # Try to get messages from the ChatContext
            messages = []
            if hasattr(chat_ctx, 'messages'):
                messages = chat_ctx.messages
            elif hasattr(chat_ctx, '_messages'):
                messages = chat_ctx._messages
            elif hasattr(chat_ctx, 'get_messages'):
                messages = chat_ctx.get_messages()
            
            if not messages:
                return 0.5
                
            last_message = messages[-1]
            content = ""
            
            # Extract content from the message
            if hasattr(last_message, 'content'):
                content = last_message.content
            elif hasattr(last_message, 'text'):
                content = last_message.text
            elif isinstance(last_message, str):
                content = last_message
                
            if not content:
                return 0.5
                
            content = content.strip()
            
            # Arabic punctuation that typically indicates end of utterance
            rtl_end_markers = ["؟", "!", ".", "،", "؛"]
            
            # Check if message ends with Arabic punctuation
            if any(content.endswith(marker) for marker in rtl_end_markers):
                return 0.8
            
            # Check for common Arabic question words at the beginning
            question_words = [
                # Arabic only
                "ماذا", "كيف", "أين", "متى", "لماذا", "هل", "ما"
            ]
            if any(content.startswith(word) for word in question_words):
                return 0.7
                
            # If message is short (likely a brief response), higher probability of EOT
            if len(content.split()) <= 3:
                return 0.6
                
        except Exception as e:
            # If we can't analyze the context, return neutral probability
            print(f"Arabic turn detector error: {e}")
            return 0.5
                
        # Default moderate probability
        return 0.4
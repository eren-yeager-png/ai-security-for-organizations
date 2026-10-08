"""Prompt-injection detection for retrieved document text.

Retrieved chunks are UNTRUSTED data. Authorization already guarantees a user
only ever retrieves documents they may read, so injected text cannot unlock
other documents (the model simply never has them). This module defends the
remaining risk: an authorized-but-malicious document trying to steer the
model (override its rules, impersonate the system, exfiltrate via links...).

Policy (see app.rag.service): passages that match any rule below are WITHHELD
from the answer generator and from the cited sources, and the event is audited.
Detection is heuristic (regex), so it favours catching obvious attacks over
perfect precision; false positives only withhold a passage, never grant access.
"""

import re

_FLAGS = re.IGNORECASE | re.MULTILINE

INJECTION_RULES: dict[str, re.Pattern[str]] = {
    "override_instructions": re.compile(
        r"\b(ignore|disregard|forget|override|bypass)\b[^.\n]{0,40}\b(previous|prior|above|earlier|preceding|all|any|system|your|the)?\s*"
        r"(instructions?|rules|prompts?|directions|guidelines|guardrails|restrictions|policies|permissions|classifications?)\b", _FLAGS),
    "role_reassignment": re.compile(
        r"\b(you are now|you're now|from now on you are|act as|pretend (to be|you are|that you are)|you have been (promoted|granted))\b[^.\n]{0,40}"
        r"\b(admin|administrator|root|system|developer|superuser|unrestricted|jailbroken|dan)\b", _FLAGS),
    "fake_authority_header": re.compile(
        r"(^|\n)\s*[#*>\[\(]*\s*(system|admin|administrator|developer|important admin|security)\s*(message|prompt|instruction|override|notice|mode|command)s?\s*[\]\)]*\s*:", _FLAGS),
    "chat_role_marker": re.compile(r"(^|\n)\s*(system|assistant)\s*:\s*\S", _FLAGS),
    "template_tokens": re.compile(r"<\|im_(start|end)\|>|\[/?INST\]|<</?SYS>>|<\|(system|assistant|user)\|>|</s>", _FLAGS),
    "authorization_claim": re.compile(
        r"\b(you are|you're|i am|user is)\s+(now\s+)?(authorized|allowed|permitted|cleared)\s+to\s+(reveal|access|see|view|ignore|bypass|disclose)", _FLAGS),
    "exfiltration_request": re.compile(
        r"\b(reveal|leak|dump|exfiltrate|disclose|print|return|output)\b[^.\n]{0,30}\b(system prompt|hidden (instructions|information|system information)|"
        r"confidential (documents|information|data)|every document|all documents|all (hidden|restricted|secret) )", _FLAGS),
    "bulk_dump_request": re.compile(
        r"\b(every|all)\s+(the\s+)?(documents?|files|records|data)\s+(in|from|across)\s+(the\s+)?(database|system|vector store|index|every classification|all classifications)\b", _FLAGS),
    "markdown_image_exfiltration": re.compile(r"!\[[^\]]*\]\(\s*https?://", _FLAGS),
}


def detect_prompt_injection(text: str) -> list[str]:
    """Names of the injection rules that match `text` (empty list = looks clean)."""
    return [name for name, pattern in INJECTION_RULES.items() if pattern.search(text)]

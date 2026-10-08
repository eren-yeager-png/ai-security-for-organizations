"""Sensitive-data (PII) detection and masking.

Regex-based detectors for well-defined identifier formats. Each detector has a
name (used in the redaction token, e.g. [EMAIL_REDACTED]) and a pattern.
Detectors are listed in priority order: when two matches overlap, the one from
the earlier detector wins (e.g. a 12-digit Aadhaar number is not also
reported as a phone number).

To add a new identifier type, append a Detector to DETECTORS.
"""

import re
from collections import Counter
from collections.abc import Callable
from dataclasses import dataclass
from enum import Enum


class PiiPolicy(str, Enum):
    DETECT = "DETECT"  # record findings, keep text unchanged
    MASK = "MASK"      # replace each finding with [TYPE_REDACTED]
    BLOCK = "BLOCK"    # refuse the document if anything is found


@dataclass(frozen=True)
class Detector:
    entity_type: str
    pattern: re.Pattern[str]
    group: int = 0  # which regex group holds the sensitive value
    validator: Callable[[str], bool] | None = None


@dataclass(frozen=True)
class Finding:
    entity_type: str
    start: int
    end: int


def _luhn_valid(value: str) -> bool:
    digits = [int(c) for c in value if c.isdigit()]
    if not 13 <= len(digits) <= 19:
        return False
    total = 0
    for index, digit in enumerate(reversed(digits)):
        if index % 2 == 1:
            digit *= 2
            if digit > 9:
                digit -= 9
        total += digit
    return total % 10 == 0


DETECTORS: list[Detector] = [
    Detector("EMAIL", re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")),
    # 13-19 digit card numbers (optionally space/dash separated), Luhn-checked.
    Detector("CREDIT_CARD", re.compile(r"(?<![\d-])\d(?:[ -]?\d){12,18}(?![\d-])"), validator=_luhn_valid),
    # Aadhaar-like: 12 digits, first digit 2-9, often written 4-4-4.
    Detector("AADHAAR", re.compile(r"(?<!\d)[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}(?!\d)")),
    # PAN-like: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).
    Detector("PAN", re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")),
    # Customer IDs: prefixed codes such as CUST-12345 / CID12345 ...
    Detector("CUSTOMER_ID", re.compile(r"\b(?:CUST|CID)[-_]?\d{4,12}\b", re.IGNORECASE)),
    # ... or any value labelled "Customer ID: X1234".
    Detector(
        "CUSTOMER_ID",
        re.compile(r"\bcustomer[ _-]?(?:id|no\.?|number)\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9-]{3,19})\b", re.IGNORECASE),
        group=1,
    ),
    # Indian mobile numbers (+91 / 0 prefix optional) ...
    Detector("PHONE", re.compile(r"(?<![\d+])(?:(?:\+|00)91[ -]?|0)?[6-9]\d{4}[ -]?\d{5}(?!\d)")),
    # ... and other international numbers written with a leading +country code.
    Detector("PHONE", re.compile(r"(?<![\d+])\+\d{1,3}[ -]?\(?\d{1,4}\)?(?:[ -]?\d{2,4}){2,4}(?!\d)")),
]


def detect_pii(text: str) -> list[Finding]:
    candidates: list[tuple[int, Finding]] = []
    for priority, detector in enumerate(DETECTORS):
        for match in detector.pattern.finditer(text):
            value = match.group(detector.group)
            if detector.validator and not detector.validator(value):
                continue
            candidates.append((priority, Finding(detector.entity_type, match.start(detector.group), match.end(detector.group))))

    # Keep higher-priority matches; drop anything overlapping an accepted one.
    accepted: list[Finding] = []
    for _, finding in sorted(candidates, key=lambda item: (item[0], item[1].start)):
        if all(finding.end <= kept.start or finding.start >= kept.end for kept in accepted):
            accepted.append(finding)
    return sorted(accepted, key=lambda finding: finding.start)


def mask_text(text: str, findings: list[Finding]) -> str:
    parts: list[str] = []
    cursor = 0
    for finding in findings:  # already sorted and non-overlapping
        parts.append(text[cursor:finding.start])
        parts.append(f"[{finding.entity_type}_REDACTED]")
        cursor = finding.end
    parts.append(text[cursor:])
    return "".join(parts)


def summarize(findings: list[Finding]) -> dict[str, int]:
    """Counts by entity type — safe to store and log (contains no PII values)."""
    return dict(Counter(finding.entity_type for finding in findings))

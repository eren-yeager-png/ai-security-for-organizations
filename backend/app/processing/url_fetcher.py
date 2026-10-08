"""Safe URL fetching (SSRF-guarded) and readable-text extraction from HTML.

SSRF protections:
  * only http/https, only ports 80/443, no credentials in the URL
  * hostnames like "localhost" / "*.local" / "*.internal" are rejected
  * the hostname is resolved and EVERY resolved address must be a public
    (globally routable) IP — loopback, private (10/8, 192.168/16, ...),
    link-local (incl. cloud metadata 169.254.169.254), CGNAT, multicast and
    reserved ranges are refused
  * redirects are followed manually (max 5) and every hop is re-validated
  * environment proxies are ignored, response size and time are capped

Known residual risk: DNS rebinding between our resolution check and the
HTTP client's own connection. Acceptable for this project's threat model;
mitigate at the network layer (egress firewall) in production.
"""

import ipaddress
import logging
import re
import socket
from dataclasses import dataclass
from urllib.parse import urljoin, urlsplit

import httpx
from bs4 import BeautifulSoup

from app.config import URL_FETCH_MAX_BYTES, URL_FETCH_TIMEOUT_SECONDS
from app.processing.extractors import ExtractionError, PageText, decode_text, extract_pdf

logger = logging.getLogger(__name__)

MAX_URL_LENGTH = 2048
MAX_REDIRECTS = 5
ALLOWED_SCHEMES = {"http", "https"}
ALLOWED_PORTS = {None, 80, 443}
BLOCKED_HOST_SUFFIXES = (".localhost", ".local", ".internal", ".localdomain", ".home.arpa")
HTML_TYPES = {"text/html", "application/xhtml+xml"}
NUMERIC_HOST = re.compile(r"(0x[0-9a-f]+|[0-9]+)(\.(0x[0-9a-f]+|[0-9]+))*", re.IGNORECASE)
NOISE_TAGS = ["script", "style", "noscript", "template", "svg", "iframe", "nav", "header", "footer", "aside", "form", "button"]


class UnsafeUrlError(ValueError):
    """The URL is malformed or points somewhere we refuse to connect to."""


def _is_public_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
        ip = ip.ipv4_mapped
    return ip.is_global and not ip.is_multicast


def validate_url_syntax(url: str) -> str:
    """Offline checks, used at registration time (returns 422 on failure)."""
    url = (url or "").strip()
    if not url or len(url) > MAX_URL_LENGTH:
        raise UnsafeUrlError("URL is empty or too long")
    try:
        parts = urlsplit(url)
        port = parts.port
    except ValueError as exc:
        raise UnsafeUrlError("URL is malformed") from exc
    if parts.scheme.lower() not in ALLOWED_SCHEMES:
        raise UnsafeUrlError("Only http and https URLs are allowed")
    if parts.username or parts.password:
        raise UnsafeUrlError("URLs containing credentials are not allowed")
    if port not in ALLOWED_PORTS:
        raise UnsafeUrlError("Only the default ports 80 and 443 are allowed")
    host = (parts.hostname or "").rstrip(".").lower()
    if not host:
        raise UnsafeUrlError("URL must include a host name")
    if host == "localhost" or host.endswith(BLOCKED_HOST_SUFFIXES):
        raise UnsafeUrlError("Internal host names are not allowed")
    try:
        literal_ip = ipaddress.ip_address(host)
    except ValueError:
        literal_ip = None
        if "." not in host:
            raise UnsafeUrlError("Host name must be a fully qualified domain")
        if NUMERIC_HOST.fullmatch(host):
            # Shorthand/octal/hex IPs (127.1, 0177.0.0.1, 0x7f.0.0.1) resolve to internal addresses.
            raise UnsafeUrlError("Non-standard IP address notation is not allowed")
    if literal_ip is not None and not _is_public_ip(literal_ip):
        raise UnsafeUrlError("Private, loopback and link-local addresses are not allowed")
    return url


def _assert_resolves_to_public_ips(url: str) -> None:
    parts = urlsplit(url)
    host = parts.hostname or ""
    port = parts.port or (443 if parts.scheme.lower() == "https" else 80)
    try:
        infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise ExtractionError("Host name could not be resolved") from exc
    addresses = {info[4][0].split("%")[0] for info in infos}
    if not addresses:
        raise ExtractionError("Host name could not be resolved")
    for address in addresses:
        if not _is_public_ip(ipaddress.ip_address(address)):
            logger.warning("url_fetch_blocked_private_address host_resolves_to_non_public_ip=true")
            raise ExtractionError("URL resolves to a private or internal address and was blocked")


@dataclass(frozen=True)
class FetchedResource:
    url: str
    content_type: str
    charset: str | None
    body: bytes


def _make_client() -> httpx.Client:
    # Separate function so tests can substitute a mock transport.
    return httpx.Client(
        follow_redirects=False,
        timeout=URL_FETCH_TIMEOUT_SECONDS,
        trust_env=False,
        headers={"User-Agent": "SecureAIAssistant-Ingestion/1.0", "Accept": "text/html,application/xhtml+xml,text/plain,application/pdf;q=0.9"},
    )


def fetch_url(url: str) -> FetchedResource:
    current = url
    with _make_client() as client:
        for _ in range(MAX_REDIRECTS + 1):
            try:
                validate_url_syntax(current)
            except UnsafeUrlError as exc:
                raise ExtractionError(f"Blocked URL: {exc}") from exc
            _assert_resolves_to_public_ips(current)
            try:
                with client.stream("GET", current) as response:
                    if response.is_redirect:
                        location = response.headers.get("location")
                        if not location:
                            raise ExtractionError("Redirect without a Location header")
                        current = urljoin(current, location)
                        continue
                    if response.status_code >= 400:
                        raise ExtractionError(f"Page is not accessible (HTTP {response.status_code})")
                    content_type = response.headers.get("content-type", "").split(";")[0].strip().lower()
                    body = bytearray()
                    for chunk in response.iter_bytes():
                        body.extend(chunk)
                        if len(body) > URL_FETCH_MAX_BYTES:
                            raise ExtractionError("Page is larger than the allowed download size")
                    return FetchedResource(current, content_type, response.charset_encoding, bytes(body))
            except httpx.TimeoutException as exc:
                raise ExtractionError("Timed out while fetching the URL") from exc
            except httpx.ConnectError as exc:
                raise ExtractionError("Could not connect to the URL's server") from exc
            except httpx.HTTPError as exc:
                raise ExtractionError("Request to the URL failed") from exc
    raise ExtractionError("Too many redirects")


def extract_html(body: bytes, charset: str | None = None) -> str:
    soup = BeautifulSoup(body, "html.parser", from_encoding=charset)
    for tag in soup(NOISE_TAGS):
        tag.decompose()
    root = soup.find("main") or soup.find("article") or soup.body or soup
    lines = (line.strip() for line in root.get_text("\n").splitlines())
    return "\n".join(line for line in lines if line)


def extract_url(url: str) -> list[PageText]:
    resource = fetch_url(url)
    if resource.content_type in HTML_TYPES or not resource.content_type:
        text = extract_html(resource.body, resource.charset)
    elif resource.content_type == "text/plain":
        text = decode_text(resource.body).strip()
    elif resource.content_type == "application/pdf":
        return extract_pdf(resource.body)
    else:
        raise ExtractionError(f"Unsupported content type: {resource.content_type[:100]}")
    if not text:
        raise ExtractionError("No readable text found at the URL")
    return [PageText(1, text.replace("\x00", ""))]

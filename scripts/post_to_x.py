#!/usr/bin/env python3
"""Post a tweet via X API v2, OAuth 1.0a signed. Stdlib only, no dependencies.

Reads credentials from environment variables (never hardcode them here):
  X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET

Usage: python3 post_to_x.py "tweet text here"
Exits non-zero and prints the API error body on failure - callers must check
the exit code rather than assume success.
"""
import hashlib
import hmac
import base64
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import uuid

API_URL = "https://api.twitter.com/2/tweets"


def oauth1_header(method, url, api_key, api_secret, token, token_secret):
    params = {
        "oauth_consumer_key": api_key,
        "oauth_nonce": uuid.uuid4().hex,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": token,
        "oauth_version": "1.0",
    }
    param_str = "&".join(
        f"{urllib.parse.quote(k, safe='')}={urllib.parse.quote(v, safe='')}"
        for k, v in sorted(params.items())
    )
    base_str = "&".join([
        method.upper(),
        urllib.parse.quote(url, safe=""),
        urllib.parse.quote(param_str, safe=""),
    ])
    signing_key = f"{urllib.parse.quote(api_secret, safe='')}&{urllib.parse.quote(token_secret, safe='')}"
    signature = base64.b64encode(
        hmac.new(signing_key.encode(), base_str.encode(), hashlib.sha1).digest()
    ).decode()
    params["oauth_signature"] = signature
    header = "OAuth " + ", ".join(
        f'{urllib.parse.quote(k, safe="")}="{urllib.parse.quote(v, safe="")}"'
        for k, v in sorted(params.items())
    )
    return header


def main():
    if len(sys.argv) != 2:
        print("Usage: post_to_x.py \"tweet text\"", file=sys.stderr)
        sys.exit(2)
    text = sys.argv[1]
    if len(text) > 280:
        print(f"FAILED: tweet is {len(text)} chars, over the 280 limit", file=sys.stderr)
        sys.exit(1)

    api_key = os.environ.get("X_API_KEY")
    api_secret = os.environ.get("X_API_SECRET")
    token = os.environ.get("X_ACCESS_TOKEN")
    token_secret = os.environ.get("X_ACCESS_TOKEN_SECRET")
    if not all([api_key, api_secret, token, token_secret]):
        print("FAILED: missing one of X_API_KEY/X_API_SECRET/X_ACCESS_TOKEN/X_ACCESS_TOKEN_SECRET", file=sys.stderr)
        sys.exit(1)

    auth_header = oauth1_header("POST", API_URL, api_key, api_secret, token, token_secret)
    body = json.dumps({"text": text}).encode()
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={
            "Authorization": auth_header,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            result = json.loads(resp.read())
            print(json.dumps(result))
            if "data" in result and "id" in result.get("data", {}):
                sys.exit(0)
            print("FAILED: unexpected response shape", file=sys.stderr)
            sys.exit(1)
    except urllib.error.HTTPError as e:
        print(f"FAILED: HTTP {e.code} - {e.read().decode()}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

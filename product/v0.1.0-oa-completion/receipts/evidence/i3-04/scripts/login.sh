#!/bin/bash
# 用法: login.sh <port> <username> -> 输出 accessToken
PORT=$1; USER=$2; PASS=${3:-admin123}
BASE="http://localhost:$PORT/api"
CH=$(curl -s "$BASE/auth/challenge")
CAPID=$(echo "$CH" | jq -r .data.captchaId)
PUB=$(echo "$CH" | jq -r .data.publicKey)
PUBPEM=$(mktemp); printf -- "-----BEGIN PUBLIC KEY-----\n%s\n-----END PUBLIC KEY-----\n" "$PUB" | fold -w 64 > "$PUBPEM"
ENC=$(printf '%s' "$PASS" | openssl pkeyutl -encrypt -pubin -inkey "$PUBPEM" -pkeyopt rsa_oaep_md:sha256 | base64)
TS=$(date +%s)000
RESP=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$USER\",\"password\":\"$ENC\",\"captcha\":\"1234\",\"captchaId\":\"$CAPID\",\"timestamp\":\"$TS\"}")
echo "$RESP" | jq -r '.data.accessToken'

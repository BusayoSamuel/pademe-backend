#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="${EMAIL:-stripe-test-$(date +%s)@example.com}"
PASSWORD="${PASSWORD:-TestPass123!}"

echo "==> Registering $EMAIL"
REGISTER=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$REGISTER" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
USER_ID=$(echo "$REGISTER" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

echo "==> Creating profile"
curl -s -X POST "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"id\":\"$USER_ID\",\"email\":\"$EMAIL\",\"firstName\":\"Jane\",\"lastName\":\"Doer\",\"dob\":\"1990-05-15\",\"phoneNo\":\"8012345678\",\"countryCode\":\"+353\",\"country\":\"IE\",\"city\":\"Dublin\",\"area\":\"City Centre\"}" \
  > /dev/null

echo "==> Starting Connect onboarding"
ONBOARDING=$(curl -s -X POST "$BASE_URL/stripe/connect/onboarding" \
  -H "Authorization: Bearer $TOKEN")

echo "$ONBOARDING" | python3 -m json.tool

URL=$(echo "$ONBOARDING" | python3 -c "import sys,json; print(json.load(sys.stdin).get('url',''))")

echo
echo "Open this URL in your browser to complete KYC:"
echo "$URL"
echo
echo "After finishing, check status with:"
echo "curl -s $BASE_URL/stripe/connect/status -H \"Authorization: Bearer $TOKEN\" | python3 -m json.tool"
echo
echo "Bearer token (save if needed):"
echo "$TOKEN"

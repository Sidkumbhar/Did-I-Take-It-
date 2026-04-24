#!/bin/bash
BASE="http://localhost:3000/api"
MED_ID="69ea62f6596943e2bfd68afc"

# Login
LOGIN_RESP=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"testuser@example.com","password":"test123456"}')
TOKEN=$(echo "$LOGIN_RESP" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "Token: ${TOKEN:0:20}..."

echo ""
echo "=== LOG DOSE (triggers email) ==="
curl -s -X POST "$BASE/medications/$MED_ID/log" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scheduleIndex":1,"status":"taken","loggedTime":"20:05"}'
echo ""

echo ""
echo "=== UPDATE DOSE TIME ==="
curl -s -X PATCH "$BASE/medications/$MED_ID/schedule/0" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"time":"09:00"}'
echo ""

echo ""
echo "=== DOSE HISTORY ==="
curl -s "$BASE/medications/history/logs" -H "Authorization: Bearer $TOKEN"
echo ""

echo ""
echo "=== DELETE MEDICATION ==="
curl -s -X DELETE "$BASE/medications/$MED_ID" -H "Authorization: Bearer $TOKEN"
echo ""

echo ""
echo "=== CHECK ADMIN NOTIFICATIONS (should have dose_taken now) ==="
ADMIN_RESP=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@diditakeit.com","password":"admin123"}')
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
curl -s "$BASE/admin/notifications" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; notifs=json.load(sys.stdin); [print(f'  [{n[\"type\"]}] {n[\"status\"]} - {n[\"subject\"]}') for n in notifs]" 2>/dev/null || curl -s "$BASE/admin/notifications" -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""
echo "=== DONE ==="

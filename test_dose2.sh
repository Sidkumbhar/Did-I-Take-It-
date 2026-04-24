#!/bin/bash
BASE="http://localhost:3000/api"
MED_ID="69ea62f6596943e2bfd68afc"

# Login first
LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"testuser@example.com","password":"test123456"}')
TOKEN=$(echo "$LOGIN" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "Logged in. Token: ${TOKEN:0:30}..."

echo ""
echo "--- LOG DOSE (triggers email) ---"
DOSE_RESP=$(curl -s -X POST "$BASE/medications/$MED_ID/log" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scheduleIndex":1,"status":"taken","loggedTime":"20:05"}')
echo "$DOSE_RESP"

echo ""
echo "--- UPDATE DOSE TIME ---"
TIME_RESP=$(curl -s -X PATCH "$BASE/medications/$MED_ID/schedule/0" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"time":"09:00"}')
echo "$TIME_RESP"

echo ""
echo "--- DOSE HISTORY ---"
curl -s "$BASE/medications/history/logs" -H "Authorization: Bearer $TOKEN"

echo ""
echo ""
echo "--- ADMIN NOTIFICATIONS (check email logs) ---"
ADMIN_LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@diditakeit.com","password":"admin123"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
NOTIFS=$(curl -s "$BASE/admin/notifications" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$NOTIFS" | head -c 500
echo "..."

echo ""
echo "--- ADMIN STATS ---"
curl -s "$BASE/admin/stats" -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""
echo "=== DONE ==="

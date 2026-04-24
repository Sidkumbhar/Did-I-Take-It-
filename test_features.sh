#!/bin/bash
# Feature test script for Did-I-Take-It

BASE="http://localhost:3000/api"

echo "=== FEATURE TEST SUITE ==="
echo ""

# 1. Login as existing test user
echo "--- 1. Login ---"
LOGIN_RESP=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"test123456"}')
echo "$LOGIN_RESP"
TOKEN=$(echo "$LOGIN_RESP" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "Token extracted: ${TOKEN:0:20}..."
echo ""

# 2. Get me
echo "--- 2. GET /me ---"
curl -s "$BASE/auth/me" -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# 3. List medications  
echo "--- 3. GET /medications ---"
MEDS_RESP=$(curl -s "$BASE/medications" -H "Authorization: Bearer $TOKEN")
echo "$MEDS_RESP"
MED_ID=$(echo "$MEDS_RESP" | sed -n 's/.*"_id":"\([^"]*\)".*/\1/p' | head -1)
echo "Med ID: $MED_ID"
echo ""

# 4. Log dose (triggers email)
echo "--- 4. LOG DOSE (triggers email) ---"
curl -s -X POST "$BASE/medications/$MED_ID/log" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scheduleIndex":1,"status":"taken","loggedTime":"20:05"}'
echo ""
echo ""

# 5. Get dose history
echo "--- 5. GET /medications/history/logs ---"
curl -s "$BASE/medications/history/logs" -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# 6. Update profile  
echo "--- 6. PATCH /me ---"
curl -s -X PATCH "$BASE/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notificationsEnabled":true}'
echo ""
echo ""

# 7. Update dose time
echo "--- 7. Update dose time ---"
curl -s -X PATCH "$BASE/medications/$MED_ID/schedule/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"time":"21:30"}'
echo ""
echo ""

# 8. Admin login
echo "--- 8. Admin Login ---"
ADMIN_RESP=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diditakeit.com","password":"admin123"}')
echo "$ADMIN_RESP"
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo ""

# 9. Admin stats
echo "--- 9. Admin Stats ---"
curl -s "$BASE/admin/stats" -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""
echo ""

# 10. Admin users
echo "--- 10. Admin Users ---"
curl -s "$BASE/admin/users" -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""
echo ""

# 11. Admin medications
echo "--- 11. Admin Medications ---"
curl -s "$BASE/admin/medications" -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""
echo ""

# 12. Admin notifications
echo "--- 12. Admin Notifications ---"
curl -s "$BASE/admin/notifications" -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""
echo ""

echo "=== TEST COMPLETE ==="

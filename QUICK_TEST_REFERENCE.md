# Quick Test Reference Card

## Start Local Dev Environment

```bash
cd /c/tmp/justenant_build
npm install
npm run build
npm run migrate
npm run seed
npm run dev
# API: http://localhost:3001 | Web: http://localhost:3000
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| **CMT** | cmt@testcompound.com | CMT@123 |
| **Tenant** | tenant@example.com | Tenant@123 |
| **Landlord** | landlord@example.com | Landlord@123 |
| **Service Provider** | serviceprovider@example.com | ServiceProvider@123 |
| **Super Admin** | superadmin@justanent.com | SuperAdmin@123 |

---

## Test Maintenance Workflow (5 min)

### 1️⃣ Tenant: Submit Request (1 min)
```
🌐 http://localhost:3000
📧 Login: tenant@example.com / Tenant@123
📍 Go to: /dashboard/tenant/maintenance
🔘 Click: "+ Submit Request"
✍️ Fill: Title & Description
💾 Click: "Submit"
```

### 2️⃣ CMT: View & Assign (1 min)
```
🔄 Logout & Login as CMT
📍 Go to: /dashboard/cmt/maintenance
✅ See pending request
🔘 Click: "Assign"
👤 Select: Service Provider
✔️ Click: "Assign"
```

### 3️⃣ Service Provider: Complete (2 min)
```
🔄 Logout & Login as Service Provider
📍 Go to: /dashboard/service-provider/tasks
🔘 Click: "Start Task"
✍️ Add notes & Click: "Complete Task"
✅ Verify: Status = COMPLETED
```

### 4️⃣ Verify in Reports
```
📍 Go to: /dashboard/service-provider/reports
✅ See completed task with completion time
```

---

## API Quick Test (curl)

### Get Auth Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cmt@testcompound.com","password":"CMT@123"}'
```

### Test Tenant Portal
```bash
TOKEN="your_token"
curl -X GET http://localhost:3001/api/tenant/profile \
  -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3001/api/tenant/unit \
  -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3001/api/tenant/contacts \
  -H "Authorization: Bearer $TOKEN"
```

### Test Landlord Management
```bash
TOKEN="your_token"
curl -X GET http://localhost:3001/api/landlord/dashboard-stats \
  -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3001/api/landlord/properties \
  -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3001/api/landlord/tenants \
  -H "Authorization: Bearer $TOKEN"
```

### Test Service Provider
```bash
TOKEN="your_token"
curl -X GET http://localhost:3001/api/service-provider/dashboard-stats \
  -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3001/api/service-provider/tasks \
  -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3001/api/service-provider/work-summary \
  -H "Authorization: Bearer $TOKEN"
```

---

## Frontend Pages to Test

### 🔧 Maintenance Workflow
- [ ] `/dashboard/tenant/maintenance` - Submit & view requests
- [ ] `/dashboard/cmt/maintenance` - Assign tasks
- [ ] `/dashboard/service-provider/tasks` - Complete tasks

### 👤 Tenant Portal
- [ ] `/dashboard/tenant` - Dashboard
- [ ] `/dashboard/tenant/unit` - Unit details
- [ ] `/dashboard/tenant/contacts` - Contacts

### 🏠 Landlord Management
- [ ] `/dashboard/landlord` - Dashboard with stats
- [ ] `/dashboard/landlord/properties` - Property list
- [ ] `/dashboard/landlord/properties/[id]` - Property details
- [ ] `/dashboard/landlord/tenants` - Tenant list

### 👨‍🔧 Service Provider
- [ ] `/dashboard/service-provider` - Dashboard
- [ ] `/dashboard/service-provider/profile` - Profile
- [ ] `/dashboard/service-provider/reports` - Work reports

---

## Key Testing Points

### ✅ Features Working?
- [ ] Maintenance: Tenant submit → CMT assign → SP complete
- [ ] Tenant: Can view unit, lease, contacts
- [ ] Landlord: Can see properties, occupancy, tenants
- [ ] SP: Can start/complete tasks, see reports

### ✅ Data Correct?
- [ ] Maintenance status changes (PENDING → ASSIGNED → IN_PROGRESS → COMPLETED)
- [ ] Lease dates calculate "days remaining"
- [ ] Occupancy rates calculate correctly
- [ ] Completion times are accurate

### ✅ Access Control?
- [ ] Tenant only sees own data
- [ ] Landlord only sees own properties
- [ ] SP only sees assigned tasks
- [ ] CMT only sees own organization data

### ✅ Responsive Design?
- [ ] Mobile (320px) - single column
- [ ] Tablet (768px) - 2 columns
- [ ] Desktop (1200px) - 3-4 columns

---

## Common Quick Fixes

### Database out of sync?
```bash
npm run migrate
npm run seed
```

### Service provider not showing in dropdown?
```
Ensure SP belongs to same CMT as CMT user
Check: CMT Profile has same cmtId
```

### Lease dates not calculating?
```
Verify: leaseEnd is in future
Check: Date format is valid ISO string
```

### Can't assign task?
```
Verify: Request status is PENDING
Check: Service provider is ACTIVE
Ensure: SP belongs to same CMT
```

---

## 30-Second Test Flow

```
1. Login as Tenant
2. Submit maintenance request
3. Logout, login as CMT
4. Assign to Service Provider
5. Logout, login as SP
6. Start & complete task
7. Check reports
✅ Done!
```

---

## Contact Info for Issues

**Feature Issues:**
- Maintenance: Check `/MAINTENANCE_LIFECYCLE_IMPLEMENTATION.md`
- Tenant: Check `/TENANT_PORTAL_IMPLEMENTATION.md`
- Landlord: Check `/LANDLORD_PROPERTY_MANAGEMENT_IMPLEMENTATION.md`
- SP: Check `/SERVICE_PROVIDER_WORKFLOW_IMPLEMENTATION.md`

**Testing Help:**
- Detailed guide: `/TESTING_GUIDE.md`
- API endpoints: Each implementation doc
- Postman collection: See TESTING_GUIDE.md

---

## Success Criteria Checklist

When all these pass, features are working ✅

- [ ] Maintenance workflow completes end-to-end
- [ ] Tenant can see unit & lease info
- [ ] Landlord can see occupancy & tenants
- [ ] Service provider can track task completion
- [ ] All dashboards load with correct stats
- [ ] Filtering works on all list pages
- [ ] Mobile responsive on all pages
- [ ] Contact links work (tel:, mailto:)
- [ ] Status badges color-coded correctly
- [ ] Data isolation verified (no cross-tenant access)

🎉 When complete, system is ready for Coolify deployment!

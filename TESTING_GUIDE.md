# JusTenant Features - Comprehensive Testing Guide

**Date:** March 6, 2026
**Updated:** With Maintenance, Tenant, Landlord, and Service Provider features

---

## Quick Start Testing

### 1. Local Development Setup

```bash
# In /c/tmp/justenant_build directory

# Start the database (ensure Coolify DB is running or use local PostgreSQL)
# Update .env with DATABASE_URL if using local DB

# Install dependencies (if not already done)
npm install

# Build the API
npm run build:api

# Run migrations
npm run migrate

# Seed the database
npm run seed

# Start development servers
npm run dev
# This starts both API (port 3001) and Web (port 3000)
```

### 2. Test Accounts (Pre-seeded)

```
SUPER ADMIN:
- Email: superadmin@justanent.com
- Password: SuperAdmin@123
- Role: SUPER_ADMIN

PORTAL TEAM:
- Email: portal@justanent.com
- Password: Portal@123
- Role: PORTAL_TEAM

CMT (Compound Management Team):
- Email: cmt@testcompound.com
- Password: CMT@123
- Role: CMT

LANDLORD:
- Email: landlord@example.com
- Password: Landlord@123
- Role: LANDLORD

TENANT:
- Email: tenant@example.com
- Password: Tenant@123
- Role: TENANT

SERVICE PROVIDER:
- Email: serviceprovider@example.com
- Password: ServiceProvider@123
- Role: SERVICE_PROVIDER
```

---

## API Testing with CURL

### 1. Get Authentication Token

```bash
# Login as CMT
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cmt@testcompound.com",
    "password": "CMT@123"
  }'

# Response includes: accessToken, refreshToken
# Save the accessToken for subsequent requests
TOKEN="your_access_token_here"
```

---

## Feature 1: Maintenance Request Lifecycle

### Tenant: Submit Maintenance Request

```bash
TOKEN="your_tenant_token"

# 1. Submit a maintenance request
curl -X POST http://localhost:3001/api/maintenance/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Broken window in bedroom",
    "description": "The bedroom window frame is cracked and needs replacement",
    "mediaUrls": []
  }'

# Response: { id, title, description, status: "PENDING", ... }
# Save the request ID for next tests

REQUEST_ID="response_id_here"
```

### Tenant: View My Requests

```bash
TOKEN="your_tenant_token"

curl -X GET http://localhost:3001/api/maintenance/requests \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of tenant's maintenance requests
```

### CMT: View All Maintenance Requests

```bash
TOKEN="your_cmt_token"

curl -X GET http://localhost:3001/api/cmt/maintenance \
  -H "Authorization: Bearer $TOKEN"

# Response: All requests in CMT's organization
```

### CMT: Get Dashboard Stats

```bash
TOKEN="your_cmt_token"

curl -X GET http://localhost:3001/api/cmt/maintenance/stats \
  -H "Authorization: Bearer $TOKEN"

# Response: { pending, assigned, inProgress, completedThisMonth }
```

### CMT: Get Service Providers (for assignment)

```bash
TOKEN="your_cmt_token"

curl -X GET http://localhost:3001/api/cmt/service-providers \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of service providers in CMT
# Get a provider ID for the next step
PROVIDER_ID="provider_id_here"
```

### CMT: Assign Request to Service Provider

```bash
TOKEN="your_cmt_token"
REQUEST_ID="request_id"
PROVIDER_ID="provider_id"

curl -X POST http://localhost:3001/api/cmt/maintenance/$REQUEST_ID/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"providerId\": \"$PROVIDER_ID\"
  }"

# Response: Request with status: "ASSIGNED"
```

### Service Provider: View Assigned Tasks

```bash
TOKEN="your_service_provider_token"

curl -X GET http://localhost:3001/api/maintenance/tasks \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of assigned tasks
```

### Service Provider: Start Task

```bash
TOKEN="your_service_provider_token"
TASK_ID="task_id"

curl -X POST http://localhost:3001/api/maintenance/tasks/$TASK_ID/start \
  -H "Authorization: Bearer $TOKEN"

# Response: Task with status: "IN_PROGRESS"
```

### Service Provider: Complete Task

```bash
TOKEN="your_service_provider_token"
TASK_ID="task_id"

curl -X POST http://localhost:3001/api/maintenance/tasks/$TASK_ID/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerNotes": "Replaced window frame. Task completed successfully."
  }'

# Response: Task with status: "COMPLETED", completedAt timestamp
```

---

## Feature 2: Tenant Portal

### Tenant: Get Profile with Unit

```bash
TOKEN="your_tenant_token"

curl -X GET http://localhost:3001/api/tenant/profile \
  -H "Authorization: Bearer $TOKEN"

# Response: { firstName, lastName, phone, leaseStart, leaseEnd, unit: {...}, cmt: {...} }
```

### Tenant: Get Unit Details

```bash
TOKEN="your_tenant_token"

curl -X GET http://localhost:3001/api/tenant/unit \
  -H "Authorization: Bearer $TOKEN"

# Response: { id, name, floor, unitNumber, property: {...}, landlord: {...} }
```

### Tenant: Get CMT Contact

```bash
TOKEN="your_tenant_token"

curl -X GET http://localhost:3001/api/tenant/cmt-details \
  -H "Authorization: Bearer $TOKEN"

# Response: { businessName, businessAddress, contactPhone, email }
```

### Tenant: Get Maintenance Stats

```bash
TOKEN="your_tenant_token"

curl -X GET http://localhost:3001/api/tenant/maintenance-stats \
  -H "Authorization: Bearer $TOKEN"

# Response: { totalRequests, pendingRequests, completedRequests }
```

### Tenant: Get All Contacts

```bash
TOKEN="your_tenant_token"

curl -X GET http://localhost:3001/api/tenant/contacts \
  -H "Authorization: Bearer $TOKEN"

# Response: { landlord: {...}, cmt: {...}, tenant: {...} }
```

---

## Feature 3: Landlord Property Management

### Landlord: Get Profile

```bash
TOKEN="your_landlord_token"

curl -X GET http://localhost:3001/api/landlord/profile \
  -H "Authorization: Bearer $TOKEN"

# Response: { firstName, lastName, phone, cmt: {...} }
```

### Landlord: Get Dashboard Stats

```bash
TOKEN="your_landlord_token"

curl -X GET http://localhost:3001/api/landlord/dashboard-stats \
  -H "Authorization: Bearer $TOKEN"

# Response: { properties, totalUnits, activeUnits, vacantUnits }
```

### Landlord: Get Occupancy Stats

```bash
TOKEN="your_landlord_token"

curl -X GET http://localhost:3001/api/landlord/rental-stats \
  -H "Authorization: Bearer $TOKEN"

# Response: { totalProperties, totalUnits, occupiedUnits, occupancyRate }
```

### Landlord: Get All Properties

```bash
TOKEN="your_landlord_token"

curl -X GET http://localhost:3001/api/landlord/properties \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of properties with units and occupancy
```

### Landlord: Get Property Details

```bash
TOKEN="your_landlord_token"
PROPERTY_ID="property_id"

curl -X GET http://localhost:3001/api/landlord/properties/$PROPERTY_ID \
  -H "Authorization: Bearer $TOKEN"

# Response: Property with all units and tenant information
```

### Landlord: Get Property Units

```bash
TOKEN="your_landlord_token"
PROPERTY_ID="property_id"

curl -X GET http://localhost:3001/api/landlord/properties/$PROPERTY_ID/units \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of units with tenant details
```

### Landlord: Get All Tenants

```bash
TOKEN="your_landlord_token"

curl -X GET http://localhost:3001/api/landlord/tenants \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of all tenants across landlord's properties
```

### Landlord: Get Maintenance Requests

```bash
TOKEN="your_landlord_token"

curl -X GET http://localhost:3001/api/landlord/maintenance-requests \
  -H "Authorization: Bearer $TOKEN"

# Response: All maintenance requests for landlord's properties
```

---

## Feature 4: Service Provider Workflow

### Service Provider: Get Profile

```bash
TOKEN="your_service_provider_token"

curl -X GET http://localhost:3001/api/service-provider/profile \
  -H "Authorization: Bearer $TOKEN"

# Response: { firstName, lastName, phone, serviceType, certifications, cmt: {...} }
```

### Service Provider: Get Dashboard Stats

```bash
TOKEN="your_service_provider_token"

curl -X GET http://localhost:3001/api/service-provider/dashboard-stats \
  -H "Authorization: Bearer $TOKEN"

# Response: { assigned, inProgress, totalCompleted, completedThisMonth }
```

### Service Provider: Get Response Time Stats

```bash
TOKEN="your_service_provider_token"

curl -X GET http://localhost:3001/api/service-provider/response-time-stats \
  -H "Authorization: Bearer $TOKEN"

# Response: { averageResponseTimeHours, maxResponseTimeHours, pendingTasks }
```

### Service Provider: Get Work Summary

```bash
TOKEN="your_service_provider_token"

# Current month (default)
curl -X GET http://localhost:3001/api/service-provider/work-summary \
  -H "Authorization: Bearer $TOKEN"

# Custom date range
curl -X GET "http://localhost:3001/api/service-provider/work-summary?startDate=2026-01-01&endDate=2026-03-06" \
  -H "Authorization: Bearer $TOKEN"

# Response: { totalTasksCompleted, averageCompletionTimeDays, ... }
```

### Service Provider: Get Completed Tasks This Month

```bash
TOKEN="your_service_provider_token"

curl -X GET http://localhost:3001/api/service-provider/completed-tasks/month \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of completed tasks with details
```

### Service Provider: Get CMT Contact

```bash
TOKEN="your_service_provider_token"

curl -X GET http://localhost:3001/api/service-provider/cmt-contact \
  -H "Authorization: Bearer $TOKEN"

# Response: { businessName, businessAddress, contactPhone, email }
```

---

## Browser Testing - End-to-End Workflow

### Test 1: Complete Maintenance Workflow

**Step 1: Login as Tenant**
```
Navigate to: http://localhost:3000
Email: tenant@example.com
Password: Tenant@123
```

**Step 2: Submit Maintenance Request**
```
Navigate to: http://localhost:3000/dashboard/tenant/maintenance
Click: "+ Submit Request"
Fill in:
  - Title: "Broken window"
  - Description: "Master bedroom window frame is cracked"
Click: "Submit"
Verify: Request appears in list with status "PENDING"
```

**Step 3: Logout and Login as CMT**
```
Logout
Navigate to: http://localhost:3000/dashboard/cmt/maintenance
Verify: The request you just submitted appears in the list
```

**Step 4: Assign to Service Provider**
```
Click: "Assign" button on the request
Select: A service provider from dropdown
Click: "Assign"
Verify: Status changes to "ASSIGNED"
```

**Step 5: Logout and Login as Service Provider**
```
Logout
Navigate to: http://localhost:3000/dashboard/service-provider
Verify: "Assigned" count shows 1
Verify: Dashboard displays task statistics
```

**Step 6: View and Start Task**
```
Click: "View Tasks" or navigate to /dashboard/service-provider/tasks
Click: Task row to see details
Click: "Start Task"
Verify: Task status changes to "IN_PROGRESS"
```

**Step 7: Complete Task**
```
Click: "Complete Task" button
Add notes: "Replaced window frame, applied sealant"
Click: "Complete Task"
Verify: Status changes to "COMPLETED"
Verify: Completion date is set
```

**Step 8: View Reports**
```
Click: "Reports" or navigate to /dashboard/service-provider/reports
Verify: Completed task appears in list
Verify: Completion time is calculated (e.g., "2 days")
```

**Step 9: Logout and Login as Tenant**
```
Logout
Navigate to: /dashboard/tenant/maintenance
Verify: Request status is now "COMPLETED"
Verify: Provider notes are visible
```

---

### Test 2: Tenant Portal Navigation

**Login as Tenant:**
```
Navigate to: http://localhost:3000
Email: tenant@example.com
Password: Tenant@123
```

**Test Dashboard:**
```
Navigate to: /dashboard/tenant
Verify: Shows unit assignment
Verify: Shows maintenance request stats
Verify: "View Unit Details" and "View Contacts" buttons visible
```

**Test Unit Details:**
```
Click: "View Unit Details" or navigate to /dashboard/tenant/unit
Verify: Shows unit name, floor, number
Verify: Shows property address
Verify: Shows lease start and end dates
Verify: Shows landlord contact info
Verify: Days remaining in lease calculated correctly
```

**Test Contacts:**
```
Navigate to: /dashboard/tenant/contacts
Verify: Shows your information
Verify: Shows landlord contact (phone, email clickable)
Verify: Shows CMT contact (phone, email clickable)
Verify: Phone links open tel: dialog
Verify: Email links open email client
```

---

### Test 3: Landlord Property Management

**Login as Landlord:**
```
Navigate to: http://localhost:3000
Email: landlord@example.com
Password: Landlord@123
```

**Test Dashboard:**
```
Navigate to: /dashboard/landlord
Verify: Shows property count
Verify: Shows unit counts
Verify: Shows occupancy rate with progress bar
Verify: Shows quick action cards
```

**Test Properties Page:**
```
Navigate to: /dashboard/landlord/properties
Verify: Lists all properties
Verify: Shows occupancy percentage per property
Verify: Color-coded occupancy bar (green/blue/yellow)
Click: "View Details" button
Verify: Navigate to property details page
```

**Test Property Details:**
```
Navigate to: /dashboard/landlord/properties/[propertyId]
Verify: Shows property summary
Verify: Shows occupancy rate
Verify: Shows all units in table
Verify: Shows tenant names for occupied units
Verify: Shows "Vacant" for empty units
Click: Unit "View" button
Verify: Modal shows unit details and tenant info
```

**Test Tenants Page:**
```
Navigate to: /dashboard/landlord/tenants
Verify: Lists all tenants
Verify: Shows property and unit assignment
Verify: Shows lease status badge
Verify: Filter buttons work (Active, Expiring, Expired)
Click: Tenant row
Verify: Shows full tenant details (contact info, lease dates)
```

---

### Test 4: Service Provider Workflow

**Login as Service Provider:**
```
Navigate to: http://localhost:3000
Email: serviceprovider@example.com
Password: ServiceProvider@123
```

**Test Dashboard:**
```
Navigate to: /dashboard/service-provider
Verify: Shows task statistics (assigned, in progress, completed)
Verify: Shows performance metrics (response time, completion time)
Verify: Shows alerts for active and pending tasks
Verify: Quick action cards visible
```

**Test Profile:**
```
Navigate to: /dashboard/service-provider/profile
Verify: Shows name and service type
Verify: Shows contact info
Verify: Shows account status
Verify: Shows work statistics
Verify: Shows CMT contact info
```

**Test Tasks:**
```
Navigate to: /dashboard/service-provider/tasks
Verify: Lists all assigned and in-progress tasks
Verify: Status badges color-coded correctly
Click: Filter buttons (All, Assigned, In Progress, Completed)
Verify: Filtering works correctly
Click: Task row
Verify: Shows full task details
Verify: Shows tenant contact info
Click: "Start Task"
Verify: Task moves to "In Progress"
Click: "Complete Task"
Verify: Add notes field appears
Click: "Complete Task"
Verify: Task marked as completed with timestamp
```

**Test Reports:**
```
Navigate to: /dashboard/service-provider/reports
Verify: Shows summary cards (completed count, avg time, completion rate)
Verify: Lists all completed tasks this month
Verify: Completion times calculated (in days)
Click: Task "View" button
Verify: Modal shows full task details
```

---

## Postman Testing Setup

### 1. Import Collection

Create a new Postman collection with these folders:

```
JusTenant Tests
├── Authentication
│   ├── Login CMT
│   ├── Login Tenant
│   ├── Login Landlord
│   └── Login Service Provider
├── Maintenance Workflow
│   ├── Tenant: Submit Request
│   ├── CMT: View Requests
│   ├── CMT: Assign to Provider
│   ├── SP: Start Task
│   ├── SP: Complete Task
│   └── CMT: View Stats
├── Tenant Portal
│   ├── Get Profile
│   ├── Get Unit
│   ├── Get Contacts
│   └── Get Maintenance Stats
├── Landlord Management
│   ├── Get Properties
│   ├── Get Property Details
│   ├── Get Tenants
│   └── Get Stats
└── Service Provider Workflow
    ├── Get Tasks
    ├── Get Dashboard Stats
    ├── Get Work Summary
    └── Get Reports
```

### 2. Environment Variables

Create a Postman environment with:

```json
{
  "base_url": "http://localhost:3001",
  "cmt_token": "your_cmt_token",
  "tenant_token": "your_tenant_token",
  "landlord_token": "your_landlord_token",
  "sp_token": "your_service_provider_token",
  "request_id": "request_id",
  "task_id": "task_id",
  "property_id": "property_id",
  "provider_id": "provider_id"
}
```

### 3. Example Requests

**Login (Pre-request Script):**
```javascript
// Pre-request Script tab
const loginRequest = {
  url: pm.environment.get('base_url') + '/api/auth/login',
  method: 'POST',
  header: {
    'Content-Type': 'application/json'
  },
  body: {
    mode: 'raw',
    raw: JSON.stringify({
      email: 'cmt@testcompound.com',
      password: 'CMT@123'
    })
  }
};

pm.sendRequest(loginRequest, function (err, response) {
  if (!err) {
    const jsonData = response.json();
    pm.environment.set('cmt_token', jsonData.accessToken);
  }
});
```

---

## Testing Checklist

### Maintenance Request Lifecycle ✅
- [ ] Tenant can submit maintenance request
- [ ] Tenant can view their requests
- [ ] CMT can view all requests
- [ ] CMT can assign request to service provider
- [ ] CMT can see dashboard stats
- [ ] Service provider receives assigned task
- [ ] Service provider can start task
- [ ] Service provider can complete task with notes
- [ ] Status transitions work correctly
- [ ] Completed task timestamp is set
- [ ] Tenant can see completion status

### Tenant Portal ✅
- [ ] Tenant can view profile
- [ ] Tenant can view assigned unit
- [ ] Tenant can see lease dates
- [ ] Tenant can see days remaining
- [ ] Tenant can view unit details
- [ ] Tenant can access contacts
- [ ] Tenant can see landlord contact
- [ ] Tenant can see CMT contact
- [ ] Phone links are clickable (tel:)
- [ ] Email links are clickable (mailto:)
- [ ] Dashboard shows maintenance stats
- [ ] Maintenance page shows requests

### Landlord Property Management ✅
- [ ] Landlord can view all properties
- [ ] Landlord can see occupancy rates
- [ ] Landlord can view property details
- [ ] Landlord can see units in property
- [ ] Landlord can see tenant info
- [ ] Landlord can see lease dates
- [ ] Landlord can view all tenants
- [ ] Landlord can filter tenants by lease status
- [ ] Occupancy bar displays correctly
- [ ] Color coding is correct (green/blue/yellow)
- [ ] Lease expiration alerts work
- [ ] Dashboard stats are accurate

### Service Provider Workflow ✅
- [ ] Service provider can view profile
- [ ] Service provider can see task stats
- [ ] Service provider can view assigned tasks
- [ ] Service provider can view task details
- [ ] Service provider can start task
- [ ] Service provider can complete task
- [ ] Service provider can add notes
- [ ] Service provider can view reports
- [ ] Completion time is calculated correctly
- [ ] Performance metrics display
- [ ] Response time stats display
- [ ] Work summary shows metrics

---

## Deployment Testing (Coolify)

### 1. Deploy to Coolify

```bash
# In your local repo
git push origin main

# The Coolify webhook should trigger automatic deployment
# Or manually trigger in Coolify dashboard
```

### 2. Verify Deployment

```bash
# Check if services are running
curl https://uk40oo08cos4k0cssoccs4gs.robot.dotid.ca/api/auth/health

# Should return 200 OK
```

### 3. Database Verification

```bash
# Connect to Coolify database
# Run migrations
npm run migrate

# Seed test data
npm run seed
```

### 4. Test on Coolify

- Navigate to: https://ps00wskc8o0oo4o0k8wks80c.robot.dotid.ca
- Login with test accounts
- Follow the same testing procedures as local testing
- Test each user role workflow
- Verify data persists across sessions
- Check network requests in browser DevTools

---

## Performance Testing

### Load Testing

```bash
# Using Apache Bench (if installed)
ab -n 100 -c 10 http://localhost:3001/api/cmt/maintenance

# Using wrk (if installed)
wrk -t12 -c400 -d30s http://localhost:3001/api/cmt/maintenance
```

### Response Time Targets

- API endpoints: < 200ms
- Dashboard load: < 1s
- List endpoints: < 500ms
- Detail endpoints: < 300ms

---

## Common Issues & Troubleshooting

### Issue: "CMT profile not found"
**Solution:** Ensure CMT is approved in database
```sql
UPDATE "CmtProfile" SET status = 'APPROVED' WHERE id = 'cmt_id';
```

### Issue: "Service Provider profile not found"
**Solution:** Ensure service provider is created and approved
```bash
# Check database for service provider record
# Verify user role is SERVICE_PROVIDER
```

### Issue: Task assignment fails
**Solution:** Verify service provider belongs to same CMT
```bash
# Check cmtId matches between CMT and Service Provider
```

### Issue: "Property not found or access denied"
**Solution:** Verify landlord owns the property
```bash
# Check landlordId in property record
```

### Issue: Lease calculation shows negative days
**Solution:** Verify lease end date is in future
```bash
# Check lease dates in database
UPDATE "TenantProfile" SET leaseEnd = NOW() + INTERVAL '30 days' WHERE id = 'tenant_id';
```

---

## Testing Summary

After completing these tests, you'll have verified:

✅ Complete maintenance request workflow (tenant → CMT → provider → completion)
✅ Tenant portal with unit viewing and lease tracking
✅ Landlord property management with occupancy analytics
✅ Service provider task workflow with completion tracking
✅ All API endpoints with proper authorization
✅ All frontend pages with responsive design
✅ Multi-tenant data isolation
✅ RBAC enforcement
✅ Status transitions and validation
✅ Performance metrics and reporting

The system is ready for production use once all tests pass! 🎉

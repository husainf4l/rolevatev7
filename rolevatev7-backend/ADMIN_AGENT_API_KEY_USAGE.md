# Admin Agent API Key Usage Guide

## Overview
The Admin Agent API Key provides full system-level access to the Rolevate API, designed specifically for AI agents and automated systems that need comprehensive read/write access to all resources.

## API Key Details
- **Environment Variable**: `ADMIN_AGENT_API_KEY`
- **Key Value**: `agent_rolevate_admin_9f2e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7`
- **Access Level**: Full admin access (equivalent to SYSTEM_API_KEY)
- **Endpoint**: `https://demo.rolevate.com/api/graphql`

## Authentication
Add the API key to your requests using the `x-api-key` header:

```bash
x-api-key: agent_rolevate_admin_9f2e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7
```

## Example Queries

### Query All Applications
```bash
curl -X POST https://demo.rolevate.com/api/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: agent_rolevate_admin_9f2e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7" \
  -d '{
    "query": "query { applications { id status appliedAt resumeUrl cvAnalysisScore job { id title } candidate { id email firstName lastName } } }"
  }'
```

### Query Applications with Filters
```bash
curl -X POST https://demo.rolevate.com/api/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: agent_rolevate_admin_9f2e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7" \
  -d '{
    "query": "query { applications(filter: { status: PENDING }) { id status appliedAt candidate { email } job { title } } }"
  }'
```

### Create Application Note
```bash
curl -X POST https://demo.rolevate.com/api/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: agent_rolevate_admin_9f2e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7" \
  -d '{
    "query": "mutation { createApplicationNote(input: { applicationId: \"<application-id>\", content: \"Reviewed by AI agent\", category: \"GENERAL\" }) { id content createdAt } }"
  }'
```

### Update Application Status
```bash
curl -X POST https://demo.rolevate.com/api/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: agent_rolevate_admin_9f2e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7" \
  -d '{
    "query": "mutation { updateApplication(id: \"<application-id>\", input: { status: REVIEWED }) { id status } }"
  }'
```

## GraphQL Schema - Application Fields

### Application Type
```graphql
type Application {
  id: ID!
  jobId: String!
  job: Job!
  candidateId: String!
  candidate: User!
  status: ApplicationStatus!
  appliedAt: DateTime!
  coverLetter: String
  resumeUrl: String
  expectedSalary: String
  noticePeriod: String
  cvAnalysisScore: Float
  cvScore: Float
  firstInterviewScore: Float
  secondInterviewScore: Float
  finalScore: Float
  cvAnalysisResults: JSONObject
  cvAnalyzedAt: DateTime
  source: String
  referralCode: String
  notes: String
  createdAt: DateTime!
  updatedAt: DateTime!
  applicationNotes: [ApplicationNote!]
}
```

### Application Status Enum
```graphql
enum ApplicationStatus {
  PENDING
  REVIEWED
  SHORTLISTED
  INTERVIEWED
  OFFERED
  HIRED
  ANALYZED
  REJECTED
  WITHDRAWN
}
```

### Filter and Pagination
```graphql
input ApplicationFilterInput {
  status: ApplicationStatus
  jobId: String
  candidateId: String
  source: String
  search: String
}

input ApplicationPaginationInput {
  page: Int
  limit: Int
  sortBy: String
  sortOrder: String  # ASC or DESC
}
```

## Permissions
The Admin Agent API key has:
- ✅ **Full Read Access**: Query all applications, jobs, candidates, companies
- ✅ **Full Write Access**: Create, update, delete applications and notes
- ✅ **No Company Filtering**: Unlike business users, sees all applications across all companies
- ✅ **No Candidate Filtering**: Unlike candidate users, sees all applications from all candidates
- ✅ **System-level privileges**: Same as SYSTEM_API_KEY

## Security Notes
1. **Keep the key secure**: Never commit this key to public repositories
2. **Environment variables**: Always use environment variables for the key
3. **HTTPS only**: Only use this key over secure HTTPS connections
4. **Logging**: All API key usage is logged for audit purposes
5. **Rotation**: Consider rotating this key periodically for security

## Implementation in Code (Node.js Example)
```javascript
const axios = require('axios');

const GRAPHQL_URL = 'https://demo.rolevate.com/api/graphql';
const API_KEY = process.env.ADMIN_AGENT_API_KEY;

async function queryApplications() {
  const response = await axios.post(
    GRAPHQL_URL,
    {
      query: `
        query {
          applications {
            id
            status
            appliedAt
            job { id title }
            candidate { email firstName lastName }
          }
        }
      `
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    }
  );
  
  return response.data.data.applications;
}
```

## Deployment Info
- **Docker Image**: `ghcr.io/husainf4l/rolevatev7/rolevate-backend:1.36`
- **Deployment Date**: December 17, 2025
- **Features**: Admin Agent API key support with full system access

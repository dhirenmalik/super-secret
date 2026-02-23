# Azure Hosting Cost Estimate

This document provides an estimated cost breakdown for hosting the Walmart ETL & EDA Web Application on Microsoft Azure. The estimates are based on **170 hours of usage per month** as requested, which assumes the application is not running 24/7 (a full month has ~730 hours) or is scaled down during off-hours.

*Note: Pricing is approximate and based on standard Azure Pay-As-You-Go rates in a typical US region (e.g., East US). Azure pricing fluctuates, so please consult the [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/) for exact numbers.*

---

## 1. Compute / Hosting Cost (Azure App Service)
To host the React frontend and FastAPI backend, you will likely need an Azure App Service Plan. We assume a standard production tier (e.g., **Standard S1** or **Premium V3**) or a Basic tier depending on performance needs.

*   **Service**: Azure App Service (Linux)
*   **Tier**: Basic B1 (1 Core, 1.75 GB RAM) *Recommended for testing/light load*
*   **Monthly Rate (730 hrs)**: ~$13.14/month
*   **Cost for 170 Hours**: 
    *   Hourly rate: ~$0.018 / hour
    *   **Estimate: $3.06**

*Alternative (Production Standard S1)*: 
*   **Monthly Rate**: ~$73.00/month
*   **Cost for 170 Hours**: **~$17.00**

## 2. Database Cost (Azure Database for PostgreSQL)
The backend requires a database (SQLAlchemy is currently used, likely with SQLite locally, but Postgres is standard for production). 

*   **Service**: Azure Database for PostgreSQL - Flexible Server
*   **Tier**: Burstable B1ms (1 vCore, 2 GB RAM, 32 GB Storage)
*   **Monthly Rate (730 hrs)**: ~$25.00/month
*   **Cost for 170 Hours**:
    *   Hourly compute rate: ~$0.034 / hour
    *   Storage cost is usually fixed monthly regardless of uptime (~$4.00/mo)
    *   **Estimate: ~$9.78** ($5.78 compute + $4.00 storage)

## 3. Storage Cost (Azure Blob Storage)
For uploading CSVs and raw data files, object storage is required.

*   **Service**: Azure Storage Account (Standard General-purpose v2, LRS)
*   **Capacity**: ~50 GB
*   **Operations**: ~10,000 Write / 10,000 Read operations
*   **Cost Estimate**:
    *   Storage: 50 GB * $0.0184/GB = $0.92
    *   Operations & Data Transfer: ~$0.10
    *   **Estimate: ~$1.02** (Storage is typically billed per month regardless of app uptime)

## 4. Other Potential Costs

*   **Azure Container Registry (ACR)**: If deploying via Docker containers.
    *   *Basic Tier*: **$5.00 / month** (fixed daily rate)
*   **Bandwidth / Data Egress**: 
    *   First 100 GB/month is usually free.
    *   **Estimate: $0.00** 
*   **Azure Monitor / Log Analytics**:
    *   For storing FastAPI and React application logs.
    *   Pay-as-you-go per GB ingested (First 5GB free).
    *   **Estimate: $0.00 to $2.00**

---

## Total Estimated Cost (Based on 170 Hours of Compute)

| Service | Estimated Cost (170 Hours) | Notes |
| :--- | :--- | :--- |
| **App Service (Frontend + Backend)** | $3.06 - $17.00 | Depends on B1 vs S1 tier. |
| **PostgreSQL Database** | $9.78 | Computes for 170h + Base Storage. |
| **Blob Storage (50 GB)** | $1.02 | Fixed monthly data storage cost. |
| **Container Registry / Misc** | $5.00 | Fixed monthly storage for Docker images. |
| **Total Estimated Cost** | **$18.86 - $32.80** | **For 170 hours of active compute per month.** |

### Recommendations for Optimization:
1. **Stop/Start Scripts**: Ensure you have automation to spin down the App Service and Pause the Postgres Flexible server during the remaining 560 hours of the month to truly realize the 170-hour cost savings.
2. **Static Web Apps**: You can host the React frontend on **Azure Static Web Apps** for **Free** (Standard tier is $9/mo), which reduces the App Service requirement to just the FastAPI backend.

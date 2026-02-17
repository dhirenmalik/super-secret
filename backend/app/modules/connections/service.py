from google.cloud import bigquery
from google.api_core import exceptions
from . import schemas

async def test_bigquery_connection(config: schemas.ConnectionTestRequest) -> schemas.ConnectionTestResponse:
    """
    Test BigQuery connection by attempting to list datasets.
    In a real-world scenario, this would use service account credentials.
    For this demo/prototype, we'll simulate the check if specific credentials aren't provided.
    """
    try:
        # Note: In a production environment, you'd handle credentials properly.
        # This implementation expects environment-based auth or a service account JSON.
        client = bigquery.Client()
        datasets = list(client.list_datasets(max_results=5))
        return schemas.ConnectionTestResponse(
            success=True,
            message=f"Successfully connected! Found {len(datasets)} datasets.",
            details={"datasets_count": len(datasets)}
        )
    except exceptions.GoogleAPICallError as e:
        return schemas.ConnectionTestResponse(
            success=False,
            message=f"BigQuery API Error: {str(e)}"
        )
    except Exception as e:
        # Fallback for prototype/demo if credentials are missing
        if "Default Credentials" in str(e):
             return schemas.ConnectionTestResponse(
                success=False,
                message="Google Cloud credentials not found. Please ensure GOOGLE_APPLICATION_CREDENTIALS is set."
            )
        return schemas.ConnectionTestResponse(
            success=False,
            message=f"Connection failed: {str(e)}"
        )

async def test_connection(config: schemas.ConnectionTestRequest) -> schemas.ConnectionTestResponse:
    if config.connection_type.lower() == "bigquery":
        return await test_bigquery_connection(config)
    
    # Placeholder for other connection types
    return schemas.ConnectionTestResponse(
        success=False,
        message=f"Connection type '{config.connection_type}' is currently in progress for live testing."
    )

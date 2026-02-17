from pydantic import BaseModel
from typing import Optional, Dict, Any

class ConnectionBase(BaseModel):
    connection_type: str
    host_server: Optional[str] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class ConnectionTestRequest(ConnectionBase):
    pass

class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None

"""
IKE Bot FastAPI Server
A modern async API server with SintraPrime event integration
"""
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import structlog
import os
import requests
import json

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Environment variables
SINTRA_WEBHOOK_URL = os.getenv("SINTRA_WEBHOOK_URL")
NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_LOG_DB = os.getenv("NOTION_ACTIVITY_LOG")
NOTION_ARCHIVE_DB = os.getenv("NOTION_FILINGS_DB")

app = FastAPI(
    title="IKE Bot Trust Automation API",
    description="Modern async API for trust automation with SintraPrime integration",
    version="2.0.0"
)


# Models
class AgentType(str, Enum):
    AFFIDAVIT_BOT = "affidavit_bot"
    ENFORCEMENT_BOT = "enforcement_bot"
    DISPUTE_BOT = "dispute_bot"


class AgentPayload(BaseModel):
    agent: AgentType
    payload: Dict[str, Any] = Field(default_factory=dict)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "agent": "affidavit_bot",
                "payload": {
                    "statement": "I hereby declare...",
                    "notice_id": "IRS-2024-001"
                }
            }
        }
    }


class AffidavitRequest(BaseModel):
    statement: str = Field(..., min_length=10, description="Affidavit statement content")
    notice_id: Optional[str] = Field(None, description="IRS Notice ID")
    response: Optional[str] = Field(None, description="IRS Response")


class BeneficiaryCreate(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: Optional[str] = None
    phone: Optional[str] = None
    relationship: Optional[str] = None


class DisputeCreate(BaseModel):
    beneficiary_id: str
    creditor_name: str = Field(..., min_length=1)
    dispute_reason: str = Field(..., min_length=10)
    dispute_type: str = Field(..., pattern="^(identity_theft|not_mine|inaccurate|duplicate|paid|other)$")


class SintraPrimeEvent(BaseModel):
    event_type: str
    payload: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str = "ike-bot-api"


# Helper functions
async def notify_sintra_prime(event_type: str, payload: Dict[str, Any]) -> bool:
    """Send event notification to SintraPrime"""
    if not SINTRA_WEBHOOK_URL:
        logger.warning("sintra_webhook_not_configured", event_type=event_type)
        return False
    
    try:
        event = SintraPrimeEvent(
            event_type=event_type,
            payload=payload
        )
        
        response = requests.post(
            SINTRA_WEBHOOK_URL,
            json=event.dict(),
            timeout=5
        )
        
        # Check response status without raising exception
        if response.status_code >= 200 and response.status_code < 300:
            logger.info(
                "sintra_event_sent",
                event_type=event_type,
                status_code=response.status_code,
                payload_keys=list(payload.keys())
            )
            return True
        else:
            logger.warning(
                "sintra_event_http_error",
                event_type=event_type,
                status_code=response.status_code
            )
            return False
        
    except requests.exceptions.RequestException as e:
        logger.error(
            "sintra_event_failed",
            event_type=event_type,
            error=str(e)
        )
        return False


async def log_to_notion(title: str, body: str, archive: bool = False) -> bool:
    """Log event to Notion database"""
    if not NOTION_API_KEY:
        logger.warning("notion_api_not_configured")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {NOTION_API_KEY}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
        
        db_id = NOTION_ARCHIVE_DB if archive else NOTION_LOG_DB
        data = {
            "parent": {"database_id": db_id},
            "properties": {
                "Title": {"title": [{"text": {"content": title}}]},
                "Details": {"rich_text": [{"text": {"content": body}}]}
            }
        }
        
        response = requests.post(
            "https://api.notion.com/v1/pages",
            headers=headers,
            json=data,
            timeout=5
        )
        response.raise_for_status()
        
        logger.info(
            "notion_log_created",
            title=title,
            archive=archive
        )
        return True
        
    except requests.exceptions.RequestException as e:
        logger.error(
            "notion_log_failed",
            title=title,
            error=str(e)
        )
        return False


# Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with structured logging"""
    start_time = datetime.utcnow()
    
    logger.info(
        "request_started",
        method=request.method,
        path=request.url.path,
        client=request.client.host if request.client else None
    )
    
    response = await call_next(request)
    
    duration = (datetime.utcnow() - start_time).total_seconds()
    
    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_seconds=duration
    )
    
    return response


# Routes
@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ike-bot-api",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/v2/run-agent", tags=["Agents"])
async def run_agent(
    request: AgentPayload,
    background_tasks: BackgroundTasks
):
    """
    Run a specific agent with the provided payload.
    Sends event notifications to SintraPrime.
    """
    logger.info(
        "agent_requested",
        agent=request.agent,
        payload_keys=list(request.payload.keys())
    )
    
    try:
        # Process based on agent type
        if request.agent == AgentType.AFFIDAVIT_BOT:
            result = await process_affidavit(request.payload)
        elif request.agent == AgentType.ENFORCEMENT_BOT:
            result = await process_enforcement(request.payload)
        elif request.agent == AgentType.DISPUTE_BOT:
            result = await process_dispute(request.payload)
        else:
            raise HTTPException(status_code=400, detail="Invalid agent type")
        
        # Send SintraPrime notification in background
        background_tasks.add_task(
            notify_sintra_prime,
            f"{request.agent}_completed",
            {"result": result, "payload": request.payload}
        )
        
        return {
            "success": True,
            "agent": request.agent,
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(
            "agent_failed",
            agent=request.agent,
            error=str(e)
        )
        
        # Notify SintraPrime of failure
        background_tasks.add_task(
            notify_sintra_prime,
            f"{request.agent}_failed",
            {"error": str(e), "payload": request.payload}
        )
        
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v2/affidavit", tags=["Agents"])
async def create_affidavit(
    request: AffidavitRequest,
    background_tasks: BackgroundTasks
):
    """
    Create an affidavit with SintraPrime integration.
    Logs to Notion and sends events to SintraPrime.
    """
    logger.info(
        "affidavit_create_requested",
        notice_id=request.notice_id,
        statement_length=len(request.statement)
    )
    
    try:
        # Log to Notion
        background_tasks.add_task(
            log_to_notion,
            "Affidavit Created",
            request.statement
        )
        
        background_tasks.add_task(
            log_to_notion,
            "Affidavit Filed",
            request.statement,
            True  # archive
        )
        
        # Notify SintraPrime
        background_tasks.add_task(
            notify_sintra_prime,
            "affidavit_created",
            {
                "statement": request.statement,
                "notice_id": request.notice_id,
                "response": request.response
            }
        )
        
        result = {
            "status": "created",
            "notice_id": request.notice_id,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Affidavit created and logged successfully"
        }
        
        logger.info("affidavit_created", notice_id=request.notice_id)
        
        return result
        
    except Exception as e:
        logger.error("affidavit_creation_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v2/beneficiaries", tags=["Beneficiaries"])
async def create_beneficiary(
    request: BeneficiaryCreate,
    background_tasks: BackgroundTasks
):
    """
    Create a beneficiary with SintraPrime event notification.
    """
    logger.info(
        "beneficiary_create_requested",
        name=f"{request.first_name} {request.last_name}"
    )
    
    try:
        # In a real implementation, this would save to database
        beneficiary_data = request.dict()
        beneficiary_data["id"] = f"ben_{datetime.utcnow().timestamp()}"
        beneficiary_data["created_at"] = datetime.utcnow().isoformat()
        
        # Notify SintraPrime
        background_tasks.add_task(
            notify_sintra_prime,
            "beneficiary_created",
            beneficiary_data
        )
        
        # Log to Notion
        background_tasks.add_task(
            log_to_notion,
            f"Beneficiary Created: {request.first_name} {request.last_name}",
            json.dumps(beneficiary_data, indent=2)
        )
        
        logger.info("beneficiary_created", beneficiary_id=beneficiary_data["id"])
        
        return beneficiary_data
        
    except Exception as e:
        logger.error("beneficiary_creation_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v2/disputes", tags=["Disputes"])
async def create_dispute(
    request: DisputeCreate,
    background_tasks: BackgroundTasks
):
    """
    Create a credit dispute with SintraPrime event notification.
    """
    logger.info(
        "dispute_create_requested",
        beneficiary_id=request.beneficiary_id,
        creditor=request.creditor_name
    )
    
    try:
        # In a real implementation, this would save to database
        dispute_data = request.dict()
        dispute_data["id"] = f"dis_{datetime.utcnow().timestamp()}"
        dispute_data["status"] = "pending"
        dispute_data["created_at"] = datetime.utcnow().isoformat()
        
        # Notify SintraPrime
        background_tasks.add_task(
            notify_sintra_prime,
            "dispute_created",
            dispute_data
        )
        
        # Log to Notion
        background_tasks.add_task(
            log_to_notion,
            f"Dispute Created: {request.creditor_name}",
            json.dumps(dispute_data, indent=2)
        )
        
        logger.info("dispute_created", dispute_id=dispute_data["id"])
        
        return dispute_data
        
    except Exception as e:
        logger.error("dispute_creation_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v2/events/sintra", tags=["Events"])
async def send_sintra_event(event: SintraPrimeEvent):
    """
    Manually trigger a SintraPrime event.
    """
    success = await notify_sintra_prime(event.event_type, event.payload)
    
    if success:
        return {
            "success": True,
            "message": "Event sent to SintraPrime",
            "event_type": event.event_type
        }
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to send event to SintraPrime"
        )


@app.get("/api/v2/health/sintra", tags=["Health"])
async def check_sintra_connection():
    """
    Check if SintraPrime webhook is configured and reachable.
    """
    if not SINTRA_WEBHOOK_URL:
        return {
            "configured": False,
            "message": "SINTRA_WEBHOOK_URL not set"
        }
    
    try:
        # Send a test ping
        response = requests.get(SINTRA_WEBHOOK_URL, timeout=5)
        return {
            "configured": True,
            "reachable": response.status_code < 500,
            "status_code": response.status_code,
            "url": SINTRA_WEBHOOK_URL
        }
    except Exception as e:
        return {
            "configured": True,
            "reachable": False,
            "error": str(e)
        }


# Agent processing functions
async def process_affidavit(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Process affidavit creation"""
    statement = payload.get("statement", "")
    notice_id = payload.get("notice_id")
    
    return {
        "type": "affidavit",
        "status": "generated",
        "notice_id": notice_id,
        "statement_length": len(statement),
        "timestamp": datetime.utcnow().isoformat()
    }


async def process_enforcement(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Process enforcement packet"""
    return {
        "type": "enforcement",
        "status": "initiated",
        "packet_type": payload.get("packet_type", "unknown"),
        "timestamp": datetime.utcnow().isoformat()
    }


async def process_dispute(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Process credit dispute"""
    return {
        "type": "dispute",
        "status": "filed",
        "creditor": payload.get("creditor_name", "unknown"),
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("FASTAPI_PORT", "8000"))
    
    logger.info(
        "starting_server",
        port=port,
        sintra_configured=bool(SINTRA_WEBHOOK_URL)
    )
    
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

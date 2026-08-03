from fastapi import APIRouter, Depends
from schemas.schemas import CodeRunRequest, CodeRunResult
from services.code_runner import run_code
from routers.deps import get_current_user

router = APIRouter(prefix="/api/v1/code", tags=["code"])


@router.post("/run", response_model=CodeRunResult)
async def run_code_endpoint(
    data: CodeRunRequest,
    current_user=Depends(get_current_user)
):
    result = await run_code(data.code, data.language, data.stdin or "")
    return CodeRunResult(**result)

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0)
    limit: int = Field(50, ge=1, le=100)

class StandardResponse(BaseSchema):
    success: bool = Field(True)
    message: str = Field("Operation completed successfully")
    data: Optional[Any] = Field(None)

__all__ = ["BaseSchema", "PaginationParams", "StandardResponse"]

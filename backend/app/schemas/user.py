from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    role_id: int
    role_category: Optional[str] = None
    role: RoleOut
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



class UserProfileOut(UserOut):
    profile_data: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)

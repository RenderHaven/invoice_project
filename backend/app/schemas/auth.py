from pydantic import BaseModel, EmailStr
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    org_name: str
    name: str
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str
    user: UserResponse


class LoginResponse(BaseModel):
    success: bool = True
    data: TokenResponse

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore")

    APP_NAME: str = "LabTrack.Python"
    ENVIRONMENT: str = Field("development", validation_alias="ENVIRONMENT")
    DEBUG: bool = Field(True, validation_alias="DEBUG")
    PORT: int = Field(8000, validation_alias="PORT")

    JWT_SECRET_KEY: str = Field("LabTrack_Secret_Key_For_Development_Only_Change_In_Production_2026", validation_alias="JWT_SECRET_KEY")
    INTERNAL_SERVICE_SECRET: str = Field("LabTrack_Internal_Service_Secret_Key_Change_In_Production_2026", validation_alias="INTERNAL_SERVICE_SECRET")
    CSHARP_API_BASE_URL: str = Field("http://localhost:5000", validation_alias="CSHARP_API_BASE_URL")

    AI_PROVIDER: str = Field("gemini", validation_alias="AI_PROVIDER")
    LLM_API_KEY: str = Field("", validation_alias="LLM_API_KEY")
    GEMINI_API_KEY: str = Field("", validation_alias="GEMINI_API_KEY")
    GROQ_API_KEY: str = Field("", validation_alias="GROQ_API_KEY")
    LLM_BASE_URL: str = Field("https://generativelanguage.googleapis.com/v1beta/openai", validation_alias="LLM_BASE_URL")
    LLM_DEFAULT_MODEL: str = Field("gemini-2.5-pro", validation_alias="LLM_DEFAULT_MODEL")

    DB_HOST: str = Field("localhost", validation_alias="DB_HOST")
    DB_PORT: int = Field(5432, validation_alias="DB_PORT")
    DB_NAME: str = Field("labtrack_db", validation_alias="DB_NAME")
    DB_USER: str = Field("postgres", validation_alias="DB_USER")
    DB_PASSWORD: str = Field("sven292005", validation_alias="DB_PASSWORD")

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

settings = Settings()

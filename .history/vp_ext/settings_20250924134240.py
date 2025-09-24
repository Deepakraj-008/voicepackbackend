from pydantic_settings import BaseSettings

class ExtSettings(BaseSettings):
    SECRET_KEY: str = "change-me-32+chars"
    ACCESS_TOKEN_EXPIRE_MIN: int = 60
    REFRESH_TOKEN_EXPIRE_MIN: int = 60*24*30
    DATABASE_URL: str = "sqlite:///./vp_ext.db"

    # live providers (keys optional; RSS/weather have free fallbacks)
    OPENWEATHER_API_KEY: str | None = None
    NEWSAPI_KEY: str | None = None
    THESPORTSDB_API_KEY: str | None = "1"  # demo key works
    OPENAI_API_KEY: str | None = None      # for chat/AI (optional)
    PERPLEXITY_CHAT_API_KEY: str | None = None  # Perplexity API key used only for chat

    # pydantic v2 settings: allow extra env vars (ignore) and read from .env
    model_config = {
        "env_file": ".env",
        "extra": "ignore",
    }

"""
Configuration for Azure OpenAI and local data sources.

The Azure credentials are read from environment variables so secrets are not
checked into source control. Default values match the hackathon API portal
but can be overridden per environment.
"""

import os

# Azure OpenAI configuration (read from environment for safety)
AZURE_OPENAI_API_KEY = os.environ.get("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.environ.get(
    "AZURE_OPENAI_ENDPOINT",
    "https://psacodesprint2025.azure-api.net/",
)
AZURE_OPENAI_API_VERSION = os.environ.get(
    "AZURE_OPENAI_API_VERSION",
    "2025-01-01-preview",
)
DEPLOYMENT_NAME = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4.1-nano")

# Paths to data files (relative to project root)
DATA_DIR = "../Problem Statement 3 - Redefining Level 2 Product Ops copy"
LOG_DIR = f"{DATA_DIR}/Application Logs"
DB_PATH = f"{DATA_DIR}/Database/db.sql"
KB_PATH = f"{DATA_DIR}/Knowledge Base.txt"
CASE_LOG_PATH = f"{DATA_DIR}/Case Log.xlsx"
CONTACTS_PATH = f"{DATA_DIR}/Product Team Escalation Contacts.pdf"

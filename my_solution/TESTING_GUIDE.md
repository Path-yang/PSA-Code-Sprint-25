# Testing Guide

## ⚠️ Current Issue: Azure OpenAI Connection Error

The system is getting connection errors when trying to reach Azure OpenAI. This could be due to:
1. Network/firewall blocking the connection
2. Incorrect endpoint URL format
3. API key permissions
4. Deployment name mismatch

## 🔧 Step-by-Step Testing

### Step 1: Verify Azure OpenAI Setup

Check your Azure OpenAI configuration:
- Endpoint: `https://openai-psa-codesprint.openai.azure.com/`
- Deployment name: `gpt-4o-mini`
- API Version: `2024-08-01-preview`

**Action**: Please verify these match your actual Azure deployment.

### Step 2: Test Connection Manually

```bash
cd my_solution
source venv/bin/activate
python3
```

Then in Python:
```python
from openai import AzureOpenAI

client = AzureOpenAI(
    api_key="89f6bee7d39542ffa3ede62f1d139bc9",
    api_version="2024-08-01-preview",  # Try different versions if needed
    azure_endpoint="https://openai-psa-codesprint.openai.azure.com/"
)

# Test call
response = client.chat.completions.create(
    model="gpt-4o-mini",  # Or your actual deployment name
    messages=[{"role": "user", "content": "Hello"}],
    max_tokens=10
)

print(response.choices[0].message.content)
```

If this fails, you'll need to:
1. Check the endpoint URL from your Azure portal
2. Verify the deployment name
3. Try different API versions

### Step 3: Update config.py

Once you find the correct settings, update `config.py`:

```python
AZURE_OPENAI_API_KEY = "your-key"
AZURE_OPENAI_ENDPOINT = "correct-endpoint"
AZURE_OPENAI_API_VERSION = "working-version"
DEPLOYMENT_NAME = "correct-deployment-name"
```

### Step 4: Run Tests

After fixing the connection:

```bash
cd my_solution
source venv/bin/activate

# Quick test (Test Case 1 only)
python3 diagnostic_system.py

# OR full test (all 4 test cases)
python3 test_all_cases.py
```

## 🎯 Alternative: Test Without GPT

If you can't get Azure OpenAI working, I can create a **mock version** that uses rule-based logic instead of GPT. It won't be as intelligent, but it will demonstrate the system working with all the data sources.

Would you like me to create that?

## 📝 Expected Output

When working correctly, you should see:

```
🔧 Initializing L2 Diagnostic System...
   ✓ Log searcher initialized (6 log files)
   ✓ Knowledge Base loaded (74 articles)
   ✓ Case Log loaded (99 historical cases)
   ✓ Azure OpenAI connected

================================================================================
🔍 STARTING DIAGNOSTIC ANALYSIS
================================================================================

📋 Step 1: Parsing alert with GPT...
   ✓ Ticket ID: ALR-861600
   ✓ Module: Container
   ✓ Entity: CMAU0000020
   ✓ Channel: Email

📚 Step 2: Searching Case Log for similar cases...
   ✓ Found 3 similar past cases
   ✓ Best match: 85% relevance

📝 Step 3: Searching application logs...
   ✓ Found 4 log entries

... etc ...

[Full diagnostic report would appear here]
```

## 🐛 Debugging Tips

1. **Check network**: Can you access Azure OpenAI from other tools?
2. **Verify deployment**: Is `gpt-4o-mini` the exact deployment name?
3. **Try curl**: Test the endpoint directly:
   ```bash
   curl https://openai-psa-codesprint.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview \
     -H "Content-Type: application/json" \
     -H "api-key: 89f6bee7d39542ffa3ede62f1d139bc9" \
     -d '{"messages":[{"role":"user","content":"test"}]}'
   ```

4. **Check Azure portal**: Verify the resource is active and accessible

## 📞 Need Help?

If you're stuck:
1. Share the error message you get
2. Confirm your actual Azure OpenAI endpoint URL
3. Let me know if you want the mock/rule-based version instead

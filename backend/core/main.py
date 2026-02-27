import open
import os

client = open.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

response = client.chat.completions.create(
    model="gpt-4", messages=[{"role": "user", "content": "你好"}]
)

print(response.choices[0].message.content)

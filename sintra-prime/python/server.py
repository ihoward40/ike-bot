from flask import Flask, request, jsonify
import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
PORT = int(os.getenv("SINTRA_PRIME_PORT", 3001))

@app.route("/sintra-prime", methods=["POST"])
def sintra_prime():
    """
    Main route: Sintra Agents → ChatGPT → Response back
    """
    try:
        body = request.json
        agent = body.get("agent")
        message = body.get("message")
        metadata = body.get("metadata", {})

        if not agent or not message:
            return jsonify({
                "error": "Missing required fields: agent and message"
            }), 400

        # 🔥 Send request to ChatGPT (GPT-4 Turbo)
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4-turbo-preview",
                "messages": [
                    {
                        "role": "system",
                        "content": """
You are SintraPrime — the master AI supervising all Sintra helper agents.
Always return structured JSON so automations never break.
Your role is to coordinate between multiple automation agents and provide intelligent routing decisions.
"""
                    },
                    {
                        "role": "user",
                        "content": f"""
Agent: {agent}
Message: {message}
Metadata: {json.dumps(metadata)}
"""
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 2000,
            },
        )

        if not r.ok:
            error_data = r.json()
            raise Exception(f"OpenAI API error: {json.dumps(error_data)}")

        result = r.json()

        return jsonify({
            "status": "ok",
            "agent": agent,
            "reply": result["choices"][0]["message"]["content"],
            "model": result["model"],
            "usage": result["usage"],
        })

    except Exception as e:
        app.logger.error(f"SintraPrime error: {str(e)}")
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check route"""
    return jsonify({
        "status": "healthy",
        "service": "SintraPrime",
        "version": "1.0.0"
    })


if __name__ == "__main__":
    print(f"✅ SintraPrime connector is running on port {PORT}")
    print(f"🔗 Endpoint: http://localhost:{PORT}/sintra-prime")
    print(f"❤️ Health check: http://localhost:{PORT}/health")
    app.run(host="0.0.0.0", port=PORT, debug=False)

import asyncio
import os
import unittest
from unittest.mock import patch

from backend.app import CONTACT_PRIVACY_REPLY, ChatRequest, chat, protect_phone_number


class CohereResponse:
    status_code = 200

    def __init__(self, answer):
        self.answer = answer

    def json(self):
        return {"message": {"content": [{"type": "text", "text": self.answer}]}}


class CohereClient:
    def __init__(self, answer):
        self.response = CohereResponse(answer)
        self.request_body = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return None

    async def post(self, _url, **kwargs):
        self.request_body = kwargs["json"]
        return self.response


class ResumeChatTests(unittest.TestCase):
    def get_chat_response(self, question, generated_answer):
        client = CohereClient(generated_answer)
        with patch.dict(os.environ, {"COHERE_API_KEY": "test-key"}):
            with patch("backend.app.httpx.AsyncClient", return_value=client):
                response = asyncio.run(chat(ChatRequest(message=question)))
        return response, client.request_body

    def test_tenth_grade_question_uses_resume_context(self):
        response, request = self.get_chat_response(
            "What was her 10th score?",
            "Roshni scored 93.6% in Class 10 at St. Thomas School.",
        )

        self.assertIn("93.6%", response["answer"])
        system_prompt = request["messages"][0]["content"]
        self.assertIn("Class 10: 93.6%", system_prompt)
        self.assertIn("What was her 10th score?", request["messages"][-1]["content"])

    def test_twelfth_grade_number_question_uses_resume_context(self):
        response, request = self.get_chat_response(
            "What her number in 12th?",
            "Roshni scored 97.8% in Class 12 at St. Xavier's School.",
        )

        self.assertIn("97.8%", response["answer"])
        self.assertIn("Class 12: 97.8%", request["messages"][0]["content"])

    def test_phone_number_policy_is_in_model_prompt(self):
        _, request = self.get_chat_response(
            "What is Roshni's phone number?",
            "Roshni's phone number is +91-8471039887.",
        )

        system_prompt = request["messages"][0]["content"]
        self.assertIn("provide only her email address: roshnie1101@gmail.com", system_prompt)
        self.assertNotIn("+91-8471039887", system_prompt)

    def test_phone_number_in_model_reply_is_replaced_with_email_only(self):
        response, _ = self.get_chat_response(
            "What is Roshni's contact number?",
            "Call her at +91-8471039887 or email roshnie1101@gmail.com.",
        )

        self.assertEqual(response["answer"], CONTACT_PRIVACY_REPLY)
        self.assertNotIn("8471039887", response["answer"])

    def test_phone_filter_leaves_academic_scores_unchanged(self):
        self.assertEqual(protect_phone_number("Class 10: 93.6%; Class 12: 97.8%."), "Class 10: 93.6%; Class 12: 97.8%.")


if __name__ == "__main__":
    unittest.main()

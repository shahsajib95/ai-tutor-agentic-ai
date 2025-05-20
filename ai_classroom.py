from fastapi import FastAPI
from pydantic import BaseModel
from crewai import Agent, Task, Crew
import os

from fastapi.middleware.cors import CORSMiddleware

# Use your OpenRouter key
os.environ["OPENAI_API_KEY"] = "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"
os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    message: str

@app.post("/ask")
def ask_ai(question: Question):
    student = Agent(
        name="Student",
        role="Curious learner",
        goal="Try to answer the question with some explanation.",
        backstory="An AI student trying their best to answer questions logically.",
        allow_delegation=False
    )

    teacher = Agent(
        name="Teacher",
        role="Experienced educator",
        goal="Review and improve student's answer with clarity and accuracy.",
        backstory="An AI teacher who helps the student and gives perfect answers.",
        allow_delegation=False
    )

    task1 = Task(
    agent=student,
    description=f"Try to answer this question: {question.message}",
    expected_output="A helpful answer to the user's question"
)
    task2 = Task(agent=teacher, description="Review the student’s answer and improve it for clarity.")

    crew = Crew(agents=[student, teacher], tasks=[task1, task2], verbose=True)

    result = crew.kickoff()
    return {"result": result}

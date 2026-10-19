#!/usr/bin/env python3
"""Generate the verified Wipro Written Communication (essay) task bank.

Each task stores a prompt, an explicit 200-400 word range and a transparent
evaluation rubric (in the explanation field). Evaluation criteria are NEVER
stored as answer options.
Outputs: backend/data/wipro/wipro_writing.json
"""
import json
import os

PROMPT_TAIL = (
    " Write an essay of 200-400 words on this topic. Your response should have a clear "
    "introduction, well-developed body paragraphs and an appropriate conclusion. Support "
    "your points with relevant reasons or examples, and write in clear, grammatically "
    "correct English."
)

RUBRIC = (
    "Evaluation rubric (self-review): Relevance to the topic; Grammar; Vocabulary; Clarity; "
    "Coherence; Paragraph structure; Appropriate conclusion. A strong response addresses the "
    "topic directly, stays within 200-400 words, and is organised into clear paragraphs with "
    "a definite conclusion."
)

TOPICS = [
    ("Technology and Society",
     "Topic: The Impact of Artificial Intelligence on Future Jobs.",
     "Discuss how artificial intelligence may change the nature of work, which jobs are most "
     "affected, and how employees can prepare for these changes."),
    ("Workplace and Professional Life",
     "Topic: Work From Home versus Working From the Office.",
     "Compare remote work and office work in terms of productivity, collaboration and work-life "
     "balance, and state which you consider more effective."),
    ("Workplace and Professional Life",
     "Topic: The Importance of Teamwork in the Workplace.",
     "Explain why teamwork matters for organisational success and describe the qualities that make "
     "an effective team member."),
    ("Social Issues",
     "Topic: Should Social Media Be Regulated?",
     "Present arguments for and against regulating social media platforms and give your own "
     "reasoned opinion."),
    ("Education and Learning",
     "Topic: The Role of Education in Nation Building.",
     "Discuss how a strong education system contributes to the economic and social development of "
     "a country."),
    ("Environment and Sustainability",
     "Topic: Climate Change and Individual Responsibility.",
     "Explain how individual choices contribute to climate change and suggest practical steps that "
     "ordinary people can take."),
    ("Technology and Society",
     "Topic: Digital Payments and the Move Towards a Cashless Economy.",
     "Discuss the advantages and risks of a cashless economy and its effect on everyday life."),
    ("Workplace and Professional Life",
     "Topic: The Importance of Communication Skills for Engineers.",
     "Explain why communication is as important as technical skill for engineers and how it can be "
     "improved."),
    ("Technology and Society",
     "Topic: The Ethical Use of Technology in Modern Society.",
     "Discuss what responsible and ethical use of technology means and give examples of misuse."),
    ("Education and Learning",
     "Topic: Benefits and Drawbacks of Online Learning.",
     "Compare online learning with traditional classroom learning and state your preference."),
    ("Environment and Sustainability",
     "Topic: Sustainable Development and the Role of Youth.",
     "Explain how young people can contribute to sustainable development and why their involvement "
     "matters."),
    ("Workplace and Professional Life",
     "Topic: Time Management for Students and Professionals.",
     "Discuss why time management is important and describe techniques that help people use their "
     "time effectively."),
]


def build():
    tasks = []
    for topic_group, headline, instruction in TOPICS:
        question = f"{headline}\n\n{instruction}{PROMPT_TAIL}"
        tasks.append({
            "company": "Wipro",
            "exam": "Wipro_Elite_NTH",
            "section": "English",
            "subject": "Essay Writing",
            "topic": "Written Communication",
            "category": "Written Communication",
            "sourceType": "practice",
            "sourceRef": "Wipro Placement Practice",
            "question": question,
            # Placeholder options are required by the shared Question schema but
            # are NEVER rendered: writing tasks use the text editor and coding
            # tasks use the dedicated problem view. They are distinct so that the
            # bank audit does not report duplicate options, and they deliberately
            # avoid naming any evaluation criterion.
            "option1": "Response submitted",
            "option2": "Free-text response",
            "option3": "Written answer",
            "option4": "Typed response",
            "answer": "Response submitted",
            "explanation": RUBRIC,
            "difficultyLevel": 2,
            "difficulty": "Medium",
            "level": "Intermediate",
            "questionType": "fill_in_blank",
            "minWords": 200,
            "maxWords": 400,
            "active": True,
        })
    out = os.path.join(os.path.dirname(__file__), "wipro_writing.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(tasks, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(tasks)} writing tasks to {out}")


if __name__ == "__main__":
    build()
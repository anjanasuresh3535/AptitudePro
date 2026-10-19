#!/usr/bin/env python3
"""Generate the verified Wipro Verbal Ability question bank.

Professionally written items with a single unambiguous correct answer and
concise explanations. Reading-comprehension passages are embedded in the
question so no external passage is ever referenced.
Outputs: backend/data/wipro/wipro_verbal.json
"""
import json
import os

DIFF_STR = {1: "Easy", 2: "Medium", 3: "Hard"}
DIFF_LVL = {1: "Foundation", 2: "Intermediate", 3: "Advanced"}

PASSAGE_URBAN = (
    "Passage: Urbanisation has transformed the way people live and work. While cities "
    "offer better employment, education and healthcare, they also place enormous pressure "
    "on housing, transport and the environment. Rapid migration from rural areas often "
    "outpaces a city's ability to build infrastructure, leading to congestion and pollution. "
    "Planners argue that sustainable urban development requires a balance between economic "
    "growth and quality of life. Green spaces, efficient public transport and affordable "
    "housing are no longer luxuries but necessities for the modern city."
)
PASSAGE_READING = (
    "Passage: Reading is one of the most effective ways to build a strong vocabulary. "
    "Regular readers encounter words in context, which helps them understand subtle shades "
    "of meaning that a dictionary alone cannot provide. However, reading passively without "
    "reflecting on new words offers limited benefit. Learners who note down unfamiliar words "
    "and use them in their own sentences retain them far better. Thus, active engagement, "
    "not mere exposure, is the key to vocabulary growth."
)

ROWS = [
    # ---- Synonyms ----
    ("Synonyms", 1, "Choose the word most similar in meaning to ABUNDANT.",
     "Plentiful", "Scarce", "Brief", "Rare", "Plentiful",
     "Abundant means existing in large quantities, i.e. plentiful."),
    ("Synonyms", 1, "Choose the word most similar in meaning to DILIGENT.",
     "Lazy", "Hardworking", "Careless", "Weak", "Hardworking",
     "Diligent means showing careful and persistent effort, i.e. hardworking."),
    ("Synonyms", 1, "Choose the word most similar in meaning to CANDID.",
     "Deceptive", "Frank", "Silent", "Rude", "Frank",
     "Candid means truthful and straightforward, i.e. frank."),
    ("Synonyms", 2, "Choose the word most similar in meaning to LUCID.",
     "Confusing", "Clear", "Loud", "Heavy", "Clear",
     "Lucid means expressed clearly and easy to understand."),
    ("Synonyms", 2, "Choose the word most similar in meaning to MITIGATE.",
     "Worsen", "Alleviate", "Ignore", "Provoke", "Alleviate",
     "Mitigate means to make less severe or painful, i.e. alleviate."),
    ("Synonyms", 3, "Choose the word most similar in meaning to METICULOUS.",
     "Careless", "Careful", "Rapid", "Vague", "Careful",
     "Meticulous means showing great attention to detail, i.e. very careful."),
    # ---- Antonyms ----
    ("Antonyms", 1, "Choose the word most opposite in meaning to EPHEMERAL.",
     "Temporary", "Permanent", "Fragile", "Rapid", "Permanent",
     "Ephemeral means short-lived, so its opposite is permanent."),
    ("Antonyms", 1, "Choose the word most opposite in meaning to BENEVOLENT.",
     "Kind", "Cruel", "Generous", "Gentle", "Cruel",
     "Benevolent means kind and well-meaning, so its opposite is cruel."),
    ("Antonyms", 1, "Choose the word most opposite in meaning to SCARCITY.",
     "Shortage", "Abundance", "Poverty", "Lack", "Abundance",
     "Scarcity means shortage, so its opposite is abundance."),
    ("Antonyms", 2, "Choose the word most opposite in meaning to OBSOLETE.",
     "Outdated", "Modern", "Ancient", "Rare", "Modern",
     "Obsolete means no longer in use, so its opposite is modern."),
    ("Antonyms", 2, "Choose the word most opposite in meaning to FRUGAL.",
     "Thrifty", "Extravagant", "Careful", "Modest", "Extravagant",
     "Frugal means economical, so its opposite is extravagant."),
    ("Antonyms", 2, "Choose the word most opposite in meaning to HUMBLE.",
     "Modest", "Arrogant", "Simple", "Polite", "Arrogant",
     "Humble means modest, so its opposite is arrogant."),
    # ---- Error Identification ----
    ("Error Identification", 2,
     "Identify the part of the sentence that contains an error: Each of the students (A) / have submitted (B) / their assignments (C) / on time. (D)",
     "Part A", "Part B", "Part C", "Part D", "Part B",
     "The subject 'Each' is singular, so 'have submitted' should be 'has submitted'."),
    ("Error Identification", 2,
     "Identify the part of the sentence that contains an error: She is one of the (A) / most talented singer (B) / in the choir (C) / of our college. (D)",
     "Part A", "Part B", "Part C", "Part D", "Part B",
     "After 'one of the', a plural noun is required: it should be 'most talented singers'."),
    ("Error Identification", 3,
     "Identify the part of the sentence that contains an error: The number of applicants (A) / are increasing (B) / every year (C) / in this field. (D)",
     "Part A", "Part B", "Part C", "Part D", "Part B",
     "'The number of' takes a singular verb, so 'are increasing' should be 'is increasing'."),
    ("Error Identification", 2,
     "Identify the part of the sentence that contains an error: He explained the concept (A) / so clearly that (B) / even the weakest student (C) / could understood it. (D)",
     "Part A", "Part B", "Part C", "Part D", "Part D",
     "After the modal 'could', the base verb is required: 'could understand it'."),
    ("Error Identification", 3,
     "Identify the part of the sentence that contains an error: Neither of the two brothers (A) / were willing (B) / to accept (C) / the responsibility. (D)",
     "Part A", "Part B", "Part C", "Part D", "Part B",
     "'Neither of' takes a singular verb, so 'were willing' should be 'was willing'."),
    ("Error Identification", 2,
     "Identify the part of the sentence that contains an error: The teacher asked the students (A) / to return back (B) / the library books (C) / before the weekend. (D)",
     "Part A", "Part B", "Part C", "Part D", "Part B",
     "'Return back' is redundant; 'return' alone already means to give back."),
    # ---- Sentence Improvement ----
    ("Sentence Improvement", 2,
     "Improve the highlighted part: The manager, along with his team members, HAVE DECIDED to work overtime.",
     "have decided", "has decided", "have been deciding", "are deciding", "has decided",
     "The subject is 'the manager' (singular). The phrase 'along with his team members' does not change the number, so 'has decided' is correct."),
    ("Sentence Improvement", 1,
     "Improve the highlighted part: ONE OF MY FRIEND IS a doctor.",
     "One of my friend is", "One of my friends is", "One of my friends are", "One of my friend are", "One of my friends is",
     "'One of' must be followed by a plural noun, so 'one of my friends is' is correct."),
    ("Sentence Improvement", 2,
     "Improve the highlighted part: I have been living in this city SINCE TEN YEARS.",
     "since ten years", "for ten years", "from ten years", "in ten years", "for ten years",
     "'For' is used with a period of time; 'since' is used with a point in time. So 'for ten years' is correct."),
    ("Sentence Improvement", 3,
     "Improve the highlighted part: He is SENIOR THAN ME by two years.",
     "senior than me", "senior than I", "senior to me", "senior from me", "senior to me",
     "Latin comparatives such as 'senior' take 'to', so 'senior to me' is correct."),
    ("Sentence Improvement", 3,
     "Improve the highlighted part: This is THE MOST UNIQUE OPPORTUNITY of my career.",
     "the most unique opportunity", "a unique opportunity", "the uniquest opportunity", "most unique opportunity", "a unique opportunity",
     "'Unique' is an absolute adjective and cannot take 'most', so 'a unique opportunity' is correct."),
    # ---- Prepositions ----
    ("Prepositions", 1, "Fill in the blank with the correct preposition: She is good ___ mathematics.",
     "in", "at", "on", "for", "at",
     "The phrase 'good at' is used for skills and subjects."),
    ("Prepositions", 2, "Fill in the blank with the correct preposition: He has been suffering ___ fever since Monday.",
     "with", "from", "of", "by", "from",
     "'Suffer from' is used for illnesses."),
    ("Prepositions", 2, "Fill in the blank with the correct preposition: Divide the sweets ___ the four children.",
     "between", "among", "into", "with", "among",
     "'Among' is used when sharing between more than two people; 'between' is used for two."),
    ("Prepositions", 1, "Fill in the blank with the correct preposition: I am looking forward ___ meeting you.",
     "for", "to", "at", "on", "to",
     "'Look forward to' is a fixed expression followed by a gerund."),
    ("Prepositions", 2, "Fill in the blank with the correct preposition: He insisted ___ paying the bill.",
     "for", "on", "at", "with", "on",
     "'Insist on' is the correct prepositional verb."),
    # ---- Sentence Completion ----
    ("Fill in the Blanks", 2,
     "Complete the sentence with the most appropriate word: The committee could not reach a decision because the members were ___ on the issue.",
     "united", "divided", "agreed", "neutral", "divided",
     "'Divided on an issue' means having opposing opinions, which explains why no decision was reached."),
    ("Fill in the Blanks", 1,
     "Complete the sentence with the most appropriate word: Despite the heavy rain, the team ___ to complete the project on time.",
     "failed", "managed", "refused", "neglected", "managed",
     "'Managed to' means succeeded in doing something, which suits the contrast with the heavy rain."),
    ("Fill in the Blanks", 2,
     "Complete the sentence with the most appropriate word: Her explanation was so ___ that everyone understood the concept immediately.",
     "vague", "lucid", "complex", "lengthy", "lucid",
     "'Lucid' means clear and easy to understand, matching the idea that everyone understood immediately."),
    ("Fill in the Blanks", 1,
     "Complete the sentence with the most appropriate word: Hard work and dedication are ___ for success in any field.",
     "optional", "essential", "irrelevant", "harmful", "essential",
     "'Essential' means absolutely necessary, which fits the sense of the sentence."),
    ("Fill in the Blanks", 2,
     "Complete the sentence with the most appropriate word: The new policy is expected to ___ the burden on small businesses.",
     "increase", "reduce", "ignore", "double", "reduce",
     "'Reduce the burden' is the natural collocation expected of a supportive new policy."),
    # ---- Reading Comprehension ----
    ("Reading Comprehension", 2,
     PASSAGE_URBAN + " Question: According to the passage, what is the main challenge faced by rapidly growing cities?",
     "A decline in employment opportunities", "Infrastructure failing to keep pace with migration", "A shortage of educational institutions", "A reduction in rural migration", "Infrastructure failing to keep pace with migration",
     "The passage states that rapid migration often outpaces a city's ability to build infrastructure, leading to congestion and pollution."),
    ("Reading Comprehension", 2,
     PASSAGE_URBAN + " Question: The author suggests that green spaces and public transport are:",
     "Luxuries meant only for the rich", "Necessities for modern cities", "Optional amenities that can be ignored", "The main cause of urban congestion", "Necessities for modern cities",
     "The passage says these are 'no longer luxuries but necessities for the modern city'."),
    ("Reading Comprehension", 2,
     PASSAGE_READING + " Question: What is the central idea of the passage?",
     "A dictionary is the best way to build vocabulary", "Passive reading is enough to learn new words", "Active engagement, not mere exposure, builds vocabulary", "Vocabulary cannot be improved by reading", "Active engagement, not mere exposure, builds vocabulary",
     "The concluding line states that 'active engagement, not mere exposure, is the key to vocabulary growth'."),
    ("Reading Comprehension", 2,
     PASSAGE_READING + " Question: According to the passage, what limits the benefit of reading?",
     "Reading too many books at once", "Reading passively without reflecting on new words", "Using new words in one's own sentences", "Reading with the help of a dictionary", "Reading passively without reflecting on new words",
     "The passage states that 'reading passively without reflecting on new words offers limited benefit'."),
    # ---- Para Jumbles ----
    ("Para Jumbles", 2,
     "Arrange the sentences to form a coherent paragraph and choose the correct order. (1) It provides clean energy. (2) Solar power has many advantages. (3) It also reduces electricity bills. (4) Therefore, many households are adopting it.",
     "2-1-3-4", "1-2-3-4", "2-3-1-4", "3-1-2-4", "2-1-3-4",
     "(2) introduces the topic, (1) and (3) give advantages, and (4) concludes with the result."),
    ("Para Jumbles", 2,
     "Arrange the sentences to form a coherent paragraph and choose the correct order. (1) The team worked day and night. (2) Finally, the project was completed on time. (3) It was an important deadline. (4) As a result, the client was satisfied.",
     "3-1-2-4", "1-3-2-4", "3-2-1-4", "2-1-3-4", "3-1-2-4",
     "(3) sets the context, (1) describes the effort, (2) gives the outcome, and (4) states the consequence."),
    ("Para Jumbles", 1,
     "Arrange the sentences to form a coherent paragraph and choose the correct order. (1) He practised every day. (2) Ravi dreamt of winning the marathon. (3) His hard work paid off. (4) He won the gold medal.",
     "2-1-3-4", "1-2-3-4", "2-3-1-4", "4-3-2-1", "2-1-3-4",
     "(2) introduces the goal, (1) the action, (3) the reward of effort, and (4) the final result."),
    ("Para Jumbles", 3,
     "Arrange the sentences to form a coherent paragraph and choose the correct order. (1) This has led to a rise in online learning. (2) The internet has changed education. (3) Students can now learn from anywhere. (4) It has made knowledge more accessible.",
     "2-4-3-1", "2-3-4-1", "1-2-3-4", "4-2-3-1", "2-4-3-1",
     "(2) states the main idea, (4) explains the effect, (3) gives a concrete example, and (1) concludes with the result."),
    # ---- Grammar ----
    ("Grammar", 2,
     "Choose the correctly punctuated sentence.",
     "'Where are you going?' she asked.", "'Where are you going?' She asked.", "Where are you going, she asked?", "'Where are you going' she asked?", "'Where are you going?' she asked.",
     "The question mark stays inside the quotation marks and the reporting clause 'she asked' begins with a lowercase letter."),
    ("Grammar", 2,
     "Select the sentence with the correct subject-verb agreement.",
     "Neither of the answers are correct.", "Neither of the answers is correct.", "Neither of the answer is correct.", "Neither of the answers were correct.", "Neither of the answers is correct.",
     "'Neither of' is singular and takes the singular verb 'is'."),
    ("Grammar", 2,
     "Choose the correct passive form of: The chef prepared a delicious meal.",
     "A delicious meal was prepared by the chef.", "A delicious meal is prepared by the chef.", "A delicious meal has prepared by the chef.", "A delicious meal were prepared by the chef.", "A delicious meal was prepared by the chef.",
     "The simple past active 'prepared' becomes 'was/were + past participle' in the passive, i.e. 'was prepared'."),
    ("Grammar", 1,
     "Choose the sentence that uses the correct tense.",
     "She has completed her homework yesterday.", "She completed her homework yesterday.", "She is completing her homework yesterday.", "She completes her homework yesterday.", "She completed her homework yesterday.",
     "A finished action with a definite past time marker ('yesterday') takes the simple past tense."),
    ]

def build():
    questions = []
    for subject, diff, q, o1, o2, o3, o4, ans, exp in ROWS:
        assert ans in (o1, o2, o3, o4), f"Answer not in options for: {q}"
        assert len({o1, o2, o3, o4}) == 4, f"Duplicate options for: {q}"
        questions.append({
            "company": "Wipro",
            "exam": "Wipro_Elite_NTH",
            "section": "English",
            "subject": subject,
            "topic": subject,
            "category": "Verbal Ability",
            "sourceType": "practice",
            "sourceRef": "Wipro Placement Practice",
            "question": q,
            "option1": o1, "option2": o2, "option3": o3, "option4": o4,
            "answer": ans,
            "explanation": exp,
            "difficultyLevel": diff,
            "difficulty": DIFF_STR[diff],
            "level": DIFF_LVL[diff],
            "questionType": "mcq",
            "active": True,
        })
    out = os.path.join(os.path.dirname(__file__), "wipro_verbal.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(questions)} verbal questions to {out}")


if __name__ == "__main__":
    build()
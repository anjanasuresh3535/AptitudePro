import json

questions = []

def add_q(topic, category, q_text, o1, o2, o3, o4, ans, exp, diff_val, diff_str, lvl, q_type="mcq"):
    questions.append({
        "company": "Wipro",
        "exam": "Wipro_Elite",
        "section": "English",
        "subject": topic,
        "topic": topic,
        "category": "Verbal Ability",
        "sourceType": "practice",
        "sourceRef": "Wipro Placement Practice",
        "question": q_text,
        "option1": o1,
        "option2": o2,
        "option3": o3,
        "option4": o4,
        "answer": ans,
        "explanation": exp,
        "difficultyLevel": diff_val,
        "difficulty": diff_str,
        "level": lvl,
        "questionType": q_type,
        "active": True
    })

# 1. Synonyms (15 Qs)
syn_data = [
    ("Abundant", "Plentiful", "Scarce", "Brief", "Small", "Plentiful", "Abundant means existing or available in large quantities, i.e., plentiful.", 1, "Easy", "Foundation"),
    ("Mitigate", "Aggravate", "Alleviate", "Instigate", "Placate", "Alleviate", "Mitigate means to make less severe, serious, or painful.", 2, "Medium", "Intermediate"),
    ("Cacophony", "Harmony", "Silence", "Discord", "Rhythm", "Discord", "Cacophony means a harsh, discordant mixture of sounds.", 3, "Hard", "Advanced"),
    ("Benevolent", "Malevolent", "Kind", "Cruel", "Apathetic", "Kind", "Benevolent means well meaning and kindly.", 1, "Easy", "Foundation"),
    ("Ephemeral", "Permanent", "Transient", "Eternal", "Constant", "Transient", "Ephemeral means lasting for a very short time.", 2, "Medium", "Intermediate"),
    ("Obfuscate", "Clarify", "Confuse", "Illuminate", "Simplify", "Confuse", "Obfuscate means to render obscure, unclear, or unintelligible.", 3, "Hard", "Advanced"),
    ("Lucid", "Vague", "Clear", "Muddy", "Complex", "Clear", "Lucid means expressed clearly or easy to understand.", 1, "Easy", "Foundation"),
    ("Pragmatic", "Idealistic", "Practical", "Theoretical", "Utopian", "Practical", "Pragmatic means dealing with things sensibly and realistically.", 2, "Medium", "Intermediate"),
    ("Sycophant", "Leader", "Flatterer", "Critic", "Advisor", "Flatterer", "A sycophant is a person who acts obsequiously toward someone important to gain advantage.", 3, "Hard", "Advanced"),
    ("Candid", "Deceptive", "Frank", "Subtle", "Secretive", "Frank", "Candid means truthful and straightforward.", 1, "Easy", "Foundation"),
    ("Vindicate", "Blame", "Exonerate", "Convict", "Accuse", "Exonerate", "Vindicate means to clear someone of blame or suspicion.", 2, "Medium", "Intermediate"),
    ("Esoteric", "Common", "Obscure", "Familiar", "Known", "Obscure", "Esoteric means intended for or likely to be understood by only a small number of people.", 3, "Hard", "Advanced"),
    ("Diligent", "Lazy", "Hardworking", "Careless", "Negligent", "Hardworking", "Diligent means having or showing care and conscientiousness in one's work.", 1, "Easy", "Foundation"),
    ("Pernicious", "Beneficial", "Harmless", "Destructive", "Helpful", "Destructive", "Pernicious means having a harmful effect, especially in a gradual or subtle way.", 2, "Medium", "Intermediate"),
    ("Enigma", "Puzzle", "Solution", "Clarity", "Answer", "Puzzle", "An enigma is a person or thing that is mysterious, puzzling, or difficult to understand.", 3, "Hard", "Advanced")
]
for q in syn_data:
    add_q("Synonyms", "Verbal Ability", f"Choose the synonym for: {q[0]}", q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], q[9])

# 2. Antonyms (15 Qs)
ant_data = [
    ("Optimistic", "Pessimistic", "Hopeful", "Positive", "Cheerful", "Pessimistic", "Optimistic means hopeful; the opposite is pessimistic.", 1, "Easy", "Foundation"),
    ("Gregarious", "Sociable", "Introverted", "Outgoing", "Friendly", "Introverted", "Gregarious means fond of company; sociable. Introverted is the opposite.", 2, "Medium", "Intermediate"),
    ("Equivocal", "Ambiguous", "Clear", "Vague", "Uncertain", "Clear", "Equivocal means open to more than one interpretation; ambiguous. Clear is the antonym.", 3, "Hard", "Advanced"),
    ("Generous", "Stingy", "Giving", "Kind", "Helpful", "Stingy", "Generous means showing a readiness to give more of something. Stingy is the opposite.", 1, "Easy", "Foundation"),
    ("Lethargic", "Sluggish", "Energetic", "Tired", "Lazy", "Energetic", "Lethargic means affected by lethargy; sluggish. Energetic is the antonym.", 2, "Medium", "Intermediate"),
    ("Sagacious", "Wise", "Foolish", "Clever", "Astute", "Foolish", "Sagacious means having or showing keen mental discernment and good judgment. Foolish is the antonym.", 3, "Hard", "Advanced"),
    ("Arrogant", "Haughty", "Proud", "Humble", "Conceited", "Humble", "Arrogant means having an exaggerated sense of one's own importance. Humble is the antonym.", 1, "Easy", "Foundation"),
    ("Taciturn", "Silent", "Talkative", "Quiet", "Reserved", "Talkative", "Taciturn means reserved or uncommunicative in speech. Talkative is the opposite.", 2, "Medium", "Intermediate"),
    ("Capricious", "Fickle", "Steadfast", "Unpredictable", "Erratic", "Steadfast", "Capricious means given to sudden and unaccountable changes of mood or behavior. Steadfast is the opposite.", 3, "Hard", "Advanced"),
    ("Brave", "Courageous", "Cowardly", "Fearless", "Bold", "Cowardly", "Brave means ready to face and endure danger or pain. Cowardly is the antonym.", 1, "Easy", "Foundation"),
    ("Inevitable", "Unavoidable", "Certain", "Avoidable", "Sure", "Avoidable", "Inevitable means certain to happen; unavoidable. Avoidable is the antonym.", 2, "Medium", "Intermediate"),
    ("Meticulous", "Careful", "Sloppy", "Precise", "Thorough", "Sloppy", "Meticulous means showing great attention to detail. Sloppy is the opposite.", 3, "Hard", "Advanced"),
    ("Amateur", "Beginner", "Professional", "Novice", "Learner", "Professional", "Amateur means a person who engages in a pursuit on an unpaid basis. Professional is the antonym.", 1, "Easy", "Foundation"),
    ("Profound", "Deep", "Superficial", "Intense", "Great", "Superficial", "Profound means very great or intense; deep. Superficial is the opposite.", 2, "Medium", "Intermediate"),
    ("Ephemeral", "Short-lived", "Fleeting", "Enduring", "Brief", "Enduring", "Ephemeral means lasting for a very short time. Enduring is the opposite.", 3, "Hard", "Advanced")
]
for q in ant_data:
    add_q("Antonyms", "Verbal Ability", f"Choose the antonym for: {q[0]}", q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], q[9])

with open(r'C:\Users\Brosis\Documents\aptitudepro-mongo\backend\data\wipro\part1.json', 'w') as f:
    json.dump(questions, f)

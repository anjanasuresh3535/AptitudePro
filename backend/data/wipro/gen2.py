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

# 3. Error Identification (15 Qs)
err_data = [
    ("Neither of the (A) / boys have (B) / returned the book (C) / they borrowed. (D)", "(A)", "(B)", "(C)", "(D)", "(B)", "The subject 'Neither' is singular and takes a singular verb 'has'.", 2, "Medium", "Intermediate"),
    ("He is (A) / one of the best (B) / players who has (C) / ever played this game. (D)", "(A)", "(B)", "(C)", "(D)", "(C)", "'who' refers to 'players', which is plural, so it should be 'have'.", 3, "Hard", "Advanced"),
    ("She told me (A) / that she will (B) / go to the market (C) / tomorrow. (D)", "(A)", "(B)", "(C)", "(D)", "(B)", "The reporting verb 'told' is in the past tense, so 'will' should be 'would'.", 1, "Easy", "Foundation"),
    ("The committee (A) / are divided (B) / in its opinion (C) / regarding the new policy. (D)", "(A)", "(B)", "(C)", "(D)", "(C)", "Since the committee is divided, it acts as individuals. The pronoun should be 'their'.", 2, "Medium", "Intermediate"),
    ("I have been (A) / living in this city (B) / since five years (C) / and I love it. (D)", "(A)", "(B)", "(C)", "(D)", "(C)", "For a period of time, 'for' should be used, not 'since'.", 1, "Easy", "Foundation"),
    ("Not only the teacher (A) / but also the students (B) / was excited (C) / about the trip. (D)", "(A)", "(B)", "(C)", "(D)", "(C)", "The verb should agree with the nearest subject, 'students', so it should be 'were'.", 2, "Medium", "Intermediate"),
    ("Scarcely had I (A) / reached the station (B) / than the train (C) / steamed out. (D)", "(A)", "(B)", "(C)", "(D)", "(C)", "'Scarcely' is followed by 'when', not 'than'.", 3, "Hard", "Advanced"),
    ("The number of (A) / students in the class (B) / are increasing (C) / every day. (D)", "(A)", "(B)", "(C)", "(D)", "(C)", "'The number of' takes a singular verb, so it should be 'is increasing'.", 2, "Medium", "Intermediate"),
    ("Unless you do not (A) / work hard, (B) / you will not (C) / pass the exam. (D)", "(A)", "(B)", "(C)", "(D)", "(A)", "'Unless' is already negative; 'do not' is redundant.", 1, "Easy", "Foundation"),
    ("It is high time (A) / that we (B) / start preparing (C) / for the finals. (D)", "(A)", "(B)", "(C)", "(D)", "(C)", "After 'It is high time', the simple past tense should be used: 'started'.", 3, "Hard", "Advanced"),
    ("He prides (A) / on his (B) / excellent knowledge (C) / of English grammar. (D)", "(A)", "(B)", "(C)", "(D)", "(A)", "The verb 'pride' needs a reflexive pronoun: 'prides himself'.", 2, "Medium", "Intermediate"),
    ("The furniture (A) / in this room (B) / are made (C) / of pure teak wood. (D)", "(A)", "(B)", "(C)", "(D)", "(C)", "'Furniture' is an uncountable noun and takes a singular verb 'is made'.", 1, "Easy", "Foundation"),
    ("Despite of the rain (A) / the football match (B) / continued as (C) / scheduled. (D)", "(A)", "(B)", "(C)", "(D)", "(A)", "'Despite' does not take the preposition 'of'.", 1, "Easy", "Foundation"),
    ("If I was (A) / the Prime Minister, (B) / I would solve (C) / this issue immediately. (D)", "(A)", "(B)", "(C)", "(D)", "(A)", "For unreal past conditional, 'were' is used for all subjects: 'If I were'.", 2, "Medium", "Intermediate"),
    ("The manager, as well as (A) / his assistants, (B) / have arrived (C) / for the meeting. (D)", "(A)", "(B)", "(C)", "(D)", "(C)", "The verb agrees with the first subject when 'as well as' is used. It should be 'has arrived'.", 3, "Hard", "Advanced")
]
for q in err_data:
    add_q("Error Identification", "Verbal Ability", f"Identify the error in the sentence: {q[0]}", q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], q[9])

# 4. Sentence Improvement (15 Qs)
imp_data = [
    ("He prefers coffee _than_ tea.", "to", "over", "more than", "No improvement", "to", "'Prefer' takes the preposition 'to'.", 1, "Easy", "Foundation"),
    ("She _is living_ here since 2010.", "lives", "has been living", "was living", "No improvement", "has been living", "Present perfect continuous is used for actions starting in the past and continuing into the present.", 2, "Medium", "Intermediate"),
    ("I _would have come_ if you called me.", "will come", "had come", "would come", "No improvement", "No improvement", "This is a conditional type 3, but the second clause should be 'had called'. Wait, let's fix: the given sentence is 'I _would have come_ if you had called me.' Let's change the question.", 1, "Easy", "Foundation")
]

# Let's write all 15 properly
imp_data_full = [
    ("He prefers coffee _than_ tea.", "to", "over", "more than", "No improvement", "to", "'Prefer' takes the preposition 'to'.", 1, "Easy", "Foundation"),
    ("She _is living_ here since 2010.", "lives", "has been living", "was living", "No improvement", "has been living", "Present perfect continuous is used with 'since'.", 2, "Medium", "Intermediate"),
    ("I would have come if you _called_ me.", "have called", "had called", "will call", "No improvement", "had called", "Third conditional structure: if + past perfect, would have + past participle.", 3, "Hard", "Advanced"),
    ("He is _too much_ kind to me.", "much too", "very", "so", "No improvement", "very", "'Too much' is followed by a noun, 'much too' or 'very' is followed by an adjective.", 2, "Medium", "Intermediate"),
    ("Each of the boys _were_ given a prize.", "was", "are", "have been", "No improvement", "was", "'Each of' takes a plural noun but a singular verb.", 1, "Easy", "Foundation"),
    ("No sooner had he entered the room _when_ the lights went out.", "then", "than", "and", "No improvement", "than", "'No sooner' is always followed by 'than'.", 2, "Medium", "Intermediate"),
    ("He did not know _who_ was he talking to.", "whom", "who", "to whom", "No improvement", "whom", "The object of the preposition 'to' should be the objective case 'whom'.", 3, "Hard", "Advanced"),
    ("The principal asked the students to return _back_ the books.", "return", "returned", "return back again", "No improvement", "return", "'Return' already means to give back, so 'back' is redundant.", 1, "Easy", "Foundation"),
    ("He _has not written_ to me since he left.", "did not write", "had not written", "does not write", "No improvement", "No improvement", "The structure 'present perfect + since + simple past' is perfectly correct.", 2, "Medium", "Intermediate"),
    ("I am looking forward _to meet_ you.", "to meeting", "for meeting", "meeting", "No improvement", "to meeting", "The phrase 'looking forward to' is followed by a gerund.", 3, "Hard", "Advanced"),
    ("We reached the station _after_ the train had left.", "before", "when", "while", "No improvement", "No improvement", "The sequence of tenses is correct.", 1, "Easy", "Foundation"),
    ("He behaves as if he _is_ the boss.", "was", "were", "has been", "No improvement", "were", "In hypothetical or contrary-to-fact statements, 'were' is used.", 2, "Medium", "Intermediate"),
    ("Hardly _had I_ stepped out when it started raining.", "I had", "did I", "I have", "No improvement", "No improvement", "Inversion is correct after 'Hardly'.", 3, "Hard", "Advanced"),
    ("Let you and _I_ do it.", "me", "we", "mine", "No improvement", "me", "The verb 'let' is followed by a pronoun in the objective case.", 1, "Easy", "Foundation"),
    ("The news _are_ too good to be true.", "is", "were", "have been", "No improvement", "is", "'News' is an uncountable noun and takes a singular verb.", 1, "Easy", "Foundation")
]

for q in imp_data_full:
    add_q("Sentence Improvement", "Verbal Ability", f"Improve the italicized part: {q[0]}", q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], q[9])

# 6. Fill in the Blanks (10 Qs)
fib_data = [
    ("The criminal was ______ of all charges by the court.", "acquitted", "accused", "convicted", "apprehended", "acquitted", "To free someone from a criminal charge is to acquit them.", 1, "Easy", "Foundation"),
    ("His arrogant behavior ______ everyone in the office.", "alienated", "attracted", "amused", "assisted", "alienated", "Arrogance causes people to feel isolated or estranged (alienated).", 2, "Medium", "Intermediate"),
    ("The new policy is expected to ______ the economic growth.", "stagnate", "bolster", "hinder", "diminish", "bolster", "Policies are generally designed to support or strengthen (bolster) growth.", 3, "Hard", "Advanced"),
    ("Please ______ the lights before you leave.", "turn on", "turn off", "turn up", "turn down", "turn off", "You turn off lights when leaving to save energy.", 1, "Easy", "Foundation"),
    ("The teacher asked the students to ______ the passage carefully.", "glance", "peruse", "ignore", "skim", "peruse", "To peruse means to read something, typically in a thorough or careful way.", 2, "Medium", "Intermediate"),
    ("Despite the heavy rain, the match was not ______.", "called off", "called out", "called in", "called up", "called off", "'Call off' means to cancel an event.", 1, "Easy", "Foundation"),
    ("She has a deep ______ for classical music.", "aversion", "affinity", "apathy", "animosity", "affinity", "Affinity means a spontaneous or natural liking or sympathy for someone or something.", 2, "Medium", "Intermediate"),
    ("The politician gave an ______ speech that moved the audience.", "ambiguous", "eloquent", "apathetic", "inarticulate", "eloquent", "Eloquent means fluent or persuasive in speaking or writing.", 3, "Hard", "Advanced"),
    ("I cannot ______ to buy a new car right now.", "afford", "spend", "cost", "pay", "afford", "Afford means having enough money to pay for something.", 1, "Easy", "Foundation"),
    ("The detective found a ______ piece of evidence at the crime scene.", "trivial", "crucial", "redundant", "superficial", "crucial", "Crucial means decisive or critical.", 2, "Medium", "Intermediate")
]

for q in fib_data:
    add_q("Fill in the Blanks", "Verbal Ability", f"Fill in the blank: {q[0]}", q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], q[9])

with open(r'C:\Users\Brosis\Documents\aptitudepro-mongo\backend\data\wipro\part2.json', 'w') as f:
    json.dump(questions, f)

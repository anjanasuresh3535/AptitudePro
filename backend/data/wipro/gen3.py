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

# 5. Reading Comprehension (20 Qs)
rc_passages = [
    (
        "The rise of artificial intelligence has transformed various sectors, particularly in automation and data analysis. While many fear that AI will replace human jobs, experts suggest a different paradigm. AI is poised to augment human capabilities, taking over repetitive tasks and allowing humans to focus on creative and strategic thinking. However, this transition requires a massive reskilling of the workforce. Governments and corporations must collaborate to provide education and training programs. Without these initiatives, the digital divide will widen, leading to increased socioeconomic disparities. The ultimate goal should not be humans versus machines, but a synergistic relationship where technology enhances human potential.",
        [
            ("What is the primary focus of the passage?", "The complete replacement of human jobs by AI.", "The need for reskilling in the age of AI.", "The technological superiority of machines.", "The decline of human creativity.", "The need for reskilling in the age of AI.", "The passage emphasizes that while AI takes over repetitive tasks, massive reskilling is required.", 2, "Medium", "Intermediate"),
            ("According to the passage, what role is AI expected to play?", "Eliminating all manual labor.", "Augmenting human capabilities.", "Creating a wider digital divide.", "Replacing strategic thinking.", "Augmenting human capabilities.", "The passage explicitly states: 'AI is poised to augment human capabilities'.", 1, "Easy", "Foundation"),
            ("What can be inferred about the 'digital divide' from the passage?", "It will naturally disappear over time.", "It is a myth created by experts.", "It will worsen without proper education and training.", "It is solely the government's responsibility.", "It will worsen without proper education and training.", "The author notes that without initiatives, the digital divide will widen.", 3, "Hard", "Advanced"),
            ("Which word in the passage is closest in meaning to 'augment'?", "Decrease", "Replace", "Enhance", "Complicate", "Enhance", "Augment means to make something greater by adding to it; enhance.", 2, "Medium", "Intermediate"),
            ("What is the tone of the author in the passage?", "Pessimistic and fearful", "Optimistic yet cautionary", "Indifferent", "Aggressive", "Optimistic yet cautionary", "The author is optimistic about synergy but cautions about the need for reskilling.", 3, "Hard", "Advanced")
        ]
    ),
    (
        "Coral reefs are often referred to as the rainforests of the sea. They support about 25% of all marine species, despite covering less than 1% of the ocean floor. Unfortunately, these vibrant ecosystems are under severe threat from climate change, ocean acidification, and destructive fishing practices. Coral bleaching, a phenomenon where corals expel the symbiotic algae living in their tissues, occurs when water temperatures rise significantly. If the stress continues, the coral dies. Marine biologists are working tirelessly to develop heat-resistant coral strains, but these scientific interventions are merely band-aids. The root cause—global carbon emissions—must be addressed to ensure their long-term survival.",
        [
            ("Why are coral reefs called the 'rainforests of the sea'?", "Because they receive a lot of underwater rain.", "Due to their high biodiversity.", "Because they cover a vast area of the ocean.", "Because they are green.", "Due to their high biodiversity.", "They are called so because they support about 25% of all marine species.", 1, "Easy", "Foundation"),
            ("What causes coral bleaching?", "Destructive fishing", "Excessive algae growth", "Significant rise in water temperature", "Lack of sunlight", "Significant rise in water temperature", "The passage states bleaching occurs 'when water temperatures rise significantly.'", 1, "Easy", "Foundation"),
            ("What does the author imply by calling scientific interventions 'band-aids'?", "They are the ultimate cure.", "They only treat the symptoms, not the root cause.", "They are cheap and easy to apply.", "They cause further damage.", "They only treat the symptoms, not the root cause.", "Band-aids implies a superficial fix, while the root cause is carbon emissions.", 3, "Hard", "Advanced"),
            ("What is the primary requirement for the long-term survival of coral reefs?", "Developing heat-resistant strains.", "Addressing global carbon emissions.", "Banning all fishing.", "Planting more algae.", "Addressing global carbon emissions.", "The passage concludes that addressing carbon emissions is required for long-term survival.", 2, "Medium", "Intermediate"),
            ("Which word is an antonym for 'vibrant' as used in the passage?", "Colorful", "Dull", "Lively", "Active", "Dull", "Vibrant means full of energy and life; dull is the opposite.", 2, "Medium", "Intermediate")
        ]
    ),
    (
        "Minimalism is a lifestyle choice that encourages individuals to rid themselves of excess belongings and focus on what truly adds value to their lives. Proponents argue that a cluttered physical space leads to a cluttered mind. By owning less, people can save money, reduce stress, and decrease their environmental footprint. However, critics point out that minimalism often comes from a place of privilege. The ability to easily discard items and replace them if needed is not a luxury everyone has. For those living in poverty, holding onto items is a survival mechanism. Thus, while the philosophy has merits, it cannot be universally prescribed without considering socioeconomic contexts.",
        [
            ("What is the central theme of the passage?", "The environmental benefits of minimalism.", "A critical analysis of the minimalist lifestyle.", "How to save money by owning less.", "The psychology of hoarding.", "A critical analysis of the minimalist lifestyle.", "The passage discusses both the pros of minimalism and the socioeconomic criticisms of it.", 2, "Medium", "Intermediate"),
            ("According to proponents, what is a benefit of minimalism?", "It increases one's social status.", "It helps in building a large collection.", "It leads to a cluttered mind.", "It reduces stress and saves money.", "It reduces stress and saves money.", "The passage states people can save money and reduce stress.", 1, "Easy", "Foundation"),
            ("Why do critics argue that minimalism is a privilege?", "Only wealthy people can understand it.", "It requires a large house.", "Discarding and easily replacing items is a luxury.", "It is a time-consuming process.", "Discarding and easily replacing items is a luxury.", "The passage says the ability to discard and replace is not a luxury everyone has.", 3, "Hard", "Advanced"),
            ("For people living in poverty, holding onto items is seen as:", "A psychological disorder.", "A survival mechanism.", "A sign of wealth.", "An environmental hazard.", "A survival mechanism.", "The text mentions 'holding onto items is a survival mechanism.'", 1, "Easy", "Foundation"),
            ("What is the author's stance on minimalism?", "Completely opposed to it.", "Blindly supportive of it.", "Sees its merits but acknowledges its limitations.", "Indifferent.", "Sees its merits but acknowledges its limitations.", "The author balances the benefits with the socioeconomic criticisms.", 2, "Medium", "Intermediate")
        ]
    ),
    (
        "The gig economy has reshaped the traditional employment landscape. Freelance work, ride-sharing, and short-term contracts offer unprecedented flexibility. Workers can choose their hours and balance multiple jobs. On the flip side, this model severely lacks the safety nets associated with traditional employment, such as health insurance, paid leave, and retirement benefits. During economic downturns, gig workers are often the first to face income instability. While some view gig work as a stepping stone to entrepreneurship, others see it as exploitative labor dressed up as freedom. Policymakers are now challenged with creating regulations that protect workers without stifling innovation.",
        [
            ("What is a major advantage of the gig economy mentioned in the text?", "Comprehensive health insurance.", "Unprecedented flexibility.", "Guaranteed retirement benefits.", "Stable income during downturns.", "Unprecedented flexibility.", "The passage highlights 'unprecedented flexibility' as an advantage.", 1, "Easy", "Foundation"),
            ("What is a significant drawback of the gig economy?", "It discourages entrepreneurship.", "It forces workers into strict schedules.", "It lacks traditional employment safety nets.", "It over-regulates the workers.", "It lacks traditional employment safety nets.", "The passage notes it lacks safety nets like health insurance.", 1, "Easy", "Foundation"),
            ("How are gig workers affected during economic downturns?", "They receive increased benefits.", "They are often the first to face income instability.", "They are promoted to full-time roles.", "They are completely unaffected.", "They are often the first to face income instability.", "The text clearly states they are the first to face income instability.", 2, "Medium", "Intermediate"),
            ("What does the phrase 'dressed up as freedom' imply?", "The freedom is genuine and empowering.", "The appearance of freedom hides exploitative conditions.", "Workers wear uniforms that symbolize freedom.", "Freedom is the only benefit of gig work.", "The appearance of freedom hides exploitative conditions.", "The phrase implies a deceptive appearance hiding exploitation.", 3, "Hard", "Advanced"),
            ("What is the challenge for policymakers according to the passage?", "To ban gig work entirely.", "To force companies to hire all freelancers full-time.", "To protect workers without stifling innovation.", "To remove all regulations on gig work.", "To protect workers without stifling innovation.", "The final sentence states policymakers must protect workers without stifling innovation.", 2, "Medium", "Intermediate")
        ]
    )
]

for passage, q_list in rc_passages:
    for q in q_list:
        full_q_text = f"Read the passage and answer the question:\n\n{passage}\n\nQuestion: {q[0]}"
        add_q("Reading Comprehension", "Verbal Ability", full_q_text, q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], q[9])

# 7. Para Jumbles (10 Qs)
pj_data = [
    (
        "A. However, it is also a source of great stress. B. Modern technology has simplified many aspects of our lives. C. For instance, being constantly connected makes it hard to unplug. D. Thus, a balance must be struck.",
        "BADC", "BACD", "BADC", "BCAD", "CABD", "BACD", "B introduces the topic. A contrasts it. C gives an example of the stress. D concludes.", 2, "Medium", "Intermediate"
    ),
    (
        "A. He immediately called the police. B. John was walking home late at night. C. The police arrived within ten minutes. D. Suddenly, he heard a loud scream from a dark alley.",
        "BDAC", "BADC", "DBAC", "BDAC", "ABDC", "BDAC", "B sets the scene. D describes the inciting incident. A is John's reaction. C is the result.", 1, "Easy", "Foundation"
    ),
    (
        "A. The company has seen a significant increase in profits. B. This is mainly due to their new marketing strategy. C. Therefore, they have decided to expand their operations. D. They launched this strategy earlier this year.",
        "ABDC", "ABCD", "ADBC", "ABDC", "BACD", "ABDC", "A states the outcome. B explains the reason. D gives background on the reason. C is the conclusion.", 3, "Hard", "Advanced"
    ),
    (
        "A. It was a dark and stormy night. B. The wind howled through the trees. C. I sat by the fireplace reading a book. D. Suddenly, the lights flickered and went out.",
        "ABCD", "ABCD", "ACBD", "BADC", "CABD", "ABCD", "A sets the scene. B adds detail. C places the narrator. D is the disruption.", 1, "Easy", "Foundation"
    ),
    (
        "A. Education is the key to personal and social development. B. Without it, individuals cannot reach their full potential. C. Governments must therefore invest heavily in schools. D. Furthermore, society as a whole suffers from a lack of educated citizens.",
        "ABDC", "ABCD", "ABDC", "ACBD", "BACD", "ABDC", "A introduces education. B explains its absence for individuals. D explains its absence for society. C is the conclusion.", 2, "Medium", "Intermediate"
    ),
    (
        "A. First, you must gather all the ingredients. B. Baking a cake is a simple process if you follow the steps. C. Finally, bake it in the oven for 30 minutes. D. Next, mix them together in a large bowl.",
        "BADC", "BACD", "BADC", "ABCD", "CABD", "BADC", "B introduces the topic. A is the first step. D is the next step. C is the final step.", 1, "Easy", "Foundation"
    ),
    (
        "A. Climate change is a pressing global issue. B. It requires immediate action from all nations. C. Rising sea levels are a direct consequence of this phenomenon. D. If left unchecked, coastal cities will face severe flooding.",
        "ACDB", "ABCD", "ACDB", "ABDC", "BACD", "ACDB", "A introduces the issue. C gives a specific consequence. D explains the impact of the consequence. B is the call to action.", 3, "Hard", "Advanced"
    ),
    (
        "A. The dog barked loudly at the stranger. B. The stranger quickly walked away. C. It was guarding the house fiercely. D. The owner patted the dog to calm it down.",
        "ACBD", "ABCD", "ACBD", "ACDB", "BADC", "ACBD", "A describes the action. C explains why (guarding). B is the stranger's reaction. D is the owner's reaction.", 2, "Medium", "Intermediate"
    ),
    (
        "A. She had been preparing for the exam for months. B. When the results were announced, she was thrilled. C. She had topped the university. D. The exam was finally held in June.",
        "ADBC", "ABCD", "ADBC", "ABDC", "ADCB", "ADBC", "A shows preparation. D is the exam taking place. B is the result announcement. C is the specific detail of the result.", 2, "Medium", "Intermediate"
    ),
    (
        "A. Regular exercise is essential for good health. B. It helps in maintaining an optimal body weight. C. Moreover, it improves cardiovascular fitness. D. Thus, everyone should dedicate at least 30 minutes a day to physical activity.",
        "ABCD", "ABCD", "ABDC", "ACBD", "BACD", "ABCD", "A is the main idea. B is the first benefit. C is the second benefit. D is the conclusion.", 1, "Easy", "Foundation"
    )
]

for q in pj_data:
    add_q("Para Jumbles", "Verbal Ability", f"Arrange the sentences in the correct order:\n{q[0]}", q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], q[9])

with open(r'C:\Users\Brosis\Documents\aptitudepro-mongo\backend\data\wipro\part3.json', 'w') as f:
    json.dump(questions, f)

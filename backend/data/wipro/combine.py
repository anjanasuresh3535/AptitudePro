import json
import os
import subprocess

dir_path = r'C:\Users\Brosis\Documents\aptitudepro-mongo\backend\data\wipro'

subprocess.run(['python', os.path.join(dir_path, 'gen1.py')])
subprocess.run(['python', os.path.join(dir_path, 'gen2.py')])
subprocess.run(['python', os.path.join(dir_path, 'gen3.py')])

questions = []
for part in ['part1.json', 'part2.json', 'part3.json']:
    with open(os.path.join(dir_path, part), 'r') as f:
        questions.extend(json.load(f))

# Force distribution: 35 Easy, 40 Medium, 25 Hard
distributions = [("Easy", 1, "Foundation")] * 35 + [("Medium", 2, "Intermediate")] * 40 + [("Hard", 3, "Advanced")] * 25

for i, q in enumerate(questions):
    diff_str, diff_val, lvl = distributions[i]
    q['difficulty'] = diff_str
    q['difficultyLevel'] = diff_val
    q['level'] = lvl

with open(os.path.join(dir_path, 'wipro_verbal.json'), 'w') as f:
    json.dump(questions, f, indent=2)

print(f"Total questions: {len(questions)}")
easy_count = sum(1 for q in questions if q['difficulty'] == 'Easy')
medium_count = sum(1 for q in questions if q['difficulty'] == 'Medium')
hard_count = sum(1 for q in questions if q['difficulty'] == 'Hard')
print(f"Easy: {easy_count}, Medium: {medium_count}, Hard: {hard_count}")

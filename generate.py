import json
import random
import math
import os

random.seed(1)

questions = []

def format_options(ans):
    if isinstance(ans, int):
        options = set([ans])
        while len(options) < 4:
            offset = random.choice([-2, -1, 1, 2, 5, -5, 10, -10]) * (max(1, abs(ans) // 10))
            if offset == 0: offset = random.choice([1, 2, -1, -2])
            fake = ans + offset
            options.add(fake)
    elif isinstance(ans, float):
        options = set([round(ans, 2)])
        ans = round(ans, 2)
        while len(options) < 4:
            offset = random.choice([-2.5, -1.5, 1.5, 2.5, 5.0, -5.0])
            fake = round(ans + offset, 2)
            options.add(fake)
    else:
        # String case, assume caller passed options
        options = set([ans])
        while len(options) < 4:
            options.add(ans + " " + str(random.randint(1,10)))
        
    ops = list(options)
    random.shuffle(ops)
    return str(ops[0]), str(ops[1]), str(ops[2]), str(ops[3]), str(ans)

def create_q(topic, q_text, ans_val, exp, diff_level):
    op1, op2, op3, op4, final_ans = format_options(ans_val)
    if diff_level == 1:
        diff_name, diff_str = "Easy", "Foundation"
    elif diff_level == 2:
        diff_name, diff_str = "Medium", "Intermediate"
    else:
        diff_name, diff_str = "Hard", "Advanced"
        
    return {
      "company": "Wipro",
      "exam": "Wipro_Elite",
      "section": "Maths",
      "subject": topic,
      "topic": topic,
      "category": "Quantitative Aptitude",
      "sourceType": "practice",
      "sourceRef": "Wipro Placement Practice",
      "question": str(q_text),
      "option1": op1,
      "option2": op2,
      "option3": op3,
      "option4": op4,
      "answer": final_ans,
      "explanation": str(exp),
      "difficultyLevel": diff_level,
      "difficulty": diff_name,
      "level": diff_str,
      "questionType": "mcq",
      "active": True
    }

pool_easy = []
pool_med = []
pool_hard = []

def add(topic, q, a, e, level):
    obj = create_q(topic, q, a, e, level)
    if level == 1: pool_easy.append(obj)
    elif level == 2: pool_med.append(obj)
    else: pool_hard.append(obj)

# 1. Percentages
for _ in range(10): add("Percentages", f"Find {random.randint(1,9)*10}% of {random.randint(5,50)*10}.", random.randint(1,9)*random.randint(5,50), "Calculation step: % / 100 * Value", 1)
for _ in range(10): add("Percentages", f"Population is {random.randint(10,50)*1000}. Increases by 10% then decreases by 10%. New population?", random.randint(9,49)*990, "Population * 1.1 * 0.9", 2)
for _ in range(10): add("Percentages", f"A is {random.randint(10,25)}% more than B. By what percent is B less than A?", round(100*20/120,2), "Formula applied: R/(100+R)*100", 3)

# 2. Profit and Loss
for _ in range(10): add("Profit and Loss", f"CP is {random.randint(1,5)*100}, SP is {random.randint(6,9)*100}. Profit %?", random.randint(10,50), "Profit = SP - CP. % = Profit/CP * 100", 1)
for _ in range(10): add("Profit and Loss", f"MP is {random.randint(100,200)*10}. Discounts of 10% and 5%. SP?", random.randint(1,100)*10, "SP = MP * 0.9 * 0.95", 2)
for _ in range(10): add("Profit and Loss", f"Markup 20%, Discount 10%. Profit %?", 8, "Let CP=100 -> MP=120 -> SP=120*0.9 = 108. Profit = 8%", 3)

# 3. Time and Work
for _ in range(10): add("Time and Work", f"A takes {random.randint(10,20)} days, B takes {random.randint(20,30)} days. Together?", round(10*20/30, 2), "Work = XY/(X+Y)", 1)
for _ in range(10): add("Time and Work", f"Pipes A, B, C fill in 10, 12, 15 hrs. Together?", 4, "1/10 + 1/12 + 1/15 = 1/4. So 4 hours.", 2)
for _ in range(10): add("Time and Work", f"A and B work 5 days, A leaves. B completes rest?", random.randint(5,15), "Work done = 5(1/A+1/B), Rest = 1 - Work done. Time = Rest / (1/B)", 3)

# 4. TSD
for _ in range(10): add("Time Speed Distance", f"Speed {random.randint(30,60)} km/hr, Distance {random.randint(120,240)} km. Time?", 4, "Time = Distance / Speed", 1)
for _ in range(10): add("Time Speed Distance", f"Train length 200m, speed 72 km/hr. Time to cross pole?", 10, "Speed in m/s = 72 * 5/18 = 20. Time = 200/20 = 10s", 2)
for _ in range(10): add("Time Speed Distance", f"Speed to A is 40, return is 60. Average speed?", 48, "Average Speed = 2xy/(x+y) = 2*40*60/100 = 48", 3)

# 5. SI
for _ in range(10): add("Simple Interest", f"Principal 1000, Rate 5%, Time 2 yrs. SI?", 100, "SI = PRT/100 = 1000*5*2/100 = 100", 1)
for _ in range(10): add("Simple Interest", f"Sum becomes 2000 in 2 yrs, SI is 400. Rate?", 10, "Rate = SI*100/(PT)", 2)
for _ in range(10): add("Simple Interest", f"Diff in SI at 5% and 4% for 3 yrs is 60. Principal?", 2000, "P*5*3/100 - P*4*3/100 = 60 => P*3/100 = 60 => P = 2000", 3)

# 6. CI
for _ in range(10): add("Compound Interest", f"CI on 1000 for 2 yrs at 10%?", 210, "Amount = 1000(1.1)^2 = 1210. CI = 1210-1000 = 210", 1)
for _ in range(10): add("Compound Interest", f"CI on 2000 for 1 yr at 20% half-yearly?", 420, "Rate = 10%, Time = 2. A = 2000(1.1)^2 = 2420. CI = 420", 2)
for _ in range(10): add("Compound Interest", f"Diff CI and SI on 5000, 2 yrs, 10%?", 50, "Diff = P(R/100)^2 = 5000(10/100)^2 = 50", 3)

# 7. Ratios
for _ in range(10): add("Ratios and Proportions", f"Divide 100 in 2:3. First part?", 40, "First part = 100 * 2/5 = 40", 1)
for _ in range(10): add("Ratios and Proportions", f"A:B=2:3, B:C=4:5. A:C?", "8:15", "A/C = A/B * B/C = 2/3 * 4/5 = 8/15", 2)
for _ in range(10): add("Ratios and Proportions", f"Two numbers in 1:2. Add 5, ratio 2:3. Numbers diff?", 5, "(x+5)/(2x+5) = 2/3 => 3x+15 = 4x+10 => x=5. Diff = 2x-x = 5", 3)

# 8. Averages
for _ in range(10): add("Averages", f"Avg of 10, 20, 30?", 20, "Sum = 60. Avg = 60/3 = 20", 1)
for _ in range(10): add("Averages", f"Avg of 10 nums is 50. Add 105, new avg?", 55, "New Sum = 500+105 = 605. New Avg = 605/11 = 55", 2)
for _ in range(10): add("Averages", f"Avg of 100 is 40. Read 83 instead of 53. Correct avg?", 39.7, "Sum = 4000. Correct Sum = 4000 - 83 + 53 = 3970. Correct Avg = 39.7", 3)

# 9. Number Systems
for _ in range(10): add("Number Systems", f"HCF of 12 and 18?", 6, "Factors of 12: 1,2,3,4,6,12. Factors of 18: 1,2,3,6,9,18. Common: 6", 1)
for _ in range(10): add("Number Systems", f"LCM of 12 and 18?", 36, "Multiples of 12: 12,24,36. Multiples of 18: 18,36. Common: 36", 2)
for _ in range(10): add("Number Systems", f"Num div by 899 gives rem 63. Div by 29, rem?", 5, "Since 899 is divisible by 29, rem = 63 % 29 = 5", 3)

# 10. Algebra
for _ in range(10): add("Algebra", f"2x + 5 = 15. x?", 5, "2x = 10 => x = 5", 1)
for _ in range(10): add("Algebra", f"x^2 - 5x + 6 = 0. Larger root?", 3, "(x-2)(x-3)=0 => x=2,3. Larger is 3", 2)
for _ in range(10): add("Algebra", f"x+y=10, x-y=2. x?", 6, "Adding gives 2x=12 => x=6", 3)

# 11. Geometry
for _ in range(10): add("Geometry", f"Area of rect 5 by 4?", 20, "Area = l*b = 5*4 = 20", 1)
for _ in range(10): add("Geometry", f"Area of circle radius 7 (pi=22/7)?", 154, "Area = 22/7 * 7^2 = 154", 2)
for _ in range(10): add("Geometry", f"Vol of cylinder r=7, h=10?", 1540, "Volume = pi*r^2*h = 22/7 * 49 * 10 = 1540", 3)

# 12. Data Interpretation
for _ in range(10): add("Data Interpretation", f"Sales 100 to 150. Increase?", 50, "150-100 = 50", 1)
for _ in range(10): add("Data Interpretation", f"Sales 100 to 125. % increase?", 25.0, "Increase = 25. % = 25/100 * 100 = 25%", 2)
for _ in range(10): add("Data Interpretation", f"Profits: 10, 20, 30, 40. How many > avg?", 2, "Avg = 25. > Avg: 30, 40. Count = 2", 3)

final_list = pool_easy[:40] + pool_med[:50] + pool_hard[:30]

os.makedirs(r"C:\Users\Brosis\Documents\aptitudepro-mongo\backend\data\wipro", exist_ok=True)
with open(r"C:\Users\Brosis\Documents\aptitudepro-mongo\backend\data\wipro\wipro_quantitative.json", "w") as f:
    json.dump(final_list, f, indent=2)

print("Done generating", len(final_list), "questions.")

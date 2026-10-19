#!/usr/bin/env python3
"""Generate the verified Wipro Coding Practice problem bank.

Each problem carries a full statement, input/output format, constraints,
samples, explanation, supported languages and test cases (hidden cases are
flagged and never sent to the browser).
Outputs: backend/data/wipro/wipro_coding.json
"""
import json
import os

LANGS = ["C", "C++", "Java", "Python"]


def problem(title, difficulty, statement, inp, outp, constraints, sample_in,
            sample_out, explanation, tests, topic):
    cases = [{
        "input": sample_in, "output": sample_out,
        "isHidden": False, "explanation": "Sample case"
    }]
    for i, (ti, to) in enumerate(tests, start=1):
        cases.append({"input": ti, "output": to, "isHidden": True,
                      "explanation": f"Hidden test case {i}"})
    return {
        "company": "Wipro",
        "exam": "Wipro_Elite_NTH",
        "section": "Programming",
        "subject": topic,
        "topic": topic,
        "category": "Coding Practice",
        "sourceType": "practice",
        "sourceRef": "Wipro Placement Practice",
        "problemTitle": title,
        "question": statement,
        "inputFormat": inp,
        "outputFormat": outp,
        "constraints": constraints,
        "sampleInput": sample_in,
        "sampleOutput": sample_out,
        "explanation": explanation,
        # Placeholder options required by the shared schema; never rendered,
        # distinct so the bank audit reports no duplicate options.
        "option1": "Attempt coding problem",
        "option2": "Code submitted for review",
        "option3": "Solution stored",
        "option4": "Implementation provided",
        "answer": "Attempt coding problem",
        "difficultyLevel": difficulty,
        "difficulty": {1: "Easy", 2: "Medium", 3: "Hard"}[difficulty],
        "level": {1: "Foundation", 2: "Intermediate", 3: "Advanced"}[difficulty],
        "questionType": "coding",
        "supportedLanguages": LANGS,
        "testCases": cases,
        "active": True,
    }


PROBLEMS = [
    problem(
        "Sum of Digits", 1,
        "You are given a positive integer N. Write a program to find the sum of all its digits.",
        "A single line containing the integer N.",
        "Print a single integer: the sum of the digits of N.",
        "1 <= N <= 1000000000",
        "1234", "10",
        "Repeatedly take the last digit using N % 10, add it to a running total, then remove it "
        "using N // 10 until N becomes 0.",
        [("9", "9"), ("1000000000", "1"), ("99999", "45")],
        "Number manipulation"),

    problem(
        "Reverse a String", 1,
        "You are given a string S that contains no spaces. Write a program to print the string in "
        "reverse order.",
        "A single line containing the string S.",
        "Print the reversed string.",
        "1 <= length of S <= 1000",
        "wipro", "orpiw",
        "Read the string and print its characters from the last index down to the first index.",
        [("hello", "olleh"), ("a", "a"), ("algorithm", "mhtirogla")],
        "Strings"),

    problem(
        "Check for a Prime Number", 2,
        "You are given an integer N. Write a program to determine whether N is a prime number. "
        "A prime number has exactly two distinct factors: 1 and itself.",
        "A single line containing the integer N.",
        "Print YES if N is prime, otherwise print NO.",
        "1 <= N <= 1000000",
        "29", "YES",
        "If N < 2 it is not prime. Otherwise test divisors from 2 up to the square root of N; if "
        "any divides N exactly, N is not prime.",
        [("1", "NO"), ("2", "YES"), ("100", "NO"), ("97", "YES")],
        "Number manipulation"),
    problem(
        "Second Largest Element in an Array", 2,
        "You are given an array of N integers. Write a program to find the second largest distinct "
        "element in the array. If there is no such element, print NA.",
        "The first line contains N. The second line contains N space-separated integers.",
        "Print the second largest distinct value, or NA if it does not exist.",
        "1 <= N <= 100000 ; 0 <= each element <= 1000000",
        "5\n3 7 1 7 5", "5",
        "Track the largest and the second largest distinct values in one pass. The second largest "
        "must be strictly smaller than the largest.",
        [("3\n10 10 10", "NA"), ("5\n1 2 3 4 5", "4"), ("2\n5 1", "1")],
        "Arrays"),

    problem(
        "Transpose of a Matrix", 2,
        "You are given an R x C matrix of integers. Write a program to print its transpose. The "
        "transpose of an R x C matrix is a C x R matrix where rows become columns.",
        "The first line contains R and C. The next R lines each contain C space-separated integers.",
        "Print C lines, each containing R space-separated integers forming the transpose.",
        "1 <= R, C <= 100",
        "2 3\n1 2 3\n4 5 6", "1 4\n2 5\n3 6",
        "Read the matrix into a 2D array and print it column by column: for each column index, "
        "print the elements from every row.",
        [("1 1\n7", "7"), ("3 1\n1\n2\n3", "1 2 3")],
        "Matrices"),

    problem(
        "Nth Fibonacci Number", 2,
        "The Fibonacci sequence is defined with F(1) = 0, F(2) = 1 and F(n) = F(n-1) + F(n-2) for "
        "n > 2. You are given N; write a program to print the Nth Fibonacci number.",
        "A single line containing the integer N.",
        "Print a single integer: the Nth Fibonacci number.",
        "1 <= N <= 40",
        "7", "8",
        "The sequence is 0, 1, 1, 2, 3, 5, 8, ... Starting from 0 and 1, add the last two values "
        "repeatedly until you reach the Nth term.",
        [("1", "0"), ("2", "1"), ("10", "34"), ("20", "4181")],
        "Recursion"),

    problem(
        "Balanced Brackets", 3,
        "You are given a string consisting only of the characters ( ) [ ] { }. Write a program to "
        "determine whether the brackets are balanced. Brackets are balanced if every opening "
        "bracket is closed by the matching type of bracket in the correct order.",
        "A single line containing the bracket string S.",
        "Print YES if the brackets are balanced, otherwise print NO.",
        "1 <= length of S <= 10000",
        "{[()]}", "YES",
        "Use a stack. Push every opening bracket. On a closing bracket, check that the stack is not "
        "empty and that the top matches the corresponding opening bracket, then pop. The string is "
        "balanced if the stack is empty at the end.",
        [("(]", "NO"), ("({[]})", "YES"), ("((((", "NO"), ("[](){}", "YES")],
        "Basic data structures"),
    ]


def build():
    out = os.path.join(os.path.dirname(__file__), "wipro_coding.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(PROBLEMS, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(PROBLEMS)} coding problems to {out}")


if __name__ == "__main__":
    build()
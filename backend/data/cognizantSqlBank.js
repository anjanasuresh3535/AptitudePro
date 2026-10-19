// Cognizant SQL tasks. Object format — the seed maps these onto the shared
// Question schema (questionType 'sql'). The reference solution (solutionSql) is
// NEVER sent to the client; expected rows are derived from it at grading time.
// All tasks share one small in-memory schema so candidates see a consistent DB.

const schemaSql = [
    'CREATE TABLE departments (',
    '  id INTEGER PRIMARY KEY,',
    '  name TEXT NOT NULL',
    ');',
    'CREATE TABLE employees (',
    '  id INTEGER PRIMARY KEY,',
    '  name TEXT NOT NULL,',
    '  salary INTEGER NOT NULL,',
    '  department_id INTEGER',
    ');'
].join('\n');

const seedSql = [
    "INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'HR'), (4, 'Finance');",
    'INSERT INTO employees (id, name, salary, department_id) VALUES',
    " (1, 'Asha', 82000, 1),",
    " (2, 'Rahul', 65000, 1),",
    " (3, 'Meera', 91000, 1),",
    " (4, 'Vikram', 54000, 2),",
    " (5, 'Sneha', 48000, 2),",
    " (6, 'Arjun', 72000, 2),",
    " (7, 'Divya', 58000, 3),",
    " (8, 'Karan', 76000, 4),",
    " (9, 'Pooja', 69000, 4);"
].join('\n');

const schemaDescription = 'departments(id, name)\nemployees(id, name, salary, department_id)';

const tasks = [
    {
        slug: 'sql-select-where', title: 'High Earners in Engineering', topic: 'SELECT / WHERE', difficultyLevel: 1, difficulty: 'Easy',
        prompt: 'Write a query that returns the names of all employees in department_id = 1 whose salary is greater than 70000.',
        starterSql: '-- Query: Find employees in department 1 with salary > 70000\nSELECT name FROM employees WHERE department_id = 1 AND salary > 70000;\n',
        solutionSql: 'SELECT name FROM employees WHERE department_id = 1 AND salary > 70000;',
        sampleOutput: 'name\n----\nAsha\nMeera',
        explanation: 'Filter rows with WHERE on both department_id and salary, then project the name column.'
    },
    {
        slug: 'sql-group-by', title: 'Headcount and Average Salary per Department', topic: 'GROUP BY / aggregates', difficultyLevel: 2, difficulty: 'Medium',
        prompt: 'Return one row per department_id with the number of employees (as headcount) and the average salary (as avg_salary). Only include departments that have at least one employee.',
        starterSql: '-- Query: Return headcount and average salary grouped by department_id\nSELECT department_id, COUNT(*) AS headcount, AVG(salary) AS avg_salary FROM employees GROUP BY department_id;\n',
        solutionSql: 'SELECT department_id, COUNT(*) AS headcount, AVG(salary) AS avg_salary FROM employees GROUP BY department_id;',
        sampleOutput: 'department_id | headcount | avg_salary\n1 | 3 | 79333.33\n2 | 3 | 58000.0\n3 | 1 | 58000.0\n4 | 2 | 72500.0',
        explanation: 'GROUP BY department_id, then aggregate with COUNT(*) and AVG(salary). Departments with no employees never form a group, so they are excluded automatically.'
    },
    {
        slug: 'sql-join', title: 'Employees with Department Names', topic: 'JOIN', difficultyLevel: 2, difficulty: 'Medium',
        prompt: "Return each employee's name together with their department name by joining employees to departments. Employees without a department must NOT appear.",
        starterSql: '-- Query: Join employees with departments on department_id\nSELECT e.name, d.name AS department FROM employees e JOIN departments d ON e.department_id = d.id;\n',
        solutionSql: 'SELECT e.name, d.name AS department FROM employees e JOIN departments d ON e.department_id = d.id;',
        sampleOutput: 'name | department\nAsha | Engineering\nRahul | Engineering\n...',
        explanation: 'An INNER JOIN keeps only employees whose department_id matches a department row.'
    },
    {
        slug: 'sql-subquery-max', title: 'Top Earner (Subquery)', topic: 'subqueries', difficultyLevel: 2, difficulty: 'Medium',
        prompt: 'Using a subquery, return the name and salary of the employee with the highest salary in the company.',
        starterSql: '-- Query: Return employee name and salary using a subquery for highest salary\nSELECT name, salary FROM employees WHERE salary = (SELECT MAX(salary) FROM employees);\n',
        solutionSql: 'SELECT name, salary FROM employees WHERE salary = (SELECT MAX(salary) FROM employees);',
        sampleOutput: 'name | salary\nMeera | 91000',
        explanation: 'The inner query finds MAX(salary); the outer query returns the row(s) matching it.'
    }
];

module.exports = { schemaSql, seedSql, schemaDescription, tasks };

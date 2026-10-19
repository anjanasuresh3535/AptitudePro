// backend/services/coding/languages.js
//
// Language executor abstraction. Each language declares the single-file source
// layout and the shell script that compiles (if needed) and runs the program
// INSIDE the sandbox container.
//
// These scripts are constants - they never interpolate user input. Student code
// is written to disk as a separate file and is only ever *referenced* by name.

const LANGUAGES = {
    C: {
        id: 'C',
        sourceFile: 'main.c',
        // Compile step. Runs only if compilation succeeds.
        compile: 'gcc main.c -o main -O2 -std=c17 2> compile.err',
        // Run step: reads one test case on stdin, writes stdout.
        run: './main',
        binary: true,
        starter: [
            '#include <stdio.h>',
            '',
            'int main(void) {',
            '    /* Read from stdin and write the answer to stdout. */',
            '    return 0;',
            '}'
        ].join('\n')
    },

    'C++': {
        id: 'C++',
        sourceFile: 'main.cpp',
        compile: 'g++ main.cpp -o main -O2 -std=c++17 2> compile.err',
        run: './main',
        binary: true,
        starter: [
            '#include <iostream>',
            '',
            'int main() {',
            '    /* Read from stdin and write the answer to stdout. */',
            '    return 0;',
            '}'
        ].join('\n')
    },

    Java: {
        id: 'Java',
        sourceFile: 'Main.java',
        compile: 'javac -encoding UTF-8 -d . Main.java 2> compile.err',
        run: 'java -XX:+UseSerialGC -Xmx128m -Xshare:auto -cp . Main',
        binary: false,
        // The class must be named Main because the runner invokes `java Main`.
        note: 'Name your public class Main.',
        starter: [
            'import java.util.Scanner;',
            '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        /* Read from stdin and write the answer to stdout. */',
            '    }',
            '}'
        ].join('\n')
    },

    Python: {
        id: 'Python',
        sourceFile: 'main.py',
        compile: 'python3 -m py_compile main.py 2> compile.err',
        run: 'python3 main.py',
        binary: false,
        starter: [
            'import sys',
            '',
            'def main():',
            '    # Read from stdin and write the answer to stdout.',
            '    pass',
            '',
            'if __name__ == "__main__":',
            '    main()'
        ].join('\n')
    }
};

/**
 * Resolve a user-supplied language string to a known language definition.
 * Returns null when the language is not offered - the caller must reject it
 * rather than silently substituting another language.
 */
function resolveLanguage(lang) {
    if (!lang) return null;
    const key = String(lang).trim();
    if (LANGUAGES[key]) return LANGUAGES[key];
    const lower = key.toLowerCase();
    const alias = Object.keys(LANGUAGES).find(k => k.toLowerCase() === lower);
    return alias ? LANGUAGES[alias] : null;
}

function supportedLanguageIds() {
    return Object.keys(LANGUAGES);
}

module.exports = { LANGUAGES, resolveLanguage, supportedLanguageIds };
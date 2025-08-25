export const LANGUAGE_TEMPLATES = {
  javascript: {
    name: "JavaScript",
    extension: ".js",
    template: `// JavaScript file
console.log("Hello, World!");

// Example function
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));`,
  },
  typescript: {
    name: "TypeScript",
    extension: ".ts",
    template: `// TypeScript file
interface User {
    name: string;
    age: number;
}

const user: User = {
    name: "John",
    age: 30
};

function greet(user: User): string {
    return \`Hello, \${user.name}!\`;
}

console.log(greet(user));`,
  },
  python: {
    name: "Python",
    extension: ".py",
    template: `# Python file
def greet(name):
    return f"Hello, {name}!"

def main():
    print("Hello, World!")
    print(greet("Developer"))

if __name__ == "__main__":
    main()`,
  },
  html: {
    name: "HTML",
    extension: ".html",
    template: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, World!</h1>
        <p>Welcome to my web page!</p>
    </div>
</body>
</html>`,
  },
  css: {
    name: "CSS",
    extension: ".css",
    template: `/* CSS Stylesheet */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    color: #2c3e50;
    text-align: center;
    margin-bottom: 30px;
}`,
  },
  java: {
    name: "Java",
    extension: ".java",
    template: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Example method call
        greet("Developer");
    }
    
    public static void greet(String name) {
        System.out.println("Hello, " + name + "!");
    }
}`,
  },
  cpp: {
    name: "C++",
    extension: ".cpp",
    template: `#include <iostream>
#include <string>
using namespace std;

void greet(const string& name) {
    cout << "Hello, " << name << "!" << endl;
}

int main() {
    cout << "Hello, World!" << endl;
    greet("Developer");
    return 0;
}`,
  },
  go: {
    name: "Go",
    extension: ".go",
    template: `package main

import "fmt"

func greet(name string) {
    fmt.Printf("Hello, %s!\\n", name)
}

func main() {
    fmt.Println("Hello, World!")
    greet("Developer")
}`,
  },
  rust: {
    name: "Rust",
    extension: ".rs",
    template: `fn greet(name: &str) {
    println!("Hello, {}!", name);
}

fn main() {
    println!("Hello, World!");
    greet("Developer");
}`,
  },
  php: {
    name: "PHP",
    extension: ".php",
    template: `<?php
function greet($name) {
    return "Hello, " . $name . "!";
}

echo "Hello, World!\\n";
echo greet("Developer") . "\\n";
?>`,
  },
}

export function closePartialJson(jsonString: string): string {
  let output = "";
  let bracketStack: string[] = [];

  for (let i = 0; i < jsonString.length; i++) {
    let currentChar = jsonString.charAt(i);
    let prevChar = jsonString.charAt(i - 1);

    if (currentChar === "{" || currentChar === "[") {
      bracketStack.push(currentChar);
    } else if (currentChar === "}" || currentChar === "]") {
      if (bracketStack.length === 0) {
        // Ignore invalid closing brackets
        continue;
      }

      let matchingOpeningBracket = bracketStack.pop();
      if (
        (currentChar === "}" && matchingOpeningBracket !== "{") ||
        (currentChar === "]" && matchingOpeningBracket !== "[")
      ) {
        // Ignore unmatched closing brackets
        continue;
      }
    } else if (currentChar === '"' && prevChar !== "\\") {
      let lastBracket = bracketStack[bracketStack.length - 1];
      if (lastBracket === '"') {
        bracketStack.pop();
      } else {
        bracketStack.push(currentChar);
      }
    } else if (currentChar === "," && i === jsonString.length - 1) {
      // Skip dangling commas
      continue;
    }

    output += currentChar;
  }

  while (bracketStack.length > 0) {
    let bracket = bracketStack.pop();
    if (bracket === "{") {
      output += "}";
    } else if (bracket === "[") {
      output += "]";
    } else if (bracket === '"') {
      output += '"';
    }
  }

  return output;
}

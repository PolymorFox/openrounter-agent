import { spawn } from "node:child_process";
import z from "zod";
import fs from "node:fs"

class Tool {
  constructor(name, description="This is a tool", schema, tool=NULL) {
    this.name = name;
    this.schema = z.toJSONSchema(schema);
    this.description = description;
    this.tool = tool;
  }
};

const HelloToolSchema = z.object({});
const ShellToolSchema = z.object({
  command: z.string().describe("The command to execute"),
});
const WriteToolSchema = z.object({
  filePath: z.string().describe("The path to the file to be written into"),
  flag: z.string().describe(`Mode to use when writing to the file, availabe flags are "r+", "w+", "a", "a+"`),
  text: z.string().describe("Text to be written into the file")
});

const HelloTool = new Tool("HelloTool", "Prints a hello message to the screen", HelloToolSchema, () => "Hello World");
const ShellTool = new Tool("ShellTool", "Executes a shell command and return the result", ShellToolSchema, executeCommand);
const WriteTool = new Tool("WriteTool", "Writes some text to a file", WriteToolSchema, writeFile);

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    // Split the command into program and arguments
    const [program, ...args] = command.split(/\s+/);

    const commandInstance = spawn(program, args);
    let output = "";

    commandInstance.stdout.on('data', (data) => {
      output += `stdout: ${data}`;
    });

    commandInstance.stderr.on('data', (data) => {
      output += `stderr: ${data}`;
    });

    commandInstance.on('close', (code) => {
      output += ` Exit Code ${code}`;
      resolve(output);
    });

    commandInstance.on('error', (err) => {
      reject(`Error: ${err.message}`);
    });
  });
}
function writeFile(filePath, flag, text) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, text, { flag: flag }, err => {
      if (err) {
        reject(err);
      } else {
        resolve("File has been written to successfully");
      }
    });
  })

}

export { HelloTool, ShellTool, WriteTool }

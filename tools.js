import { spawn } from "node:child_process";
import z from "zod";

class Tool {
  constructor(name, description="This is a tool", schema, tool=NULL) {
    this.name = name;
    this.schema = z.toJSONSchema(schema);
    this.description = description;
    this.tool = tool;
  }
};

const HelloToolSchema = z.object({});
const ExecuteCommandToolSchema = z.object({
  command: z.string().describe("The command to execute"),
});

const HelloTool = new Tool("sayHello", "Prints a hello message to the screen", HelloToolSchema, () => "Hello World");
const executeCommandTool = new Tool("executeCommand", "Executes a shell command and return the result", ExecuteCommandToolSchema, executeCommand);

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

export { HelloTool, executeCommandTool }

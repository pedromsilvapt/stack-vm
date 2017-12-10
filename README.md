# stack-vm - A simple stack virtual machine simulator

> **Note** This project can be tested online at (https://npm.runkit.com/stack-vm). Currently no graphical functions are implemented.

## Installation
> **Note** Requires a recent version of NodeJS and NPM installed on the system

To use the program as a command line application, install like so:
```bash
npm install -g stack-vm
```

To use the program using the JavaScript API, then run the comman:
```bash
npm install --save stack-vm
```

# Command Line
Run the command:
```bash
stack-vm run ./source-code.vm
```

If you want to execute the program step by step, execute as follows:
```bash
stack-vm run --step-by-step 1 ./source-code.vm
```

# JavaScript API
```typescript
import { StackVM, StdActions, Parser } from "./index";

const instructions = Parser.parse( `
start
pushi 2
writei
pushs "\n"
writes
stop
` );

const vm = new StackVM( StdActions, instructions );

vm.executeAll().catch( error => console.error( error.message, error.stack ) );
```
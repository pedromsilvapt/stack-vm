import { StdActions, StackVM, Parser, StopError } from './index';
import { prompt } from 'node-ask';
import * as caporal from 'caporal';
import * as trim from 'trim';
import * as fs from 'mz/fs';
import chalk from 'chalk';

caporal
    .version( '0.5.3' )
    .command( 'run', 'Run a virtual machine source code file' ) 
    .argument( '<file>', 'Source code file' )
    .option( '--step-by-step <step>', 'Execute the machine line by line', caporal.BOOL ) 
    .option( '--max-stack <stack>', 'Maximum stack size to prevent uncontrolled growth', caporal.INT ) 
    .action( async ( args, options, logger ) => {
        const code = await fs.readFile( args.file, 'utf8' );

        const instructions = new Parser().parse( code );

        const vm = new StackVM( StdActions, instructions );

        if ( typeof options.stack === 'number' ) {
            vm.maxStackSize = options.stack;
        }

        if ( options.stepByStep ) {
            for await ( let result of vm.stepByStep() ) {
                const instruction = vm.instructions[ vm.registers.codePointer ];

                console.log( chalk.green( '\nins' ), instruction.name, instruction.parameters.map( v => v.value ).join( ' ' ) );

                console.log( chalk.gray( 'REG' ), 
                    chalk.green( 'CP:' ), vm.registers.codePointer,
                    chalk.green( 'GP:' ), vm.registers.globalPointer,
                    chalk.green( 'FP:' ), vm.registers.framePointer,
                    chalk.green( 'SP:' ), vm.registers.stackPointer,
                );

                if ( result instanceof Error && !( result instanceof StopError ) ) {
                    throw result;
                }

                let answer;

                while ( answer = trim( await prompt( chalk.blue( '>' ) + ' next action (h for help)? ' ) ).toLowerCase() ) {
                    if ( answer === 'h' ) {
                        console.log( chalk.blue( 'h' ), 'show help message' );
                        console.log( chalk.blue( 'q' ), 'quit program execution' );
                        console.log( chalk.blue( 's' ), 'show the program stack' );
                        console.log( chalk.blue( 'k' ), 'keep previous lines and move forward' );
                        console.log( chalk.blue( 'empty' ), 'continue to the next line' );
                    } else if ( answer === 'q' ) {
                        console.log(  )
                        break;
                    } else if ( answer === 'k' ) {
                        break;
                    }
                }

                if ( answer === 'q' ) {
                    break;
                }
            }
        } else {
            await vm.executeAll();
        }
    } );

caporal.parse( process.argv );
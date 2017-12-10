import { Action } from "../Action";
import { ValueType, Value } from "../Instruction";
import { StackVM } from "../StackVM";

export class SwapAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'swap', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value1 : Value = vm.operands.pop();
        const value2 : Value = vm.operands.pop();

        vm.operands.push( value1 );
        vm.operands.push( value2 );
    }
}

export class DebugAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'debug', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        console.log( vm.operands );
        
        const reg = vm.registers;

        console.log( 'registers', { code: reg.codePointer, frame: reg.framePointer, global: reg.globalPointer, stack: reg.stackPointer } );
    }
}